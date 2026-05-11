/**
 * Shared portion-slider primitive (A2).
 *
 * Consumed by Track B's B4 (slider-adjust screen, Structured mode) and
 * Track C's C2 (chip flow, Free mode).
 *
 * Layout:
 *   [ food name header                                   ]
 *   [ quick-pills row · 3 primary ticks                  ]
 *   [ hand-icon · current value (dual format)            ]
 *   [ track + draggable thumb (LTR)                      ]
 *   [ tick row with dual-format labels                   ]
 *   [ cooked/raw toggle (only when variant prop given)   ]
 *
 * Decisions baked in (spec docs/specs/2026-04-30-shared-slider-primitive.md):
 *   - Q1 cooked/raw: parent owns sibling; gram preserved on swap
 *   - Q2 units: dual label `125 גר׳ · ½ חזה` on tick / between
 *   - Q3 RTL: track stays LTR (number row, lessons.md:99)
 *   - Q4 state: parent-controlled grams + sparse onChange (one fire per
 *     tick crossing during drag); thumb position is reanimated shared
 *     value (UI thread)
 *   - Q5 haptic: tick-crossing detection inlined in worklet (helper
 *     duplicated for worklet purity); manual device test verifies wiring
 *     per lessons.md:101
 */

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useMemo } from 'react'
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

import { t } from '@/i18n'
import { colors } from '@/theme/colors'
import { borderRadius, spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import type { FoodItem, HandPortion, ServingTick } from '@/types/nutrition'

import { getHandPortion, getServingTicks } from './serving-ticks.helpers'

export interface SliderProps {
  food: FoodItem
  grams: number
  onChange: (grams: number) => void
  onChangeEnd?: (grams: number) => void
  variant?: { food: FoodItem; label: string }
  onVariantChange?: (food: FoodItem) => void
  testID?: string
}

// Best-fit Ionicons for each hand-portion. Real custom SVG assets are a
// follow-up (F7 accessibility / design polish).
const HAND_ICON_NAMES: Record<HandPortion, keyof typeof Ionicons.glyphMap> = {
  palm: 'hand-left-outline',
  cupped_hand: 'water-outline',
  thumb: 'thumbs-up-outline',
  fist: 'ellipse-outline',
  unit: 'cube-outline',
}

function formatTickLabel(tick: ServingTick, gramsAbbr: string): string {
  return `${tick.grams} ${gramsAbbr} · ${tick.nameHe}`
}

function findCurrentLabel(
  grams: number,
  ticks: readonly ServingTick[],
  gramsAbbr: string,
  approxSymbol: string,
): string {
  const onTick = ticks.find((t) => t.grams === grams)
  if (onTick) return formatTickLabel(onTick, gramsAbbr)

  // No tick anchors at all — fall back to a plain gram readout.
  if (ticks.length === 0) return `${grams} ${gramsAbbr}`

  // Between ticks: show comparative form against the nearest tick.
  const nearest = ticks.reduce((best, t) =>
    Math.abs(t.grams - grams) < Math.abs(best.grams - grams) ? t : best,
  )
  const ratio = (grams / nearest.grams).toFixed(1)
  return `${approxSymbol} ${ratio} ${nearest.nameHe} · ${grams} ${gramsAbbr}`
}

function computeThumbLeftPercent(grams: number, ticks: readonly ServingTick[]): number {
  if (ticks.length === 0) return 0
  const min = ticks[0].grams
  const max = ticks[ticks.length - 1].grams
  if (max === min) return 50
  const clamped = Math.max(min, Math.min(max, grams))
  return ((clamped - min) / (max - min)) * 100
}

// Detect the current variant state from the slug suffix. Used to pick
// the i18n key for the active toggle pill. Currently only raw/cooked is
// modeled; other variant axes (crispy/chewy etc.) are out of scope.
//
// Invariant: the toggle is only rendered when `variant` is provided, and
// `variant` is only provided for foods whose slug exists in SERVING_TICKS
// with a `cookedVariantSlug`. So a `food.slug` of undefined SHOULD be
// unreachable here. The explicit `null` return is defense-in-depth: if a
// future caller violates the invariant, we return null and the toggle
// label falls back to the variant.label-only form rather than mis-labeling.
function detectVariantState(food: FoodItem): 'raw' | 'cooked' | null {
  if (!food.slug) return null
  if (food.slug.endsWith('_raw')) return 'raw'
  if (food.slug.endsWith('_cooked')) return 'cooked'
  return null
}

export function Slider({
  food,
  grams,
  onChange,
  onChangeEnd,
  variant,
  onVariantChange,
  testID,
}: SliderProps) {
  const strings = t().nutrition.slider
  const gramsAbbr = strings.gramsAbbreviated
  const approxSymbol = strings.approximately
  const ticks = getServingTicks(food)
  const primaryPills = ticks.filter((tick) => tick.isPrimary).slice(0, 3)
  const handPortion = getHandPortion(food)
  const handIconName = handPortion ? HAND_ICON_NAMES[handPortion] : null
  const currentLabel = findCurrentLabel(grams, ticks, gramsAbbr, approxSymbol)
  const thumbLeftPct = computeThumbLeftPercent(grams, ticks)
  const variantState = detectVariantState(food)

  // ── Gesture state (Q4: UI-thread reanimated; sparse JS callbacks) ──

  // Track width is measured via onLayout. Shared value so the worklet
  // can read it without crossing the JS↔UI bridge per frame.
  const trackWidth = useSharedValue(0)

  // Thumb position as 0..100 percent. Driven by gesture during drag,
  // synced from the `grams` prop on external changes (toggle, quick-pill).
  const thumbPercent = useSharedValue(thumbLeftPct)

  // Last gram value reported via onChange. Lives in the worklet so it can
  // detect tick crossings between gesture frames without JS round-trips.
  const lastReportedGrams = useSharedValue(grams)

  // Sync shared values with the prop-driven values. Quick-pill / toggle
  // press updates `grams`, which jumps the thumb instantly here.
  useEffect(() => {
    thumbPercent.value = thumbLeftPct
    lastReportedGrams.value = grams
  }, [grams, thumbLeftPct, thumbPercent, lastReportedGrams])

  const animatedThumbStyle = useAnimatedStyle(() => ({
    left: `${thumbPercent.value}%`,
  }))

  // Stable copies for the gesture closure. Capturing the helpers' arrays
  // directly is fine because they only change when `food` changes (which
  // re-creates the gesture via the useMemo dep below).
  const tickGramValues = useMemo(() => ticks.map((t) => t.grams), [ticks])
  const minGrams = tickGramValues[0] ?? 0
  const maxGrams = tickGramValues[tickGramValues.length - 1] ?? minGrams

  // JS-thread side-effects fired sparsely from the worklet via runOnJS.
  // Haptic + onChange per tick crossing; onChangeEnd once on release.
  const fireCrossing = (newGrams: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Haptics can throw on devices without Taptic engine. Silently
      // swallow — drag still works, just no vibration.
    })
    onChange(newGrams)
  }

  const fireEnd = (finalGrams: number) => {
    onChangeEnd?.(finalGrams)
  }

  // Re-create the gesture when the food (= tick set) changes so the
  // worklet captures fresh tick values. RNGH attaches/detaches gestures
  // automatically when the JSX updates.
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onUpdate((e) => {
        'worklet'
        if (trackWidth.value === 0 || tickGramValues.length === 0) return

        const pct = Math.max(0, Math.min(100, (e.x / trackWidth.value) * 100))
        thumbPercent.value = pct

        if (maxGrams === minGrams) return // degenerate single-tick slider
        const newGrams = Math.round(minGrams + (pct / 100) * (maxGrams - minGrams))

        // Tick-crossing detection inlined for worklet purity. Mirrors
        // detectTickCrossings — kept in lockstep with that helper.
        const lo = Math.min(lastReportedGrams.value, newGrams)
        const hi = Math.max(lastReportedGrams.value, newGrams)
        let crossed = false
        for (let i = 0; i < tickGramValues.length; i++) {
          const tickG = tickGramValues[i]
          if (tickG > lo && tickG <= hi) {
            crossed = true
            break
          }
        }

        if (crossed) {
          lastReportedGrams.value = newGrams
          runOnJS(fireCrossing)(newGrams)
        }
      })
      .onEnd(() => {
        'worklet'
        runOnJS(fireEnd)(lastReportedGrams.value)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickGramValues, minGrams, maxGrams])

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.value = e.nativeEvent.layout.width
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Food name */}
      <Text style={styles.foodName}>{food.nameHe}</Text>

      {/* Quick-pills */}
      {primaryPills.length > 0 && (
        <View style={styles.pillsRow}>
          {primaryPills.map((tick) => (
            <Pressable
              key={tick.grams}
              style={styles.pill}
              onPress={() => onChange(tick.grams)}
              accessibilityRole="button"
              testID={testID ? `${testID}-pill-${tick.grams}` : undefined}
            >
              <Text style={styles.pillText}>{formatTickLabel(tick, gramsAbbr)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Current value display: hand-icon + dual label */}
      <View style={styles.valueRow}>
        {handIconName && (
          <Ionicons
            name={handIconName}
            size={28}
            color={colors.primary}
            testID={testID ? `${testID}-hand-icon` : undefined}
            accessibilityLabel={handPortion ? strings.handPortion[handPortion] : undefined}
          />
        )}
        <Text style={styles.currentLabel}>{currentLabel}</Text>
      </View>

      {/* Track + thumb. GestureDetector wraps the track; thumb is animated. */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.trackContainer} onLayout={onTrackLayout}>
          <View style={styles.track} />
          <Animated.View
            style={[styles.thumb, animatedThumbStyle]}
            testID={testID ? `${testID}-thumb` : undefined}
            accessible={true}
            accessibilityRole="adjustable"
            accessibilityLabel={food.nameHe}
            accessibilityHint={strings.thumbHint}
            accessibilityValue={{
              min: minGrams,
              max: maxGrams,
              now: grams,
              text: currentLabel,
            }}
          />
        </View>
      </GestureDetector>

      {/* Tick row */}
      {ticks.length > 0 && (
        <View style={styles.ticksRow}>
          {ticks.map((tick) => (
            <View
              key={tick.grams}
              style={styles.tickColumn}
              testID={testID ? `${testID}-tick-${tick.grams}` : undefined}
            >
              <View style={styles.tickMark} />
              <Text style={styles.tickLabel}>{formatTickLabel(tick, gramsAbbr)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cooked/raw toggle. RTL: framework forces I18nManager.isRTL=true
          globally; flexDirection: 'row' flips automatically (per project
          RTL architecture — no per-component isRTL() conditionals). */}
      {variant && (
        <View style={styles.toggleRow} testID={testID ? `${testID}-toggle` : undefined}>
          {variantState && (
            <View
              style={[styles.togglePill, styles.togglePillActive]}
              accessibilityLabel={`${strings.currentSelection}: ${strings.cookedRaw[variantState]}`}
            >
              <Text style={styles.togglePillTextActive}>{strings.cookedRaw[variantState]}</Text>
            </View>
          )}
          <Pressable
            style={styles.togglePill}
            onPress={() => onVariantChange?.(variant.food)}
            accessibilityRole="button"
            accessibilityLabel={variant.label}
            testID={testID ? `${testID}-toggle-pill` : undefined}
          >
            <Text style={styles.togglePillText}>{variant.label}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  foodName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.ms,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flex: 1,
    alignItems: 'center',
  },
  pillText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  currentLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  // Track stays LTR even on Hebrew device (lessons.md:99 — number rows are LTR).
  trackContainer: {
    height: 32,
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    top: 4,
    marginLeft: -12,
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  tickColumn: {
    alignItems: 'center',
    flex: 1,
  },
  tickMark: {
    width: 1,
    height: 6,
    backgroundColor: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tickLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  togglePill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  togglePillActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  togglePillText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  togglePillTextActive: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
