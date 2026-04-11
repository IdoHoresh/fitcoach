import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize } from '@/theme/typography'
import { todayISO } from '@/db'
import { t } from '@/i18n'
import type { MealType, AdherenceLevel } from '@/types'
import type { MealName, ToastMacro } from '@/algorithms'
import { DaySelector } from './DaySelector'
import { NutritionCalorieArc } from './NutritionCalorieArc'
import { NutritionMacroPills } from './NutritionMacroPills'
import { MealSection } from './MealSection'
import { FoodSearchSheet } from './FoodSearchSheet'
import { computeDayTotals, groupFoodsByMeal } from './nutritionDashboard.helpers'
import { getWeekDates } from './daySelector.helpers'

const MEAL_TYPES: MealName[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function NutritionDashboard() {
  const today = todayISO()
  const [selectedDate, setSelectedDate] = useState(today)
  const weekDates = useMemo(() => getWeekDates(today), [today])
  const [activeMealSheet, setActiveMealSheet] = useState<MealType | null>(null)

  const selectedDateLog = useNutritionStore((s) => s.selectedDateLog)
  const dateAdherence = useNutritionStore((s) => s.dateAdherence)
  const activePlan = useNutritionStore((s) => s.activePlan)
  const mealTargets = useNutritionStore((s) => s.mealTargets)
  const loadLogForDate = useNutritionStore((s) => s.loadLogForDate)
  const loadAdherenceForDate = useNutritionStore((s) => s.loadAdherenceForDate)
  const removeFood = useNutritionStore((s) => s.removeFood)
  const setMealAdherence = useNutritionStore((s) => s.setMealAdherence)
  const refreshMealTargets = useNutritionStore((s) => s.refreshMealTargets)
  const generateMealForSlot = useNutritionStore((s) => s.generateMealForSlot)
  const regenerateMealForSlot = useNutritionStore((s) => s.regenerateMealForSlot)
  const lastGeneratedEntryIds = useNutritionStore((s) => s.lastGeneratedEntryIds)
  const redistributionToast = useNutritionStore((s) => s.redistributionToast)
  const clearRedistributionToast = useNutritionStore((s) => s.clearRedistributionToast)

  // Toast fade animation
  const toastOpacity = useRef(new Animated.Value(0)).current
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!redistributionToast) return

    // Cancel any pending hide timer
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)

    // Fade in
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()

    // Auto-dismiss after 3 seconds
    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
        () => clearRedistributionToast(),
      )
    }, 3000)

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [redistributionToast, toastOpacity, clearRedistributionToast])

  useEffect(() => {
    refreshMealTargets()
  }, [refreshMealTargets])

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
            mealTarget={mealTargets?.[mealType]}
            onGenerateMeal={() => generateMealForSlot(mealType, selectedDate)}
            onRegenerateMeal={
              lastGeneratedEntryIds[mealType]
                ? () => regenerateMealForSlot(mealType, selectedDate)
                : undefined
            }
            testID={`meal-section-${mealType}`}
          />
        ))}
      </ScrollView>

      {/* Redistribution toast */}
      {redistributionToast && (
        <Animated.View
          style={[styles.toast, { opacity: toastOpacity }]}
          testID="redistribution-toast"
        >
          <Text style={styles.toastText}>{buildToastText(redistributionToast, t().nutrition)}</Text>
        </Animated.View>
      )}

      {MEAL_TYPES.map((mealType) => {
        const logged = mealGroups.get(mealType) ?? []
        return (
          <FoodSearchSheet
            key={mealType}
            visible={activeMealSheet === mealType}
            mealType={mealType}
            date={selectedDate}
            onClose={() => {
              setActiveMealSheet(null)
              loadLogForDate(selectedDate)
            }}
            mealTarget={mealTargets?.[mealType]}
            mealLogged={{
              protein: logged.reduce((s, e) => s + e.protein, 0),
              fat: logged.reduce((s, e) => s + e.fat, 0),
              carbs: logged.reduce((s, e) => s + e.carbs, 0),
            }}
            testID={`food-search-${mealType}`}
          />
        )
      })}
    </View>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

type NutritionStrings = ReturnType<typeof t>['nutrition']

function buildToastText(
  toast: { macro: NonNullable<ToastMacro>; amount: number; mealName: MealName },
  strings: NutritionStrings,
): string {
  const mealNameMap: Record<MealName, string> = {
    breakfast: strings.meals.breakfast,
    lunch: strings.meals.lunch,
    dinner: strings.meals.dinner,
    snack: strings.meals.snack,
  }
  const macroLabel =
    toast.macro === 'protein'
      ? strings.macros.protein
      : toast.macro === 'fat'
        ? strings.macros.fat
        : toast.macro === 'carbs'
          ? strings.macros.carbs
          : strings.redistributedCalories
  const unit = toast.macro === 'calories' ? strings.redistributedCalories : 'g'
  return `${toast.amount}${unit} ${macroLabel} ${strings.redistributedToast} ${mealNameMap[toast.mealName]}`
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
  toast: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    maxWidth: '85%',
  },
  toastText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
})
