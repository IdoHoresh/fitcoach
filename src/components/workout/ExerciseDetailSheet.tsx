import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
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
                {exercise.gifUrl && <ExerciseGif url={exercise.gifUrl} testID={testID} />}

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

const GIF_SIZE = 200

function ExerciseGif({ url, testID }: { url: string; testID?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (error) return null

  return (
    <View style={styles.gifContainer}>
      {loading && (
        <ActivityIndicator
          style={styles.gifLoader}
          color={colors.primary}
          testID={testID ? `${testID}-gif-loading` : undefined}
        />
      )}
      <Image
        source={{ uri: url }}
        style={styles.gif}
        resizeMode="contain"
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        testID={testID ? `${testID}-gif` : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  gifContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: GIF_SIZE,
    justifyContent: 'center',
  },
  gifLoader: {
    position: 'absolute',
  },
  gif: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
  },
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
    flexDirection: 'row',
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
    textAlign: 'left',
  },
  setsReps: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  section: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  badgeRow: {
    flexDirection: 'row',
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
    textAlign: 'left',
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
    textAlign: 'left',
  },
  adviceReason: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  noAdvice: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'left',
  },
})
