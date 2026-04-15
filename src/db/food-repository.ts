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
import { normalizeNameForDedup } from '../shared/normalizeFoodName'

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
         CASE
           WHEN id LIKE 'raw_%'    THEN 0
           WHEN id LIKE 'manual_%' THEN 1
           WHEN id LIKE 'sh_%'     THEN 2
           WHEN id LIKE 'rl_%'     THEN 3
           ELSE 4
         END,
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

  /**
   * Looks up a food by EAN barcode across all source tiers.
   * Checks raw_, manual_, sh_, rl_ prefixes and returns the highest-tier match.
   * Returns null if no tier has the barcode.
   */
  async getByBarcode(ean: string): Promise<FoodItem | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<FoodRow>(
      `SELECT * FROM foods
       WHERE id IN (?, ?, ?, ?)
       ORDER BY CASE
         WHEN id LIKE 'raw_%'    THEN 1
         WHEN id LIKE 'manual_%' THEN 2
         WHEN id LIKE 'sh_%'     THEN 3
         ELSE                         4
       END
       LIMIT 1`,
      [`raw_${ean}`, `manual_${ean}`, `sh_${ean}`, `rl_${ean}`],
    )
    return row ? rowToFoodItem(row) : null
  }

  /**
   * Inserts or replaces a food in the database.
   * Used to persist Open Food Facts results as manual_<ean> entries.
   */
  async insertFood(food: FoodItem): Promise<void> {
    const db = getDatabase()
    await db.runAsync(
      `INSERT OR REPLACE INTO foods
         (id, name_he, name_en, category,
          calories_per_100g, protein_per_100g, fat_per_100g,
          carbs_per_100g, fiber_per_100g,
          is_user_created, serving_sizes_json, name_norm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        food.id,
        food.nameHe,
        food.nameEn,
        food.category,
        food.caloriesPer100g,
        food.proteinPer100g,
        food.fatPer100g,
        food.carbsPer100g,
        food.fiberPer100g,
        food.isUserCreated ? 1 : 0,
        JSON.stringify(food.servingSizes),
        normalizeNameForDedup(food.nameHe),
      ],
    )
  }
}

export const foodRepository = new FoodRepository()
