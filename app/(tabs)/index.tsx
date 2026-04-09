import { View, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { Card } from '@/components/Card'
import { HomeHeader } from '@/components/home/HomeHeader'
import { MacroGauge } from '@/components/home/MacroGauge'
import { MacroLegend } from '@/components/home/MacroLegend'
import { TodaysPlanList } from '@/components/home/TodaysPlanList'
import { WeekdayStreakStrip } from '@/components/home/WeekdayStreakStrip'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import type { DayOfWeek } from '@/types/user'

// Fallback weekly workout target for users who haven't generated a plan
// yet — 3 sessions/week is the minimum effective training frequency from
// Schoenfeld 2016 (the lower bound of "2+ sessions per muscle group").
const DEFAULT_WEEKLY_WORKOUT_GOAL = 3

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // ── User store: personalized greeting ──
  const userName = useUserStore((s) => s.profile?.name)

  // ── Nutrition store: gauge + legend props ──
  const activePlan = useNutritionStore((s) => s.activePlan)
  const dailySummary = useNutritionStore((s) => s.dailySummary)

  const consumedCalories = dailySummary?.totalCalories ?? 0
  const goalCalories = activePlan?.targetCalories ?? 0

  const protein = {
    current: dailySummary?.totalProtein ?? 0,
    goal: activePlan?.targetProtein ?? 0,
  }
  const carbs = {
    current: dailySummary?.totalCarbs ?? 0,
    goal: activePlan?.targetCarbs ?? 0,
  }
  const fat = {
    current: dailySummary?.totalFat ?? 0,
    goal: activePlan?.targetFat ?? 0,
  }

  // ── Workout store: streak strip props ──
  const mesocycle = useWorkoutStore((s) => s.mesocycle)
  const recentLogs = useWorkoutStore((s) => s.recentLogs)

  // Filter completed workouts to "this week" using mesocycle.weekStartDate.
  // Each completed log contributes its day-of-week to the strip.
  const weekStart = mesocycle?.weekStartDate ?? null
  const completedThisWeekLogs = weekStart
    ? recentLogs.filter((log) => log.date >= weekStart && log.completedAt !== null)
    : []
  const completedDaysOfWeek: DayOfWeek[] = completedThisWeekLogs.map(
    (log) => new Date(log.date).getDay() as DayOfWeek,
  )

  // Weekly goal: count training days in the active plan, fall back to the default.
  const plan = useWorkoutStore((s) => s.plan)
  const weeklyGoal = plan
    ? plan.weeklySchedule.filter((d) => d.template !== null).length
    : DEFAULT_WEEKLY_WORKOUT_GOAL

  const todayDayOfWeek = new Date().getDay() as DayOfWeek

  // Routing handlers — passed into TodaysPlanList so it stays
  // expo-router-agnostic and easy to unit-test.
  const goToProfile = () => router.push('/(tabs)/profile')
  const goToNutrition = () => router.push('/(tabs)/nutrition')
  const goToWorkout = () => router.push('/(tabs)/workout')
  // Ghost rows route to the onboarding flow's first screen so a fresh-install
  // user can set up their plan from anywhere they tap on the dashboard.
  const goToOnboarding = () => router.push('/(onboarding)/welcome')

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HomeHeader onAvatarPress={goToProfile} name={userName} testID="home-header" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <MacroGauge
            consumedCalories={consumedCalories}
            goalCalories={goalCalories}
            testID="home-gauge"
          />
          <View style={styles.legendSpacer} />
          <MacroLegend protein={protein} carbs={carbs} fat={fat} testID="home-legend" />
        </Card>

        <TodaysPlanList
          onMealPress={goToNutrition}
          onWorkoutPress={goToWorkout}
          onOnboardingPress={goToOnboarding}
          testID="home-plan"
        />

        <WeekdayStreakStrip
          weekNumber={mesocycle?.currentWeek ?? null}
          completedThisWeek={completedThisWeekLogs.length}
          weeklyGoal={weeklyGoal}
          completedDaysOfWeek={completedDaysOfWeek}
          todayDayOfWeek={todayDayOfWeek}
          testID="home-streak"
        />
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  legendSpacer: {
    height: spacing.md,
  },
})
