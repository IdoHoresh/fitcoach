import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import { RTLWrapper } from '../shared/RTLWrapper'
import type { PlanItem } from '@/utils/buildTodaysPlan'

const INDICATOR_SIZE = 22
const PILL_ICON_SIZE = 14
const NEXT_LABEL_ICON_SIZE = 12

interface PlanRowProps {
  item: PlanItem
  onPress: () => void
  testID?: string
}

export function PlanRow({ item, onPress, testID }: PlanRowProps) {
  const strings = t().home.v2
  const isRest = item.kind === 'rest'
  const isGhost = item.kind === 'ghost'
  const isWorkout = item.kind === 'workout'
  const isNext = item.isNext && !isRest // defensive — rest rows should never be next

  // ── Label resolution ──
  // Primary label comes from i18n planItems map; workout rows have a
  // secondaryLabel with the template's localized name.
  const planItemKey = item.labelKey as keyof typeof strings.planItems
  const primaryLabel = isRest ? strings.restDay : strings.planItems[planItemKey]
  const secondaryLabel = item.secondaryLabel

  // ── Pill label (only for next rows) ──
  const pillLabel = isWorkout ? strings.startPill : strings.logPill

  // ── Indicator (left side of row) ──
  const indicator = renderIndicator(item, isRest, isGhost, testID)

  // ── Trailing value ──
  const trailing = renderTrailing(item, strings.caloriesShort, strings.minutesShort, testID)

  const rowStyles = [
    styles.row,
    isNext && styles.rowNext,
    isGhost && styles.rowGhost,
    isRest && styles.rowRest,
  ]

  return (
    <Pressable
      onPress={onPress}
      disabled={isRest}
      style={rowStyles}
      testID={testID}
      accessibilityRole={isRest ? undefined : 'button'}
    >
      {/* Next-state top label — absolute so it floats above the row */}
      {isNext && (
        <View style={[styles.nextLabel, isRTL() ? styles.nextLabelRTL : styles.nextLabelLTR]}>
          <Text style={styles.nextLabelText}>{strings.nextLabel}</Text>
          <Ionicons
            name={isRTL() ? 'arrow-back' : 'arrow-forward'}
            size={NEXT_LABEL_ICON_SIZE}
            color={colors.warning}
          />
        </View>
      )}

      <RTLWrapper style={styles.content}>
        {indicator}

        {/* Primary + secondary label stack */}
        <View style={styles.labelColumn}>
          <Text
            style={[styles.primaryLabel, (item.done || isGhost || isRest) && styles.labelMuted]}
          >
            {primaryLabel}
          </Text>
          {secondaryLabel && (
            <Text style={styles.secondaryLabel} numberOfLines={1}>
              {secondaryLabel}
            </Text>
          )}
        </View>

        {/* Trailing value + optional pill */}
        <View style={styles.trailingColumn}>
          {trailing}
          {isNext && (
            <Pressable
              onPress={onPress}
              style={styles.pill}
              testID={testID ? `${testID}-next-pill` : undefined}
              accessibilityRole="button"
            >
              <Text style={styles.pillText}>{pillLabel}</Text>
              <Ionicons
                name={isRTL() ? 'arrow-back' : 'arrow-forward'}
                size={PILL_ICON_SIZE}
                color={colors.textPrimary}
              />
            </Pressable>
          )}
        </View>
      </RTLWrapper>
    </Pressable>
  )
}

// ── Sub-renderers ─────────────────────────────────────────────────

function renderIndicator(
  item: PlanItem,
  isRest: boolean,
  isGhost: boolean,
  testID: string | undefined,
): React.ReactElement {
  if (isRest) {
    return (
      <View style={styles.indicator}>
        <Ionicons name="bed-outline" size={INDICATOR_SIZE} color={colors.textSecondary} />
      </View>
    )
  }

  if (isGhost) {
    return (
      <View style={[styles.indicator, styles.indicatorGhost]}>
        <View
          style={styles.pendingCircle}
          testID={testID ? `${testID}-pending-circle` : undefined}
        />
      </View>
    )
  }

  if (item.done) {
    return (
      <View
        style={[styles.indicator, styles.indicatorDone]}
        testID={testID ? `${testID}-check` : undefined}
      >
        <Ionicons name="checkmark" size={INDICATOR_SIZE - 4} color={colors.textPrimary} />
      </View>
    )
  }

  return (
    <View style={styles.indicator}>
      <View style={styles.pendingCircle} testID={testID ? `${testID}-pending-circle` : undefined} />
    </View>
  )
}

function renderTrailing(
  item: PlanItem,
  caloriesUnit: string,
  minutesUnit: string,
  testID: string | undefined,
): React.ReactElement | null {
  if (item.kind === 'workout' && item.durationMinutes !== null) {
    return (
      <Text style={styles.trailingValue} testID={testID ? `${testID}-duration` : undefined}>
        {item.durationMinutes} {minutesUnit}
      </Text>
    )
  }

  if (item.calories !== null) {
    const prefix = item.done ? '' : '~'
    return (
      <Text style={styles.trailingValue} testID={testID ? `${testID}-calories` : undefined}>
        {prefix}
        {item.calories} {caloriesUnit}
      </Text>
    )
  }

  return null
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowNext: {
    borderColor: colors.warning,
    paddingTop: spacing.lg, // more room for the "next" label
  },
  rowGhost: {
    opacity: 0.45,
  },
  rowRest: {
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  nextLabel: {
    position: 'absolute',
    top: spacing.xs,
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  nextLabelRTL: {
    left: spacing.md,
  },
  nextLabelLTR: {
    right: spacing.md,
  },
  nextLabelText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  content: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: INDICATOR_SIZE + 4,
    height: INDICATOR_SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDone: {
    backgroundColor: colors.success,
    borderRadius: (INDICATOR_SIZE + 4) / 2,
  },
  indicatorGhost: {
    opacity: 0.6,
  },
  pendingCircle: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  labelColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  primaryLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  labelMuted: {
    color: colors.textSecondary,
  },
  secondaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  trailingColumn: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trailingValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  pill: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
})
