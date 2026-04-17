import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { DayOfWeek } from '@/types/user'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'

const CIRCLE_SIZE = 40

const WEEKDAY_LABEL_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

interface WorkoutDayStripProps {
  dayMapping: ReadonlyMap<DayOfWeek, GeneratedWorkoutDay> | null
  selectedDay: DayOfWeek
  todayDayOfWeek: DayOfWeek
  onDaySelect: (day: DayOfWeek) => void
  testID?: string
}

export function WorkoutDayStrip({
  dayMapping,
  selectedDay,
  todayDayOfWeek,
  onDaySelect,
  testID,
}: WorkoutDayStripProps) {
  const strings = t().home.v2

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.dotsRow}>
        {([0, 1, 2, 3, 4, 5, 6] as readonly DayOfWeek[]).map((dayIdx) => {
          const day = dayMapping?.get(dayIdx)
          const isRest = day == null || day.template == null
          const isToday = dayIdx === todayDayOfWeek
          const isSelected = dayIdx === selectedDay
          const labelKey = WEEKDAY_LABEL_KEYS[dayIdx]

          // Build a compound testID suffix for the circle's current state.
          // Priority: selected > today > rest (most specific wins).
          const stateTestID = testID
            ? isSelected
              ? `${testID}-day-${dayIdx}-selected`
              : isToday
                ? `${testID}-day-${dayIdx}-today`
                : isRest
                  ? `${testID}-day-${dayIdx}-rest`
                  : undefined
            : undefined

          return (
            <Pressable
              key={dayIdx}
              onPress={() => onDaySelect(dayIdx)}
              testID={testID ? `${testID}-day-${dayIdx}` : undefined}
              accessibilityRole="button"
              accessibilityLabel={strings.weekdayShort[labelKey]}
            >
              <View
                testID={stateTestID}
                style={[
                  styles.circle,
                  isRest && styles.circleRest,
                  isToday && styles.circleToday,
                  isSelected && styles.circleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                    isRest && !isSelected && styles.dayLabelRest,
                  ]}
                >
                  {strings.weekdayShort[labelKey]}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  circleRest: {
    backgroundColor: colors.surface,
    opacity: 0.6,
  },
  circleToday: {
    borderColor: colors.primary,
  },
  circleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    opacity: 1,
  },
  dayLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  dayLabelSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  dayLabelRest: {
    color: colors.textMuted,
  },
})
