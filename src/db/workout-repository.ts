/**
 * Workout repository.
 * Handles CRUD for workout plans, mesocycles, workout logs, and archives.
 * Uses parameterized queries only.
 */

import type { GeneratedWorkoutPlan } from '../algorithms/workout-generator'
import type {
  ArchivedPlan,
  LoggedExercise,
  LoggedSet,
  Mesocycle,
  SplitType,
  WorkoutLog,
} from '../types'
import { BaseRepository, generateId, nowISO } from './base-repository'
import { getDatabase } from './database'

// ── Row types ─────────────────────────────────────────────────────

interface WorkoutPlanRow {
  id: string
  user_id: string
  split_type: string
  created_at: string
  is_active: number
  weekly_schedule_json: string
  mesocycle_week: number
  total_mesocycle_weeks: number
  reasoning: string
  reasoning_he: string
}

interface MesocycleRow {
  id: string
  start_date: string
  end_date: string | null
  week_number: number
  total_weeks: number
  is_deload_week: number
}

interface WorkoutLogRow {
  id: string
  date: string
  template_id: string
  day_type: string
  started_at: string
  completed_at: string | null
  duration_minutes: number
}

interface SetLogRow {
  id: string
  workout_log_id: string
  exercise_id: string
  set_number: number
  weight_kg: number
  reps: number
  rpe: number | null
  is_warmup: number
  notes: string
}

interface ArchivedPlanRow {
  id: string
  plan_id: string
  split_type: string
  mesocycle_weeks: number
  workouts_completed: number
  weekly_schedule_json: string
  archived_at: string
}

// ── Row mappers ───────────────────────────────────────────────────

function parseScheduleJson(json: string): GeneratedWorkoutPlan['weeklySchedule'] {
  if (!json) throw new Error('[WorkoutRepository] weekly_schedule_json is empty or null')
  try {
    return JSON.parse(json) as GeneratedWorkoutPlan['weeklySchedule']
  } catch {
    throw new Error(
      '[WorkoutRepository] Failed to parse weekly_schedule_json — data may be corrupted',
    )
  }
}

function rowToPlan(row: WorkoutPlanRow): GeneratedWorkoutPlan & { planId: string } {
  return {
    planId: row.id,
    splitType: row.split_type as GeneratedWorkoutPlan['splitType'],
    reasoning: row.reasoning,
    reasoningHe: row.reasoning_he,
    weeklySchedule: parseScheduleJson(row.weekly_schedule_json),
    mesocycleWeek: row.mesocycle_week,
    totalMesocycleWeeks: row.total_mesocycle_weeks,
  }
}

function rowToMesocycle(row: MesocycleRow): Mesocycle {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    weekNumber: row.week_number,
    totalWeeks: row.total_weeks,
    isDeloadWeek: row.is_deload_week === 1,
  }
}

function groupSetsIntoExercises(sets: SetLogRow[]): LoggedExercise[] {
  const exerciseMap = new Map<string, { sets: LoggedSet[]; notes: string }>()

  for (const set of sets) {
    if (!exerciseMap.has(set.exercise_id)) {
      exerciseMap.set(set.exercise_id, { sets: [], notes: set.notes })
    }
    exerciseMap.get(set.exercise_id)!.sets.push({
      setNumber: set.set_number,
      weightKg: set.weight_kg,
      reps: set.reps,
      rpe: set.rpe,
      isWarmup: set.is_warmup === 1,
    })
  }

  return Array.from(exerciseMap.entries()).map(([exerciseId, data]) => ({
    exerciseId,
    sets: data.sets,
    notes: data.notes,
  }))
}

function rowToWorkoutLog(row: WorkoutLogRow, sets: SetLogRow[]): WorkoutLog {
  return {
    id: row.id,
    date: row.date,
    templateId: row.template_id,
    dayType: row.day_type as WorkoutLog['dayType'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    exercises: groupSetsIntoExercises(sets),
    durationMinutes: row.duration_minutes,
  }
}

function rowToArchivedPlan(row: ArchivedPlanRow): ArchivedPlan {
  return {
    id: row.id,
    splitType: row.split_type as SplitType,
    mesocycleWeeks: row.mesocycle_weeks,
    workoutsCompleted: row.workouts_completed,
    archivedAt: row.archived_at,
  }
}

// ── Repository ────────────────────────────────────────────────────

class WorkoutRepository extends BaseRepository<WorkoutPlanRow> {
  constructor() {
    super('workout_plan')
  }

  /**
   * Saves a generated workout plan to SQLite.
   * Inserts plan + templates + prescriptions in a single transaction.
   */
  async savePlan(plan: GeneratedWorkoutPlan, userId: string): Promise<string> {
    const db = getDatabase()
    const planId = generateId()
    const now = nowISO()

    await db.withTransactionAsync(async () => {
      // Insert plan row
      await db.runAsync(
        `INSERT INTO workout_plan (id, user_id, split_type, created_at, is_active, weekly_schedule_json, mesocycle_week, total_mesocycle_weeks, reasoning, reasoning_he)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          planId,
          userId,
          plan.splitType,
          now,
          JSON.stringify(plan.weeklySchedule),
          plan.mesocycleWeek,
          plan.totalMesocycleWeeks,
          plan.reasoning,
          plan.reasoningHe,
        ],
      )

      // Insert templates and prescriptions for training days
      for (const day of plan.weeklySchedule) {
        if (!day.template) continue

        const templateId = generateId()
        await db.runAsync(
          `INSERT INTO workout_template (id, plan_id, day_type, name_he, name_en, estimated_minutes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            templateId,
            planId,
            day.template.dayType,
            day.template.nameHe,
            day.template.nameEn,
            day.template.estimatedMinutes,
          ],
        )

        for (const ex of day.template.exercises) {
          await db.runAsync(
            `INSERT INTO exercise_prescription (id, template_id, exercise_id, sets, min_reps, max_reps, rest_seconds, exercise_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId(),
              templateId,
              ex.exerciseId,
              ex.sets,
              ex.minReps,
              ex.maxReps,
              ex.restSeconds,
              ex.order,
            ],
          )
        }
      }
    })

    return planId
  }

  /**
   * Gets the currently active workout plan, or null if none.
   */
  async getActivePlan(): Promise<(GeneratedWorkoutPlan & { planId: string }) | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<WorkoutPlanRow>(
      'SELECT * FROM workout_plan WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1',
      [],
    )
    return row ? rowToPlan(row) : null
  }

  /**
   * Deactivates a plan (sets is_active = 0).
   */
  async deactivatePlan(planId: string): Promise<void> {
    const db = getDatabase()
    await db.runAsync('UPDATE workout_plan SET is_active = 0 WHERE id = ?', [planId])
  }

  /**
   * Creates a new mesocycle record.
   */
  async saveMesocycle(data: Omit<Mesocycle, 'id'>): Promise<Mesocycle> {
    const db = getDatabase()
    const id = generateId()

    await db.runAsync(
      `INSERT INTO mesocycle (id, start_date, end_date, week_number, total_weeks, is_deload_week)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.startDate,
        data.endDate,
        data.weekNumber,
        data.totalWeeks,
        data.isDeloadWeek ? 1 : 0,
      ],
    )

    return { id, ...data }
  }

  /**
   * Gets the active mesocycle (end_date IS NULL).
   */
  async getActiveMesocycle(): Promise<Mesocycle | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<MesocycleRow>(
      'SELECT * FROM mesocycle WHERE end_date IS NULL ORDER BY start_date DESC LIMIT 1',
      [],
    )
    return row ? rowToMesocycle(row) : null
  }

  /**
   * Updates mesocycle fields (week number, deload status, end date).
   * Always sends all 3 columns — unchanged fields get their current values.
   */
  async updateMesocycle(
    id: string,
    updates: Partial<Pick<Mesocycle, 'weekNumber' | 'isDeloadWeek' | 'endDate'>>,
  ): Promise<void> {
    const db = getDatabase()
    const current = await db.getFirstAsync<MesocycleRow>('SELECT * FROM mesocycle WHERE id = ?', [
      id,
    ])
    if (!current) return

    const weekNumber = updates.weekNumber ?? current.week_number
    const isDeloadWeek = updates.isDeloadWeek ?? current.is_deload_week === 1
    const endDate = updates.endDate !== undefined ? updates.endDate : current.end_date

    await db.runAsync(
      'UPDATE mesocycle SET week_number = ?, is_deload_week = ?, end_date = ? WHERE id = ?',
      [weekNumber, isDeloadWeek ? 1 : 0, endDate, id],
    )
  }

  /**
   * Saves a completed or abandoned workout log with all sets.
   */
  async saveWorkoutLog(data: Omit<WorkoutLog, 'id'>): Promise<WorkoutLog> {
    const db = getDatabase()
    const logId = generateId()

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO workout_log (id, date, template_id, day_type, started_at, completed_at, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          data.date,
          data.templateId,
          data.dayType,
          data.startedAt,
          data.completedAt,
          data.durationMinutes,
        ],
      )

      for (const exercise of data.exercises) {
        for (const set of exercise.sets) {
          await db.runAsync(
            `INSERT INTO set_log (id, workout_log_id, exercise_id, set_number, weight_kg, reps, rpe, is_warmup, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId(),
              logId,
              exercise.exerciseId,
              set.setNumber,
              set.weightKg,
              set.reps,
              set.rpe,
              set.isWarmup ? 1 : 0,
              exercise.notes,
            ],
          )
        }
      }
    })

    return { id: logId, ...data }
  }

  /**
   * Gets the most recent workout logs with all their sets.
   */
  async getRecentLogs(limit: number): Promise<WorkoutLog[]> {
    const db = getDatabase()
    const logRows = await db.getAllAsync<WorkoutLogRow>(
      'SELECT * FROM workout_log ORDER BY date DESC, started_at DESC LIMIT ?',
      [limit],
    )

    if (logRows.length === 0) return []

    const logs: WorkoutLog[] = []
    for (const logRow of logRows) {
      const setRows = await db.getAllAsync<SetLogRow>(
        'SELECT * FROM set_log WHERE workout_log_id = ? ORDER BY exercise_id, set_number',
        [logRow.id],
      )
      logs.push(rowToWorkoutLog(logRow, setRows))
    }

    return logs
  }

  /**
   * Gets recent sets for a specific exercise (for progression advice).
   * Returns domain LoggedSet objects, not raw DB rows.
   */
  async getLogsByExercise(exerciseId: string, limit: number): Promise<LoggedSet[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<SetLogRow>(
      `SELECT sl.* FROM set_log sl
       JOIN workout_log wl ON sl.workout_log_id = wl.id
       WHERE sl.exercise_id = ?
       ORDER BY wl.date DESC, sl.set_number ASC
       LIMIT ?`,
      [exerciseId, limit],
    )
    return rows.map((r) => ({
      setNumber: r.set_number,
      weightKg: r.weight_kg,
      reps: r.reps,
      rpe: r.rpe,
      isWarmup: r.is_warmup === 1,
    }))
  }

  /**
   * Archives a plan and its logs, then deactivates the plan.
   */
  async archivePlan(
    planId: string,
    splitType: SplitType,
    mesocycleWeeks: number,
    workoutsCompleted: number,
    weeklyScheduleJson: string,
  ): Promise<void> {
    const db = getDatabase()

    await db.withTransactionAsync(async () => {
      const archiveId = generateId()

      // Insert archived plan
      await db.runAsync(
        `INSERT INTO archived_plan (id, plan_id, split_type, mesocycle_weeks, workouts_completed, weekly_schedule_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [archiveId, planId, splitType, mesocycleWeeks, workoutsCompleted, weeklyScheduleJson],
      )

      // Copy workout logs to archive
      const logs = await db.getAllAsync<WorkoutLogRow>(
        'SELECT * FROM workout_log WHERE template_id IN (SELECT id FROM workout_template WHERE plan_id = ?)',
        [planId],
      )

      for (const log of logs) {
        await db.runAsync(
          `INSERT INTO archived_workout_log (id, archived_plan_id, original_log_json)
           VALUES (?, ?, ?)`,
          [generateId(), archiveId, JSON.stringify(log)],
        )
      }

      // Deactivate the plan
      await db.runAsync('UPDATE workout_plan SET is_active = 0 WHERE id = ?', [planId])
    })
  }

  /**
   * Gets all archived plans, most recent first.
   */
  async getArchivedPlans(): Promise<ArchivedPlan[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<ArchivedPlanRow>(
      'SELECT * FROM archived_plan ORDER BY archived_at DESC',
    )
    return rows.map(rowToArchivedPlan)
  }
}

// ── Singleton export ──────────────────────────────────────────────

export const workoutRepository = new WorkoutRepository()
