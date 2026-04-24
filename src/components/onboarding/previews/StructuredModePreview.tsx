import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'

/**
 * Miniature "Structured mode" preview surfaced inside the ModeCard.
 * Shows a faux meal card with per-meal macro target + 3 macro bars + pick chips.
 * Purely visual — no interactivity, no data, no touch targets.
 */

const BAR_HEIGHT = 5
const CHIP_PADDING_V = 3
const CHIP_PADDING_H = 7
const TARGET_PADDING_V = 2
const TARGET_PADDING_H = 8

interface StructuredModePreviewProps {
  /** Accessibility label — set by parent ModeCard from i18n. */
  accessibilityLabel?: string
}

export function StructuredModePreview({ accessibilityLabel }: StructuredModePreviewProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={styles.targetChip}>
          <Text style={styles.targetText}>730 קל׳</Text>
        </View>
        <Text style={styles.mealLabel}>ארוחת בוקר</Text>
      </View>
      {MACRO_BARS.map((b) => (
        <View key={b.label} style={styles.barRow}>
          <Text style={styles.macroLabel}>{b.label}</Text>
          <View style={styles.barTrack}>
            <View
              style={[styles.barFill, { width: `${b.fillPercent}%`, backgroundColor: b.color }]}
            />
          </View>
          <Text style={styles.macroValue}>{b.value}</Text>
        </View>
      ))}
      <View style={styles.chipRow}>
        {PICK_CHIPS.map((c, i) => (
          <View
            key={c}
            style={[styles.chip, i === 0 ? styles.chipSelected : styles.chipUnselected]}
          >
            <Text style={[styles.chipText, i === 0 ? styles.chipTextSelected : null]}>{c}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const MACRO_BARS = [
  { label: 'חלבון', color: colors.protein, fillPercent: 72, value: '32/44ג׳' },
  { label: 'פחמימות', color: colors.carbs, fillPercent: 48, value: '38/80ג׳' },
  { label: 'שומן', color: colors.fat, fillPercent: 30, value: '7/24ג׳' },
] as const

const PICK_CHIPS = ['½ חזה עוף', 'יוגורט', '¾ אורז'] as const

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  targetChip: {
    backgroundColor: colors.primarySoft,
    paddingVertical: TARGET_PADDING_V,
    paddingHorizontal: TARGET_PADDING_H,
    borderRadius: borderRadius.full,
  },
  targetText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    width: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  barTrack: {
    flex: 1,
    height: BAR_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    // flexDirection: 'row' lets forceRTL auto-flip the fill so it grows from
    // the start edge in both LTR and RTL (same pattern as calculating.tsx).
    flexDirection: 'row',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  macroValue: {
    fontSize: 9,
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'left',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    paddingVertical: CHIP_PADDING_V,
    paddingHorizontal: CHIP_PADDING_H,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryMuted,
  },
  chipUnselected: {
    backgroundColor: colors.surfaceElevated,
  },
  chipText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
  },
})
