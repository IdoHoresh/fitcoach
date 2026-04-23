import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import type { PlanItem } from '@/utils/buildTodaysPlan'

const ICON_CONTAINER_SIZE = 48
const ICON_SIZE = 22
const CIRCLE_SIZE = 24
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
  const isNext = item.isNext && !isRest

  const planItemKey = item.labelKey as keyof typeof strings.planItems
  const primaryLabel = isRest ? strings.restDay : strings.planItems[planItemKey]
  const secondaryLabel = item.secondaryLabel

  const pillLabel = isWorkout ? strings.startPill : strings.logPill

  const leadingIcon = renderLeadingIcon(item, testID)
  const trailing = renderTrailing(item, strings.caloriesShort, strings.minutesShort, testID)
  const trailingCircle = renderTrailingCircle(item, testID)

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

      <View style={styles.content}>
        {/* Trailing: value + pill OR check circle (left side in RTL) */}
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
          {!isNext && trailingCircle}
        </View>

        {/* Primary + secondary label stack (right of icon in RTL) */}
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

        {leadingIcon}
      </View>
    </Pressable>
  )
}

// ── Sub-renderers ─────────────────────────────────────────────────

function renderLeadingIcon(item: PlanItem, testID: string | undefined): React.ReactElement {
  const isGhost = item.kind === 'ghost'

  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'ellipsis-horizontal'
  if (item.kind === 'workout') iconName = 'barbell-outline'
  else if (item.kind === 'meal') iconName = 'restaurant-outline'
  else if (item.kind === 'rest') iconName = 'bed-outline'

  return (
    <View
      style={[styles.iconContainer, isGhost && styles.iconContainerGhost]}
      testID={testID ? `${testID}-icon` : undefined}
    >
      <Ionicons name={iconName} size={ICON_SIZE} color={colors.primary} />
    </View>
  )
}

function renderTrailingCircle(
  item: PlanItem,
  testID: string | undefined,
): React.ReactElement | null {
  if (item.kind === 'rest') return null

  if (item.done) {
    return (
      <View style={styles.doneCircle} testID={testID ? `${testID}-check` : undefined}>
        <Ionicons name="checkmark" size={CIRCLE_SIZE - 10} color={colors.textInverse} />
      </View>
    )
  }

  return (
    <View style={styles.pendingCircle} testID={testID ? `${testID}-pending-circle` : undefined} />
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
  },
  rowNext: {
    borderWidth: 1,
    borderColor: colors.warning,
    paddingTop: spacing.lg,
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
    flexDirection: 'row',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerGhost: {
    opacity: 0.5,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trailingValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  doneCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pill: {
    flexDirection: 'row',
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
