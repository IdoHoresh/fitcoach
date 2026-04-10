import React, { useEffect } from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'

const BUBBLE_SIZE = 56
const STROKE_WIDTH = 4
const RADIUS = (BUBBLE_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface FloatingRestBubbleProps {
  remainingSeconds: number
  totalSeconds: number
  isVisible: boolean
  onPress: () => void
  testID?: string
}

export function FloatingRestBubble({
  remainingSeconds,
  totalSeconds,
  isVisible,
  onPress,
  testID,
}: FloatingRestBubbleProps) {
  const opacity = useSharedValue(0)
  const rtl = isRTL()

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 200 })
  }, [isVisible, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? ('auto' as const) : ('none' as const),
  }))

  const ratio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const offset = CIRCUMFERENCE * (1 - ratio)

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const display = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}`

  return (
    <Animated.View
      style={[styles.container, rtl ? styles.containerRTL : styles.containerLTR, animatedStyle]}
      testID={testID}
    >
      <Pressable
        onPress={onPress}
        style={styles.bubble}
        accessibilityLabel={t().workout.restBubbleLabel}
      >
        <Svg width={BUBBLE_SIZE} height={BUBBLE_SIZE} style={styles.ring}>
          <Circle
            cx={BUBBLE_SIZE / 2}
            cy={BUBBLE_SIZE / 2}
            r={RADIUS}
            stroke={colors.surface}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={BUBBLE_SIZE / 2}
            cy={BUBBLE_SIZE / 2}
            r={RADIUS}
            stroke={colors.restTimer}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${BUBBLE_SIZE / 2} ${BUBBLE_SIZE / 2})`}
          />
        </Svg>
        <Text style={styles.time}>{display}</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    zIndex: 10,
  },
  containerLTR: {
    right: spacing.md,
  },
  containerRTL: {
    left: spacing.md,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ring: {
    position: 'absolute',
  },
  time: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.restTimer,
    fontVariant: ['tabular-nums'],
  },
})
