import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodLogEntry, MealType, AdherenceLevel } from '@/types'
import { MACRO_SATISFIED_THRESHOLD } from '@/data/constants'
import { FOOD_MAP } from '@/data/foods'
import type { MealMacroTargetByName } from '@/algorithms/meal-targets'
import { FoodItemRow } from './FoodItemRow'
import { MealEmptyState } from './MealEmptyState'
import { AdherencePicker } from './AdherencePicker'

interface MealSectionProps {
  mealType: MealType
  date: string
  foods: FoodLogEntry[]
  adherence: AdherenceLevel | null
  onAddFood: () => void
  onRemoveFood: (entryId: string) => void
  onAdherenceChange: (level: AdherenceLevel) => void
  mealTarget?: MealMacroTargetByName
  onGenerateMeal?: () => void
  onRegenerateMeal?: () => void
  testID?: string
}

export function MealSection({
  mealType,
  foods,
  adherence,
  onAddFood,
  onRemoveFood,
  onAdherenceChange,
  mealTarget,
  onGenerateMeal,
  onRegenerateMeal,
  testID,
}: MealSectionProps) {
  const id = testID ?? `meal-section-${mealType}`
  const strings = t().nutrition
  const mealNameMap: Record<MealType, string> = {
    breakfast: strings.meals.breakfast,
    lunch: strings.meals.lunch,
    dinner: strings.meals.dinner,
    snack: strings.meals.snack,
    pre_workout: strings.meals.preWorkout,
    post_workout: strings.meals.postWorkout,
  }
  const mealName = mealNameMap[mealType]
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0)
  const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0)
  const totalFat = foods.reduce((sum, f) => sum + f.fat, 0)
  const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0)

  // Progress bar fill — capped at 100%
  const calorieFillPct = mealTarget
    ? Math.min(1, totalCalories / Math.max(1, mealTarget.calories)) * 100
    : 0

  // Most-needed macro hint — shown when at least one macro is below threshold
  const macroHint = mealTarget
    ? getMostNeededMacro(totalProtein, totalFat, totalCarbs, mealTarget, strings)
    : null

  const isEmpty = foods.length === 0

  return (
    <View style={styles.container} testID={id}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.totalCalories} testID={`${id}-calories`}>
          {Math.round(totalCalories)} {strings.kcal}
        </Text>
        <Text style={styles.mealName} testID={`${id}-title`}>
          {mealName}
        </Text>
      </View>

      {/* Calorie progress bar */}
      {mealTarget && (
        <View style={styles.progressTrack} testID={`${id}-progress`}>
          <View style={[styles.progressFill, { width: `${calorieFillPct}%` }]} />
        </View>
      )}

      {/* Macro hint — most-needed macro in red */}
      {macroHint && (
        <Text style={styles.macroHint} testID={`${id}-hint`}>
          {macroHint}
        </Text>
      )}

      {/* Food rows or empty state */}
      {isEmpty ? (
        mealTarget ? (
          <View style={styles.emptyWithButtons} testID={`${id}-empty`}>
            <Pressable style={styles.addFoodButton} onPress={onAddFood} testID={`${id}-add-food`}>
              <Text style={styles.addFoodButtonText}>{strings.addFoodLabel}</Text>
            </Pressable>
            <Pressable
              style={styles.generateButton}
              onPress={onGenerateMeal}
              testID={`${id}-generate`}
            >
              <Text style={styles.generateButtonText}>{strings.generateMeal}</Text>
            </Pressable>
          </View>
        ) : (
          <MealEmptyState testID={`${id}-empty`} />
        )
      ) : (
        foods.map((entry) => (
          <FoodItemRow
            key={entry.id}
            nameHe={FOOD_MAP.get(entry.foodId)?.nameHe ?? entry.foodId}
            grams={entry.gramsConsumed}
            calories={entry.calories}
            onRemove={() => onRemoveFood(entry.id)}
            testID={`${id}-food-${entry.id}`}
          />
        ))
      )}

      {/* Regenerate button — shown when meal was auto-generated */}
      {onRegenerateMeal && !isEmpty && (
        <Pressable
          style={styles.regenerateRow}
          onPress={onRegenerateMeal}
          testID={`${id}-regenerate`}
        >
          <Text style={styles.regenerateText}>{strings.regenerateMeal}</Text>
        </Pressable>
      )}

      {/* Add + Adherence inline row */}
      <View style={styles.actionsRow}>
        <View style={styles.adherenceWrapper}>
          <AdherencePicker
            value={adherence}
            onChange={onAdherenceChange}
            testID={`${id}-adherence`}
          />
        </View>
        <Pressable style={styles.addButton} onPress={onAddFood} testID={`${id}-add`}>
          <Ionicons name="add" size={22} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

type NutritionStrings = ReturnType<typeof t>['nutrition']

/** Returns a localized hint string for the most-needed macro, or null if all are met. */
function getMostNeededMacro(
  loggedProtein: number,
  loggedFat: number,
  loggedCarbs: number,
  target: MealMacroTargetByName,
  strings: NutritionStrings,
): string | null {
  const ratios = [
    { macro: strings.macros.protein, logged: loggedProtein, goal: target.protein },
    { macro: strings.macros.fat, logged: loggedFat, goal: target.fat },
    { macro: strings.macros.carbs, logged: loggedCarbs, goal: target.carbs },
  ]

  // Find the macro furthest from its target (lowest ratio)
  let worstRatio = 1
  let worstEntry: { macro: string; logged: number; goal: number } | null = null

  for (const entry of ratios) {
    if (entry.goal <= 0) continue
    const ratio = entry.logged / entry.goal
    if (ratio < MACRO_SATISFIED_THRESHOLD && ratio < worstRatio) {
      worstRatio = ratio
      worstEntry = entry
    }
  }

  if (!worstEntry) return null

  const missing = Math.max(0, Math.round(worstEntry.goal - worstEntry.logged))
  return `${strings.missing}: ${missing}g ${worstEntry.macro}`
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  totalCalories: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  adherenceWrapper: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  macroHint: {
    fontSize: fontSize.xs,
    color: colors.error,
    textAlign: 'right',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  emptyWithButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  addFoodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  addFoodButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  generateButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: fontSize.sm,
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },
  regenerateRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  regenerateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
})
