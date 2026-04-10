import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

interface MacroStat {
  planned: number
  goal: number
}

interface NutritionMacroPillsProps {
  protein: MacroStat
  carbs: MacroStat
  fat: MacroStat
  testID?: string
}

interface PillProps {
  label: string
  stat: MacroStat
  accentColor: string
  pillTestID: string
  labelTestID: string
  valueTestID: string
}

function MacroPill({ label, stat, accentColor, pillTestID, labelTestID, valueTestID }: PillProps) {
  return (
    <View style={[styles.pill, { borderBottomColor: accentColor }]} testID={pillTestID}>
      <Text style={styles.label} testID={labelTestID}>
        {label}
      </Text>
      <Text style={styles.value} testID={valueTestID}>
        {`${Math.round(stat.planned)}g`}
      </Text>
    </View>
  )
}

export function NutritionMacroPills({ protein, carbs, fat, testID }: NutritionMacroPillsProps) {
  const strings = t().nutrition.macros
  const id = testID ?? 'macro-pills'

  return (
    <View style={styles.row}>
      {/* RTL order: fat | carbs | protein (right-to-left on screen) */}
      <MacroPill
        label={strings.fat}
        stat={fat}
        accentColor={colors.fat}
        pillTestID={`${id}-fat`}
        labelTestID={`${id}-fat-label`}
        valueTestID={`${id}-fat-value`}
      />
      <MacroPill
        label={strings.carbs}
        stat={carbs}
        accentColor={colors.carbs}
        pillTestID={`${id}-carbs`}
        labelTestID={`${id}-carbs-label`}
        valueTestID={`${id}-carbs-value`}
      />
      <MacroPill
        label={strings.protein}
        stat={protein}
        accentColor={colors.protein}
        pillTestID={`${id}-protein`}
        labelTestID={`${id}-protein-label`}
        valueTestID={`${id}-protein-value`}
      />
    </View>
  )
}

const BORDER_WIDTH = 3

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderBottomWidth: BORDER_WIDTH,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.ms,
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.regular,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
})
