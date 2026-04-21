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
import { normalizeNameForDedup } from '../shared/normalizeFoodName'

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
    if (currentVersion < 11) {
      await migrateToV11(db)
    }
    if (currentVersion < 12) {
      await migrateToV12(db)
    }
    if (currentVersion < 13) {
      await migrateToV13(db)
    }
    if (currentVersion < 14) {
      await migrateToV14(db)
    }
    if (currentVersion < 15) {
      await migrateToV15(db)
    }
    if (currentVersion < 16) {
      await migrateToV16(db)
    }
    if (currentVersion < 17) {
      await migrateToV17(db)
    }
    if (currentVersion < 19) {
      await migrateToV19(db)
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
 * v10: Previously seeded Tzameret foods. Now a no-op — Tzameret replaced by
 * supermarket scraper pipeline (v11+). Kept to avoid re-running on existing
 * databases that already passed this version gate.
 */
async function migrateToV10(_db: SQLite.SQLiteDatabase): Promise<void> {
  // No-op. Tzameret seeding removed in v12.
}

/**
 * v11: Seed the foods table with supermarket (Shufersal) products + protein yoghurt overrides.
 * Safe to re-run — uses INSERT OR IGNORE so existing rows are preserved.
 * If the asset file is missing (e.g. developer hasn't run scrape-shufersal yet),
 * the migration is silently skipped — the app still works with Tzameret data only.
 */
async function migrateToV11(db: SQLite.SQLiteDatabase): Promise<void> {
  let seed: {
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

  try {
    seed = require('../assets/supermarket-seed.json')
  } catch {
    // Asset not yet generated — scraper hasn't been run. Skip silently.
    console.log('[Database] supermarket-seed.json not found — skipping v11 seeding')
    return
  }

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

  console.log(`[Database] Seeded ${seed.length} foods from supermarket dataset`)
}

/**
 * v12: Remove all Tzameret foods (tz_ prefix) from existing installs.
 * Tzameret replaced by supermarket scraper — data was too generic and
 * unbranded for an Israeli food-logging app.
 */
async function migrateToV12(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(`DELETE FROM foods WHERE id LIKE 'tz_%'`)
  console.log('[Database] v12: Removed Tzameret foods from database')
}

/**
 * v13: Add name_he column to food_log.
 * Denormalizes the Hebrew food name at log time so display doesn't require
 * a foods table lookup (and survives food DB changes / Tzameret removal).
 */
async function migrateToV13(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(food_log)`)
  const existing = new Set(columns.map((c) => c.name))

  if (!existing.has('name_he')) {
    await db.execAsync(`ALTER TABLE food_log ADD COLUMN name_he TEXT NOT NULL DEFAULT ''`)
  }
}

/**
 * v14: Replace the 46-product Shufersal proof-of-concept seed with the full
 * 5,459-product catalog scraped from shufersal.co.il.
 *
 * Deletes all existing sh_ and manual_ rows first so stale products don't
 * linger after deduplication or override changes between scrape runs.
 * Uses INSERT OR IGNORE so user-created foods (no sh_/manual_ prefix) are safe.
 *
 * If the asset file is missing, silently skips — same pattern as v11.
 */
async function migrateToV14(db: SQLite.SQLiteDatabase): Promise<void> {
  let seed: {
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

  try {
    seed = require('../assets/supermarket-seed.json')
  } catch {
    console.log('[Database] supermarket-seed.json not found — skipping v14 seeding')
    return
  }

  // Wipe previous scrape so stale products don't persist
  await db.runAsync(`DELETE FROM foods WHERE id LIKE 'sh_%' OR id LIKE 'manual_%'`)

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

  console.log(`[Database] v14: Seeded ${seed.length} foods from full Shufersal catalog`)
}

async function migrateToV15(db: SQLite.SQLiteDatabase): Promise<void> {
  let seed: {
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

  try {
    seed = require('../assets/rami-levy-seed.json')
  } catch {
    console.log('[Database] rami-levy-seed.json not found — skipping v15 seeding')
    return
  }

  if (seed.length === 0) {
    console.log('[Database] rami-levy-seed.json is empty — skipping v15 seeding')
    return
  }

  // Wipe previous Rami Levy scrape so stale products don't persist
  await db.runAsync(`DELETE FROM foods WHERE id LIKE 'rl_%'`)

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

  console.log(`[Database] v15: Seeded ${seed.length} foods from Rami Levy catalog`)
}

async function migrateToV16(db: SQLite.SQLiteDatabase): Promise<void> {
  let seed: {
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

  try {
    seed = require('../assets/raw-ingredients-seed.json')
  } catch {
    console.log('[Database] raw-ingredients-seed.json not found — skipping v16 seeding')
    return
  }

  if (seed.length === 0) {
    console.log('[Database] raw-ingredients-seed.json is empty — skipping v16 seeding')
    return
  }

  // Wipe previous raw ingredient catalog so stale entries don't persist
  await db.runAsync(`DELETE FROM foods WHERE id LIKE 'raw_%'`)

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

  console.log(`[Database] v16: Seeded ${seed.length} foods from raw ingredient catalog`)
}

/**
 * v17: Dedup food catalog across sources.
 *
 * 1. Ensures `name_norm` column exists (fresh installs already have it via
 *    CREATE TABLE; upgrade installs need ALTER TABLE).
 * 2. Backfills `name_norm` for every row using the shared normalization helper.
 * 3. Cross-source tier cleanup: when two rows share a normalized name across
 *    different sources, keep the highest-tier one and delete the rest.
 *    Tier order: raw_% (0) > manual_% (1) > sh_% (2) > rl_% (3).
 * 4. Ensures the index on `name_norm` exists.
 *
 * Idempotent: safe to re-run on already-migrated databases.
 */
async function migrateToV17(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Add column if missing (fresh installs already have it via CREATE TABLE)
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(foods)`)
  const hasNameNorm = columns.some((c) => c.name === 'name_norm')
  if (!hasNameNorm) {
    await db.execAsync(`ALTER TABLE foods ADD COLUMN name_norm TEXT`)
  }

  // 2. Backfill name_norm for rows where it's null (or empty, for safety)
  const toBackfill = await db.getAllAsync<{ id: string; name_he: string }>(
    `SELECT id, name_he FROM foods WHERE name_norm IS NULL OR name_norm = ''`,
  )

  const BACKFILL_BATCH = 100
  for (let i = 0; i < toBackfill.length; i += BACKFILL_BATCH) {
    const batch = toBackfill.slice(i, i + BACKFILL_BATCH)
    for (const row of batch) {
      await db.runAsync(`UPDATE foods SET name_norm = ? WHERE id = ?`, [
        normalizeNameForDedup(row.name_he),
        row.id,
      ])
    }
  }

  // 3. Ensure index exists
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_foods_name_norm ON foods(name_norm)`)

  // 4. Cross-source tier cleanup: delete rows where a same-name_norm row with
  //    lower tier number (= higher priority) exists.
  //    Tier inline via CASE. Skip empty name_norm (defensive — shouldn't happen).
  const deleteResult = await db.runAsync(
    `DELETE FROM foods
     WHERE name_norm IS NOT NULL
       AND name_norm != ''
       AND EXISTS (
         SELECT 1 FROM foods f2
         WHERE f2.name_norm = foods.name_norm
           AND (
             CASE
               WHEN f2.id LIKE 'raw_%'    THEN 0
               WHEN f2.id LIKE 'manual_%' THEN 1
               WHEN f2.id LIKE 'sh_%'     THEN 2
               WHEN f2.id LIKE 'rl_%'     THEN 3
               ELSE 4
             END
           ) < (
             CASE
               WHEN foods.id LIKE 'raw_%'    THEN 0
               WHEN foods.id LIKE 'manual_%' THEN 1
               WHEN foods.id LIKE 'sh_%'     THEN 2
               WHEN foods.id LIKE 'rl_%'     THEN 3
               ELSE 4
             END
           )
       )`,
  )

  const backfilled = toBackfill.length
  const deleted = deleteResult?.changes ?? 0
  console.log(
    `[Database] v17: backfilled ${backfilled} name_norm, deleted ${deleted} cross-source dups`,
  )
}

/**
 * v19: Tiv Taam Phase 2 seed migration.
 *
 * 1. Adds `origin_country TEXT` column to `foods` (fresh installs already
 *    have it via CREATE TABLE; upgrade installs need ALTER TABLE).
 *    Nullable — only tt_ rows populate it; sh_/rl_/raw_/manual_ stay NULL.
 * 2. Wipes previous tt_ scrape so stale items don't persist.
 * 3. Batch-inserts `src/assets/tivtaam-seed.json` with INSERT OR IGNORE —
 *    user-created foods + cross-source dedup winners from v17 are preserved.
 *
 * Same DELETE-then-INSERT pattern as v14 (sh_), v15 (rl_), v16 (raw_).
 * Silently skips if `tivtaam-seed.json` hasn't been generated yet (same
 * "missing asset" escape hatch as v11/v14/v15/v16).
 */
async function migrateToV19(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Schema: add origin_country column if missing.
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(foods)`)
  const hasOriginCountry = columns.some((c) => c.name === 'origin_country')
  if (!hasOriginCountry) {
    await db.execAsync(`ALTER TABLE foods ADD COLUMN origin_country TEXT`)
  }

  // 2. Seed: load tivtaam-seed.json; silently skip if missing.
  let seed: {
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
    originCountry: string | null
  }[]

  try {
    seed = require('../assets/tivtaam-seed.json')
  } catch {
    console.log('[Database] tivtaam-seed.json not found — skipping v19 seeding')
    return
  }

  if (seed.length === 0) {
    console.log('[Database] tivtaam-seed.json is empty — skipping v19 seeding')
    return
  }

  // 3. Wipe previous tt_ scrape so stale items don't persist across rebuilds.
  await db.runAsync(`DELETE FROM foods WHERE id LIKE 'tt_%'`)

  // 4. Batch INSERT OR IGNORE — 12 columns (11 shared + origin_country).
  const BATCH_SIZE = 50
  for (let i = 0; i < seed.length; i += BATCH_SIZE) {
    const batch = seed.slice(i, i + BATCH_SIZE)
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
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
      f.originCountry, // nullable
    ])
    await db.runAsync(
      `INSERT OR IGNORE INTO foods
       (id, name_he, name_en, category,
        calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g,
        is_user_created, serving_sizes_json, origin_country)
       VALUES ${placeholders}`,
      params,
    )
  }

  console.log(`[Database] v19: Seeded ${seed.length} Tiv Taam foods (with origin_country)`)
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
