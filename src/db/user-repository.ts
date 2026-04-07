/**
 * User profile repository.
 * Handles CRUD for user profile and body measurements.
 * Uses parameterized queries only.
 */

import type {
  BodyMeasurement,
  DayOfWeek,
  EquipmentItem,
  LifestyleProfile,
  SessionDuration,
  TrainingLocation,
  UserEquipment,
  UserProfile,
} from '../types'
import { BaseRepository, generateId, nowISO, todayISO } from './base-repository'
import { getDatabase } from './database'

/** Database row shape for user_profile table */
interface UserProfileRow {
  id: string
  created_at: string
  updated_at: string
  height_cm: number
  weight_kg: number
  age: number
  sex: string
  body_fat_percent: number | null
  goal: string
  experience: string
  training_days: string // JSON array stored as text
  training_location: string
  available_equipment: string // JSON array stored as text
  // Lifestyle fields (component-based TDEE)
  occupation: string
  daily_steps: number | null
  after_work_activity: string
  exercise_days_per_week: number
  exercise_type: string
  session_duration_minutes: number
  exercise_intensity: string
  sleep_hours_per_night: number
}

/** Maps a database row to a UserProfile domain object */
function rowToProfile(row: UserProfileRow): UserProfile {
  const lifestyle: LifestyleProfile = {
    occupation: row.occupation as LifestyleProfile['occupation'],
    dailySteps: row.daily_steps,
    afterWorkActivity: row.after_work_activity as LifestyleProfile['afterWorkActivity'],
    exerciseDaysPerWeek: row.exercise_days_per_week,
    exerciseType: row.exercise_type as LifestyleProfile['exerciseType'],
    sessionDurationMinutes: row.session_duration_minutes as SessionDuration,
    exerciseIntensity: row.exercise_intensity as LifestyleProfile['exerciseIntensity'],
    sleepHoursPerNight: row.sleep_hours_per_night,
  }

  const equipment: UserEquipment = {
    location: row.training_location as TrainingLocation,
    availableEquipment: JSON.parse(row.available_equipment) as EquipmentItem[],
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    age: row.age,
    sex: row.sex as UserProfile['sex'],
    bodyFatPercent: row.body_fat_percent,
    goal: row.goal as UserProfile['goal'],
    experience: row.experience as UserProfile['experience'],
    trainingDays: JSON.parse(row.training_days) as DayOfWeek[],
    equipment,
    lifestyle,
  }
}

class UserRepository extends BaseRepository<UserProfileRow> {
  constructor() {
    super('user_profile')
  }

  /**
   * Gets the current user profile (there's only ever one).
   */
  async getProfile(): Promise<UserProfile | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<UserProfileRow>('SELECT * FROM user_profile LIMIT 1')
    return row ? rowToProfile(row) : null
  }

  /**
   * Creates or updates the user profile (upsert).
   * Only one profile exists at a time.
   */
  async saveProfile(
    data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserProfile> {
    const db = getDatabase()
    const existing = await this.getProfile()
    const now = nowISO()
    const ls = data.lifestyle

    if (existing) {
      await db.runAsync(
        `UPDATE user_profile SET
          height_cm = ?, weight_kg = ?, age = ?, sex = ?,
          body_fat_percent = ?, goal = ?, experience = ?,
          training_days = ?, training_location = ?, available_equipment = ?,
          occupation = ?, daily_steps = ?, after_work_activity = ?,
          exercise_days_per_week = ?, exercise_type = ?,
          session_duration_minutes = ?, exercise_intensity = ?,
          sleep_hours_per_night = ?,
          updated_at = ?
        WHERE id = ?`,
        [
          data.heightCm,
          data.weightKg,
          data.age,
          data.sex,
          data.bodyFatPercent,
          data.goal,
          data.experience,
          JSON.stringify(data.trainingDays),
          data.equipment.location,
          JSON.stringify(data.equipment.availableEquipment),
          ls.occupation,
          ls.dailySteps,
          ls.afterWorkActivity,
          ls.exerciseDaysPerWeek,
          ls.exerciseType,
          ls.sessionDurationMinutes,
          ls.exerciseIntensity,
          ls.sleepHoursPerNight,
          now,
          existing.id,
        ],
      )

      return { ...existing, ...data, updatedAt: now }
    }

    // Create new profile
    const id = generateId()
    await db.runAsync(
      `INSERT INTO user_profile (
        id, height_cm, weight_kg, age, sex,
        body_fat_percent, goal, experience,
        training_days, training_location, available_equipment,
        occupation, daily_steps, after_work_activity,
        exercise_days_per_week, exercise_type,
        session_duration_minutes, exercise_intensity,
        sleep_hours_per_night,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.heightCm,
        data.weightKg,
        data.age,
        data.sex,
        data.bodyFatPercent,
        data.goal,
        data.experience,
        JSON.stringify(data.trainingDays),
        data.equipment.location,
        JSON.stringify(data.equipment.availableEquipment),
        ls.occupation,
        ls.dailySteps,
        ls.afterWorkActivity,
        ls.exerciseDaysPerWeek,
        ls.exerciseType,
        ls.sessionDurationMinutes,
        ls.exerciseIntensity,
        ls.sleepHoursPerNight,
        now,
        now,
      ],
    )

    return {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    }
  }
}

// ── Body Measurements ───────────────────────────────────────────────

interface MeasurementRow {
  id: string
  date: string
  weight_kg: number
  body_fat_percent: number | null
  notes: string
}

function rowToMeasurement(row: MeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    date: row.date,
    weightKg: row.weight_kg,
    bodyFatPercent: row.body_fat_percent,
    notes: row.notes,
  }
}

class MeasurementRepository extends BaseRepository<MeasurementRow> {
  constructor() {
    super('body_measurement')
  }

  async addMeasurement(data: Omit<BodyMeasurement, 'id'>): Promise<BodyMeasurement> {
    const db = getDatabase()
    const id = generateId()

    await db.runAsync(
      `INSERT INTO body_measurement (id, date, weight_kg, body_fat_percent, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.date, data.weightKg, data.bodyFatPercent, data.notes],
    )

    return { id, ...data }
  }

  async getMeasurementsByDateRange(startDate: string, endDate: string): Promise<BodyMeasurement[]> {
    const rows = await this.findWhere('date >= ? AND date <= ? ORDER BY date ASC', [
      startDate,
      endDate,
    ])
    return rows.map(rowToMeasurement)
  }

  async getLatestMeasurement(): Promise<BodyMeasurement | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<MeasurementRow>(
      'SELECT * FROM body_measurement ORDER BY date DESC LIMIT 1',
    )
    return row ? rowToMeasurement(row) : null
  }

  async getTodaysMeasurement(): Promise<BodyMeasurement | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<MeasurementRow>(
      'SELECT * FROM body_measurement WHERE date = ?',
      [todayISO()],
    )
    return row ? rowToMeasurement(row) : null
  }

  async getWeeklyAverageWeight(startDate: string, endDate: string): Promise<number | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<{ avg_weight: number | null }>(
      'SELECT AVG(weight_kg) as avg_weight FROM body_measurement WHERE date >= ? AND date <= ?',
      [startDate, endDate],
    )
    return row?.avg_weight ?? null
  }
}

// ── Singleton exports ───────────────────────────────────────────────

export const userRepository = new UserRepository()
export const measurementRepository = new MeasurementRepository()
