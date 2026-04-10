import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodLogEntry, MealType, AdherenceLevel } from '@/types'
import { FOOD_MAP } from '@/data/foods'
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
  testID?: string
}

export function MealSection({
  mealType,
  foods,
  adherence,
  onAddFood,
  onRemoveFood,
  onAdherenceChange,
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

      {/* Food rows or empty state */}
      {foods.length === 0 ? (
        <MealEmptyState testID={`${id}-empty`} />
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
})
