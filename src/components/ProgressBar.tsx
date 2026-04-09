import React from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { borderRadius } from '@/theme/spacing'

const BAR_HEIGHT = 4
const SPRING_CONFIG = { damping: 15, stiffness: 100 }

interface ProgressBarProps {
  current: number
  total: number
  testID?: string
}

export function ProgressBar({ current, total, testID }: ProgressBarProps) {
  const progress = Math.min(Math.max(current / total, 0), 1)

  // Animate width directly from 0→100%. The fill is pinned to `left: 0`,
  // and React Native auto-swaps `left` ↔ `right` when I18nManager.isRTL is
  // true, so the fill naturally grows from the correct edge in both LTR
  // and RTL. Do NOT manually swap — that would double-flip and break RTL.
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${withSpring(progress * 100, SPRING_CONFIG)}%`,
  }))

  return (
    <View
      style={styles.track}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View
        style={[styles.fill, animatedStyle]}
        testID={testID ? `${testID}-fill` : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: BAR_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
})
