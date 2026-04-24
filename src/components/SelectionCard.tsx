import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'
import { triggerHaptic } from '@/hooks/useHaptics'
import { Icon } from './Icon'

const CARD_PADDING = 20
const INDICATOR_SIZE = 40
const ICON_SIZE = 24

interface SelectionCardProps {
  title: string
  description?: string
  emoji?: string
  selected: boolean
  onPress: () => void
  testID?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function SelectionCard({
  title,
  description,
  emoji,
  selected,
  onPress,
  testID,
}: SelectionCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress()

  const handlePress = useCallback(() => {
    triggerHaptic('light')
    onPress()
  }, [onPress])

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ selected }}
      testID={testID}
      style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected, animatedStyle]}
    >
      <View style={styles.textColumn}>
        <Text style={styles.title}>
          {title}
          {emoji ? ` ${emoji}` : ''}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {selected ? (
        <View style={styles.indicator}>
          <Icon name="check-circle" size={ICON_SIZE} color={colors.primary} />
        </View>
      ) : null}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: CARD_PADDING,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing.md,
  },
  cardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  cardUnselected: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'transparent',
  },
  textColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
