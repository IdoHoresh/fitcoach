import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedProps, withSpring } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const DEFAULT_SIZE = 240
const STROKE_WIDTH = 16
const SPRING_CONFIG = { damping: 18, stiffness: 90 }

interface MacroGaugeProps {
  consumedCalories: number
  goalCalories: number
  size?: number
  testID?: string
}

/**
 * Pure helper — computes the normalized progress [0, 1] for the gauge.
 * Handles zero/negative goals (returns 0) and clamps over-target to 1.
 * Extracted so the logic can be unit-tested without SVG / reanimated.
 */
export function computeGaugeProgress(consumed: number, goal: number): number {
  if (goal <= 0) return 0
  const raw = consumed / goal
  if (raw < 0) return 0
  if (raw > 1) return 1
  return raw
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * Half-circle gauge.
 *
 * Implementation note — why a full Circle, not a Path arc:
 * Earlier attempts using `<Path d="M ... A ...">` with various sweep
 * flags would not render visibly on react-native-svg, even though the
 * path string was valid in browser SVG renderers. The cause turned out
 * to be how react-native-svg interpolates dashed arc paths.
 *
 * The reliable approach (same as our existing MacroRing component):
 *   1. Draw a FULL circle with strokeDasharray = [halfCircumference, fullCircumference]
 *      → only the first half is visible.
 *   2. Rotate -90° around the circle center so the visible half starts
 *      at 9 o'clock and sweeps clockwise through 12 to 3 o'clock —
 *      i.e. the TOP half of the circle.
 *   3. Wrap the SVG in a View with `overflow: 'hidden'` and a height
 *      of `radius + STROKE_WIDTH / 2` so the bottom half (which contains
 *      nothing visible anyway) is clipped off the layout.
 *
 * Animating progress is then identical to MacroRing: shift
 * `strokeDashoffset` from `halfCircumference` (empty) to `0` (full).
 */
export function MacroGauge({
  consumedCalories,
  goalCalories,
  size = DEFAULT_SIZE,
  testID,
}: MacroGaugeProps) {
  const strings = t().home.v2
  const progress = computeGaugeProgress(consumedCalories, goalCalories)

  const radius = (size - STROKE_WIDTH) / 2
  const fullCircumference = 2 * Math.PI * radius
  const halfCircumference = Math.PI * radius

  // Visible canvas height = top half of the circle + half a stroke for
  // the linecap to sit fully inside the viewport.
  const visibleHeight = radius + STROKE_WIDTH / 2

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withSpring(halfCircumference * (1 - progress), SPRING_CONFIG),
  }))

  return (
    <View style={styles.container} testID={testID}>
      {/* Clipping wrapper hides the bottom half of the rendered circle. */}
      <View style={[styles.gaugeClip, { width: size, height: visibleHeight }]}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${halfCircumference} ${fullCircumference}`}
            // Rotate -180° so the dash starts at 9 o'clock and runs
            // clockwise over the top to 3 o'clock = the top half.
            transform={`rotate(180 ${size / 2} ${size / 2})`}
          />
          {/* Animated fill — same path, but with strokeDashoffset. */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${halfCircumference} ${fullCircumference}`}
            animatedProps={animatedProps}
            transform={`rotate(180 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Number label sits inside the half-circle, anchored to the bottom. */}
        <View style={styles.centerLabel} pointerEvents="none">
          <View style={styles.numberRow}>
            <Text style={styles.consumedNumber} testID={testID ? `${testID}-consumed` : undefined}>
              {formatNumber(consumedCalories)}
            </Text>
            <Text style={styles.separator}> / </Text>
            <Text style={styles.goalNumber} testID={testID ? `${testID}-goal` : undefined}>
              {formatNumber(goalCalories)}
            </Text>
          </View>
          <Text style={styles.caloriesLabel}>{strings.caloriesShort}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  gaugeClip: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  numberRow: {
    // Numeric pairs are displayed LTR in both languages — matches the
    // standard convention in Hebrew apps where numbers, dates, and
    // data values keep their western left-to-right order even when
    // the surrounding text flows RTL.
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  goalNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
  separator: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  consumedNumber: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  caloriesLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
})
