import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'
import type { LoggedSet } from '@/types/workout'

type SetStatus = 'pending' | 'active' | 'confirmed'

interface SetRowProps {
  setNumber: number
  prescribedReps: { min: number; max: number }
  suggestedWeightKg: number | null
  loggedSet: LoggedSet | null
  status: SetStatus
  onConfirm: (set: LoggedSet) => void
  testID?: string
}

export function SetRow({
  setNumber,
  prescribedReps,
  suggestedWeightKg,
  loggedSet,
  status,
  onConfirm,
  testID,
}: SetRowProps) {
  const strings = t().workout
  const rtl = isRTL()

  const defaultReps = Math.round((prescribedReps.min + prescribedReps.max) / 2)
  const defaultWeight = suggestedWeightKg ?? 0

  const [weightText, setWeightText] = useState(
    loggedSet ? String(loggedSet.weightKg) : String(defaultWeight),
  )
  const [repsText, setRepsText] = useState(loggedSet ? String(loggedSet.reps) : String(defaultReps))

  // Update weight when suggested weight arrives late (async progression advice)
  const userEditedRef = useRef(false)
  useEffect(() => {
    if (
      suggestedWeightKg != null &&
      suggestedWeightKg > 0 &&
      status === 'pending' &&
      !userEditedRef.current
    ) {
      setWeightText(String(suggestedWeightKg))
    }
  }, [suggestedWeightKg, status])

  const handleWeightChange = useCallback((text: string) => {
    userEditedRef.current = true
    setWeightText(text)
  }, [])

  const handleRepsChange = useCallback((text: string) => {
    userEditedRef.current = true
    setRepsText(text)
  }, [])

  const handleConfirm = useCallback(() => {
    const weightKg = parseFloat(weightText) || 0
    const reps = parseInt(repsText, 10) || 0
    onConfirm({
      setNumber,
      weightKg,
      reps,
      rpe: null,
      isWarmup: false,
    })
  }, [weightText, repsText, setNumber, onConfirm])

  const isConfirmed = status === 'confirmed'
  const isActive = status === 'active'
  const isPending = status === 'pending'

  return (
    <View
      style={[
        styles.row,
        rtl && styles.rowRTL,
        isActive && styles.rowActive,
        isConfirmed && styles.rowConfirmed,
        isPending && styles.rowPending,
      ]}
      testID={testID}
    >
      {/* Set number */}
      <View style={styles.setLabel}>
        <Text style={[styles.setNumber, isConfirmed && styles.textConfirmed]}>{setNumber}</Text>
      </View>

      {/* Weight input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, rtl && styles.inputRTL, isConfirmed && styles.inputConfirmed]}
          value={isConfirmed && loggedSet ? String(loggedSet.weightKg) : weightText}
          onChangeText={handleWeightChange}
          keyboardType="numeric"
          editable={isActive}
          selectTextOnFocus
          testID={testID ? `${testID}-weight` : undefined}
          accessibilityLabel={strings.weight}
        />
        <Text style={styles.unitLabel}>{strings.kg}</Text>
      </View>

      {/* Reps input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, rtl && styles.inputRTL, isConfirmed && styles.inputConfirmed]}
          value={isConfirmed && loggedSet ? String(loggedSet.reps) : repsText}
          onChangeText={handleRepsChange}
          keyboardType="number-pad"
          editable={isActive}
          selectTextOnFocus
          testID={testID ? `${testID}-reps` : undefined}
          accessibilityLabel={strings.repsLabel}
        />
        <Text style={styles.unitLabel}>{strings.repsLabel}</Text>
      </View>

      {/* Confirm / check button */}
      <Pressable
        style={[styles.confirmBtn, isConfirmed && styles.confirmBtnDone]}
        onPress={handleConfirm}
        disabled={!isActive}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={strings.confirmSet}
        testID={testID ? `${testID}-confirm` : undefined}
      >
        <Ionicons
          name={isConfirmed ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={28}
          color={isConfirmed ? colors.setComplete : isActive ? colors.setActive : colors.textMuted}
        />
      </Pressable>
    </View>
  )
}

const INPUT_WIDTH = 56
const INPUT_HEIGHT = 40

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  rowActive: {
    backgroundColor: `${colors.setActive}15`,
    borderWidth: 1,
    borderColor: `${colors.setActive}40`,
  },
  rowConfirmed: {
    backgroundColor: `${colors.setComplete}10`,
  },
  rowPending: {
    opacity: 0.5,
  },
  setLabel: {
    width: 24,
    alignItems: 'center',
  },
  setNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  textConfirmed: {
    color: colors.setComplete,
  },
  inputGroup: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  input: {
    width: INPUT_WIDTH,
    height: INPUT_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: spacing.xs,
  },
  inputRTL: {
    textAlign: 'center',
  },
  inputConfirmed: {
    backgroundColor: `${colors.setComplete}10`,
    borderColor: colors.setComplete,
    color: colors.setComplete,
  },
  unitLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  confirmBtn: {
    padding: spacing.xxs,
  },
  confirmBtnDone: {
    opacity: 1,
  },
})
