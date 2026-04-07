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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: withSpring(progress, SPRING_CONFIG) }],
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
  },
  fill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    transformOrigin: 'left',
  },
})
