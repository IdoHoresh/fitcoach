import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

interface StepProgressHeaderProps {
  step: number
  total: number
  testID?: string
}

export function StepProgressHeader({ step, total, testID }: StepProgressHeaderProps) {
  const percent = Math.round((step / total) * 100)
  const strings = t().onboarding.common

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.labelRow}>
        <Text style={styles.stepLabel}>
          {strings.stepOf.replace('{step}', String(step)).replace('{total}', String(total))}
        </Text>
        <Text style={styles.percentLabel}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${percent}%` }]}
          testID={testID ? `${testID}-fill` : undefined}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.ms,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  stepLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  percentLabel: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  track: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
})
