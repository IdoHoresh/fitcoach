import React from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'
import { formatSetsReps, formatRestTime, translateMuscle } from './helpers'
import type { Exercise, ExercisePrescription, ProgressionAdvice } from '@/types/workout'

interface ExerciseDetailSheetProps {
  visible: boolean
  exercise: Exercise | null
  prescription: ExercisePrescription | null
  progressionAdvice: ProgressionAdvice | null
  isLoadingAdvice: boolean
  onClose: () => void
  testID?: string
}

export function ExerciseDetailSheet({
  visible,
  exercise,
  prescription,
  progressionAdvice,
  isLoadingAdvice,
  onClose,
  testID,
}: ExerciseDetailSheetProps) {
  const strings = t().workout

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Pressable
              onPress={onClose}
              testID={testID ? `${testID}-close` : undefined}
              accessibilityRole="button"
              accessibilityLabel={t().common.done}
              hitSlop={12}
            >
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {exercise && prescription ? (
              <>
                <Text style={styles.name}>{isRTL() ? exercise.nameHe : exercise.nameEn}</Text>

                <Text style={styles.setsReps}>
                  {formatSetsReps(prescription.sets, prescription.minReps, prescription.maxReps)}
                  {'  ·  '}
                  {formatRestTime(prescription.restSeconds)} {t().common.rest}
                </Text>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{strings.primaryMuscle}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {translateMuscle(exercise.primaryMuscle)}
                      </Text>
                    </View>
                  </View>
                </View>

                {exercise.secondaryMuscles.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{strings.secondaryMuscles}</Text>
                    <View style={styles.badgeRow}>
                      {exercise.secondaryMuscles.map((muscle) => (
                        <View key={muscle} style={styles.badgeSecondary}>
                          <Text style={styles.badgeSecondaryText}>{translateMuscle(muscle)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {exercise.instructions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{strings.instructions}</Text>
                    <Text style={styles.instructions}>{exercise.instructions}</Text>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{strings.equipment}</Text>
                  <View style={styles.badgeRow}>
                    {exercise.requiredEquipment.map((item) => (
                      <View key={item} style={styles.badgeSecondary}>
                        <Text style={styles.badgeSecondaryText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{strings.progressionAdvice}</Text>
                  {isLoadingAdvice && (
                    <ActivityIndicator
                      testID={testID ? `${testID}-advice-loading` : undefined}
                      color={colors.primary}
                    />
                  )}
                  {!isLoadingAdvice && progressionAdvice && (
                    <View style={styles.adviceCard}>
                      <Text style={styles.adviceWeight}>
                        {progressionAdvice.suggestedWeightKg != null
                          ? `${progressionAdvice.suggestedWeightKg} ${t().common.kg}`
                          : '—'}
                      </Text>
                      <Text style={styles.adviceReason}>
                        {isRTL() ? progressionAdvice.reasonHe : progressionAdvice.reason}
                      </Text>
                    </View>
                  )}
                  {!isLoadingAdvice && !progressionAdvice && <Text style={styles.noAdvice}>—</Text>}
                </View>
              </>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.ms,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: isRTL() ? 'right' : 'left',
  },
  setsReps: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: isRTL() ? 'right' : 'left',
  },
  section: {
    marginBottom: spacing.md,
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    textAlign: isRTL() ? 'right' : 'left',
  },
  badgeRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  badgeSecondary: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  badgeSecondaryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  instructions: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.5,
    textAlign: isRTL() ? 'right' : 'left',
  },
  adviceCard: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.ms,
    borderRadius: borderRadius.md,
    gap: spacing.xxs,
  },
  adviceWeight: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textAlign: isRTL() ? 'right' : 'left',
  },
  adviceReason: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: isRTL() ? 'right' : 'left',
  },
  noAdvice: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: isRTL() ? 'right' : 'left',
  },
})
