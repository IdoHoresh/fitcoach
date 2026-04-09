import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t, getLanguage } from '@/i18n'
import { Card } from '../Card'
import { Button } from '../Button'
import { RTLWrapper } from '../shared/RTLWrapper'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { EXERCISE_MAP } from '@/data/exercises'

/** Pick the current-locale value from an (he, en) pair. */
function pickLocale<T>(he: T, en: T): T {
  return getLanguage() === 'he' ? he : en
}

const MAX_PREVIEW_EXERCISES = 3
const HEADER_ICON_SIZE = 20

interface TodaysWorkoutCardProps {
  onStart: () => void
  testID?: string
}

export function TodaysWorkoutCard({ onStart, testID }: TodaysWorkoutCardProps) {
  const plan = useWorkoutStore((s) => s.plan)
  const todaysDay = useWorkoutStore((s) => s.getTodaysWorkout())
  const strings = t().home.dashboard

  // Three branches: no plan → rest day → workout exists
  if (!plan) {
    return (
      <Card testID={testID}>
        <SectionHeader title={strings.todaysWorkout} />
        <Text style={styles.emptyText}>{strings.noPlanYet}</Text>
        <Button
          label={t().workout.startWorkout}
          onPress={onStart}
          variant="outline"
          size="md"
          testID={testID ? `${testID}-cta` : undefined}
        />
      </Card>
    )
  }

  if (!todaysDay || !todaysDay.template) {
    return (
      <Card testID={testID}>
        <SectionHeader title={strings.todaysWorkout} />
        <Text style={styles.emptyText}>{strings.restDay}</Text>
      </Card>
    )
  }

  const template = todaysDay.template
  const preview = template.exercises.slice(0, MAX_PREVIEW_EXERCISES)
  const extraCount = template.exercises.length - preview.length
  const workoutName = pickLocale(template.nameHe, template.nameEn)

  return (
    <Card testID={testID}>
      <SectionHeader title={strings.todaysWorkout} />

      <Text style={styles.workoutName}>{workoutName}</Text>
      <Text style={styles.summary}>
        {strings.workoutSummary
          .replace('{count}', String(template.exercises.length))
          .replace('{minutes}', String(template.estimatedMinutes))}
      </Text>

      <View style={styles.exerciseList}>
        {preview.map((prescription) => (
          <ExerciseRow
            key={prescription.exerciseId}
            exerciseId={prescription.exerciseId}
            sets={prescription.sets}
            minReps={prescription.minReps}
            maxReps={prescription.maxReps}
          />
        ))}
        {extraCount > 0 && (
          <Text style={styles.moreText}>
            {strings.moreExercises.replace('{count}', String(extraCount))}
          </Text>
        )}
      </View>

      <Button
        label={t().workout.startWorkout}
        onPress={onStart}
        variant="primary"
        size="md"
        testID={testID ? `${testID}-cta` : undefined}
      />
    </Card>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <RTLWrapper style={styles.header}>
      <Ionicons name="barbell-outline" size={HEADER_ICON_SIZE} color={colors.primary} />
      <Text style={styles.headerTitle}>{title}</Text>
    </RTLWrapper>
  )
}

interface ExerciseRowProps {
  exerciseId: string
  sets: number
  minReps: number
  maxReps: number
}

function ExerciseRow({ exerciseId, sets, minReps, maxReps }: ExerciseRowProps) {
  // Fallback to the raw id if the exercise DB no longer contains this entry
  // (stale plan, renamed exercise) — better than crashing the whole Home screen.
  const exercise = EXERCISE_MAP.get(exerciseId)
  const name = exercise ? pickLocale(exercise.nameHe, exercise.nameEn) : exerciseId
  const setsReps = t()
    .home.dashboard.setsReps.replace('{sets}', String(sets))
    .replace('{minReps}', String(minReps))
    .replace('{maxReps}', String(maxReps))

  return (
    <RTLWrapper style={styles.exerciseRow}>
      <Text style={styles.exerciseName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.exerciseSetsReps}>{setsReps}</Text>
    </RTLWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  workoutName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  summary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  exerciseList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  exerciseRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  exerciseSetsReps: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  moreText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
})
