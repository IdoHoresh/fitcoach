import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { RTLWrapper } from './shared/RTLWrapper'

const DOT_COUNT = 7
const DOT_SIZE = 14
const FLAME_SIZE = 32

interface StreakCounterProps {
  completedThisWeek: number
  weeklyGoal: number
  currentStreak: number
  testID?: string
}

export function StreakCounter({
  completedThisWeek,
  weeklyGoal,
  currentStreak,
  testID,
}: StreakCounterProps) {
  const filled = Math.min(Math.max(completedThisWeek, 0), DOT_COUNT)

  const streakLabel =
    currentStreak === 1
      ? t().components.streakCounter.streakWeek
      : t().components.streakCounter.streakWeeks

  return (
    <View style={styles.container} testID={testID}>
      <RTLWrapper style={styles.topRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.ratio}>
            {completedThisWeek}/{weeklyGoal}
          </Text>
          <Text style={styles.ratioLabel}>{t().components.streakCounter.weeklyLabel}</Text>
        </View>

        <RTLWrapper style={styles.streakBadge}>
          <Ionicons name="flame" size={FLAME_SIZE} color={colors.warning} />
          <View style={styles.streakTextColumn}>
            <Text style={styles.streakNumber} testID={testID ? `${testID}-count` : undefined}>
              {currentStreak}
            </Text>
            <Text style={styles.streakLabel}>{streakLabel}</Text>
          </View>
        </RTLWrapper>
      </RTLWrapper>

      <RTLWrapper style={styles.dotsRow}>
        {Array.from({ length: DOT_COUNT }).map((_, index) => (
          <View
            key={index}
            testID={testID ? `${testID}-dot-${index}` : undefined}
            style={[
              styles.dot,
              { backgroundColor: index < filled ? colors.success : colors.surface },
            ]}
          />
        ))}
      </RTLWrapper>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
  },
  ratio: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  ratioLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  streakBadge: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakTextColumn: {
    alignItems: 'flex-start',
  },
  streakNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  streakLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dotsRow: {
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
})
