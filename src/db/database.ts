/**
 * Database initialization and connection management.
 *
 * Uses expo-sqlite for local-first storage.
 * All queries are parameterized — NO string concatenation in SQL.
 *
 * SECURITY:
 * - SQL injection prevention via parameterized queries
 * - WAL mode for better concurrent read performance
 * - Foreign keys enforced
 */

import * as SQLite from 'expo-sqlite'
import { CREATE_TABLE_STATEMENTS, SCHEMA_VERSION } from './schema'

const DATABASE_NAME = 'fitcoach.db'

let dbInstance: SQLite.SQLiteDatabase | null = null

/**
 * Opens (or creates) the database and runs all migrations.
 * Call once at app startup.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance !== null) {
    return dbInstance
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME)

  // Enable WAL mode for better performance
  await db.execAsync('PRAGMA journal_mode = WAL')

  // Enforce foreign key constraints
  await db.execAsync('PRAGMA foreign_keys = ON')

  // Run schema creation
  await runMigrations(db)

  dbInstance = db
  return db
}

/**
 * Returns the active database instance.
 * Throws if database hasn't been initialized (catches misconfiguration early).
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (dbInstance === null) {
    throw new Error('[Database] Not initialized. Call initializeDatabase() at app startup.')
  }
  return dbInstance
}

/**
 * Runs all CREATE TABLE statements and version-gated ALTER migrations.
 * Uses IF NOT EXISTS so it's safe to run multiple times.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Check current version
  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = versionResult?.user_version ?? 0

  if (currentVersion >= SCHEMA_VERSION) {
    return // Already up to date
  }

  // Run all CREATE statements in a transaction (atomic — all or nothing)
  await db.withTransactionAsync(async () => {
    for (const statement of CREATE_TABLE_STATEMENTS) {
      await db.execAsync(statement)
    }

    // Version-gated ALTER TABLE migrations for existing databases
    if (currentVersion > 0 && currentVersion < 5) {
      await migrateToV5(db)
    }
    if (currentVersion > 0 && currentVersion < 6) {
      await migrateToV6(db)
    }
    if (currentVersion > 0 && currentVersion < 7) {
      await migrateToV7(db)
    }
    if (currentVersion > 0 && currentVersion < 9) {
      await migrateToV9(db)
    }
    if (currentVersion < 10) {
      await migrateToV10(db)
    }

    // Update version
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
  })

  console.log(`[Database] Migrated from v${currentVersion} to v${SCHEMA_VERSION}`)
}

/**
 * v5: Add missing columns to workout_plan table.
 * Uses a helper to skip columns that already exist (safe for fresh installs).
 */
async function migrateToV5(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(workout_plan)`)
  const existing = new Set(columns.map((c) => c.name))

  const additions: { col: string; def: string }[] = [
    { col: 'weekly_schedule_json', def: "TEXT NOT NULL DEFAULT '[]'" },
    { col: 'mesocycle_week', def: 'INTEGER NOT NULL DEFAULT 1' },
    { col: 'total_mesocycle_weeks', def: 'INTEGER NOT NULL DEFAULT 6' },
    { col: 'reasoning', def: "TEXT NOT NULL DEFAULT ''" },
    { col: 'reasoning_he', def: "TEXT NOT NULL DEFAULT ''" },
  ]

  for (const { col, def } of additions) {
    if (!existing.has(col)) {
      await db.execAsync(`ALTER TABLE workout_plan ADD COLUMN ${col} ${def}`)
    }
  }
}

/**
 * v6: Add coach_marks_completed column to user_profile.
 * Tracks whether the user has dismissed the post-onboarding tour.
 */
async function migrateToV6(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(user_profile)`)
  const existing = new Set(columns.map((c) => c.name))

  if (!existing.has('coach_marks_completed')) {
    await db.execAsync(
      `ALTER TABLE user_profile ADD COLUMN coach_marks_completed INTEGER NOT NULL DEFAULT 0`,
    )
  }
}

/**
 * v7: Add name column to user_profile.
 * Stores the user's first name for personalized greetings (HomeHeader).
 */
async function migrateToV7(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(user_profile)`)
  const existing = new Set(columns.map((c) => c.name))

  if (!existing.has('name')) {
    await db.execAsync(`ALTER TABLE user_profile ADD COLUMN name TEXT NOT NULL DEFAULT ''`)
  }
}

/**
 * v9: Add workout_time column to user_profile.
 * Drives per-meal macro targeting (pre/post-workout meal roles).
 */
async function migrateToV9(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(user_profile)`)
  const existing = new Set(columns.map((c) => c.name))

  if (!existing.has('workout_time')) {
    await db.execAsync(
      `ALTER TABLE user_profile ADD COLUMN workout_time TEXT NOT NULL DEFAULT 'flexible'`,
    )
  }
}

/**
 * v10: Seed the foods table from the bundled Tzameret JSON asset.
 * Runs only if the table is empty (idempotent — safe to call on every migration).
 * Inserts in batches of 50 to stay within SQLite's parameter limit.
 */
async function migrateToV10(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM foods')
  if ((existing?.count ?? 0) > 0) {
    return // Already seeded
  }

  const seed = require('../assets/tzameret-seed.json') as {
    id: string
    nameHe: string
    nameEn: string
    category: string
    caloriesPer100g: number
    proteinPer100g: number
    fatPer100g: number
    carbsPer100g: number
    fiberPer100g: number
    isUserCreated: boolean
    servingSizesJson: string
  }[]

  const BATCH_SIZE = 50
  for (let i = 0; i < seed.length; i += BATCH_SIZE) {
    const batch = seed.slice(i, i + BATCH_SIZE)
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const params = batch.flatMap((f) => [
      f.id,
      f.nameHe,
      f.nameEn,
      f.category,
      f.caloriesPer100g,
      f.proteinPer100g,
      f.fatPer100g,
      f.carbsPer100g,
      f.fiberPer100g,
      f.isUserCreated ? 1 : 0,
      f.servingSizesJson,
    ])
    await db.runAsync(
      `INSERT OR IGNORE INTO foods (id, name_he, name_en, category, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, is_user_created, serving_sizes_json) VALUES ${placeholders}`,
      params,
    )
  }

  console.log(`[Database] Seeded ${seed.length} foods from Tzameret dataset`)
}

/**
 * Closes the database connection.
 * Call during app cleanup or testing teardown.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance !== null) {
    await dbInstance.closeAsync()
    dbInstance = null
  }
}
