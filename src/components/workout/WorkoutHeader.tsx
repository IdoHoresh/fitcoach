import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'
import { isRestDay } from './helpers'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'
import type { MesocycleState } from '@/types/workout'

interface WorkoutHeaderProps {
  workout: GeneratedWorkoutDay | undefined
  mesocycle: MesocycleState | null
  testID?: string
}

export function WorkoutHeader({ workout, mesocycle, testID }: WorkoutHeaderProps) {
  const strings = t().workout
  const rest = isRestDay(workout)

  const title = rest ? strings.restDay : strings.todaysWorkout
  const dayTypeName =
    !rest && workout?.template
      ? isRTL()
        ? workout.template.nameHe
        : workout.template.nameEn
      : null

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {mesocycle?.isDeloadWeek && (
          <View style={styles.deloadBadge}>
            <Text style={styles.deloadText}>{strings.deloadBadge}</Text>
          </View>
        )}
      </View>

      <View style={styles.subtitleRow}>
        {dayTypeName && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{dayTypeName}</Text>
          </View>
        )}
        {mesocycle && (
          <Text style={styles.weekText}>
            {strings.weekLabel.replace('{week}', String(mesocycle.currentWeek))}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  titleRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  deloadBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  deloadText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  subtitleRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  weekText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
})
