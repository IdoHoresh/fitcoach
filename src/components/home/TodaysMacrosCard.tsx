import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { Card } from '../Card'
import { MacroRing } from '../MacroRing'
import { RTLWrapper } from '../shared/RTLWrapper'
import { useNutritionStore } from '@/stores/useNutritionStore'

const HEADER_ICON_SIZE = 20
const RING_SIZE = 180

interface TodaysMacrosCardProps {
  testID?: string
}

export function TodaysMacrosCard({ testID }: TodaysMacrosCardProps) {
  const activePlan = useNutritionStore((s) => s.activePlan)
  const dailySummary = useNutritionStore((s) => s.dailySummary)
  const strings = t().home.dashboard

  if (!activePlan) {
    return (
      <Card testID={testID}>
        <SectionHeader title={strings.todaysMacros} />
        <Text style={styles.emptyText}>{strings.noMealPlanYet}</Text>
      </Card>
    )
  }

  // dailySummary may be null early in the day; treat as zero consumed
  const consumedCalories = dailySummary?.totalCalories ?? 0
  const consumedProtein = dailySummary?.totalProtein ?? 0
  const consumedCarbs = dailySummary?.totalCarbs ?? 0
  const consumedFat = dailySummary?.totalFat ?? 0

  return (
    <Card testID={testID}>
      <SectionHeader title={strings.todaysMacros} />
      <MacroRing
        testID={testID ? `${testID}-ring` : undefined}
        consumedCalories={consumedCalories}
        goalCalories={activePlan.targetCalories}
        protein={{ current: consumedProtein, goal: activePlan.targetProtein }}
        carbs={{ current: consumedCarbs, goal: activePlan.targetCarbs }}
        fat={{ current: consumedFat, goal: activePlan.targetFat }}
        size={RING_SIZE}
      />
    </Card>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <RTLWrapper style={styles.header}>
      <Ionicons name="nutrition-outline" size={HEADER_ICON_SIZE} color={colors.primary} />
      <Text style={styles.headerTitle}>{title}</Text>
    </RTLWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
})
