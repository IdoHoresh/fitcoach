/**
 * Coach marks overlay — renders the active step over a dimmed backdrop.
 *
 * Layout strategy:
 *   - Single root <Modal> rendered above the entire app (statusBarTranslucent).
 *   - 4 dimmed <View> "slabs" (top / bottom / left / right) form a hole around
 *     the active target's measured rect — no SVG mask, no extra dependencies.
 *   - Tooltip card sits below the target if there's room; otherwise above.
 *   - Footer row: step counter (left in LTR / right in RTL) + Skip + primary
 *     button (label flips to the localized "done" string on the final step).
 *
 * If the active target hasn't been measured yet (e.g. tab bar still laying
 * out), the spotlight slabs collapse and a centered tooltip is shown so the
 * step copy is still visible. The overlay never blocks itself.
 */

import React from 'react'
import { Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL, t } from '@/i18n'
import { Button } from '../Button'
import { useCoachMarks } from './CoachMarksContext'
import type { TargetRect } from './types'

const BACKDROP_COLOR = 'rgba(15, 23, 42, 0.78)' // colors.background @ 78%
const SPOTLIGHT_PADDING = 8
const TOOLTIP_MARGIN = 12
const TOOLTIP_MAX_WIDTH = 320

export function CoachMarksOverlay() {
  const { isActive, steps, activeIndex, getTargetRect, next, skip } = useCoachMarks()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  if (!isActive || activeIndex === null) {
    return null
  }

  const step = steps[activeIndex]
  if (!step) return null

  const labels = t().components.coachMarks
  const isFinalStep = activeIndex === steps.length - 1
  const stepCounter = `${activeIndex + 1} ${labels.stepSeparator} ${steps.length}`
  const rtl = isRTL()

  const rect = getTargetRect(step.id)
  const spotlight = rect ? buildSpotlight(rect, screenWidth, screenHeight) : null
  const tooltipPosition = rect
    ? computeTooltipPosition(rect, screenHeight)
    : { centered: true as const }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={skip}
      testID="coach-marks-modal"
    >
      <View style={styles.root} pointerEvents="box-none">
        {spotlight !== null ? (
          <>
            <View style={[styles.dim, spotlight.top]} />
            <View style={[styles.dim, spotlight.bottom]} />
            <View style={[styles.dim, spotlight.left]} />
            <View style={[styles.dim, spotlight.right]} />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFillObject]} />
        )}

        <View
          testID="coach-marks-tooltip"
          style={[
            styles.tooltip,
            'centered' in tooltipPosition
              ? styles.tooltipCentered
              : { top: tooltipPosition.top, left: tooltipPosition.left },
          ]}
        >
          <Text style={[styles.title, rtl && styles.rtlText]}>{step.title}</Text>
          <Text style={[styles.body, rtl && styles.rtlText]}>{step.body}</Text>

          <View style={[styles.footer, rtl && styles.footerRtl]}>
            <Text style={styles.counter}>{stepCounter}</Text>
            <View style={[styles.actions, rtl && styles.actionsRtl]}>
              <Button
                label={labels.skip}
                onPress={skip}
                variant="ghost"
                size="sm"
                testID="coach-marks-skip"
              />
              <Button
                label={isFinalStep ? labels.done : labels.next}
                onPress={next}
                variant="primary"
                size="sm"
                testID="coach-marks-next"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ── Geometry helpers ────────────────────────────────────────────────

interface SpotlightSlabs {
  top: { top: number; left: number; width: number; height: number }
  bottom: { top: number; left: number; width: number; height: number }
  left: { top: number; left: number; width: number; height: number }
  right: { top: number; left: number; width: number; height: number }
}

function buildSpotlight(
  rect: TargetRect,
  screenWidth: number,
  screenHeight: number,
): SpotlightSlabs {
  const x = Math.max(0, rect.x - SPOTLIGHT_PADDING)
  const y = Math.max(0, rect.y - SPOTLIGHT_PADDING)
  const w = Math.min(screenWidth - x, rect.width + SPOTLIGHT_PADDING * 2)
  const h = Math.min(screenHeight - y, rect.height + SPOTLIGHT_PADDING * 2)

  return {
    top: { top: 0, left: 0, width: screenWidth, height: y },
    bottom: { top: y + h, left: 0, width: screenWidth, height: Math.max(0, screenHeight - y - h) },
    left: { top: y, left: 0, width: x, height: h },
    right: { top: y, left: x + w, width: Math.max(0, screenWidth - x - w), height: h },
  }
}

interface TooltipPositioned {
  top: number
  left: number
}
type TooltipPosition = TooltipPositioned | { centered: true }

function computeTooltipPosition(rect: TargetRect, screenHeight: number): TooltipPosition {
  // Prefer ABOVE the target (tab bar lives at the bottom of the screen).
  // Falls back to BELOW if there's not enough room.
  const ESTIMATED_TOOLTIP_HEIGHT = 180
  const spaceAbove = rect.y
  const spaceBelow = screenHeight - (rect.y + rect.height)

  if (spaceAbove >= ESTIMATED_TOOLTIP_HEIGHT + TOOLTIP_MARGIN) {
    return {
      top: rect.y - ESTIMATED_TOOLTIP_HEIGHT - TOOLTIP_MARGIN,
      left: spacing.md,
    }
  }
  if (spaceBelow >= ESTIMATED_TOOLTIP_HEIGHT + TOOLTIP_MARGIN) {
    return {
      top: rect.y + rect.height + TOOLTIP_MARGIN,
      left: spacing.md,
    }
  }
  return { centered: true }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    position: 'absolute',
    backgroundColor: BACKDROP_COLOR,
  },
  tooltip: {
    position: 'absolute',
    maxWidth: TOOLTIP_MAX_WIDTH,
    right: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipCentered: {
    top: '40%',
    left: spacing.md,
    right: spacing.md,
    alignSelf: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRtl: {
    flexDirection: 'row-reverse',
  },
  counter: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionsRtl: {
    flexDirection: 'row-reverse',
  },
})
