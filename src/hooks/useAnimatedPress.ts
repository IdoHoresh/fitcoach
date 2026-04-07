import { useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { triggerHaptic } from './useHaptics'

const DEFAULT_SCALE = 0.96
const SPRING_CONFIG = { damping: 15, stiffness: 150 }

interface UseAnimatedPressOptions {
  disabled?: boolean
  scale?: number
  hapticStyle?: 'light' | 'medium' | 'heavy'
}

export function useAnimatedPress(options: UseAnimatedPressOptions = {}) {
  const { disabled = false, scale = DEFAULT_SCALE, hapticStyle = 'light' } = options
  const pressed = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }))

  const onPressIn = useCallback(() => {
    if (disabled) return
    pressed.value = withSpring(scale, SPRING_CONFIG)
    triggerHaptic(hapticStyle)
  }, [disabled, scale, hapticStyle, pressed])

  const onPressOut = useCallback(() => {
    if (disabled) return
    pressed.value = withSpring(1, SPRING_CONFIG)
  }, [disabled, pressed])

  return { animatedStyle, onPressIn, onPressOut }
}
