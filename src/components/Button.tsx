import React from 'react'
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontFamily, fontSize } from '@/theme/typography'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'

const DISABLED_OPACITY = 0.5

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  testID?: string
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
}

const VARIANT_TEXT_COLORS: Record<ButtonVariant, string> = {
  primary: colors.textPrimary,
  secondary: colors.textPrimary,
  outline: colors.textPrimary,
  ghost: colors.primary,
}

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { paddingVertical: spacing.ms, paddingHorizontal: spacing.ml },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
}

const SIZE_TEXT: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress({
    disabled: isDisabled,
  })

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={[
        styles.base,
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        isDisabled && styles.disabled,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          testID={testID ? `${testID}-loading` : 'btn-loading'}
          color={VARIANT_TEXT_COLORS[variant]}
          size="small"
        />
      ) : (
        <Text style={[styles.label, SIZE_TEXT[size], { color: VARIANT_TEXT_COLORS[variant] }]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  label: {
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
})
