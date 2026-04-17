import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/Card'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'
import { t } from '@/i18n'
import { formatSetsReps, formatRestTime, translateMuscle } from './helpers'
import type { Exercise, ExercisePrescription } from '@/types/workout'

const ORDER_BADGE_SIZE = 28

interface ExerciseCardProps {
  exercise: Exercise
  prescription: ExercisePrescription
  order: number
  onPress: () => void
  testID?: string
}

export function ExerciseCard({
  exercise,
  prescription,
  order,
  onPress,
  testID,
}: ExerciseCardProps) {
  const name = isRTL() ? exercise.nameHe : exercise.nameEn
  const setsReps = formatSetsReps(prescription.sets, prescription.minReps, prescription.maxReps)
  const rest = formatRestTime(prescription.restSeconds)

  return (
    <Card onPress={onPress} testID={testID} accessibilityLabel={name}>
      <View style={styles.row}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{order}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.setsReps}>{setsReps}</Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.rest}>
              {rest} {t().common.rest}
            </Text>
          </View>
        </View>
        <View style={styles.muscleBadge}>
          <Text style={styles.muscleText}>{translateMuscle(exercise.primaryMuscle)}</Text>
        </View>
        <Pressable
          onPress={onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t().workout.instructions}
          testID={testID ? `${testID}-info` : undefined}
        >
          <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
  },
  orderBadge: {
    width: ORDER_BADGE_SIZE,
    height: ORDER_BADGE_SIZE,
    borderRadius: ORDER_BADGE_SIZE / 2,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  setsReps: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  separator: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  rest: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  muscleBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  muscleText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
})
