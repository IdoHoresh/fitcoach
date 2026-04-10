import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { isToday } from './daySelector.helpers'

interface DaySelectorProps {
  selectedDate: string // YYYY-MM-DD
  weekDates: string[] // 7 YYYY-MM-DD strings
  todayDate: string // YYYY-MM-DD
  onDaySelect: (date: string) => void
  testID?: string
}

/** Maps JS getDay() index to the Hebrew day abbreviation key. */
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function getDayLabel(date: string): string {
  const dayIndex = new Date(date + 'T12:00:00').getDay()
  const key = DAY_KEYS[dayIndex]
  return t().nutrition.days[key]
}

function getDayNumber(date: string): string {
  return String(new Date(date + 'T12:00:00').getDate())
}

export function DaySelector({
  selectedDate,
  weekDates,
  todayDate,
  onDaySelect,
  testID,
}: DaySelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
      testID={testID}
    >
      {weekDates.map((date) => {
        const selected = date === selectedDate
        const today = isToday(date, todayDate)

        return (
          <Pressable
            key={date}
            onPress={() => onDaySelect(date)}
            style={[
              styles.pill,
              selected && styles.pillSelected,
              today && !selected && styles.pillToday,
            ]}
            testID={`${testID}-day-${date}`}
          >
            {selected && (
              <View
                testID={`${testID}-selected-${date}`}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            )}
            {today && (
              <View
                testID={`${testID}-today-${date}`}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            )}
            <Text
              style={[styles.dayLabel, selected && styles.dayLabelSelected]}
              testID={`${testID}-label-${date}`}
            >
              {getDayLabel(date)}
            </Text>
            <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>
              {getDayNumber(date)}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.ms,
    borderRadius: borderRadius.lg,
    minWidth: 44,
    gap: spacing.xxs,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillToday: {
    backgroundColor: colors.primaryTint,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
  dayLabelSelected: {
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },
  dayNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  dayNumberSelected: {
    color: colors.textInverse,
  },
})
