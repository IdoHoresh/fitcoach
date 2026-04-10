import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@/components/Card'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL, t } from '@/i18n'
import { getNextDay, isRestDay } from './helpers'
import type { DayOfWeek } from '@/types/user'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'

interface TomorrowPreviewProps {
  dayMapping: ReadonlyMap<DayOfWeek, GeneratedWorkoutDay> | null
  todayDayOfWeek: DayOfWeek
  testID?: string
}

export function TomorrowPreview({ dayMapping, todayDayOfWeek, testID }: TomorrowPreviewProps) {
  const strings = t().workout
  const tomorrowDay = getNextDay(todayDayOfWeek)
  const tomorrowWorkout = dayMapping?.get(tomorrowDay)
  const tomorrowIsRest = isRestDay(tomorrowWorkout)

  return (
    <Card testID={testID}>
      <Text style={styles.title}>{strings.tomorrowPreview}</Text>

      {tomorrowIsRest ? (
        <Text style={styles.restMessage}>{strings.noWorkoutToday}</Text>
      ) : (
        <View style={styles.workoutInfo}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isRTL()
                ? (tomorrowWorkout?.template?.nameHe ?? '')
                : (tomorrowWorkout?.template?.nameEn ?? '')}
            </Text>
          </View>
          <Text style={styles.exerciseCount}>
            {strings.exerciseCount.replace(
              '{count}',
              String(tomorrowWorkout?.template?.exercises.length ?? 0),
            )}
          </Text>
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  restMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  workoutInfo: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  exerciseCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
})
