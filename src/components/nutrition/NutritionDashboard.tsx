import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Animated } from 'react-native'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { todayISO } from '@/db'
import { t } from '@/i18n'
import type { MealType } from '@/types'
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
  const activePlan = useNutritionStore((s) => s.activePlan)
  const mealTargets = useNutritionStore((s) => s.mealTargets)
  const loadLogForDate = useNutritionStore((s) => s.loadLogForDate)
  const removeFood = useNutritionStore((s) => s.removeFood)
  const refreshMealTargets = useNutritionStore((s) => s.refreshMealTargets)
  const redistributionToast = useNutritionStore((s) => s.redistributionToast)
  const clearRedistributionToast = useNutritionStore((s) => s.clearRedistributionToast)
  const relogPreviousMeal = useNutritionStore((s) => s.relogPreviousMeal)
  const relogToast = useNutritionStore((s) => s.relogToast)
  const undoRelog = useNutritionStore((s) => s.undoRelog)
  const clearRelogToast = useNutritionStore((s) => s.clearRelogToast)
  const previousMealSourceDates = useNutritionStore((s) => s.previousMealSourceDates)
  const loadPreviousMealLookup = useNutritionStore((s) => s.loadPreviousMealLookup)

  // Redistribution toast fade animation
  const toastOpacity = useRef(new Animated.Value(0)).current
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-log toast fade animation (5s dwell to allow undo)
  const relogToastOpacity = useRef(new Animated.Value(0)).current
  const relogToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  }, [selectedDate, loadLogForDate])

  const totals = useMemo(() => computeDayTotals(selectedDateLog), [selectedDateLog])
  const mealGroups = useMemo(() => groupFoodsByMeal(selectedDateLog), [selectedDateLog])

  // Re-log toast fade in + 5s auto-dismiss
  useEffect(() => {
    if (!relogToast) return

    if (relogToastTimerRef.current) clearTimeout(relogToastTimerRef.current)

    Animated.timing(relogToastOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    relogToastTimerRef.current = setTimeout(() => {
      Animated.timing(relogToastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => clearRelogToast())
    }, 5000)

    return () => {
      if (relogToastTimerRef.current) clearTimeout(relogToastTimerRef.current)
    }
  }, [relogToast, relogToastOpacity, clearRelogToast])

  // Refresh per-meal previous-meal lookup when date or log changes.
  // Re-runs on selectedDateLog so a clone/undo immediately refreshes lookups
  // (e.g. user fills in a past date, shifting the "most recent prior" for a future date).
  useEffect(() => {
    loadPreviousMealLookup(selectedDate)
  }, [selectedDate, selectedDateLog, loadPreviousMealLookup])

  const goalCalories = activePlan?.targetCalories ?? 2000
  const goalProtein = activePlan?.targetProtein ?? 150
  const goalCarbs = activePlan?.targetCarbs ?? 200
  const goalFat = activePlan?.targetFat ?? 65

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

        {MEAL_TYPES.map((mealType) => {
          const sourceDate = previousMealSourceDates[mealType] ?? null
          const dayWord = sourceDate ? deriveDayWord(sourceDate, selectedDate, t().nutrition) : null
          return (
            <MealSection
              key={mealType}
              mealType={mealType}
              date={selectedDate}
              foods={mealGroups.get(mealType) ?? []}
              onAddFood={() => setActiveMealSheet(mealType)}
              onRemoveFood={(entryId) => removeFood(entryId)}
              mealTarget={mealTargets?.[mealType]}
              previousMealDayWord={dayWord}
              onRelog={() => relogPreviousMeal(mealType, selectedDate)}
              testID={`meal-section-${mealType}`}
            />
          )
        })}
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

      {/* Re-log toast with undo action */}
      {relogToast && (
        <Animated.View
          style={[styles.toast, styles.relogToast, { opacity: relogToastOpacity }]}
          testID="relog-toast"
        >
          <Text style={styles.toastText}>
            {t().nutrition.itemsAddedWithUndo.replace('{count}', String(relogToast.count))}
          </Text>
          <Pressable
            onPress={() => {
              undoRelog(selectedDate)
            }}
            testID="relog-toast-undo"
            hitSlop={8}
          >
            <Text style={styles.undoText}>{t().nutrition.undo}</Text>
          </Pressable>
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

// Day-word picker: "אתמול" if sourceDate is one calendar day before selectedDate,
// else the Hebrew weekday name of sourceDate.
function deriveDayWord(
  sourceDate: string,
  selectedDate: string,
  strings: NutritionStrings,
): string {
  const selected = new Date(`${selectedDate}T00:00:00Z`)
  const yesterday = new Date(selected)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayIso = yesterday.toISOString().split('T')[0]
  if (sourceDate === yesterdayIso) return strings.yesterdayWord

  const source = new Date(`${sourceDate}T00:00:00Z`)
  const dayIndex = source.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
  const keys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ] as const
  return strings.daysOfWeek[keys[dayIndex]]
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
  relogToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  undoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
})
