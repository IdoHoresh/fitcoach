/**
 * Nutrition repositories.
 * Handles CRUD for food logs, meal plans, and weekly check-ins.
 * Uses parameterized queries only.
 */

import type {
  AdherenceLevel,
  DailyNutritionSummary,
  FoodLogEntry,
  MealAdherence,
  MealPlan,
  MealPlanDay,
  MealPlanStatus,
  MealsPerDay,
  MealType,
  PlannedMeal,
  PlannedMealItem,
  SavedMeal,
  SavedMealItem,
  ServingUnit,
  WeeklyCheckIn,
} from '../types'
import { BaseRepository, generateId, nowISO } from './base-repository'
import { getDatabase } from './database'

// ── Row types ─────────────────────────────────────────────────────

interface FoodLogRow {
  id: string
  food_id: string
  name_he: string
  meal_type: string
  date: string
  serving_amount: number
  serving_unit: string
  grams_consumed: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

interface MealPlanRow {
  id: string
  start_date: string
  end_date: string
  status: string
  target_calories: number
  target_protein: number
  target_fat: number
  target_carbs: number
  meals_per_day: number
  plan_json: string
  created_at: string
}

interface PlannedMealRow {
  id: string
  plan_id: string
  day_of_week: number
  is_training_day: number
  meal_type: string
  order_index: number
  time_slot: string | null
  template_id: string | null
  items_json: string
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
}

interface WeeklyCheckInRow {
  id: string
  week_start_date: string
  week_end_date: string
  avg_weight: number
  prev_avg_weight: number | null
  weight_change: number | null
  expected_change: number
  calorie_adjustment: number
  new_target_calories: number
  coach_message: string
  coach_message_en: string
  created_at: string
}

interface DailySummaryRow {
  date: string
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
  meal_count: number
}

interface SavedMealRow {
  id: string
  name_he: string
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
}

interface SavedMealItemRow {
  id: string
  saved_meal_id: string
  food_id: string
  serving_amount: number
  serving_unit: string
  grams_consumed: number
}

// ── Row mappers ───────────────────────────────────────────────────

function rowToFoodLogEntry(row: FoodLogRow): FoodLogEntry {
  return {
    id: row.id,
    foodId: row.food_id,
    nameHe: row.name_he,
    mealType: row.meal_type as MealType,
    date: row.date,
    servingAmount: row.serving_amount,
    servingUnit: row.serving_unit as ServingUnit,
    gramsConsumed: row.grams_consumed,
    calories: row.calories,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
  }
}

function parseItemsJson(json: string): PlannedMealItem[] {
  if (!json) return []
  try {
    return JSON.parse(json) as PlannedMealItem[]
  } catch {
    throw new Error('[NutritionRepository] Failed to parse items_json — data may be corrupted')
  }
}

function parsePlanJson(json: string): MealPlanDay[] {
  if (!json) return []
  try {
    return JSON.parse(json) as MealPlanDay[]
  } catch {
    throw new Error('[NutritionRepository] Failed to parse plan_json — data may be corrupted')
  }
}

function rowToMealPlan(row: MealPlanRow): MealPlan {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as MealPlanStatus,
    targetCalories: row.target_calories,
    targetProtein: row.target_protein,
    targetFat: row.target_fat,
    targetCarbs: row.target_carbs,
    mealsPerDay: row.meals_per_day as MealsPerDay,
    days: parsePlanJson(row.plan_json),
    createdAt: row.created_at,
  }
}

function rowToPlannedMeal(row: PlannedMealRow): PlannedMeal {
  return {
    id: row.id,
    mealType: row.meal_type as MealType,
    orderIndex: row.order_index,
    timeSlot: row.time_slot,
    templateId: row.template_id,
    items: parseItemsJson(row.items_json),
    totalCalories: row.total_calories,
    totalProtein: row.total_protein,
    totalFat: row.total_fat,
    totalCarbs: row.total_carbs,
  }
}

function rowToWeeklyCheckIn(row: WeeklyCheckInRow): WeeklyCheckIn {
  return {
    id: row.id,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
    avgWeight: row.avg_weight,
    prevAvgWeight: row.prev_avg_weight,
    weightChange: row.weight_change,
    expectedChange: row.expected_change,
    calorieAdjustment: row.calorie_adjustment,
    newTargetCalories: row.new_target_calories,
    coachMessage: row.coach_message,
    coachMessageEn: row.coach_message_en,
    createdAt: row.created_at,
  }
}

function rowToDailySummary(row: DailySummaryRow): DailyNutritionSummary {
  return {
    date: row.date,
    totalCalories: row.total_calories,
    totalProtein: row.total_protein,
    totalFat: row.total_fat,
    totalCarbs: row.total_carbs,
    // Fiber not tracked at food_log level — always 0 until schema adds a fiber column
    totalFiber: 0,
    mealCount: row.meal_count,
  }
}

// ── Food Log Repository ─────────────────────────────────────────

class FoodLogRepository extends BaseRepository<FoodLogRow> {
  constructor() {
    super('food_log')
  }

  async addEntry(data: Omit<FoodLogEntry, 'id'>): Promise<FoodLogEntry> {
    const db = getDatabase()
    const id = generateId()

    await db.runAsync(
      `INSERT INTO food_log (id, food_id, name_he, meal_type, date, serving_amount, serving_unit, grams_consumed, calories, protein, fat, carbs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.foodId,
        data.nameHe,
        data.mealType,
        data.date,
        data.servingAmount,
        data.servingUnit,
        data.gramsConsumed,
        data.calories,
        data.protein,
        data.fat,
        data.carbs,
      ],
    )

    return { id, ...data }
  }

  async getEntriesByDate(date: string): Promise<FoodLogEntry[]> {
    const rows = await this.findWhere('date = ?', [date])
    return rows.map(rowToFoodLogEntry)
  }

  async getEntriesByDateRange(startDate: string, endDate: string): Promise<FoodLogEntry[]> {
    const rows = await this.findWhere('date >= ? AND date <= ?', [startDate, endDate])
    return rows.map(rowToFoodLogEntry)
  }

  async getDailySummary(date: string): Promise<DailyNutritionSummary> {
    const db = getDatabase()
    const row = await db.getFirstAsync<DailySummaryRow>(
      `SELECT
        date,
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(fat), 0) as total_fat,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COUNT(DISTINCT meal_type) as meal_count
       FROM food_log
       WHERE date = ?
       GROUP BY date`,
      [date],
    )

    if (!row) {
      return {
        date,
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalCarbs: 0,
        totalFiber: 0,
        mealCount: 0,
      }
    }

    return rowToDailySummary(row)
  }

  async getDailySummaries(startDate: string, endDate: string): Promise<DailyNutritionSummary[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<DailySummaryRow>(
      `SELECT
        date,
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(fat), 0) as total_fat,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COUNT(DISTINCT meal_type) as meal_count
       FROM food_log
       WHERE date >= ? AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [startDate, endDate],
    )

    return rows.map(rowToDailySummary)
  }

  async getWeeklyAverageCalories(startDate: string, endDate: string): Promise<number> {
    const db = getDatabase()
    const row = await db.getFirstAsync<{ avg_cal: number }>(
      `SELECT COALESCE(AVG(daily_cal), 0) as avg_cal FROM (
        SELECT SUM(calories) as daily_cal
        FROM food_log
        WHERE date >= ? AND date <= ?
        GROUP BY date
       )`,
      [startDate, endDate],
    )

    return row?.avg_cal ?? 0
  }

  /**
   * Finds the most recent prior day within `maxLookback` days of `beforeDate`
   * that has entries for the given `mealType`, and returns those entries.
   *
   * Strict `date < beforeDate` — the selectedDate itself is excluded so a user
   * looking at an empty meal today never clones from a different empty meal today.
   */
  async getPreviousMealEntries(
    mealType: MealType,
    beforeDate: string,
    maxLookback = 7,
  ): Promise<{ entries: FoodLogEntry[]; sourceDate: string } | null> {
    const db = getDatabase()
    const minDate = subtractDays(beforeDate, maxLookback)

    const rows = await db.getAllAsync<FoodLogRow>(
      `SELECT * FROM food_log
       WHERE meal_type = ? AND date < ? AND date >= ?
       ORDER BY date DESC, id ASC`,
      [mealType, beforeDate, minDate],
    )

    if (rows.length === 0) return null

    const sourceDate = rows[0].date
    const entries = rows.filter((r) => r.date === sourceDate).map(rowToFoodLogEntry)
    return { entries, sourceDate }
  }

  /**
   * Transactionally deletes the given ids. Empty input is a no-op.
   * Matches the transaction semantics of `cloneEntriesToDate` so undo is
   * all-or-nothing.
   */
  async deleteManyByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    const db = getDatabase()
    await db.withTransactionAsync(async () => {
      for (const id of ids) {
        await db.runAsync(`DELETE FROM food_log WHERE id = ?`, [id])
      }
    })
  }

  /**
   * Transactionally clones each entry into `targetDate` with fresh ids.
   * Sequential inserts preserve original order. Empty input is a no-op.
   */
  async cloneEntriesToDate(entries: FoodLogEntry[], targetDate: string): Promise<FoodLogEntry[]> {
    if (entries.length === 0) return []

    const db = getDatabase()
    const cloned: FoodLogEntry[] = []

    await db.withTransactionAsync(async () => {
      for (const entry of entries) {
        const id = generateId()
        await db.runAsync(
          `INSERT INTO food_log (id, food_id, name_he, meal_type, date, serving_amount, serving_unit, grams_consumed, calories, protein, fat, carbs)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            entry.foodId,
            entry.nameHe,
            entry.mealType,
            targetDate,
            entry.servingAmount,
            entry.servingUnit,
            entry.gramsConsumed,
            entry.calories,
            entry.protein,
            entry.fat,
            entry.carbs,
          ],
        )
        cloned.push({ ...entry, id, date: targetDate })
      }
    })

    return cloned
  }
}

// YYYY-MM-DD arithmetic — UTC-safe to avoid DST/locale off-by-one.
function subtractDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().split('T')[0]
}

// ── Meal Plan Repository ────────────────────────────────────────

class MealPlanRepository extends BaseRepository<MealPlanRow> {
  constructor() {
    super('meal_plan')
  }

  async savePlan(plan: Omit<MealPlan, 'id' | 'createdAt'>): Promise<MealPlan> {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()

    await db.withTransactionAsync(async () => {
      // Deactivate any existing active plan
      await db.runAsync(`UPDATE meal_plan SET status = 'archived' WHERE status = 'active'`, [])

      // Insert the plan
      await db.runAsync(
        `INSERT INTO meal_plan (id, start_date, end_date, status, target_calories, target_protein, target_fat, target_carbs, meals_per_day, plan_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          plan.startDate,
          plan.endDate,
          'active',
          plan.targetCalories,
          plan.targetProtein,
          plan.targetFat,
          plan.targetCarbs,
          plan.mealsPerDay,
          JSON.stringify(plan.days),
          now,
        ],
      )

      // Insert individual planned meals for querying
      for (const day of plan.days) {
        for (const meal of day.meals) {
          await db.runAsync(
            `INSERT INTO planned_meal (id, plan_id, day_of_week, is_training_day, meal_type, order_index, time_slot, template_id, items_json, total_calories, total_protein, total_fat, total_carbs)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId(),
              id,
              day.dayOfWeek,
              day.isTrainingDay ? 1 : 0,
              meal.mealType,
              meal.orderIndex,
              meal.timeSlot,
              meal.templateId,
              JSON.stringify(meal.items),
              meal.totalCalories,
              meal.totalProtein,
              meal.totalFat,
              meal.totalCarbs,
            ],
          )
        }
      }
    })

    return {
      id,
      createdAt: now,
      ...plan,
      status: 'active',
    }
  }

  async getActivePlan(): Promise<MealPlan | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<MealPlanRow>(
      `SELECT * FROM meal_plan WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [],
    )
    return row ? rowToMealPlan(row) : null
  }

  async deactivatePlan(planId: string): Promise<void> {
    const db = getDatabase()
    await db.runAsync(`UPDATE meal_plan SET status = 'archived' WHERE id = ?`, [planId])
  }

  async updatePlanMacros(
    planId: string,
    targetCalories: number,
    targetProtein: number,
    targetFat: number,
    targetCarbs: number,
  ): Promise<void> {
    const db = getDatabase()
    await db.runAsync(
      `UPDATE meal_plan SET target_calories = ?, target_protein = ?, target_fat = ?, target_carbs = ? WHERE id = ?`,
      [targetCalories, targetProtein, targetFat, targetCarbs, planId],
    )
  }

  async getPlannedMealsForDay(planId: string, dayOfWeek: number): Promise<PlannedMeal[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<PlannedMealRow>(
      `SELECT * FROM planned_meal WHERE plan_id = ? AND day_of_week = ? ORDER BY order_index ASC`,
      [planId, dayOfWeek],
    )
    return rows.map(rowToPlannedMeal)
  }
}

// ── Weekly Check-in Repository ──────────────────────────────────

class WeeklyCheckInRepository extends BaseRepository<WeeklyCheckInRow> {
  constructor() {
    super('weekly_checkin')
  }

  async saveCheckIn(data: Omit<WeeklyCheckIn, 'id' | 'createdAt'>): Promise<WeeklyCheckIn> {
    const db = getDatabase()
    const id = generateId()
    const now = nowISO()

    await db.runAsync(
      `INSERT INTO weekly_checkin (id, week_start_date, week_end_date, avg_weight, prev_avg_weight, weight_change, expected_change, calorie_adjustment, new_target_calories, coach_message, coach_message_en, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.weekStartDate,
        data.weekEndDate,
        data.avgWeight,
        data.prevAvgWeight,
        data.weightChange,
        data.expectedChange,
        data.calorieAdjustment,
        data.newTargetCalories,
        data.coachMessage,
        data.coachMessageEn,
        now,
      ],
    )

    return { id, createdAt: now, ...data }
  }

  async getLatestCheckIn(): Promise<WeeklyCheckIn | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<WeeklyCheckInRow>(
      'SELECT * FROM weekly_checkin ORDER BY created_at DESC LIMIT 1',
      [],
    )
    return row ? rowToWeeklyCheckIn(row) : null
  }

  async getRecentCheckIns(limit: number): Promise<WeeklyCheckIn[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<WeeklyCheckInRow>(
      'SELECT * FROM weekly_checkin ORDER BY created_at DESC LIMIT ?',
      [limit],
    )
    return rows.map(rowToWeeklyCheckIn)
  }

  async getCheckInByWeek(weekStartDate: string): Promise<WeeklyCheckIn | null> {
    const db = getDatabase()
    const row = await db.getFirstAsync<WeeklyCheckInRow>(
      'SELECT * FROM weekly_checkin WHERE week_start_date = ?',
      [weekStartDate],
    )
    return row ? rowToWeeklyCheckIn(row) : null
  }
}

// ── Saved Meal Repository ──────────────────────────────────────────

function rowToSavedMealItem(row: SavedMealItemRow): SavedMealItem {
  return {
    foodId: row.food_id,
    servingAmount: row.serving_amount,
    servingUnit: row.serving_unit as ServingUnit,
    gramsConsumed: row.grams_consumed,
  }
}

class SavedMealRepository extends BaseRepository<SavedMealRow> {
  constructor() {
    super('saved_meal')
  }

  async saveMeal(data: Omit<SavedMeal, 'id'>): Promise<SavedMeal> {
    const db = getDatabase()
    const id = generateId()

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO saved_meal (id, name_he, total_calories, total_protein, total_fat, total_carbs)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, data.nameHe, data.totalCalories, data.totalProtein, data.totalFat, data.totalCarbs],
      )

      for (const item of data.items) {
        await db.runAsync(
          `INSERT INTO saved_meal_item (id, saved_meal_id, food_id, serving_amount, serving_unit, grams_consumed)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [generateId(), id, item.foodId, item.servingAmount, item.servingUnit, item.gramsConsumed],
        )
      }
    })

    return { id, ...data }
  }

  async getSavedMeals(): Promise<SavedMeal[]> {
    const db = getDatabase()
    const mealRows = await db.getAllAsync<SavedMealRow>(
      'SELECT * FROM saved_meal ORDER BY name_he ASC',
      [],
    )

    const meals: SavedMeal[] = []
    for (const row of mealRows) {
      const itemRows = await db.getAllAsync<SavedMealItemRow>(
        'SELECT * FROM saved_meal_item WHERE saved_meal_id = ?',
        [row.id],
      )
      meals.push({
        id: row.id,
        nameHe: row.name_he,
        items: itemRows.map(rowToSavedMealItem),
        totalCalories: row.total_calories,
        totalProtein: row.total_protein,
        totalFat: row.total_fat,
        totalCarbs: row.total_carbs,
      })
    }

    return meals
  }

  async deleteSavedMeal(mealId: string): Promise<void> {
    const db = getDatabase()
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM saved_meal_item WHERE saved_meal_id = ?', [mealId])
      await db.runAsync('DELETE FROM saved_meal WHERE id = ?', [mealId])
    })
  }
}

// ── Meal Adherence Repository ──────────────────────────────────────

interface MealAdherenceRow {
  id: string
  date: string
  meal_type: string
  level: string
  created_at: string
}

function rowToMealAdherence(row: MealAdherenceRow): MealAdherence {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type as MealType,
    level: row.level as AdherenceLevel,
    createdAt: row.created_at,
  }
}

class MealAdherenceRepository extends BaseRepository<MealAdherenceRow> {
  constructor() {
    super('meal_adherence')
  }

  async saveAdherence(data: Omit<MealAdherence, 'id' | 'createdAt'>): Promise<MealAdherence> {
    const db = getDatabase()
    const id = generateId()
    const createdAt = nowISO()

    // UNIQUE(date, meal_type) in schema — INSERT OR REPLACE acts as upsert:
    // deletes the existing row for this date+meal_type and inserts the new one.
    await db.runAsync(
      `INSERT OR REPLACE INTO meal_adherence (id, date, meal_type, level, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.date, data.mealType, data.level, createdAt],
    )

    return { id, date: data.date, mealType: data.mealType, level: data.level, createdAt }
  }

  async getAdherenceForDate(date: string): Promise<MealAdherence[]> {
    const db = getDatabase()
    const rows = await db.getAllAsync<MealAdherenceRow>(
      'SELECT * FROM meal_adherence WHERE date = ? ORDER BY meal_type ASC',
      [date],
    )
    return rows.map(rowToMealAdherence)
  }
}

// ── Singleton exports ──────────────────────────────────────────────

export const foodLogRepository = new FoodLogRepository()
export const mealPlanRepository = new MealPlanRepository()
export const savedMealRepository = new SavedMealRepository()
export const weeklyCheckInRepository = new WeeklyCheckInRepository()
export const mealAdherenceRepository = new MealAdherenceRepository()
