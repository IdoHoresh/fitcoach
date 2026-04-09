import { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { getGreetingKey, getRandomMotivation } from '@/utils/greeting'
import { isRTL } from '@/hooks/rtl'
import { StreakCounter } from '@/components/StreakCounter'
import { Button } from '@/components/Button'
import { TodaysWorkoutCard } from '@/components/home/TodaysWorkoutCard'
import { TodaysMacrosCard } from '@/components/home/TodaysMacrosCard'
import { useWorkoutStore } from '@/stores/useWorkoutStore'

const AVATAR_SIZE = 36
const DEFAULT_WEEKLY_GOAL = 3

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [motivation] = useState(() => getRandomMotivation())

  const hour = new Date().getHours()
  const greetingKey = getGreetingKey(hour)
  const greetingTemplate = t().home.greetings[greetingKey]
  // TODO: get real user name from store once onboarding is built
  const userName: string = '?'
  const greeting = greetingTemplate.replace('{name}', userName)
  const initial = userName === '?' ? '?' : userName.charAt(0).toUpperCase()

  // Streak wiring — derive props from workout store
  const plan = useWorkoutStore((s) => s.plan)
  const mesocycle = useWorkoutStore((s) => s.mesocycle)
  const completedThisWeek = useWorkoutStore((s) => s.getCompletedThisWeek().length)
  const weeklyGoal = plan
    ? plan.weeklySchedule.filter((d) => d.template !== null).length
    : DEFAULT_WEEKLY_GOAL
  // mesocycle.currentWeek is 1-indexed and tracks the *in-progress* week,
  // so completed-week streak is (currentWeek - 1), floored at 0.
  const currentStreak = Math.max((mesocycle?.currentWeek ?? 1) - 1, 0)

  const goToWorkout = () => router.push('/(tabs)/workout')
  const goToNutrition = () => router.push('/(tabs)/nutrition')

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.motivation}>{motivation}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel={t().tabs.profile}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StreakCounter
          completedThisWeek={completedThisWeek}
          weeklyGoal={weeklyGoal}
          currentStreak={currentStreak}
          testID="home-streak"
        />

        <View style={styles.quickActions}>
          <View style={styles.quickActionItem}>
            <Button
              label={t().home.dashboard.logMeal}
              onPress={goToNutrition}
              variant="secondary"
              size="md"
              testID="home-action-log-meal"
            />
          </View>
          <View style={styles.quickActionItem}>
            <Button
              label={t().workout.startWorkout}
              onPress={goToWorkout}
              variant="primary"
              size="md"
              testID="home-action-start-workout"
            />
          </View>
        </View>

        <TodaysWorkoutCard onStart={goToWorkout} testID="home-todays-workout" />
        <TodaysMacrosCard testID="home-todays-macros" />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  motivation: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: spacing.md,
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  quickActions: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    gap: spacing.md,
  },
  quickActionItem: {
    flex: 1,
  },
})
