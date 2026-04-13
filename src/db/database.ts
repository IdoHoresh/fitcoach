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

const DATABASE_NAME = 'gibor.db'

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
 * Runs all CREATE TABLE statements.
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

    // Update version
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`)
  })

  console.log(`[Database] Migrated from v${currentVersion} to v${SCHEMA_VERSION}`)
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
