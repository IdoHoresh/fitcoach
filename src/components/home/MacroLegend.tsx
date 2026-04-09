import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'

const LETTER_UNDERLINE_HEIGHT = 3

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
        letter={strings.proteinLetter}
        label={strings.proteinLabel}
        stat={protein}
        color={colors.protein}
        testID={testID ? `${testID}-protein` : undefined}
      />
      <MacroColumn
        letter={strings.carbsLetter}
        label={strings.carbsLabel}
        stat={carbs}
        color={colors.carbs}
        testID={testID ? `${testID}-carbs` : undefined}
      />
      <MacroColumn
        letter={strings.fatLetter}
        label={strings.fatLabel}
        stat={fat}
        color={colors.fat}
        testID={testID ? `${testID}-fat` : undefined}
      />
    </View>
  )
}

interface MacroColumnProps {
  letter: string
  label: string
  stat: MacroStat
  color: string
  testID?: string
}

function MacroColumn({ letter, label, stat, color, testID }: MacroColumnProps) {
  return (
    <View style={styles.column} testID={testID}>
      <View style={styles.letterRow}>
        <Text style={[styles.letter, { color }]} testID={testID ? `${testID}-letter` : undefined}>
          {letter}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={[styles.underline, { backgroundColor: color }]} />
      <Text style={styles.value}>
        {stat.current}g/{stat.goal}g
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xxs,
  },
  letterRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  letter: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  underline: {
    width: 24,
    height: LETTER_UNDERLINE_HEIGHT,
    borderRadius: LETTER_UNDERLINE_HEIGHT / 2,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
})
