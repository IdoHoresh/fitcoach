import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t, pickLocale } from '@/i18n'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { buildTodaysPlan, type PlanItem } from '@/utils/buildTodaysPlan'
import { todayISO } from '@/utils/date'
import type { DayOfWeek } from '@/types/user'
import type { WorkoutLog } from '@/types/workout'
import { PlanRow } from './PlanRow'

interface TodaysPlanListProps {
  onMealPress: () => void
  onWorkoutPress: () => void
  onOnboardingPress: () => void
  testID?: string
}

function findTodaysCompletedWorkout(
  recentLogs: readonly WorkoutLog[],
  today: string,
): WorkoutLog | null {
  return recentLogs.find((log) => log.date === today && log.completedAt !== null) ?? null
}

export function TodaysPlanList({
  onMealPress,
  onWorkoutPress,
  onOnboardingPress,
  testID,
}: TodaysPlanListProps) {
  const strings = t().home.v2

  // Store subscriptions (granular selectors — per REVIEW.md "Zustand selectors are granular")
  const activePlan = useNutritionStore((s) => s.activePlan)
  const todaysLog = useNutritionStore((s) => s.todaysLog)
  const dayMapping = useWorkoutStore((s) => s.dayMapping)
  const recentLogs = useWorkoutStore((s) => s.recentLogs)

  const today = todayISO()
  const todayDayOfWeek = new Date().getDay() as DayOfWeek
  const todaysWorkoutDay = dayMapping?.get(todayDayOfWeek) ?? null
  const todaysCompletedWorkoutLog = findTodaysCompletedWorkout(recentLogs, today)

  // Localized workout name — picked at the screen layer to keep buildTodaysPlan i18n-agnostic.
  const workoutDisplayName = todaysWorkoutDay?.template
    ? pickLocale(todaysWorkoutDay.template.nameHe, todaysWorkoutDay.template.nameEn)
    : null

  const items = buildTodaysPlan({
    activePlan,
    todaysWorkoutDay,
    todaysLog,
    todaysCompletedWorkoutLog,
    todayDayOfWeek,
    mealsPerDayFallback: activePlan?.mealsPerDay ?? 4,
    workoutDisplayName,
  })

  // Celebration state: everything that can be done is done.
  // (Rest rows are "can't be done" so they're excluded from the check.)
  const actionableItems = items.filter((i) => i.kind !== 'rest' && i.kind !== 'ghost')
  const allDone = actionableItems.length > 0 && actionableItems.every((i) => i.done)

  const handlePress = (item: PlanItem) => {
    switch (item.routeTarget) {
      case 'nutrition':
        onMealPress()
        break
      case 'workout':
        onWorkoutPress()
        break
      case 'onboarding':
        onOnboardingPress()
        break
      default:
        // Rest rows have null routeTarget — PlanRow disables the press anyway.
        break
    }
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>{strings.todayTitle}</Text>

      {allDone && (
        <Text style={styles.celebration} testID={testID ? `${testID}-celebration` : undefined}>
          {strings.celebration}
        </Text>
      )}

      <View style={styles.list}>
        {items.map((item, index) => (
          <PlanRow
            key={item.id}
            item={item}
            onPress={() => handlePress(item)}
            testID={testID ? `${testID}-row-${index}` : undefined}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'left',
    paddingHorizontal: spacing.xs,
  },
  celebration: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
})
