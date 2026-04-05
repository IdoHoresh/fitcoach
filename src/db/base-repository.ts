/**
 * Generic base repository for SQLite CRUD operations.
 *
 * Implements the Repository pattern (SOLID — Dependency Inversion):
 * - All repos inherit from this base
 * - Enforces parameterized queries everywhere
 * - Single place for common operations (no duplicate CRUD code)
 *
 * SECURITY: Every query uses ? placeholders. String concatenation is forbidden.
 */

import * as Crypto from 'expo-crypto';
import type { SQLiteBindValue } from 'expo-sqlite';
import { getDatabase } from './database';

/**
 * Generates a cryptographically secure unique ID.
 * Uses expo-crypto (hardware-backed on iOS).
 */
export function generateId(): string {
  return Crypto.randomUUID();
}

/**
 * Returns current ISO datetime string for timestamps.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Returns current ISO date string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Base repository with common CRUD operations.
 * Extend this for each entity (workouts, food logs, measurements).
 *
 * Usage:
 *   class WorkoutRepo extends BaseRepository<WorkoutLog> {
 *     constructor() { super('workout_log'); }
 *   }
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Finds a single record by ID.
   * Returns null if not found (never throws for missing records).
   */
  async findById(id: string): Promise<T | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result ?? null;
  }

  /**
   * Finds all records matching a WHERE clause.
   * @param whereClause - SQL WHERE clause with ? placeholders
   * @param params - Values for the placeholders
   */
  async findWhere(whereClause: string, params: SQLiteBindValue[]): Promise<T[]> {
    const db = getDatabase();
    return db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
      params
    );
  }

  /**
   * Returns all records in the table, optionally ordered.
   * @param orderBy - Column to order by (must be a known column name)
   * @param direction - ASC or DESC
   */
  async findAll(orderBy?: string, direction: 'ASC' | 'DESC' = 'ASC'): Promise<T[]> {
    const db = getDatabase();
    const orderClause = orderBy ? ` ORDER BY ${orderBy} ${direction}` : '';
    return db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName}${orderClause}`
    );
  }

  /**
   * Deletes a record by ID.
   * Returns true if a record was deleted, false if it didn't exist.
   */
  async deleteById(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Counts records matching a WHERE clause.
   */
  async count(whereClause?: string, params?: SQLiteBindValue[]): Promise<number> {
    const db = getDatabase();
    const query = whereClause
      ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = await db.getFirstAsync<{ count: number }>(query, params ?? []);
    return result?.count ?? 0;
  }
}
