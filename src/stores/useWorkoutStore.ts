/**
 * Workout Store.
 *
 * The central store for workout data — connects workout algorithms to UI.
 *
 * Flow:
 *   Generate Plan → plan + mesocycle + dayMapping ready
 *   Start Workout → activeSession tracks sets in real time
 *   Finish Workout → persist log to SQLite, update recentLogs
 *   Week ends → auto-advance mesocycle, check deload
 *
 * Design decisions:
 * - On-demand plan generation (user taps "Generate Plan")
 * - Auto-advance mesocycle weeks (all workouts done or 7 days elapsed)
 * - Single store for plan + logging + progression
 * - Archive & start fresh on regenerate
 * - Progression advice computed on read (always current)
 */

import { create } from 'zustand'
import type {
  ActiveSession,
  ArchivedPlan,
  DayOfWeek,
  LoggedExercise,
  LoggedSet,
  Mesocycle,
  MesocycleState,
  MuscleGroup,
  ProgressionAdvice,
  WorkoutLog,
} from '../types'
import type { GeneratedWorkoutDay, GeneratedWorkoutPlan } from '../algorithms/workout-generator'
import { generateWorkoutPlan } from '../algorithms/workout-generator'
import { EXERCISE_MAP } from '../data/exercises'
import { getProgressionAdvice as getProgressionAdviceAlgo } from '../algorithms/progressive-overload'
import { nowISO, todayISO, workoutRepository } from '../db'
import { useUserStore } from './useUserStore'

// ── Store Interface ───────────────────────────────────────────────

interface WorkoutStore {
  // State
  plan: GeneratedWorkoutPlan | null
  planId: string | null
  mesocycle: MesocycleState | null
  dayMapping: ReadonlyMap<DayOfWeek, GeneratedWorkoutDay> | null
  activeSession: ActiveSession | null
  recentLogs: WorkoutLog[]
  isLoading: boolean
  error: string | null

  // Plan Lifecycle
  generatePlan: () => Promise<void>
  regeneratePlan: () => Promise<void>
  loadPlan: () => Promise<void>

  // Mesocycle
  advanceWeek: () => Promise<void>
  checkWeekAdvance: () => Promise<void>
  triggerDeload: () => Promise<void>

  // Workout Session
  startWorkout: (dayOfWeek: DayOfWeek) => void
  logSet: (exerciseId: string, set: LoggedSet) => void
  completeExercise: () => void
  finishWorkout: () => Promise<void>
  abandonWorkout: () => Promise<void>

  // Computed (read-only)
  getProgressionAdvice: (exerciseId: string) => Promise<ProgressionAdvice | null>
  getTodaysWorkout: () => GeneratedWorkoutDay | null
  getCompletedThisWeek: () => WorkoutLog[]
  getArchivedPlans: () => Promise<ArchivedPlan[]>
}

// ── Helpers ───────────────────────────────────────────────────────

function buildDayMapping(
  weeklySchedule: readonly GeneratedWorkoutDay[],
): Map<DayOfWeek, GeneratedWorkoutDay> {
  const mapping = new Map<DayOfWeek, GeneratedWorkoutDay>()
  for (const day of weeklySchedule) {
    if (day.template) {
      mapping.set(day.dayOfWeek, day)
    }
  }
  return mapping
}

function mesocycleFromDb(meso: Mesocycle, planId: string): MesocycleState {
  return {
    id: meso.id,
    planId,
    startDate: meso.startDate,
    currentWeek: meso.weekNumber,
    totalWeeks: meso.totalWeeks,
    isDeloadWeek: meso.isDeloadWeek,
    weekStartDate: meso.startDate,
  }
}

function diffDays(dateA: string, dateB: string): number {
  const msPerDay = 86400000
  return Math.floor((new Date(dateA).getTime() - new Date(dateB).getTime()) / msPerDay)
}

/** Finds the exercise prescription in the current plan, or null if not found. */
function findPrescription(
  plan: GeneratedWorkoutPlan,
  exerciseId: string,
): { minReps: number; maxReps: number; primaryMuscle: MuscleGroup } | null {
  for (const day of plan.weeklySchedule) {
    if (!day.template) continue
    const prescription = day.template.exercises.find((e) => e.exerciseId === exerciseId)
    if (prescription) {
      const exercise = EXERCISE_MAP.get(exerciseId)
      return {
        minReps: prescription.minReps,
        maxReps: prescription.maxReps,
        primaryMuscle: exercise?.primaryMuscle ?? 'chest',
      }
    }
  }
  return null
}

// ── Store ─────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // Initial state
  plan: null,
  planId: null,
  mesocycle: null,
  dayMapping: null,
  activeSession: null,
  recentLogs: [],
  isLoading: false,
  error: null,

  // ── Plan Lifecycle ────────────────────────────────────────────

  generatePlan: async () => {
    const { profile } = useUserStore.getState()
    if (!profile) {
      set({ error: 'No user profile found. Complete onboarding first.' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const plan = generateWorkoutPlan(
        profile.trainingDays,
        profile.experience,
        profile.equipment.availableEquipment,
      )

      const planId = await workoutRepository.savePlan(plan, profile.id)

      const mesocycle = await workoutRepository.saveMesocycle({
        startDate: todayISO(),
        endDate: null,
        weekNumber: 1,
        totalWeeks: plan.totalMesocycleWeeks,
        isDeloadWeek: false,
      })

      set({
        plan,
        planId,
        mesocycle: mesocycleFromDb(mesocycle, planId),
        dayMapping: buildDayMapping(plan.weeklySchedule),
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to generate plan' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadPlan: async () => {
    set({ isLoading: true, error: null })

    try {
      const result = await workoutRepository.getActivePlan()
      const mesocycleRow = await workoutRepository.getActiveMesocycle()
      const recentLogs = await workoutRepository.getRecentLogs(20)

      if (!result) {
        set({ plan: null, planId: null, mesocycle: null, dayMapping: null, recentLogs })
        return
      }

      const { planId, ...plan } = result

      set({
        plan,
        planId,
        mesocycle: mesocycleRow ? mesocycleFromDb(mesocycleRow, planId) : null,
        dayMapping: buildDayMapping(plan.weeklySchedule),
        recentLogs,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load plan' })
    } finally {
      set({ isLoading: false })
    }
  },

  regeneratePlan: async () => {
    const { plan, planId, mesocycle, recentLogs } = get()

    set({ isLoading: true, error: null })

    try {
      // Archive current plan if one exists
      if (plan && mesocycle && planId) {
        const completedCount = recentLogs.filter((l) => l.completedAt !== null).length
        await workoutRepository.archivePlan(
          planId,
          plan.splitType,
          mesocycle.currentWeek,
          completedCount,
          JSON.stringify(plan.weeklySchedule),
        )
        await workoutRepository.updateMesocycle(mesocycle.id, {
          endDate: todayISO(),
        })
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to archive plan',
        isLoading: false,
      })
      return
    }

    // Clear old state and generate fresh
    set({
      plan: null,
      planId: null,
      mesocycle: null,
      dayMapping: null,
      recentLogs: [],
      isLoading: false,
    })
    await get().generatePlan()
  },

  // ── Mesocycle ─────────────────────────────────────────────────

  advanceWeek: async () => {
    const { mesocycle, plan } = get()
    if (!mesocycle || !plan) return

    const newWeek = mesocycle.currentWeek + 1

    try {
      await workoutRepository.updateMesocycle(mesocycle.id, {
        weekNumber: newWeek,
      })

      set({
        mesocycle: {
          ...mesocycle,
          currentWeek: newWeek,
          weekStartDate: todayISO(),
        },
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to advance week' })
    }
  },

  triggerDeload: async () => {
    const { mesocycle } = get()
    if (!mesocycle) return

    try {
      await workoutRepository.updateMesocycle(mesocycle.id, {
        isDeloadWeek: true,
      })

      set({
        mesocycle: {
          ...mesocycle,
          isDeloadWeek: true,
        },
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to trigger deload' })
    }
  },

  checkWeekAdvance: async () => {
    const { mesocycle, plan, recentLogs } = get()
    if (!mesocycle || !plan) return

    const daysSinceWeekStart = diffDays(todayISO(), mesocycle.weekStartDate)

    // Count training days in the plan
    const trainingDaysCount = plan.weeklySchedule.filter((d) => d.template !== null).length

    // Count completed workouts this week
    const completedThisWeek = recentLogs.filter(
      (log) => log.date >= mesocycle.weekStartDate && log.completedAt !== null,
    ).length

    const allDone = completedThisWeek >= trainingDaysCount
    const weekExpired = daysSinceWeekStart >= 7

    if (!allDone && !weekExpired) return

    await get().advanceWeek()
  },

  // ── Workout Session ───────────────────────────────────────────

  startWorkout: (dayOfWeek: DayOfWeek) => {
    const { dayMapping } = get()

    if (!dayMapping) {
      set({ error: 'No workout plan generated. Generate a plan first.' })
      return
    }

    const workout = dayMapping.get(dayOfWeek)
    if (!workout || !workout.template) {
      set({ error: 'No workout scheduled for this day.' })
      return
    }

    set({
      activeSession: {
        templateId: workout.template.id,
        workoutDayType: workout.dayType,
        startedAt: nowISO(),
        currentExerciseIndex: 0,
        loggedExercises: [],
      },
      error: null,
    })
  },

  logSet: (exerciseId: string, setData: LoggedSet) => {
    const { activeSession } = get()

    if (!activeSession) {
      set({ error: 'No active workout session.' })
      return
    }

    const existingIdx = activeSession.loggedExercises.findIndex((e) => e.exerciseId === exerciseId)

    let updatedExercises: LoggedExercise[]

    if (existingIdx >= 0) {
      updatedExercises = activeSession.loggedExercises.map((e, i) =>
        i === existingIdx ? { ...e, sets: [...e.sets, setData] } : e,
      )
    } else {
      updatedExercises = [
        ...activeSession.loggedExercises,
        { exerciseId, sets: [setData], notes: '' },
      ]
    }

    set({
      activeSession: {
        ...activeSession,
        loggedExercises: updatedExercises,
      },
    })
  },

  completeExercise: () => {
    const { activeSession } = get()
    if (!activeSession) return

    set({
      activeSession: {
        ...activeSession,
        currentExerciseIndex: activeSession.currentExerciseIndex + 1,
      },
    })
  },

  finishWorkout: async () => {
    const { activeSession } = get()

    if (!activeSession) {
      set({ error: 'No active workout session.' })
      return
    }

    const now = nowISO()
    const startTime = new Date(activeSession.startedAt).getTime()
    const durationMinutes = Math.round((Date.now() - startTime) / 60000)

    try {
      const log = await workoutRepository.saveWorkoutLog({
        date: todayISO(),
        templateId: activeSession.templateId,
        dayType: activeSession.workoutDayType,
        startedAt: activeSession.startedAt,
        completedAt: now,
        exercises: activeSession.loggedExercises,
        durationMinutes,
      })

      set((state) => ({
        activeSession: null,
        recentLogs: [log, ...state.recentLogs],
        error: null,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save workout' })
    }
  },

  abandonWorkout: async () => {
    const { activeSession } = get()
    if (!activeSession) return

    const startTime = new Date(activeSession.startedAt).getTime()
    const durationMinutes = Math.round((Date.now() - startTime) / 60000)

    try {
      const log = await workoutRepository.saveWorkoutLog({
        date: todayISO(),
        templateId: activeSession.templateId,
        dayType: activeSession.workoutDayType,
        startedAt: activeSession.startedAt,
        completedAt: null,
        exercises: activeSession.loggedExercises,
        durationMinutes,
      })

      set((state) => ({
        activeSession: null,
        recentLogs: [log, ...state.recentLogs],
        error: null,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save workout' })
    }
  },

  // ── Computed ──────────────────────────────────────────────────

  getProgressionAdvice: async (exerciseId: string) => {
    const recentSets = await workoutRepository.getLogsByExercise(exerciseId, 20)
    if (recentSets.length === 0) return null

    const { plan } = get()
    if (!plan) return null

    const prescription = findPrescription(plan, exerciseId)
    if (!prescription) return null

    const lastWeight = recentSets[0].weightKg
    const workingSets = recentSets.filter((s) => !s.isWarmup)

    return getProgressionAdviceAlgo(
      lastWeight,
      workingSets,
      prescription.minReps,
      prescription.maxReps,
      prescription.primaryMuscle,
      0,
    )
  },

  getTodaysWorkout: () => {
    const { dayMapping } = get()
    if (!dayMapping) return null

    const todayDow = new Date().getDay() as DayOfWeek
    return dayMapping.get(todayDow) ?? null
  },

  getCompletedThisWeek: () => {
    const { mesocycle, recentLogs } = get()
    if (!mesocycle) return []

    return recentLogs.filter(
      (log) => log.date >= mesocycle.weekStartDate && log.completedAt !== null,
    )
  },

  getArchivedPlans: async () => {
    return workoutRepository.getArchivedPlans()
  },
}))
