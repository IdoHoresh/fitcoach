/**
 * SQLite Database Schema.
 *
 * All tables defined here — single source of truth for database structure.
 * Uses parameterized queries ONLY — no string concatenation, ever.
 *
 * SECURITY:
 * - All queries use ? placeholders (SQL injection prevention)
 * - Sensitive data (future auth tokens) stored in expo-secure-store, NOT here
 * - Health data stays on device only (no cloud sync without user consent)
 */

/** Current schema version — increment when modifying tables */
export const SCHEMA_VERSION = 6

/**
 * All CREATE TABLE statements.
 * Executed in order during initial setup or migration.
 */
export const CREATE_TABLE_STATEMENTS: readonly string[] = [
  // ── User Profile ──
  `CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    body_fat_percent REAL,
    goal TEXT NOT NULL CHECK (goal IN ('muscle_gain', 'fat_loss', 'maintenance')),
    experience TEXT NOT NULL CHECK (experience IN ('beginner', 'intermediate')),
    training_days TEXT NOT NULL,
    training_location TEXT NOT NULL CHECK (training_location IN ('full_gym', 'home', 'bodyweight_only')),
    available_equipment TEXT NOT NULL,
    occupation TEXT NOT NULL CHECK (occupation IN ('desk', 'mixed', 'active', 'physical_labor')),
    daily_steps INTEGER,
    after_work_activity TEXT NOT NULL CHECK (after_work_activity IN ('sedentary', 'moderate', 'active')),
    exercise_days_per_week INTEGER NOT NULL,
    exercise_type TEXT NOT NULL CHECK (exercise_type IN ('strength', 'cardio', 'both')),
    session_duration_minutes INTEGER NOT NULL,
    exercise_intensity TEXT NOT NULL CHECK (exercise_intensity IN ('light', 'moderate', 'intense')),
    sleep_hours_per_night REAL NOT NULL,
    coach_marks_completed INTEGER NOT NULL DEFAULT 0
  )`,

  // ── Workout Plan (generated from algorithm) ──
  `CREATE TABLE IF NOT EXISTS workout_plan (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    split_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    weekly_schedule_json TEXT NOT NULL DEFAULT '[]',
    mesocycle_week INTEGER NOT NULL DEFAULT 1,
    total_mesocycle_weeks INTEGER NOT NULL DEFAULT 6,
    reasoning TEXT NOT NULL DEFAULT '',
    reasoning_he TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES user_profile(id)
  )`,

  // ── Workout Templates (individual workout days) ──
  `CREATE TABLE IF NOT EXISTS workout_template (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    day_type TEXT NOT NULL,
    name_he TEXT NOT NULL,
    name_en TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES workout_plan(id)
  )`,

  // ── Exercise Prescriptions (exercises within a template) ──
  `CREATE TABLE IF NOT EXISTS exercise_prescription (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sets INTEGER NOT NULL,
    min_reps INTEGER NOT NULL,
    max_reps INTEGER NOT NULL,
    rest_seconds INTEGER NOT NULL,
    exercise_order INTEGER NOT NULL,
    FOREIGN KEY (template_id) REFERENCES workout_template(id)
  )`,

  // ── Workout Logs (completed workouts) ──
  `CREATE TABLE IF NOT EXISTS workout_log (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    template_id TEXT NOT NULL,
    day_type TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES workout_template(id)
  )`,

  // ── Set Logs (individual sets within a workout) ──
  `CREATE TABLE IF NOT EXISTS set_log (
    id TEXT PRIMARY KEY,
    workout_log_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    reps INTEGER NOT NULL,
    rpe REAL,
    is_warmup INTEGER NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    FOREIGN KEY (workout_log_id) REFERENCES workout_log(id)
  )`,

  // ── Food Log (daily nutrition tracking) ──
  `CREATE TABLE IF NOT EXISTS food_log (
    id TEXT PRIMARY KEY,
    food_id TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    date TEXT NOT NULL,
    serving_amount REAL NOT NULL,
    serving_unit TEXT NOT NULL,
    grams_consumed REAL NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbs REAL NOT NULL
  )`,

  // ── Saved Meals (user's frequently eaten meal combos) ──
  `CREATE TABLE IF NOT EXISTS saved_meal (
    id TEXT PRIMARY KEY,
    name_he TEXT NOT NULL,
    total_calories REAL NOT NULL,
    total_protein REAL NOT NULL,
    total_fat REAL NOT NULL,
    total_carbs REAL NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS saved_meal_item (
    id TEXT PRIMARY KEY,
    saved_meal_id TEXT NOT NULL,
    food_id TEXT NOT NULL,
    serving_amount REAL NOT NULL,
    serving_unit TEXT NOT NULL,
    grams_consumed REAL NOT NULL,
    FOREIGN KEY (saved_meal_id) REFERENCES saved_meal(id)
  )`,

  // ── Body Measurements (progress tracking) ──
  `CREATE TABLE IF NOT EXISTS body_measurement (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    body_fat_percent REAL,
    notes TEXT DEFAULT ''
  )`,

  // ── Mesocycle Tracking ──
  `CREATE TABLE IF NOT EXISTS mesocycle (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT,
    week_number INTEGER NOT NULL DEFAULT 1,
    total_weeks INTEGER NOT NULL,
    is_deload_week INTEGER NOT NULL DEFAULT 0
  )`,

  // ── Archived Plans (history of completed/abandoned mesocycles) ──
  `CREATE TABLE IF NOT EXISTS archived_plan (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    split_type TEXT NOT NULL,
    mesocycle_weeks INTEGER NOT NULL,
    workouts_completed INTEGER NOT NULL DEFAULT 0,
    weekly_schedule_json TEXT NOT NULL,
    archived_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // ── Archived Workout Logs (logs belonging to archived plans) ──
  `CREATE TABLE IF NOT EXISTS archived_workout_log (
    id TEXT PRIMARY KEY,
    archived_plan_id TEXT NOT NULL,
    original_log_json TEXT NOT NULL,
    FOREIGN KEY (archived_plan_id) REFERENCES archived_plan(id)
  )`,

  // ── Meal Plan (generated nutrition plan) ──
  `CREATE TABLE IF NOT EXISTS meal_plan (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    target_calories REAL NOT NULL,
    target_protein REAL NOT NULL,
    target_fat REAL NOT NULL,
    target_carbs REAL NOT NULL,
    meals_per_day INTEGER NOT NULL CHECK (meals_per_day IN (3, 4, 5, 6)),
    plan_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // ── Planned Meals (individual meals within a plan) ──
  `CREATE TABLE IF NOT EXISTS planned_meal (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_training_day INTEGER NOT NULL DEFAULT 0,
    meal_type TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    time_slot TEXT,
    template_id TEXT,
    items_json TEXT NOT NULL,
    total_calories REAL NOT NULL,
    total_protein REAL NOT NULL,
    total_fat REAL NOT NULL,
    total_carbs REAL NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES meal_plan(id)
  )`,

  // ── Weekly Check-in (recalibration records) ──
  `CREATE TABLE IF NOT EXISTS weekly_checkin (
    id TEXT PRIMARY KEY,
    week_start_date TEXT NOT NULL,
    week_end_date TEXT NOT NULL,
    avg_weight REAL NOT NULL,
    prev_avg_weight REAL,
    weight_change REAL,
    expected_change REAL NOT NULL,
    calorie_adjustment REAL NOT NULL,
    new_target_calories REAL NOT NULL,
    coach_message TEXT NOT NULL,
    coach_message_en TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // ── Indexes for fast lookups ──
  `CREATE INDEX IF NOT EXISTS idx_workout_log_date ON workout_log(date)`,
  `CREATE INDEX IF NOT EXISTS idx_set_log_workout ON set_log(workout_log_id)`,
  `CREATE INDEX IF NOT EXISTS idx_set_log_exercise ON set_log(exercise_id)`,
  `CREATE INDEX IF NOT EXISTS idx_food_log_date ON food_log(date)`,
  `CREATE INDEX IF NOT EXISTS idx_food_log_meal ON food_log(date, meal_type)`,
  `CREATE INDEX IF NOT EXISTS idx_body_measurement_date ON body_measurement(date)`,
  `CREATE INDEX IF NOT EXISTS idx_archived_log_plan ON archived_workout_log(archived_plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_meal_plan_status ON meal_plan(status)`,
  `CREATE INDEX IF NOT EXISTS idx_planned_meal_plan ON planned_meal(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_weekly_checkin_date ON weekly_checkin(week_start_date)`,
]
