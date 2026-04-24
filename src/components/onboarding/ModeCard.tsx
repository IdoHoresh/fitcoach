import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, AccessibilityRole } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'
import { triggerHaptic } from '@/hooks/useHaptics'
import { Icon } from '../Icon'

/**
 * Card used on the mode-choice onboarding screen. Picks a meal-logging mode
 * (Structured "אני רוצה תוכנית" vs Free "אני רוצה מעקב").
 *
 * Layout per card: header row (ⓘ info button · title+subtitle · check indicator)
 * above a thumbnail preview + an optional callout chip pinned to the preview's
 * top edge. Parent supplies the preview component + the callout label.
 *
 * Selection styling mirrors SelectionCard:
 * - selected → primaryTint background + primary border + shadow halo
 * - unselected → surfaceContainerLow background + transparent 2px border (reserved
 *   so selection doesn't cause layout shift)
 */

const CARD_PADDING = spacing.md
const INDICATOR_SIZE = 28
const INFO_BUTTON_SIZE = 32
const INFO_ICON_SIZE = 22
const CHECK_ICON_SIZE = 20
const CALLOUT_OFFSET_TOP = 10

interface ModeCardProps {
  title: string
  subtitle: string
  selected: boolean
  onPress: () => void
  onInfoPress: () => void
  /** Thumbnail preview component (StructuredModePreview or FreeModePreview) */
  preview: React.ReactNode
  /** Short label shown in a teal chip above the preview when the card is selected */
  calloutLabel: string
  infoAccessibilityLabel: string
  testID?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function ModeCard({
  title,
  subtitle,
  selected,
  onPress,
  onInfoPress,
  preview,
  calloutLabel,
  infoAccessibilityLabel,
  testID,
}: ModeCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress()

  const handlePress = useCallback(() => {
    triggerHaptic('light')
    onPress()
  }, [onPress])

  const handleInfoPress = useCallback(() => {
    triggerHaptic('light')
    onInfoPress()
  }, [onInfoPress])

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole={'radio' as AccessibilityRole}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ selected }}
      testID={testID}
      style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected, animatedStyle]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleInfoPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={infoAccessibilityLabel}
          testID={testID ? `${testID}-info` : undefined}
          style={styles.infoButton}
        >
          <Icon name="info-outline" size={INFO_ICON_SIZE} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.textColumn}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.indicator}>
          {selected ? (
            <Icon name="check-circle" size={CHECK_ICON_SIZE} color={colors.primary} />
          ) : null}
        </View>
      </View>

      <View style={styles.previewWrap}>
        {preview}
        {selected ? (
          <View style={styles.calloutChip} pointerEvents="none">
            <Text style={styles.calloutText}>{calloutLabel}</Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: CARD_PADDING,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing.ms,
  },
  cardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  cardUnselected: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
  },
  infoButton: {
    width: INFO_BUTTON_SIZE,
    height: INFO_BUTTON_SIZE,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: fontSize.lg * 1.2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: fontSize.xs * 1.4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewWrap: {
    position: 'relative',
    marginTop: CALLOUT_OFFSET_TOP,
  },
  calloutChip: {
    position: 'absolute',
    top: -CALLOUT_OFFSET_TOP - 2,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: 7,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  calloutText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.onPrimary,
  },
})
