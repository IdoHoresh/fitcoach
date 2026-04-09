import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedProps, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { triggerHaptic } from '@/hooks/useHaptics'
import { t } from '@/i18n'
import { Button } from './Button'
import { RTLWrapper } from './shared/RTLWrapper'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const DEFAULT_SIZE = 180
const STROKE_WIDTH = 12
const WARNING_THRESHOLD_SECONDS = 10
const TICK_MS = 1000

interface RestTimerProps {
  durationSeconds: number
  onComplete?: () => void
  autoStart?: boolean
  size?: number
  testID?: string
}

export function RestTimer({
  durationSeconds,
  onComplete,
  autoStart = true,
  size = DEFAULT_SIZE,
  testID,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const onCompleteRef = useRef(onComplete)

  // Keep latest onComplete callback without re-triggering effects.
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)
          triggerHaptic('heavy')
          onCompleteRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [isRunning])

  const togglePause = useCallback(() => {
    if (remaining === 0) return
    setIsRunning((prev) => !prev)
  }, [remaining])

  const reset = useCallback(() => {
    setRemaining(durationSeconds)
    setIsRunning(autoStart)
  }, [durationSeconds, autoStart])

  // Ring progress: 1 = full, 0 = empty
  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = durationSeconds > 0 ? remaining / durationSeconds : 0
  const isWarning = remaining > 0 && remaining <= WARNING_THRESHOLD_SECONDS

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference * (1 - ratio), { duration: TICK_MS }),
  }))

  const displayColor = isWarning ? colors.warning : colors.textPrimary
  const ringColor = isWarning ? colors.warning : colors.restTimer

  return (
    <View style={styles.container} testID={testID}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text
            style={[styles.time, { color: displayColor }]}
            testID={testID ? `${testID}-display` : undefined}
          >
            {formatTime(remaining)}
          </Text>
        </View>
      </View>

      <RTLWrapper style={styles.controls}>
        <Button
          label={isRunning ? t().components.restTimer.pause : t().components.restTimer.resume}
          onPress={togglePause}
          variant="ghost"
          size="sm"
          disabled={remaining === 0}
          testID={testID ? `${testID}-pause` : undefined}
        />
        <Button
          label={t().components.restTimer.reset}
          onPress={reset}
          variant="ghost"
          size="sm"
          testID={testID ? `${testID}-reset` : undefined}
        />
      </RTLWrapper>
    </View>
  )
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    gap: spacing.md,
  },
})
