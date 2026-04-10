import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, ScrollView, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { EXERCISE_MAP } from '@/data/exercises'
import { ActiveExerciseCard } from './ActiveExerciseCard'
import { FloatingRestBubble } from './FloatingRestBubble'
import { FinishWorkoutBar } from './FinishWorkoutBar'
import { EndEarlyDialog } from './EndEarlyDialog'
import type {
  ActiveSession,
  ExercisePrescription,
  LoggedSet,
  ProgressionAdvice,
} from '@/types/workout'

const AUTO_ADVANCE_DELAY_MS = 1000
const REST_TICK_MS = 1000

interface ActiveWorkoutViewProps {
  exercises: readonly ExercisePrescription[]
  activeSession: ActiveSession
  onFinish: () => void
  onAbandon: () => void
  testID?: string
}

export function ActiveWorkoutView({
  exercises,
  activeSession,
  onFinish,
  onAbandon,
  testID,
}: ActiveWorkoutViewProps) {
  const insets = useSafeAreaInsets()
  const logSet = useWorkoutStore((s) => s.logSet)
  const completeExercise = useWorkoutStore((s) => s.completeExercise)
  const getProgressionAdvice = useWorkoutStore((s) => s.getProgressionAdvice)
  const isFirstWorkout = useWorkoutStore((s) => s.recentLogs.length === 0)
  const strings = t().workout

  // ── Refs ──
  const isMountedRef = useRef(true)
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
      }
    }
  }, [])

  // ── Local state ──
  const [expandedIndex, setExpandedIndex] = useState(activeSession.currentExerciseIndex)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [adviceMap, setAdviceMap] = useState<Map<string, ProgressionAdvice | null>>(new Map())

  // Rest timer state
  const [restTimer, setRestTimer] = useState<{
    exerciseIndex: number
    durationSeconds: number
    startedAt: number
  } | null>(null)
  const [restRemaining, setRestRemaining] = useState(0)

  // Scroll & layout tracking
  const scrollRef = useRef<ScrollView>(null)
  const offsetsRef = useRef<Map<number, number>>(new Map())
  const scrollYRef = useRef(0)
  const viewportHeightRef = useRef(0)

  // Bubble visibility: rest timer active and the active exercise is scrolled out of view
  const [bubbleVisible, setBubbleVisible] = useState(false)

  // ── Load progression advice on mount ──
  useEffect(() => {
    const loadAdvice = async () => {
      const map = new Map<string, ProgressionAdvice | null>()
      for (const ex of exercises) {
        try {
          const advice = await getProgressionAdvice(ex.exerciseId)
          map.set(ex.exerciseId, advice)
        } catch {
          map.set(ex.exerciseId, null)
        }
      }
      if (isMountedRef.current) {
        setAdviceMap(map)
      }
    }
    loadAdvice()
  }, [exercises, getProgressionAdvice])

  // ── Rest timer tick ──
  useEffect(() => {
    if (!restTimer) return
    const endTime = restTimer.startedAt + restTimer.durationSeconds * 1000
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
    setRestRemaining(remaining)

    const interval = setInterval(() => {
      const r = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRestRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
      }
    }, REST_TICK_MS)

    return () => clearInterval(interval)
  }, [restTimer])

  // ── Bubble visibility based on scroll position ──
  useEffect(() => {
    if (!restTimer) {
      setBubbleVisible(false)
      return
    }
    const exerciseY = offsetsRef.current.get(restTimer.exerciseIndex) ?? 0
    const scrollY = scrollYRef.current
    const viewportH = viewportHeightRef.current
    const isOutOfView = exerciseY < scrollY - 50 || exerciseY > scrollY + viewportH + 50
    setBubbleVisible(isOutOfView)
  }, [restTimer, restRemaining]) // Re-check on each tick

  // ── Derived ──
  const completedExerciseCount = activeSession.currentExerciseIndex
  const allDone = completedExerciseCount >= exercises.length

  // Keep expandedIndex in sync with store's currentExerciseIndex
  useEffect(() => {
    setExpandedIndex(activeSession.currentExerciseIndex)
  }, [activeSession.currentExerciseIndex])

  // ── Handlers ──
  const handleRegisterOffset = useCallback((index: number, y: number) => {
    offsetsRef.current.set(index, y)
  }, [])

  const handleScroll = useCallback(
    (e: {
      nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number } }
    }) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y
      viewportHeightRef.current = e.nativeEvent.layoutMeasurement.height
    },
    [],
  )

  const handleSetConfirmed = useCallback(
    (exerciseId: string, set: LoggedSet) => {
      logSet(exerciseId, set)
    },
    [logSet],
  )

  const handleRestTimerStart = useCallback((exerciseIndex: number, seconds: number) => {
    setRestTimer({
      exerciseIndex,
      durationSeconds: seconds,
      startedAt: Date.now(),
    })
  }, [])

  const handleRestTimerComplete = useCallback(() => {
    setRestTimer(null)
    setRestRemaining(0)
    setBubbleVisible(false)
  }, [])

  const handleAllSetsCompleted = useCallback(
    (exerciseIndex: number) => {
      completeExercise()
      const nextIndex = exerciseIndex + 1
      // Auto-advance with delay, tracked for cleanup
      autoAdvanceTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return
        setExpandedIndex(nextIndex)
        const nextY = offsetsRef.current.get(nextIndex)
        if (nextY != null && scrollRef.current) {
          scrollRef.current.scrollTo({ y: nextY - spacing.md, animated: true })
        }
      }, AUTO_ADVANCE_DELAY_MS)
    },
    [completeExercise],
  )

  const handleBubblePress = useCallback(() => {
    if (restTimer) {
      const y = offsetsRef.current.get(restTimer.exerciseIndex)
      if (y != null && scrollRef.current) {
        scrollRef.current.scrollTo({ y: y - spacing.md, animated: true })
      }
    }
  }, [restTimer])

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? -1 : index))
  }, [])

  const handleViewportLayout = useCallback((e: LayoutChangeEvent) => {
    viewportHeightRef.current = e.nativeEvent.layout.height
  }, [])

  return (
    <View style={styles.container} testID={testID} onLayout={handleViewportLayout}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {isFirstWorkout && (
          <View
            style={styles.firstWorkoutBanner}
            testID={testID ? `${testID}-first-banner` : undefined}
          >
            <View style={styles.bannerHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={styles.bannerTitle}>{strings.firstWorkoutTitle}</Text>
            </View>
            <Text style={styles.bannerMessage}>{strings.firstWorkoutMessage}</Text>
          </View>
        )}
        {exercises.map((prescription, index) => {
          const exercise = EXERCISE_MAP.get(prescription.exerciseId)
          if (!exercise) return null

          const isCompleted = index < activeSession.currentExerciseIndex
          const loggedExercise = activeSession.loggedExercises.find(
            (le) => le.exerciseId === prescription.exerciseId,
          )
          const loggedSets = loggedExercise ? [...loggedExercise.sets] : []
          const isRestActive = restTimer?.exerciseIndex === index && restRemaining > 0

          return (
            <ActiveExerciseCard
              key={prescription.exerciseId}
              exercise={exercise}
              prescription={prescription}
              order={index + 1}
              isExpanded={expandedIndex === index}
              isCompleted={isCompleted}
              loggedSets={loggedSets}
              progressionAdvice={adviceMap.get(prescription.exerciseId) ?? null}
              onToggleExpand={() => handleToggleExpand(index)}
              onSetConfirmed={(set) => handleSetConfirmed(prescription.exerciseId, set)}
              onAllSetsCompleted={() => handleAllSetsCompleted(index)}
              onRestTimerStart={(seconds) => handleRestTimerStart(index, seconds)}
              restTimerActive={isRestActive}
              restDurationSeconds={restTimer?.durationSeconds ?? 0}
              onRestTimerComplete={handleRestTimerComplete}
              onLayout={(y) => handleRegisterOffset(index, y)}
              testID={testID ? `${testID}-exercise-${index}` : undefined}
            />
          )
        })}
      </ScrollView>

      {/* Floating rest timer bubble */}
      <FloatingRestBubble
        remainingSeconds={restRemaining}
        totalSeconds={restTimer?.durationSeconds ?? 0}
        isVisible={bubbleVisible}
        onPress={handleBubblePress}
        testID={testID ? `${testID}-rest-bubble` : undefined}
      />

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <FinishWorkoutBar
          totalExercises={exercises.length}
          completedExercises={completedExerciseCount}
          allDone={allDone}
          startedAt={activeSession.startedAt}
          onFinish={onFinish}
          onEndEarly={() => setShowEndDialog(true)}
          testID={testID ? `${testID}-bar` : undefined}
        />
      </View>

      {/* End early confirmation */}
      <EndEarlyDialog
        visible={showEndDialog}
        completedExercises={completedExerciseCount}
        totalExercises={exercises.length}
        onConfirm={() => {
          setShowEndDialog(false)
          onAbandon()
        }}
        onCancel={() => setShowEndDialog(false)}
        testID={testID ? `${testID}-end-dialog` : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.ms,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  firstWorkoutBanner: {
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  bannerMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.6,
  },
})
