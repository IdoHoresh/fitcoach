import React from 'react'
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'

type CardVariant = 'default' | 'elevated' | 'outlined'

interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  onPress?: () => void
  accessibilityLabel?: string
  testID?: string
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function PressableCard({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  testID,
}: CardProps & { onPress: () => void }) {
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress()

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.base, VARIANT_STYLES[variant], animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  )
}

export function Card({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  testID,
}: CardProps) {
  if (onPress) {
    return (
      <PressableCard
        variant={variant}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {children}
      </PressableCard>
    )
  }

  return (
    <View style={[styles.base, VARIANT_STYLES[variant]]} testID={testID}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
})
