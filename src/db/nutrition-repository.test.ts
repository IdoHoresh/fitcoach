import type { FoodLogEntry, MealPlan, SavedMeal, WeeklyCheckIn } from '../types'
import {
  foodLogRepository,
  mealPlanRepository,
  savedMealRepository,
  weeklyCheckInRepository,
} from './nutrition-repository'

// ── Mock the database ─────────────────────────────────────────────

const mockRunAsync = jest.fn()
const mockGetFirstAsync = jest.fn()
const mockGetAllAsync = jest.fn()
const mockWithTransactionAsync = jest.fn((fn: () => Promise<void>) => fn())

jest.mock('./database', () => ({
  getDatabase: () => ({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: mockGetAllAsync,
    withTransactionAsync: mockWithTransactionAsync,
  }),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2, 8),
}))

// ── Test fixtures ─────────────────────────────────────────────────

const MOCK_FOOD_LOG_ENTRY: Omit<FoodLogEntry, 'id'> = {
  foodId: 'food_002',
  nameHe: 'חזה עוף בגריל',
  mealType: 'lunch',
  date: '2026-04-07',
  servingAmount: 1,
  servingUnit: 'piece',
  gramsConsumed: 170,
  calories: 281,
  protein: 53,
  fat: 6,
  carbs: 0,
}

const MOCK_MEAL_PLAN: Omit<MealPlan, 'id' | 'createdAt'> = {
  startDate: '2026-04-07',
  endDate: '2026-04-13',
  status: 'active',
  targetCalories: 2300,
  targetProtein: 200,
  targetFat: 90,
  targetCarbs: 170,
  mealsPerDay: 4,
  days: [
    {
      dayOfWeek: 0,
      isTrainingDay: true,
      meals: [
        {
          id: 'meal-1',
          mealType: 'breakfast',
          orderIndex: 1,
          timeSlot: '08:00',
          templateId: 'tmpl_001',
          items: [
            {
              foodId: 'food_006',
              servingAmount: 2,
              servingUnit: 'piece',
              gramsConsumed: 100,
              calories: 155,
              protein: 13,
              fat: 11,
              carbs: 1,
            },
          ],
          totalCalories: 155,
          totalProtein: 13,
          totalFat: 11,
          totalCarbs: 1,
        },
      ],
      totalCalories: 155,
      totalProtein: 13,
      totalFat: 11,
      totalCarbs: 1,
    },
  ],
}

const MOCK_SAVED_MEAL: Omit<SavedMeal, 'id'> = {
  nameHe: 'ארוחת הבוקר שלי',
  items: [
    { foodId: 'food_006', servingAmount: 2, servingUnit: 'piece', gramsConsumed: 100 },
    { foodId: 'food_015', servingAmount: 1, servingUnit: 'serving', gramsConsumed: 150 },
  ],
  totalCalories: 435,
  totalProtein: 28,
  totalFat: 19,
  totalCarbs: 39,
}

const MOCK_CHECKIN: Omit<WeeklyCheckIn, 'id' | 'createdAt'> = {
  weekStartDate: '2026-04-01',
  weekEndDate: '2026-04-07',
  avgWeight: 112.5,
  prevAvgWeight: 113.0,
  weightChange: -0.5,
  expectedChange: -0.5,
  calorieAdjustment: 0,
  newTargetCalories: 2300,
  coachMessage: 'אתה בדיוק על המסלול! המשך ככה.',
  coachMessageEn: "You're right on track! Keep doing what you're doing.",
}

// ── Helpers ───────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════
// FOOD LOG REPOSITORY
// ═══════════════════════════════════════════════════════════════════

describe('FoodLogRepository', () => {
  describe('addEntry', () => {
    it('should insert a food log entry and return it with an ID', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      const result = await foodLogRepository.addEntry(MOCK_FOOD_LOG_ENTRY)

      expect(result.id).toBeDefined()
      expect(result.foodId).toBe('food_002')
      expect(result.calories).toBe(281)
      expect(result.protein).toBe(53)
      expect(mockRunAsync).toHaveBeenCalledTimes(1)
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO food_log'),
        expect.arrayContaining([result.id, 'food_002', 'lunch', '2026-04-07']),
      )
    })
  })

  describe('getEntriesByDate', () => {
    it('should return food log entries for a specific date', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        {
          id: 'entry-1',
          food_id: 'food_002',
          name_he: 'חזה עוף בגריל',
          meal_type: 'lunch',
          date: '2026-04-07',
          serving_amount: 1,
          serving_unit: 'piece',
          grams_consumed: 170,
          calories: 281,
          protein: 53,
          fat: 6,
          carbs: 0,
        },
      ])

      const result = await foodLogRepository.getEntriesByDate('2026-04-07')

      expect(result).toHaveLength(1)
      expect(result[0].foodId).toBe('food_002')
      expect(result[0].mealType).toBe('lunch')
      expect(result[0].calories).toBe(281)
    })

    it('should return empty array when no entries exist', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await foodLogRepository.getEntriesByDate('2026-04-07')

      expect(result).toHaveLength(0)
    })
  })

  describe('getEntriesByDateRange', () => {
    it('should return entries within date range', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        {
          id: 'e1',
          food_id: 'food_002',
          meal_type: 'lunch',
          date: '2026-04-07',
          serving_amount: 1,
          serving_unit: 'piece',
          grams_consumed: 170,
          calories: 281,
          protein: 53,
          fat: 6,
          carbs: 0,
        },
        {
          id: 'e2',
          food_id: 'food_023',
          meal_type: 'dinner',
          date: '2026-04-08',
          serving_amount: 1,
          serving_unit: 'cup',
          grams_consumed: 185,
          calories: 241,
          protein: 5,
          fat: 1,
          carbs: 52,
        },
      ])

      const result = await foodLogRepository.getEntriesByDateRange('2026-04-07', '2026-04-08')

      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-04-07')
      expect(result[1].date).toBe('2026-04-08')
    })

    it('should return empty array when no entries exist in range', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await foodLogRepository.getEntriesByDateRange('2026-04-07', '2026-04-08')

      expect(result).toHaveLength(0)
    })
  })

  describe('getDailySummary', () => {
    it('should return aggregated daily summary', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        date: '2026-04-07',
        total_calories: 2100,
        total_protein: 180,
        total_fat: 85,
        total_carbs: 160,
        meal_count: 4,
      })

      const result = await foodLogRepository.getDailySummary('2026-04-07')

      expect(result.totalCalories).toBe(2100)
      expect(result.totalProtein).toBe(180)
      expect(result.totalFat).toBe(85)
      expect(result.totalCarbs).toBe(160)
      expect(result.mealCount).toBe(4)
    })

    it('should return zero summary when no entries exist', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await foodLogRepository.getDailySummary('2026-04-07')

      expect(result.totalCalories).toBe(0)
      expect(result.totalProtein).toBe(0)
      expect(result.mealCount).toBe(0)
      expect(result.date).toBe('2026-04-07')
    })
  })

  describe('getDailySummaries', () => {
    it('should return summaries for a date range', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        {
          date: '2026-04-07',
          total_calories: 2100,
          total_protein: 180,
          total_fat: 85,
          total_carbs: 160,
          meal_count: 4,
        },
        {
          date: '2026-04-08',
          total_calories: 2200,
          total_protein: 190,
          total_fat: 90,
          total_carbs: 165,
          meal_count: 5,
        },
      ])

      const result = await foodLogRepository.getDailySummaries('2026-04-07', '2026-04-08')

      expect(result).toHaveLength(2)
      expect(result[0].totalCalories).toBe(2100)
      expect(result[1].totalCalories).toBe(2200)
    })

    it('should return empty array when no entries exist in range', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await foodLogRepository.getDailySummaries('2026-04-07', '2026-04-08')

      expect(result).toHaveLength(0)
    })
  })

  describe('getWeeklyAverageCalories', () => {
    it('should return average daily calories for a week', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({ avg_cal: 2150 })

      const result = await foodLogRepository.getWeeklyAverageCalories('2026-04-01', '2026-04-07')

      expect(result).toBe(2150)
    })

    it('should return 0 when no data exists', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await foodLogRepository.getWeeklyAverageCalories('2026-04-01', '2026-04-07')

      expect(result).toBe(0)
    })
  })

  describe('deleteById', () => {
    it('should delete a food log entry', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      const result = await foodLogRepository.deleteById('entry-1')

      expect(result).toBe(true)
      expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM food_log'), [
        'entry-1',
      ])
    })

    it('should return false when entry does not exist', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 0 })

      const result = await foodLogRepository.deleteById('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('getPreviousMealEntries', () => {
    const makeRow = (overrides: Partial<{ id: string; date: string; meal_type: string }>) => ({
      id: overrides.id ?? 'row-1',
      food_id: 'food_002',
      name_he: 'חזה עוף בגריל',
      meal_type: overrides.meal_type ?? 'breakfast',
      date: overrides.date ?? '2026-04-22',
      serving_amount: 1,
      serving_unit: 'piece',
      grams_consumed: 170,
      calories: 281,
      protein: 53,
      fat: 6,
      carbs: 0,
    })

    it('returns the most recent prior day with entries and groups them', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        makeRow({ id: 'r1', date: '2026-04-22' }),
        makeRow({ id: 'r2', date: '2026-04-22' }),
        makeRow({ id: 'r3', date: '2026-04-20' }),
      ])

      const result = await foodLogRepository.getPreviousMealEntries('breakfast', '2026-04-23', 7)

      expect(result).not.toBeNull()
      expect(result!.sourceDate).toBe('2026-04-22')
      expect(result!.entries).toHaveLength(2)
      expect(result!.entries.map((e) => e.id)).toEqual(['r1', 'r2'])
    })

    it('returns null when no prior entries exist in the window', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await foodLogRepository.getPreviousMealEntries('breakfast', '2026-04-23', 7)

      expect(result).toBeNull()
    })

    it('excludes the selectedDate itself (strict <, not <=)', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await foodLogRepository.getPreviousMealEntries('lunch', '2026-04-23', 7)

      const [sql, params] = mockGetAllAsync.mock.calls[0] as [string, unknown[]]
      expect(sql).toMatch(/date\s*<\s*\?/)
      expect(sql).not.toMatch(/date\s*<=\s*\?/)
      expect(params).toContain('2026-04-23')
    })

    it('bounds the window at exactly maxLookback days before the selectedDate', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await foodLogRepository.getPreviousMealEntries('breakfast', '2026-04-23', 7)

      const [, params] = mockGetAllAsync.mock.calls[0] as [string, unknown[]]
      // 7 days before 2026-04-23 = 2026-04-16 (inclusive lower bound)
      expect(params).toContain('2026-04-16')
    })

    it('filters by mealType in the SQL query', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await foodLogRepository.getPreviousMealEntries('dinner', '2026-04-23', 7)

      const [sql, params] = mockGetAllAsync.mock.calls[0] as [string, unknown[]]
      expect(sql).toMatch(/meal_type\s*=\s*\?/)
      expect(params).toContain('dinner')
    })
  })

  describe('cloneEntriesToDate', () => {
    const makeEntry = (overrides: Partial<FoodLogEntry>): FoodLogEntry => ({
      id: 'old-1',
      foodId: 'food_002',
      nameHe: 'חזה עוף בגריל',
      mealType: 'breakfast',
      date: '2026-04-22',
      servingAmount: 1,
      servingUnit: 'piece',
      gramsConsumed: 170,
      calories: 281,
      protein: 53,
      fat: 6,
      carbs: 0,
      ...overrides,
    })

    it('inserts each entry in a transaction with a fresh id and the target date', async () => {
      const entries = [
        makeEntry({ id: 'old-1' }),
        makeEntry({ id: 'old-2', foodId: 'food_023', gramsConsumed: 200 }),
      ]

      const cloned = await foodLogRepository.cloneEntriesToDate(entries, '2026-04-23')

      expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
      expect(mockRunAsync).toHaveBeenCalledTimes(2)
      expect(cloned).toHaveLength(2)
      expect(cloned[0].id).not.toBe('old-1')
      expect(cloned[1].id).not.toBe('old-2')
      expect(cloned[0].date).toBe('2026-04-23')
      expect(cloned[1].date).toBe('2026-04-23')
      expect(cloned[0].foodId).toBe('food_002')
      expect(cloned[1].foodId).toBe('food_023')
      expect(cloned[1].gramsConsumed).toBe(200)
    })

    it('returns empty array and does not open a transaction for empty input', async () => {
      const result = await foodLogRepository.cloneEntriesToDate([], '2026-04-23')

      expect(result).toEqual([])
      expect(mockWithTransactionAsync).not.toHaveBeenCalled()
      expect(mockRunAsync).not.toHaveBeenCalled()
    })

    it('uses parameterized INSERT (? placeholders, no concatenation)', async () => {
      await foodLogRepository.cloneEntriesToDate([makeEntry({ id: 'old-1' })], '2026-04-23')

      const [sql] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(sql).toMatch(/INSERT INTO food_log/)
      expect(sql).toMatch(/\?/)
      expect(sql).not.toMatch(/'2026-04-23'/) // no string-concat dates
    })
  })

  describe('deleteManyByIds', () => {
    it('deletes each id inside a single transaction', async () => {
      await foodLogRepository.deleteManyByIds(['a', 'b', 'c'])

      expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
      expect(mockRunAsync).toHaveBeenCalledTimes(3)
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('DELETE FROM food_log'),
        ['a'],
      )
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('DELETE FROM food_log'),
        ['c'],
      )
    })

    it('is a no-op for empty input (no transaction opened)', async () => {
      await foodLogRepository.deleteManyByIds([])

      expect(mockWithTransactionAsync).not.toHaveBeenCalled()
      expect(mockRunAsync).not.toHaveBeenCalled()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// MEAL PLAN REPOSITORY
// ═══════════════════════════════════════════════════════════════════

describe('MealPlanRepository', () => {
  describe('savePlan', () => {
    it('should save a meal plan with transaction', async () => {
      const result = await mealPlanRepository.savePlan(MOCK_MEAL_PLAN)

      expect(result.id).toBeDefined()
      expect(result.status).toBe('active')
      expect(result.targetCalories).toBe(2300)
      expect(result.mealsPerDay).toBe(4)
      expect(result.createdAt).toBeDefined()
      expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
    })

    it('should deactivate existing active plans before saving', async () => {
      await mealPlanRepository.savePlan(MOCK_MEAL_PLAN)

      const archiveCalls = mockRunAsync.mock.calls.filter((call: string[]) =>
        call[0].includes("UPDATE meal_plan SET status = 'archived'"),
      )
      const insertPlanCalls = mockRunAsync.mock.calls.filter((call: string[]) =>
        call[0].includes('INSERT INTO meal_plan'),
      )
      expect(archiveCalls).toHaveLength(1)
      expect(insertPlanCalls).toHaveLength(1)
    })

    it('should insert planned meals for each meal in each day', async () => {
      await mealPlanRepository.savePlan(MOCK_MEAL_PLAN)

      const plannedMealCalls = mockRunAsync.mock.calls.filter((call: string[]) =>
        call[0].includes('INSERT INTO planned_meal'),
      )
      // MOCK_MEAL_PLAN has 1 day × 1 meal = 1 planned meal insert
      expect(plannedMealCalls).toHaveLength(1)
    })

    it('should insert planned meals for multi-day plans', async () => {
      const multiDayPlan: Omit<MealPlan, 'id' | 'createdAt'> = {
        ...MOCK_MEAL_PLAN,
        days: [
          MOCK_MEAL_PLAN.days[0],
          {
            dayOfWeek: 2,
            isTrainingDay: false,
            meals: [
              {
                id: 'meal-2',
                mealType: 'lunch',
                orderIndex: 1,
                timeSlot: '13:00',
                templateId: 'tmpl_005',
                items: [],
                totalCalories: 600,
                totalProtein: 50,
                totalFat: 20,
                totalCarbs: 55,
              },
              {
                id: 'meal-3',
                mealType: 'dinner',
                orderIndex: 2,
                timeSlot: '19:00',
                templateId: 'tmpl_009',
                items: [],
                totalCalories: 550,
                totalProtein: 40,
                totalFat: 25,
                totalCarbs: 40,
              },
            ],
            totalCalories: 1150,
            totalProtein: 90,
            totalFat: 45,
            totalCarbs: 95,
          },
        ],
      }

      await mealPlanRepository.savePlan(multiDayPlan)

      const plannedMealCalls = mockRunAsync.mock.calls.filter((call: string[]) =>
        call[0].includes('INSERT INTO planned_meal'),
      )
      // 2 days: day 0 has 1 meal, day 2 has 2 meals = 3 planned meal inserts
      expect(plannedMealCalls).toHaveLength(3)
    })
  })

  describe('getActivePlan', () => {
    it('should return the active meal plan', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 'plan-1',
        start_date: '2026-04-07',
        end_date: '2026-04-13',
        status: 'active',
        target_calories: 2300,
        target_protein: 200,
        target_fat: 90,
        target_carbs: 170,
        meals_per_day: 4,
        plan_json: JSON.stringify(MOCK_MEAL_PLAN.days),
        created_at: '2026-04-07T08:00:00.000Z',
      })

      const result = await mealPlanRepository.getActivePlan()

      expect(result).not.toBeNull()
      expect(result!.id).toBe('plan-1')
      expect(result!.targetCalories).toBe(2300)
      expect(result!.days).toHaveLength(1)
      expect(result!.days[0].isTrainingDay).toBe(true)
    })

    it('should return null when no active plan exists', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await mealPlanRepository.getActivePlan()

      expect(result).toBeNull()
    })
  })

  describe('deactivatePlan', () => {
    it('should set plan status to archived', async () => {
      await mealPlanRepository.deactivatePlan('plan-1')

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'archived'"),
        ['plan-1'],
      )
    })
  })

  describe('updatePlanMacros', () => {
    it('should update target macros for a plan', async () => {
      await mealPlanRepository.updatePlanMacros('plan-1', 2150, 200, 85, 155)

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meal_plan SET target_calories'),
        [2150, 200, 85, 155, 'plan-1'],
      )
    })
  })

  describe('getPlannedMealsForDay', () => {
    it('should return planned meals for a specific day', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        {
          id: 'pm-1',
          plan_id: 'plan-1',
          day_of_week: 0,
          is_training_day: 1,
          meal_type: 'breakfast',
          order_index: 1,
          time_slot: '08:00',
          template_id: 'tmpl_001',
          items_json: JSON.stringify([
            {
              foodId: 'food_006',
              servingAmount: 2,
              servingUnit: 'piece',
              gramsConsumed: 100,
              calories: 155,
              protein: 13,
              fat: 11,
              carbs: 1,
            },
          ]),
          total_calories: 155,
          total_protein: 13,
          total_fat: 11,
          total_carbs: 1,
        },
      ])

      const result = await mealPlanRepository.getPlannedMealsForDay('plan-1', 0)

      expect(result).toHaveLength(1)
      expect(result[0].mealType).toBe('breakfast')
      expect(result[0].items).toHaveLength(1)
      expect(result[0].items[0].foodId).toBe('food_006')
    })

    it('should return empty array for rest day', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await mealPlanRepository.getPlannedMealsForDay('plan-1', 1)

      expect(result).toHaveLength(0)
    })
  })

  describe('JSON parsing', () => {
    it('should throw on corrupted plan_json', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 'plan-1',
        start_date: '2026-04-07',
        end_date: '2026-04-13',
        status: 'active',
        target_calories: 2300,
        target_protein: 200,
        target_fat: 90,
        target_carbs: 170,
        meals_per_day: 4,
        plan_json: '{corrupted json',
        created_at: '2026-04-07T08:00:00.000Z',
      })

      await expect(mealPlanRepository.getActivePlan()).rejects.toThrow('Failed to parse plan_json')
    })

    it('should throw on corrupted items_json', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        {
          id: 'pm-1',
          plan_id: 'plan-1',
          day_of_week: 0,
          is_training_day: 0,
          meal_type: 'breakfast',
          order_index: 1,
          time_slot: null,
          template_id: null,
          items_json: 'not-json',
          total_calories: 0,
          total_protein: 0,
          total_fat: 0,
          total_carbs: 0,
        },
      ])

      await expect(mealPlanRepository.getPlannedMealsForDay('plan-1', 0)).rejects.toThrow(
        'Failed to parse items_json',
      )
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// WEEKLY CHECK-IN REPOSITORY
// ═══════════════════════════════════════════════════════════════════

describe('WeeklyCheckInRepository', () => {
  describe('saveCheckIn', () => {
    it('should save a weekly check-in and return it with ID', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      const result = await weeklyCheckInRepository.saveCheckIn(MOCK_CHECKIN)

      expect(result.id).toBeDefined()
      expect(result.avgWeight).toBe(112.5)
      expect(result.weightChange).toBe(-0.5)
      expect(result.coachMessage).toContain('על המסלול')
      expect(result.createdAt).toBeDefined()
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO weekly_checkin'),
        expect.arrayContaining([result.id]),
      )
    })
  })

  describe('getLatestCheckIn', () => {
    it('should return the most recent check-in', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 'ci-1',
        week_start_date: '2026-04-01',
        week_end_date: '2026-04-07',
        avg_weight: 112.5,
        prev_avg_weight: 113.0,
        weight_change: -0.5,
        expected_change: -0.5,
        calorie_adjustment: 0,
        new_target_calories: 2300,
        coach_message: 'On track',
        coach_message_en: 'On track',
        created_at: '2026-04-07T20:00:00.000Z',
      })

      const result = await weeklyCheckInRepository.getLatestCheckIn()

      expect(result).not.toBeNull()
      expect(result!.avgWeight).toBe(112.5)
      expect(result!.prevAvgWeight).toBe(113.0)
      expect(result!.weightChange).toBe(-0.5)
    })

    it('should return null when no check-ins exist', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await weeklyCheckInRepository.getLatestCheckIn()

      expect(result).toBeNull()
    })
  })

  describe('getRecentCheckIns', () => {
    it('should return recent check-ins ordered by date', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        {
          id: 'ci-2',
          week_start_date: '2026-04-08',
          week_end_date: '2026-04-14',
          avg_weight: 112.0,
          prev_avg_weight: 112.5,
          weight_change: -0.5,
          expected_change: -0.5,
          calorie_adjustment: 0,
          new_target_calories: 2300,
          coach_message: 'Great',
          coach_message_en: 'Great',
          created_at: '2026-04-14T20:00:00.000Z',
        },
        {
          id: 'ci-1',
          week_start_date: '2026-04-01',
          week_end_date: '2026-04-07',
          avg_weight: 112.5,
          prev_avg_weight: 113.0,
          weight_change: -0.5,
          expected_change: -0.5,
          calorie_adjustment: 0,
          new_target_calories: 2300,
          coach_message: 'Good',
          coach_message_en: 'Good',
          created_at: '2026-04-07T20:00:00.000Z',
        },
      ])

      const result = await weeklyCheckInRepository.getRecentCheckIns(5)

      expect(result).toHaveLength(2)
      expect(result[0].weekStartDate).toBe('2026-04-08')
      expect(result[1].weekStartDate).toBe('2026-04-01')
    })

    it('should return empty array when no check-ins exist', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await weeklyCheckInRepository.getRecentCheckIns(5)

      expect(result).toHaveLength(0)
    })
  })

  describe('getCheckInByWeek', () => {
    it('should return check-in for a specific week', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 'ci-1',
        week_start_date: '2026-04-01',
        week_end_date: '2026-04-07',
        avg_weight: 112.5,
        prev_avg_weight: 113.0,
        weight_change: -0.5,
        expected_change: -0.5,
        calorie_adjustment: 0,
        new_target_calories: 2300,
        coach_message: 'Good',
        coach_message_en: 'Good',
        created_at: '2026-04-07T20:00:00.000Z',
      })

      const result = await weeklyCheckInRepository.getCheckInByWeek('2026-04-01')

      expect(result).not.toBeNull()
      expect(result!.weekStartDate).toBe('2026-04-01')
    })

    it('should return null for a week with no check-in', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await weeklyCheckInRepository.getCheckInByWeek('2026-05-01')

      expect(result).toBeNull()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// SAVED MEAL REPOSITORY
// ═══════════════════════════════════════════════════════════════════

describe('SavedMealRepository', () => {
  describe('saveMeal', () => {
    it('should save a meal with items in a transaction and return it with ID', async () => {
      const result = await savedMealRepository.saveMeal(MOCK_SAVED_MEAL)

      expect(result.id).toBeDefined()
      expect(result.nameHe).toBe('ארוחת הבוקר שלי')
      expect(result.totalCalories).toBe(435)
      expect(result.items).toHaveLength(2)
      expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)

      // Should insert saved_meal row (but not saved_meal_item)
      const mealInserts = mockRunAsync.mock.calls.filter(
        (call: string[]) =>
          call[0].includes('INSERT INTO saved_meal') &&
          !call[0].includes('INSERT INTO saved_meal_item'),
      )
      expect(mealInserts).toHaveLength(1)

      // Should insert 2 saved_meal_item rows
      const itemInserts = mockRunAsync.mock.calls.filter((call: string[]) =>
        call[0].includes('INSERT INTO saved_meal_item'),
      )
      expect(itemInserts).toHaveLength(2)
    })
  })

  describe('getSavedMeals', () => {
    it('should return all saved meals with their items', async () => {
      // First call: get all saved meals
      mockGetAllAsync
        .mockResolvedValueOnce([
          {
            id: 'sm-1',
            name_he: 'ארוחת הבוקר שלי',
            total_calories: 435,
            total_protein: 28,
            total_fat: 19,
            total_carbs: 39,
          },
        ])
        // Second call: get items for sm-1
        .mockResolvedValueOnce([
          {
            id: 'smi-1',
            saved_meal_id: 'sm-1',
            food_id: 'food_006',
            serving_amount: 2,
            serving_unit: 'piece',
            grams_consumed: 100,
          },
          {
            id: 'smi-2',
            saved_meal_id: 'sm-1',
            food_id: 'food_015',
            serving_amount: 1,
            serving_unit: 'serving',
            grams_consumed: 150,
          },
        ])

      const result = await savedMealRepository.getSavedMeals()

      expect(result).toHaveLength(1)
      expect(result[0].nameHe).toBe('ארוחת הבוקר שלי')
      expect(result[0].items).toHaveLength(2)
      expect(result[0].items[0].foodId).toBe('food_006')
      expect(result[0].items[1].foodId).toBe('food_015')
    })

    it('should return empty array when no saved meals exist', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      const result = await savedMealRepository.getSavedMeals()

      expect(result).toHaveLength(0)
    })
  })

  describe('deleteSavedMeal', () => {
    it('should delete items first then meal in a transaction', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 })

      await savedMealRepository.deleteSavedMeal('sm-1')

      expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)

      // Should delete items first, then meal
      const deleteCalls = mockRunAsync.mock.calls.filter(
        (call: string[]) =>
          call[0].includes('DELETE FROM saved_meal_item') ||
          call[0].includes('DELETE FROM saved_meal WHERE'),
      )
      expect(deleteCalls).toHaveLength(2)

      // Items deleted first
      expect(deleteCalls[0][0]).toContain('saved_meal_item')
      expect(deleteCalls[0][1]).toEqual(['sm-1'])
      // Then meal
      expect(deleteCalls[1][0]).toContain('DELETE FROM saved_meal WHERE')
      expect(deleteCalls[1][1]).toEqual(['sm-1'])
    })
  })
})
