/**
 * FoodRepository — SQLite-backed food database.
 *
 * Replaces the in-memory FOOD_MAP from foods.ts for food search.
 * Covers all 4,609 Tzameret foods + any user-created foods.
 *
 * SECURITY: Parameterized queries only. No string concatenation.
 */

import type { FoodCategory, FoodItem, ServingSize } from '../types'
import { BaseRepository } from './base-repository'
import { getDatabase } from './database'

// ── DB row type (snake_case columns) ─────────────────────────────────

interface FoodRow {
  id: string
  name_he: string
  name_en: string
  category: string
  calories_per_100g: number
  protein_per_100g: number
  fat_per_100g: number
  carbs_per_100g: number
  fiber_per_100g: number
  is_user_created: number
  serving_sizes_json: string
}

// ── Row → domain type mapping ─────────────────────────────────────────

function rowToFoodItem(row: FoodRow): FoodItem {
  let servingSizes: ServingSize[] = []
  try {
    const parsed = JSON.parse(row.serving_sizes_json)
    if (Array.isArray(parsed)) servingSizes = parsed as ServingSize[]
  } catch {
    // Corrupt JSON — return empty array rather than crashing
  }

  return {
    id: row.id,
    nameHe: row.name_he,
    nameEn: row.name_en,
    category: row.category as FoodCategory,
    caloriesPer100g: row.calories_per_100g,
    proteinPer100g: row.protein_per_100g,
    fatPer100g: row.fat_per_100g,
    carbsPer100g: row.carbs_per_100g,
    fiberPer100g: row.fiber_per_100g,
    isUserCreated: row.is_user_created === 1,
    servingSizes,
  }
}

// ── Repository ────────────────────────────────────────────────────────

export class FoodRepository extends BaseRepository<FoodItem> {
  constructor() {
    super('foods')
  }

  /**
   * Searches foods by Hebrew or English name (partial, case-insensitive).
   * Empty/whitespace query returns up to `limit` foods without filtering.
   */
  async search(query: string, limit = 50): Promise<FoodItem[]> {
    const db = getDatabase()
    const q = query.trim()
    const containsPattern = `%${q}%`
    const startsWithPattern = `${q}%`

    const rows = await db.getAllAsync<FoodRow>(
      `SELECT * FROM foods
       WHERE name_he LIKE ? OR name_en LIKE ?
       ORDER BY
         CASE WHEN name_he LIKE ? THEN 0 ELSE 1 END,
         name_he ASC
       LIMIT ?`,
      [containsPattern, containsPattern, startsWithPattern, limit],
    )

    return rows.map(rowToFoodItem)
  }

  /**
   * Looks up a single food by ID.
   * Returns null if not found.
   */
  async getById(id: string): Promise<FoodItem | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<FoodRow>(`SELECT * FROM foods WHERE id = ?`, [id])
    return row ? rowToFoodItem(row) : null
  }

  /**
   * Returns foods in a specific category, ordered alphabetically.
   */
  async getByCategory(category: FoodCategory, limit = 50): Promise<FoodItem[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<FoodRow>(
      `SELECT * FROM foods WHERE category = ? ORDER BY name_he ASC LIMIT ?`,
      [category, limit],
    )
    return rows.map(rowToFoodItem)
  }

  /**
   * Returns the most recently logged foods (distinct, newest first).
   * Used to show "recent foods" at the top of food search.
   */
  async getRecent(limit = 15): Promise<FoodItem[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<FoodRow>(
      `SELECT f.*
       FROM foods f
       INNER JOIN (
         SELECT food_id, MAX(date) as last_logged
         FROM food_log
         GROUP BY food_id
         ORDER BY last_logged DESC
         LIMIT ?
       ) recent ON f.id = recent.food_id`,
      [limit],
    )
    return rows.map(rowToFoodItem)
  }
}

export const foodRepository = new FoodRepository()
