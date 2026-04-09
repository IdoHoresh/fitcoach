import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import type { DayOfWeek } from '@/types/user'

const CIRCLE_SIZE = 36
const FLAME_SIZE = 18

// DayOfWeek in the type is 0..6 (Sunday..Saturday).
// JS Date.getDay() matches this convention, so we can iterate 0..6 directly.
const WEEKDAY_LABEL_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

interface WeekdayStreakStripProps {
  weekNumber: number | null
  completedThisWeek: number
  weeklyGoal: number
  completedDaysOfWeek: readonly DayOfWeek[]
  todayDayOfWeek: DayOfWeek
  testID?: string
}

export function WeekdayStreakStrip({
  weekNumber,
  completedThisWeek,
  weeklyGoal,
  completedDaysOfWeek,
  todayDayOfWeek,
  testID,
}: WeekdayStreakStripProps) {
  const strings = t().home.v2
  const completedSet = new Set(completedDaysOfWeek)

  const weekLabel = strings.streakWeekLabel
    .replace('{week}', String(weekNumber ?? 0))
    .replace('{done}', String(completedThisWeek))
    .replace('{goal}', String(weeklyGoal))

  return (
    <View style={styles.container} testID={testID}>
      {weekNumber !== null && (
        <View style={styles.headerRow}>
          <View testID={testID ? `${testID}-flame` : undefined}>
            <Ionicons name="flame" size={FLAME_SIZE} color={colors.warning} />
          </View>
          <Text style={styles.weekLabel} testID={testID ? `${testID}-week-label` : undefined}>
            {weekLabel}
          </Text>
        </View>
      )}

      {weekNumber === null && (
        <View style={styles.headerRow}>
          <View testID={testID ? `${testID}-flame` : undefined}>
            <Ionicons name="flame-outline" size={FLAME_SIZE} color={colors.textSecondary} />
          </View>
        </View>
      )}

      <View style={styles.dotsRow}>
        {([0, 1, 2, 3, 4, 5, 6] as readonly DayOfWeek[]).map((dayIdx) => {
          const isCompleted = completedSet.has(dayIdx)
          const isToday = dayIdx === todayDayOfWeek
          const labelKey = WEEKDAY_LABEL_KEYS[dayIdx]

          // The outer cell carries the canonical `strip-day-N` testID.
          // The circle only gets the `-completed` variant when filled,
          // so canonical and variant testIDs never collide.
          const completedCircleTestID =
            isCompleted && testID ? `${testID}-day-${dayIdx}-completed` : undefined

          const todayMarkerTestID = isToday && testID ? `${testID}-day-${dayIdx}-today` : undefined

          return (
            <View
              key={dayIdx}
              style={styles.dayCell}
              testID={testID ? `${testID}-day-${dayIdx}` : undefined}
            >
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isToday && styles.circleToday,
                ]}
                testID={completedCircleTestID}
              >
                {isToday && <View style={styles.todayInner} testID={todayMarkerTestID} />}
                <Text style={[styles.dayLabel, isCompleted && styles.dayLabelCompleted]}>
                  {strings.weekdayShort[labelKey]}
                </Text>
              </View>
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
  },
  headerRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  weekLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  dotsRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleCompleted: {
    backgroundColor: colors.success,
  },
  circleToday: {
    borderColor: colors.primary,
  },
  todayInner: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    top: 2,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  dayLabelCompleted: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
})
