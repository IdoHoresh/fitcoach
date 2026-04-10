import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import type { DayOfWeek } from '@/types/user'

const CIRCLE_SIZE = 36
const ICON_SIZE = 16

// DayOfWeek in the type is 0..6 (Sunday..Saturday).
// JS Date.getDay() matches this convention, so we can iterate 0..6 directly.
const WEEKDAY_LABEL_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

interface WeekdayStreakStripProps {
  weekNumber: number | null
  completedThisWeek: number
  completedDaysOfWeek: readonly DayOfWeek[]
  todayDayOfWeek: DayOfWeek
  testID?: string
}

export function WeekdayStreakStrip({
  weekNumber,
  completedThisWeek,
  completedDaysOfWeek,
  todayDayOfWeek,
  testID,
}: WeekdayStreakStripProps) {
  const strings = t().home.v2
  const completedSet = new Set(completedDaysOfWeek)

  const daysStreakText = strings.daysStreak.replace('{done}', String(completedThisWeek))

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.progressTitle}>{strings.progressTitle}</Text>
        {weekNumber !== null && (
          <Text style={styles.daysStreak} testID={testID ? `${testID}-week-label` : undefined}>
            {daysStreakText}
          </Text>
        )}
      </View>

      <View style={styles.dotsRow}>
        {([0, 1, 2, 3, 4, 5, 6] as readonly DayOfWeek[]).map((dayIdx) => {
          const isCompleted = completedSet.has(dayIdx)
          const isToday = dayIdx === todayDayOfWeek
          // A day is "future" if it hasn't arrived yet this week and wasn't completed.
          // Safe assumption: completedDaysOfWeek is always filtered to the current ISO week
          // by the caller (index.tsx uses mesocycle.weekStartDate as the boundary).
          const isFuture = dayIdx > todayDayOfWeek && !isCompleted
          const labelKey = WEEKDAY_LABEL_KEYS[dayIdx]
          const isActive = isCompleted || isToday

          const completedCircleTestID =
            isCompleted && testID ? `${testID}-day-${dayIdx}-completed` : undefined

          const todayMarkerTestID = isToday && testID ? `${testID}-day-${dayIdx}-today` : undefined

          return (
            <View
              key={dayIdx}
              style={[styles.dayCell, isFuture && styles.dayCellFuture]}
              testID={testID ? `${testID}-day-${dayIdx}` : undefined}
            >
              <View
                style={[styles.circle, isActive && styles.circleActive]}
                testID={completedCircleTestID}
              >
                {isActive && (
                  <Ionicons
                    name={isToday ? 'flash' : 'checkmark'}
                    size={ICON_SIZE}
                    color={colors.textInverse}
                    testID={todayMarkerTestID}
                  />
                )}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {strings.weekdayShort[labelKey]}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border + '1A',
  },
  headerRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  progressTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  daysStreak: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  dotsRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dayCellFuture: {
    opacity: 0.4,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
})
