import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/Card'
import { RestTimer } from '@/components/RestTimer'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'
import { formatSetsSummary } from './helpers'
import { SetRow } from './SetRow'
import type { Exercise, ExercisePrescription, LoggedSet, ProgressionAdvice } from '@/types/workout'

const ORDER_BADGE_SIZE = 28

interface ActiveExerciseCardProps {
  exercise: Exercise
  prescription: ExercisePrescription
  order: number
  isExpanded: boolean
  isCompleted: boolean
  loggedSets: LoggedSet[]
  progressionAdvice: ProgressionAdvice | null
  onToggleExpand: () => void
  onSetConfirmed: (set: LoggedSet) => void
  onAllSetsCompleted: () => void
  onRestTimerStart: (seconds: number) => void
  restTimerActive: boolean
  restDurationSeconds: number
  onRestTimerComplete: () => void
  onLayout: (y: number) => void
  testID?: string
}

export function ActiveExerciseCard({
  exercise,
  prescription,
  order,
  isExpanded,
  isCompleted,
  loggedSets,
  progressionAdvice,
  onToggleExpand,
  onSetConfirmed,
  onAllSetsCompleted,
  onRestTimerStart,
  restTimerActive,
  restDurationSeconds,
  onRestTimerComplete,
  onLayout,
  testID,
}: ActiveExerciseCardProps) {
  const strings = t().workout
  const rtl = isRTL()
  const name = rtl ? exercise.nameHe : exercise.nameEn
  const totalSets = prescription.sets
  const completedSets = loggedSets.length
  const activeSetIndex = completedSets

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { y: number } } }) => {
      onLayout(e.nativeEvent.layout.y)
    },
    [onLayout],
  )

  const handleSetConfirm = useCallback(
    (set: LoggedSet) => {
      onSetConfirmed(set)
      const isLastSet = set.setNumber === totalSets
      if (isLastSet) {
        onAllSetsCompleted()
      } else {
        onRestTimerStart(prescription.restSeconds)
      }
    },
    [onSetConfirmed, onAllSetsCompleted, onRestTimerStart, totalSets, prescription.restSeconds],
  )

  const lastWeight = loggedSets.length > 0 ? loggedSets[loggedSets.length - 1].weightKg : null

  // ── Collapsed view ──
  if (!isExpanded) {
    return (
      <View onLayout={handleLayout}>
        <Card onPress={onToggleExpand} testID={testID}>
          <View style={[styles.collapsedRow, rtl && styles.collapsedRowRTL]}>
            <View style={[styles.orderBadge, isCompleted && styles.orderBadgeCompleted]}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color={colors.setComplete} />
              ) : (
                <Text style={styles.orderText}>{order}</Text>
              )}
            </View>
            <View style={styles.collapsedContent}>
              <Text
                style={[
                  styles.exerciseName,
                  rtl && styles.textRTL,
                  isCompleted && styles.textCompleted,
                ]}
              >
                {name}
              </Text>
              {isCompleted && (
                <Text style={styles.setSummary}>
                  {formatSetsSummary(completedSets, totalSets, lastWeight)}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-down-outline" size={18} color={colors.textMuted} />
          </View>
        </Card>
      </View>
    )
  }

  // ── Expanded view ──
  const suggestedWeight = progressionAdvice?.suggestedWeightKg ?? null

  return (
    <View onLayout={handleLayout}>
      <Card testID={testID}>
        {/* Header */}
        <Pressable onPress={onToggleExpand}>
          <View style={[styles.expandedHeader, rtl && styles.expandedHeaderRTL]}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{order}</Text>
            </View>
            <Text style={[styles.exerciseName, styles.exerciseNameExpanded, rtl && styles.textRTL]}>
              {name}
            </Text>
            <Text style={styles.setCounter}>
              {strings.setsCompleted
                .replace('{done}', String(completedSets))
                .replace('{total}', String(totalSets))}
            </Text>
          </View>
        </Pressable>

        {/* Progression advice pill */}
        {progressionAdvice && progressionAdvice.suggestedWeightKg != null && (
          <View style={styles.advicePill}>
            <Ionicons name="trending-up" size={14} color={colors.primary} />
            <Text style={styles.adviceText}>
              {rtl ? progressionAdvice.reasonHe : progressionAdvice.reason}
            </Text>
          </View>
        )}

        {/* Set rows */}
        <View style={styles.setsContainer}>
          {Array.from({ length: totalSets }, (_, i) => {
            const setNumber = i + 1
            const logged = loggedSets.find((s) => s.setNumber === setNumber) ?? null
            const isConfirmed = logged != null
            const isActive = i === activeSetIndex && !restTimerActive
            const status = isConfirmed ? 'confirmed' : isActive ? 'active' : 'pending'

            // Use last logged weight as suggestion for subsequent sets
            const weight =
              suggestedWeight ?? (i > 0 && loggedSets[i - 1] ? loggedSets[i - 1].weightKg : null)

            return (
              <React.Fragment key={setNumber}>
                <SetRow
                  setNumber={setNumber}
                  prescribedReps={{
                    min: prescription.minReps,
                    max: prescription.maxReps,
                  }}
                  suggestedWeightKg={weight}
                  loggedSet={logged}
                  status={status}
                  onConfirm={handleSetConfirm}
                  testID={testID ? `${testID}-set-${setNumber}` : undefined}
                />
                {/* Inline rest timer — shown after a confirmed set, before the next active set */}
                {isConfirmed && i === activeSetIndex - 1 && restTimerActive && (
                  <View style={styles.restTimerContainer}>
                    <RestTimer
                      durationSeconds={restDurationSeconds}
                      onComplete={onRestTimerComplete}
                      autoStart
                      size={120}
                      testID={testID ? `${testID}-rest-timer` : undefined}
                    />
                  </View>
                )}
              </React.Fragment>
            )
          })}
        </View>

        {/* Completed badge */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.setComplete} />
            <Text style={styles.completedText}>{strings.exerciseDone}</Text>
          </View>
        )}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  // ── Collapsed ──
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
  },
  collapsedRowRTL: {
    flexDirection: 'row-reverse',
  },
  collapsedContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  setSummary: {
    fontSize: fontSize.sm,
    color: colors.setComplete,
    fontWeight: fontWeight.medium,
  },

  // ── Shared ──
  orderBadge: {
    width: ORDER_BADGE_SIZE,
    height: ORDER_BADGE_SIZE,
    borderRadius: ORDER_BADGE_SIZE / 2,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeCompleted: {
    backgroundColor: `${colors.setComplete}20`,
  },
  orderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  exerciseName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  exerciseNameExpanded: {
    flex: 1,
  },
  textRTL: {
    textAlign: 'right',
  },
  textCompleted: {
    color: colors.setComplete,
  },

  // ── Expanded ──
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    marginBottom: spacing.sm,
  },
  expandedHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  setCounter: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  advicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  adviceText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  setsContainer: {
    gap: spacing.xs,
  },
  restTimerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completedText: {
    fontSize: fontSize.sm,
    color: colors.setComplete,
    fontWeight: fontWeight.semibold,
  },
})
