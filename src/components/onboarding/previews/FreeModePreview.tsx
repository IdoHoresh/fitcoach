import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Text as SvgText } from 'react-native-svg'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'

/**
 * Miniature "Free mode" preview surfaced inside the ModeCard.
 * Shows a half-ring daily-calorie gauge alongside time-of-day windows (בוקר / צהריים / ערב).
 * Purely visual — no interactivity, no data, no touch targets.
 */

const GAUGE_WIDTH = 88
const GAUGE_HEIGHT = 50
const WINDOW_PADDING_V = 4
const WINDOW_PADDING_H = 7

interface FreeModePreviewProps {
  /** Accessibility label — set by parent ModeCard from i18n. */
  accessibilityLabel?: string
}

export function FreeModePreview({ accessibilityLabel }: FreeModePreviewProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={styles.container}
    >
      <View style={styles.gaugeColumn}>
        <Svg width={GAUGE_WIDTH} height={GAUGE_HEIGHT} viewBox="0 0 88 50">
          <Path
            d="M6 46 A 38 38 0 0 1 82 46"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M6 46 A 38 38 0 0 1 60 10"
            stroke={colors.primary}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          <SvgText
            x={44}
            y={42}
            textAnchor="middle"
            fontFamily="Rubik_700Bold"
            fontSize={16}
            fontWeight={fontWeight.bold}
            fill={colors.textPrimary}
          >
            1820
          </SvgText>
          <SvgText
            x={44}
            y={50}
            textAnchor="middle"
            fontFamily="Rubik_400Regular"
            fontSize={7}
            fill={colors.textMuted}
          >
            / 2300
          </SvgText>
        </Svg>
        <Text style={styles.gaugeCaption}>קלוריות היום</Text>
      </View>
      <View style={styles.windowsColumn}>
        {WINDOWS.map((w) => (
          <View key={w.label} style={styles.windowRow}>
            <Text style={styles.windowLabel}>{w.label}</Text>
            <Text style={styles.windowItems} numberOfLines={1}>
              {w.items}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const WINDOWS = [
  { label: 'בוקר', items: 'יוגורט · קפה' },
  { label: 'צהריים', items: 'סלט · פיתה' },
  { label: 'ערב', items: 'דג · אורז' },
] as const

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  gaugeColumn: {
    width: 100,
    alignItems: 'center',
    flexShrink: 0,
  },
  gaugeCaption: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  windowsColumn: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  windowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    paddingVertical: WINDOW_PADDING_V,
    paddingHorizontal: WINDOW_PADDING_H,
  },
  windowLabel: {
    fontSize: fontSize.xs - 2,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  windowItems: {
    fontSize: 8,
    color: colors.textMuted,
    marginStart: 6,
    overflow: 'hidden',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
