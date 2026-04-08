import React, { useState, useRef, useCallback, useEffect } from 'react'
import { View, Text, Pressable, TextInput as RNTextInput, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontFamily } from '@/theme/typography'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'
import { triggerHaptic } from '@/hooks/useHaptics'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'
import { RTLWrapper } from './shared/RTLWrapper'

const DISABLED_OPACITY = 0.5
const LONG_PRESS_DELAY = 500
const REPEAT_INTERVAL = 150
const STEPPER_SIZE = 48

interface NumberInputProps {
  label: string
  value: number
  onChangeValue: (value: number) => void
  min: number
  max: number
  step: number
  unit?: string
  error?: string
  testID?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function StepperButton({
  direction,
  disabled,
  onPressIn,
  onPressOut,
  testID,
  accessibilityLabel,
}: {
  direction: 'increment' | 'decrement'
  disabled: boolean
  onPressIn: () => void
  onPressOut: () => void
  testID: string
  accessibilityLabel: string
}) {
  const {
    animatedStyle,
    onPressIn: animPressIn,
    onPressOut: animPressOut,
  } = useAnimatedPress({
    disabled,
  })

  const handlePressIn = useCallback(() => {
    animPressIn()
    onPressIn()
  }, [animPressIn, onPressIn])

  const handlePressOut = useCallback(() => {
    animPressOut()
    onPressOut()
  }, [animPressOut, onPressOut])

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={[styles.stepperButton, disabled && styles.disabled, animatedStyle]}
    >
      <Text style={[styles.stepperText, disabled && styles.stepperTextDisabled]}>
        {direction === 'increment' ? '+' : '\u2212'}
      </Text>
    </AnimatedPressable>
  )
}

export function NumberInput({
  label,
  value,
  onChangeValue,
  min,
  max,
  step,
  unit,
  error,
  testID,
}: NumberInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const isAtMin = value <= min
  const isAtMax = value >= max
  const textAlign = isRTL() ? 'right' : 'left'

  const doIncrement = useCallback(() => {
    const current = valueRef.current
    if (current >= max) return
    const next = clamp(current + step, min, max)
    valueRef.current = next
    onChangeValue(next)
    triggerHaptic('light')
  }, [max, min, step, onChangeValue])

  const doDecrement = useCallback(() => {
    const current = valueRef.current
    if (current <= min) return
    const next = clamp(current - step, min, max)
    valueRef.current = next
    onChangeValue(next)
    triggerHaptic('light')
  }, [max, min, step, onChangeValue])

  const clearTimers = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current)
      delayTimerRef.current = null
    }
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current)
      repeatTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const startLongPress = useCallback(
    (action: () => void) => {
      clearTimers()
      delayTimerRef.current = setTimeout(() => {
        repeatTimerRef.current = setInterval(action, REPEAT_INTERVAL)
      }, LONG_PRESS_DELAY)
    },
    [clearTimers],
  )

  const handleIncrementPressIn = useCallback(() => {
    if (!isAtMax) {
      doIncrement()
      startLongPress(doIncrement)
    }
  }, [isAtMax, doIncrement, startLongPress])

  const handleDecrementPressIn = useCallback(() => {
    if (!isAtMin) {
      doDecrement()
      startLongPress(doDecrement)
    }
  }, [isAtMin, doDecrement, startLongPress])

  const handleValuePress = useCallback(() => {
    setEditText(String(value))
    setIsEditing(true)
  }, [value])

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editText)
    if (!isNaN(parsed)) {
      const clamped = clamp(parsed, min, max)
      onChangeValue(clamped)
    }
    setIsEditing(false)
  }, [editText, min, max, onChangeValue])

  const handleEditSubmit = commitEdit
  const handleEditBlur = commitEdit

  const valueLabel = unit ? `${value} ${unit}` : String(value)

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      <RTLWrapper style={styles.row}>
        <StepperButton
          direction="decrement"
          disabled={isAtMin}
          onPressIn={handleDecrementPressIn}
          onPressOut={clearTimers}
          testID={testID ? `${testID}-decrement` : 'number-decrement'}
          accessibilityLabel={t().components.numberInput.decrement}
        />
        {isEditing ? (
          <RNTextInput
            value={editText}
            onChangeText={setEditText}
            onSubmitEditing={handleEditSubmit}
            onBlur={handleEditBlur}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            testID={testID ? `${testID}-edit` : 'number-edit'}
            style={[styles.valueInput, { textAlign: 'center' }]}
          />
        ) : (
          <Pressable
            onPress={handleValuePress}
            accessibilityLabel={valueLabel}
            testID={testID ? `${testID}-value` : 'number-value'}
            style={styles.valueContainer}
          >
            <Text style={styles.value}>{String(value)}</Text>
            {unit ? (
              <Text style={styles.unit} testID={testID ? `${testID}-unit` : 'number-unit'}>
                {unit}
              </Text>
            ) : null}
          </Pressable>
        )}
        <StepperButton
          direction="increment"
          disabled={isAtMax}
          onPressIn={handleIncrementPressIn}
          onPressOut={clearTimers}
          testID={testID ? `${testID}-increment` : 'number-increment'}
          accessibilityLabel={t().components.numberInput.increment}
        />
      </RTLWrapper>
      {error ? (
        <Text style={styles.error} testID={testID ? `${testID}-error` : 'number-error'}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  row: {
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperButton: {
    width: STEPPER_SIZE,
    height: STEPPER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperText: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semibold,
  },
  stepperTextDisabled: {
    color: colors.textMuted,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.ms,
  },
  value: {
    color: colors.textPrimary,
    fontSize: fontSize.hero,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  valueInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.hero,
    fontFamily: fontFamily.bold,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
  },
})
