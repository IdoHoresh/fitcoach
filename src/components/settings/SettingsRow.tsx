import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'
import { triggerHaptic } from '@/hooks/useHaptics'

interface SettingsRowProps {
  label: string
  subtitle?: string
  onPress: () => void
  testID?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function SettingsRow({ label, subtitle, onPress, testID }: SettingsRowProps) {
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
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      testID={testID}
      style={[styles.row, animatedStyle]}
    >
      <View style={styles.textColumn}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
})
