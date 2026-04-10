import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { todayISO } from '@/db'
import type { MealType, AdherenceLevel } from '@/types'
import { DaySelector } from './DaySelector'
import { NutritionCalorieArc } from './NutritionCalorieArc'
import { NutritionMacroPills } from './NutritionMacroPills'
import { MealSection } from './MealSection'
import { FoodSearchSheet } from './FoodSearchSheet'
import { computeDayTotals, groupFoodsByMeal } from './nutritionDashboard.helpers'
import { getWeekDates } from './daySelector.helpers'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function NutritionDashboard() {
  const today = todayISO()
  const [selectedDate, setSelectedDate] = useState(today)
  const weekDates = useMemo(() => getWeekDates(today), [today])
  const [activeMealSheet, setActiveMealSheet] = useState<MealType | null>(null)

  const selectedDateLog = useNutritionStore((s) => s.selectedDateLog)
  const dateAdherence = useNutritionStore((s) => s.dateAdherence)
  const activePlan = useNutritionStore((s) => s.activePlan)
  const loadLogForDate = useNutritionStore((s) => s.loadLogForDate)
  const loadAdherenceForDate = useNutritionStore((s) => s.loadAdherenceForDate)
  const removeFood = useNutritionStore((s) => s.removeFood)
  const setMealAdherence = useNutritionStore((s) => s.setMealAdherence)

  useEffect(() => {
    loadLogForDate(selectedDate)
    loadAdherenceForDate(selectedDate)
  }, [selectedDate, loadLogForDate, loadAdherenceForDate])

  const totals = useMemo(() => computeDayTotals(selectedDateLog), [selectedDateLog])
  const mealGroups = useMemo(() => groupFoodsByMeal(selectedDateLog), [selectedDateLog])

  const goalCalories = activePlan?.targetCalories ?? 2000
  const goalProtein = activePlan?.targetProtein ?? 150
  const goalCarbs = activePlan?.targetCarbs ?? 200
  const goalFat = activePlan?.targetFat ?? 65

  const getAdherenceForMeal = useCallback(
    (mealType: MealType): AdherenceLevel | null =>
      dateAdherence.find((a) => a.mealType === mealType)?.level ?? null,
    [dateAdherence],
  )

  const handleAdherenceChange = useCallback(
    (mealType: MealType, level: AdherenceLevel) => {
      setMealAdherence(selectedDate, mealType, level)
    },
    [selectedDate, setMealAdherence],
  )

  return (
    <View style={styles.container}>
      <DaySelector
        selectedDate={selectedDate}
        weekDates={weekDates}
        todayDate={today}
        onDaySelect={setSelectedDate}
        testID="day-selector"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <NutritionCalorieArc
          plannedCalories={totals.calories}
          goalCalories={goalCalories}
          testID="calorie-arc"
        />

        <NutritionMacroPills
          protein={{ planned: totals.protein, goal: goalProtein }}
          carbs={{ planned: totals.carbs, goal: goalCarbs }}
          fat={{ planned: totals.fat, goal: goalFat }}
          testID="macro-pills"
        />

        {MEAL_TYPES.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            date={selectedDate}
            foods={mealGroups.get(mealType) ?? []}
            adherence={getAdherenceForMeal(mealType)}
            onAddFood={() => setActiveMealSheet(mealType)}
            onRemoveFood={(entryId) => removeFood(entryId)}
            onAdherenceChange={(level) => handleAdherenceChange(mealType, level)}
            testID={`meal-section-${mealType}`}
          />
        ))}
      </ScrollView>

      {MEAL_TYPES.map((mealType) => (
        <FoodSearchSheet
          key={mealType}
          visible={activeMealSheet === mealType}
          mealType={mealType}
          date={selectedDate}
          onClose={() => setActiveMealSheet(null)}
          testID={`food-search-${mealType}`}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
})
