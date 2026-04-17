import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

const DOT_SIZE = 8

interface MacroStat {
  readonly current: number
  readonly goal: number
}

interface MacroLegendProps {
  protein: MacroStat
  carbs: MacroStat
  fat: MacroStat
  testID?: string
}

export function MacroLegend({ protein, carbs, fat, testID }: MacroLegendProps) {
  const strings = t().home.v2.macroLegend

  return (
    <View style={styles.row} testID={testID}>
      <MacroColumn
        label={strings.proteinLabel}
        stat={protein}
        color={colors.protein}
        testID={testID ? `${testID}-protein` : undefined}
      />
      <MacroColumn
        label={strings.carbsLabel}
        stat={carbs}
        color={colors.carbs}
        testID={testID ? `${testID}-carbs` : undefined}
      />
      <MacroColumn
        label={strings.fatLabel}
        stat={fat}
        color={colors.fat}
        testID={testID ? `${testID}-fat` : undefined}
      />
    </View>
  )
}

interface MacroColumnProps {
  label: string
  stat: MacroStat
  color: string
  testID?: string
}

function MacroColumn({ label, stat, color, testID }: MacroColumnProps) {
  return (
    <View style={styles.column} testID={testID}>
      <View style={styles.dotRow}>
        <View
          style={[styles.dot, { backgroundColor: color }]}
          testID={testID ? `${testID}-dot` : undefined}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{stat.current}g</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.xs,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
})
