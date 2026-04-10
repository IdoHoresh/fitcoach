import React, { useState, useCallback, useRef } from 'react'
import { View, ScrollView, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize } from '@/theme/typography'
import { t } from '@/i18n'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { EXERCISE_MAP } from '@/data/exercises'
import { Button } from '@/components/Button'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutDayStrip } from '@/components/workout/WorkoutDayStrip'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { ExerciseDetailSheet } from '@/components/workout/ExerciseDetailSheet'
import { RestDayCard } from '@/components/workout/RestDayCard'
import { TomorrowPreview } from '@/components/workout/TomorrowPreview'
import { ActiveWorkoutView } from '@/components/workout/ActiveWorkoutView'
import { isRestDay } from '@/components/workout/helpers'
import type { DayOfWeek } from '@/types/user'
import type { Exercise, ExercisePrescription, ProgressionAdvice } from '@/types/workout'

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets()
  const strings = t().workout

  // ── Store selectors (granular to avoid unnecessary re-renders) ──
  const plan = useWorkoutStore((s) => s.plan)
  const dayMapping = useWorkoutStore((s) => s.dayMapping)
  const mesocycle = useWorkoutStore((s) => s.mesocycle)
  const getProgressionAdvice = useWorkoutStore((s) => s.getProgressionAdvice)
  const activeSession = useWorkoutStore((s) => s.activeSession)
  const startWorkout = useWorkoutStore((s) => s.startWorkout)
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout)
  const abandonWorkout = useWorkoutStore((s) => s.abandonWorkout)

  // ── Local state ──
  const todayDayOfWeek = new Date().getDay() as DayOfWeek
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayOfWeek)

  const [sheetExercise, setSheetExercise] = useState<Exercise | null>(null)
  const [sheetPrescription, setSheetPrescription] = useState<ExercisePrescription | null>(null)
  const [sheetAdvice, setSheetAdvice] = useState<ProgressionAdvice | null>(null)
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const sheetOpenRef = useRef(false)

  // ── Derived data ──
  const selectedWorkout = dayMapping?.get(selectedDay)
  const rest = isRestDay(selectedWorkout)
  const exercises = selectedWorkout?.template?.exercises ?? []

  const isActive = activeSession != null

  // ── Active workout handlers ──
  const handleStartWorkout = useCallback(() => {
    startWorkout(selectedDay)
  }, [startWorkout, selectedDay])

  const handleFinishWorkout = useCallback(async () => {
    await finishWorkout()
  }, [finishWorkout])

  const handleAbandonWorkout = useCallback(async () => {
    await abandonWorkout()
  }, [abandonWorkout])

  // ── Handlers ──
  const handleExercisePress = useCallback(
    async (prescription: ExercisePrescription, exercise: Exercise) => {
      setSheetExercise(exercise)
      setSheetPrescription(prescription)
      setSheetAdvice(null)
      setSheetVisible(true)
      sheetOpenRef.current = true

      setIsLoadingAdvice(true)
      try {
        const advice = await getProgressionAdvice(prescription.exerciseId)
        if (sheetOpenRef.current) {
          setSheetAdvice(advice)
        }
      } finally {
        if (sheetOpenRef.current) {
          setIsLoadingAdvice(false)
        }
      }
    },
    [getProgressionAdvice],
  )

  const handleCloseSheet = useCallback(() => {
    sheetOpenRef.current = false
    setSheetVisible(false)
    setSheetAdvice(null)
    setIsLoadingAdvice(false)
  }, [])

  // ── No plan state ──
  if (!plan) {
    return (
      <View style={[styles.container, styles.emptyContainer, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText} testID="workout-no-plan">
          {strings.noWorkoutPlan}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="workout-screen">
      <View style={styles.headerArea}>
        <WorkoutHeader workout={selectedWorkout} mesocycle={mesocycle} testID="workout-header" />
        <WorkoutDayStrip
          dayMapping={dayMapping}
          selectedDay={selectedDay}
          todayDayOfWeek={todayDayOfWeek}
          onDaySelect={setSelectedDay}
          testID="workout-day-strip"
        />
      </View>

      {isActive && activeSession ? (
        <ActiveWorkoutView
          exercises={exercises}
          activeSession={activeSession}
          onFinish={handleFinishWorkout}
          onAbandon={handleAbandonWorkout}
          testID="active-workout"
        />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {rest ? (
              <View style={styles.restContent}>
                <RestDayCard testID="workout-rest-card" />
                <TomorrowPreview
                  dayMapping={dayMapping}
                  todayDayOfWeek={todayDayOfWeek}
                  testID="workout-tomorrow"
                />
              </View>
            ) : (
              <View style={styles.exerciseList}>
                {exercises.map((prescription, index) => {
                  const exercise = EXERCISE_MAP.get(prescription.exerciseId)
                  if (!exercise) return null
                  return (
                    <ExerciseCard
                      key={prescription.exerciseId}
                      exercise={exercise}
                      prescription={prescription}
                      order={index + 1}
                      onPress={() => handleExercisePress(prescription, exercise)}
                      testID={`workout-exercise-${index}`}
                    />
                  )
                })}
              </View>
            )}
          </ScrollView>

          {!rest && (
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
              <Button
                label={strings.startWorkout}
                onPress={handleStartWorkout}
                testID="workout-start-btn"
              />
            </View>
          )}
        </>
      )}

      <ExerciseDetailSheet
        visible={sheetVisible}
        exercise={sheetExercise}
        prescription={sheetPrescription}
        progressionAdvice={sheetAdvice}
        isLoadingAdvice={isLoadingAdvice}
        onClose={handleCloseSheet}
        testID="workout-detail-sheet"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  restContent: {
    gap: spacing.lg,
  },
  exerciseList: {
    gap: spacing.ms,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
