import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodLogEntry, MealType } from '@/types'
import type { MealMacroTargetByName } from '@/algorithms/meal-targets'
import { FoodItemRow } from './FoodItemRow'
import { MealEmptyState } from './MealEmptyState'

interface MealSectionProps {
  mealType: MealType
  date: string
  foods: FoodLogEntry[]
  onAddFood: () => void
  onRemoveFood: (entryId: string) => void
  mealTarget?: MealMacroTargetByName
  testID?: string
}

export function MealSection({
  mealType,
  foods,
  onAddFood,
  onRemoveFood,
  mealTarget,
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

  const calorieFillPct = mealTarget
    ? Math.min(1, totalCalories / Math.max(1, mealTarget.calories)) * 100
    : 0

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

      {/* Per-meal macro row — centered, color-coded */}
      <View style={styles.macroRow} testID={`${id}-macros`}>
        <Text style={styles.macroLabel}>{strings.macros.protein}</Text>
        <Text style={[styles.macroValue, { color: colors.protein }]} testID={`${id}-protein`}>
          {mealTarget
            ? `${Math.round(totalProtein)}/${Math.round(mealTarget.protein)}g`
            : `${Math.round(totalProtein)}g`}
        </Text>
        <Text style={styles.macroDivider}>·</Text>
        <Text style={styles.macroLabel}>{strings.macros.carbs}</Text>
        <Text style={[styles.macroValue, { color: colors.carbs }]} testID={`${id}-carbs`}>
          {mealTarget
            ? `${Math.round(totalCarbs)}/${Math.round(mealTarget.carbs)}g`
            : `${Math.round(totalCarbs)}g`}
        </Text>
        <Text style={styles.macroDivider}>·</Text>
        <Text style={styles.macroLabel}>{strings.macros.fat}</Text>
        <Text style={[styles.macroValue, { color: colors.fat }]} testID={`${id}-fat`}>
          {mealTarget
            ? `${Math.round(totalFat)}/${Math.round(mealTarget.fat)}g`
            : `${Math.round(totalFat)}g`}
        </Text>
      </View>

      {/* Food rows */}
      {!isEmpty && (
        <>
          {foods.map((entry) => (
            <FoodItemRow
              key={entry.id}
              nameHe={entry.nameHe}
              grams={entry.gramsConsumed}
              calories={entry.calories}
              onRemove={() => onRemoveFood(entry.id)}
              testID={`${id}-food-${entry.id}`}
            />
          ))}
        </>
      )}

      {/* No-target empty state */}
      {isEmpty && !mealTarget && <MealEmptyState testID={`${id}-empty`} />}

      {/* Bottom row — "+" pinned to the right */}
      <View style={styles.bottomRow}>
        <View />
        <Pressable style={styles.addButton} onPress={onAddFood} testID={`${id}-add`}>
          <Ionicons name="add" size={22} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  )
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
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  macroLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  macroValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  macroDivider: {
    fontSize: fontSize.xs,
    color: colors.border,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
