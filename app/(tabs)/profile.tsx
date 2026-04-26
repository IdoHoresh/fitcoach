import { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '@/theme'
import { t } from '@/i18n'
import { Button } from '@/components/Button'
import { SettingsRow } from '@/components/settings/SettingsRow'
import { ModeToggleSheet } from '@/components/settings/ModeToggleSheet'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { todayISO } from '@/utils/date'
import type { DayOfWeek, MealLoggingMode } from '@/types/user'
import type { FoodLogEntry, DailyNutritionSummary } from '@/types/nutrition'
import type { WorkoutLog } from '@/types/workout'
// Relative import: `src/dev/` was added after Metro's initial cache build
// and this is a single dev-only consumer — a relative path is simpler than
// asking contributors to `expo start --clear` on first pull.
import { resetApp } from '../../src/dev/resetApp'

// ── Dev helpers ──────────────────────────────────────────────────
//
// These helpers bypass the food + workout repositories (no real foodId or
// SQLite write) and inject fake state directly via setState. The Home v2
// tab reads from `todaysLog` / `recentLogs` / `dailySummary`, so injecting
// matching shapes is enough to flip done flags and fill the gauge.
//
// State resets on app reload — by design. Use the "Reset app" button to
// start over. Production food logging will replace this entirely.

/**
 * Dev-only: regenerates the workout plan + weekly meal plan from the current
 * profile. Useful when iterating on plan-generation algorithms without having
 * to wipe the DB and re-run onboarding.
 *
 * The production flow (onboarding → finishOnboarding) already generates both
 * plans automatically; this button is a shortcut for dev iteration only.
 */
function handleGenerateSamplePlans() {
  Alert.alert(
    'Generate sample plans?',
    'Creates a 4-meals-per-day meal plan + workout plan from your current profile. Dev only.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Generate',
        onPress: async () => {
          try {
            // Workout plan first — meal-plan calorie targets depend only on
            // the profile, but doing them in series gives clearer error
            // messages if either step fails.
            await useWorkoutStore.getState().generatePlan()
            await useNutritionStore.getState().generateMealPlan(4)
            Alert.alert('Done', 'Open the Home tab to see real plan data.')
          } catch (error) {
            Alert.alert(
              'Generation failed',
              `${error instanceof Error ? error.message : String(error)}\n\nDid you finish onboarding?`,
            )
          }
        },
      },
    ],
  )
}

/**
 * Dev-only: injects a single fake food log entry for the FIRST meal in
 * today's plan, plus a partial dailySummary. After tapping, the first
 * meal row should flip to done and the gauge should tick up.
 *
 * Use this to verify the next-marker moves down the list as meals are
 * logged. Tap multiple times → no-op (it always logs the first meal).
 */
function handleLogFirstMeal() {
  const activePlan = useNutritionStore.getState().activePlan
  if (!activePlan) {
    Alert.alert('No meal plan', 'Tap "Generate sample plans" first.')
    return
  }
  const todayDow = new Date().getDay() as DayOfWeek
  const todayDay = activePlan.days.find((d) => d.dayOfWeek === todayDow)
  const firstMeal = todayDay?.meals[0]
  if (!firstMeal) {
    Alert.alert('No meals today', "Today's day in the plan has no meals.")
    return
  }

  const today = todayISO()
  const fakeEntry: FoodLogEntry = {
    id: `dev-log-${firstMeal.mealType}`,
    foodId: 'dev-food',
    nameHe: 'ארוחת בדיקה',
    mealType: firstMeal.mealType,
    date: today,
    servingAmount: 1,
    servingUnit: 'serving',
    gramsConsumed: 100,
    calories: firstMeal.totalCalories,
    protein: firstMeal.totalProtein,
    fat: firstMeal.totalFat,
    carbs: firstMeal.totalCarbs,
  }

  const existingLog = useNutritionStore.getState().todaysLog
  // Skip if we've already injected this meal (idempotent).
  if (existingLog.some((e) => e.mealType === firstMeal.mealType)) {
    Alert.alert('Already logged', `${firstMeal.mealType} is already marked done.`)
    return
  }

  const existingSummary = useNutritionStore.getState().dailySummary
  const summary: DailyNutritionSummary = {
    date: today,
    totalCalories: (existingSummary?.totalCalories ?? 0) + fakeEntry.calories,
    totalProtein: (existingSummary?.totalProtein ?? 0) + fakeEntry.protein,
    totalFat: (existingSummary?.totalFat ?? 0) + fakeEntry.fat,
    totalCarbs: (existingSummary?.totalCarbs ?? 0) + fakeEntry.carbs,
    totalFiber: existingSummary?.totalFiber ?? 0,
    mealCount: (existingSummary?.mealCount ?? 0) + 1,
  }

  useNutritionStore.setState({
    todaysLog: [...existingLog, fakeEntry],
    dailySummary: summary,
  })
}

/**
 * Dev-only: marks every meal in today's plan as logged + completes the
 * workout. Triggers the all-done celebration line on Home.
 */
function handleMarkTodayDone() {
  Alert.alert(
    'Mark today as done?',
    'Logs every meal + completes the workout so the Home tab shows the celebration state. Dev only.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark done',
        onPress: () => {
          const activePlan = useNutritionStore.getState().activePlan
          const today = todayISO()
          const todayDow = new Date().getDay() as DayOfWeek

          if (activePlan) {
            const todayDay = activePlan.days.find((d) => d.dayOfWeek === todayDow)
            if (todayDay) {
              const fakeLog: FoodLogEntry[] = todayDay.meals.map((meal) => ({
                id: `dev-log-${meal.mealType}`,
                foodId: 'dev-food',
                nameHe: 'ארוחת בדיקה',
                mealType: meal.mealType,
                date: today,
                servingAmount: 1,
                servingUnit: 'serving',
                gramsConsumed: 100,
                calories: meal.totalCalories,
                protein: meal.totalProtein,
                fat: meal.totalFat,
                carbs: meal.totalCarbs,
              }))
              const summary: DailyNutritionSummary = {
                date: today,
                totalCalories: todayDay.totalCalories,
                totalProtein: todayDay.totalProtein,
                totalFat: todayDay.totalFat,
                totalCarbs: todayDay.totalCarbs,
                totalFiber: 0,
                mealCount: todayDay.meals.length,
              }
              useNutritionStore.setState({ todaysLog: fakeLog, dailySummary: summary })
            }
          }

          // Mark today's workout complete (if there is one).
          const dayMapping = useWorkoutStore.getState().dayMapping
          const todaysWorkoutDay = dayMapping?.get(todayDow)
          if (todaysWorkoutDay?.template) {
            const nowISO = new Date().toISOString()
            const fakeWorkoutLog: WorkoutLog = {
              id: 'dev-workout-log',
              date: today,
              templateId: todaysWorkoutDay.template.id,
              dayType: todaysWorkoutDay.dayType,
              startedAt: nowISO,
              completedAt: nowISO,
              exercises: [],
              durationMinutes: todaysWorkoutDay.template.estimatedMinutes,
            }
            useWorkoutStore.setState((state) => ({
              recentLogs: [
                fakeWorkoutLog,
                ...state.recentLogs.filter((l) => l.id !== 'dev-workout-log'),
              ],
            }))
          }

          Alert.alert('Done', 'Open the Home tab to see the celebration state.')
        },
      },
    ],
  )
}

/**
 * Dev-only: deletes the SQLite DB, then tells the user to force-close and
 * reopen the app. We deliberately do NOT call `DevSettings.reload()` —
 * on iOS that's a JS-only reload and leaves the native I18nManager /
 * Yoga layout engine in a stale RTL state. A full native relaunch is
 * the only way to guarantee the onboarding flow renders correctly.
 */
function handleDevReset() {
  Alert.alert(
    'Reset app?',
    'Deletes all profile, workout, and nutrition data. Dev only — cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetApp()
            Alert.alert(
              'Data cleared',
              'Now force-close the app (swipe up in the app switcher) and reopen it. A JS reload is not enough — RTL needs a full native relaunch.',
            )
          } catch (error) {
            Alert.alert('Reset failed', String(error))
          }
        },
      },
    ],
  )
}

export default function ProfileScreen() {
  const profile = useUserStore((s) => s.profile)
  const updateProfile = useUserStore((s) => s.updateProfile)
  const [modeSheetVisible, setModeSheetVisible] = useState(false)
  const strings = t().settings.mealLoggingMode

  const currentMode: MealLoggingMode = profile?.mealLoggingMode ?? 'structured'
  const modeSubtitle =
    currentMode === 'structured' ? strings.subtitleStructured : strings.subtitleFree

  const handleModeSelect = (next: MealLoggingMode) => {
    if (next !== currentMode) {
      void updateProfile({ mealLoggingMode: next })
    }
  }

  return (
    <View style={styles.container}>
      <Ionicons name="person-outline" size={64} color={colors.primary} />
      <Text style={styles.title}>{t().tabs.profile}</Text>

      {profile ? (
        <View style={styles.settingsSection}>
          <SettingsRow
            label={strings.title}
            subtitle={modeSubtitle}
            onPress={() => setModeSheetVisible(true)}
            testID="settings-meal-logging-mode-row"
          />
        </View>
      ) : null}

      <ModeToggleSheet
        visible={modeSheetVisible}
        currentMode={currentMode}
        onSelect={handleModeSelect}
        onClose={() => setModeSheetVisible(false)}
        testID="settings-mode-toggle-sheet"
      />

      {__DEV__ ? (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>Dev tools</Text>
          <Button
            label="Generate sample plans"
            onPress={handleGenerateSamplePlans}
            variant="outline"
            size="sm"
            testID="dev-generate-plans-button"
          />
          <Button
            label="Log first meal (test progress)"
            onPress={handleLogFirstMeal}
            variant="outline"
            size="sm"
            testID="dev-log-first-meal-button"
          />
          <Button
            label="Mark today done (celebration)"
            onPress={handleMarkTodayDone}
            variant="outline"
            size="sm"
            testID="dev-mark-done-button"
          />
          <Button
            label="Reset app (wipe DB + reload)"
            onPress={handleDevReset}
            variant="outline"
            size="sm"
            testID="dev-reset-button"
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  devSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    gap: spacing.sm,
    alignItems: 'center',
  },
  devLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsSection: {
    marginTop: spacing.lg,
    width: '88%',
    gap: spacing.sm,
  },
})
