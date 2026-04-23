import type {
  BodyMeasurement,
  DailyNutritionSummary,
  DayOfWeek,
  FoodLogEntry,
  MealPlan,
  MealPlanDay,
  RecalibrationResult,
  SavedMeal,
  WeeklyCheckIn,
} from '../types'
import { useNutritionStore } from './useNutritionStore'

// ── Mock dependencies ─────────────────────────────────────────────

// Food log repository
const mockAddEntry = jest.fn()
const mockGetEntriesByDate = jest.fn()
const mockGetDailySummary = jest.fn()
const mockGetDailySummaries = jest.fn()
const mockGetWeeklyAverageCalories = jest.fn()
const mockDeleteById = jest.fn()
const mockDeleteManyByIds = jest.fn()
const mockGetPreviousMealEntries = jest.fn()
const mockCloneEntriesToDate = jest.fn()

// Meal plan repository
const mockSavePlan = jest.fn()
const mockGetActivePlan = jest.fn()
const mockDeactivatePlan = jest.fn()
const mockUpdatePlanMacros = jest.fn()

// Saved meal repository
const mockSaveMeal = jest.fn()
const mockGetSavedMeals = jest.fn()
const mockDeleteSavedMeal = jest.fn()

// Weekly check-in repository
const mockSaveCheckIn = jest.fn()
const mockGetLatestCheckIn = jest.fn()
const mockGetRecentCheckIns = jest.fn()

// Measurement repository (weight)
const mockAddMeasurement = jest.fn()
const mockGetMeasurementsByDateRange = jest.fn()
const mockGetWeeklyAverageWeight = jest.fn()

// Food repository (for logSavedMeal)
const mockGetById = jest.fn()

jest.mock('../db', () => ({
  foodRepository: {
    getById: (...args: unknown[]) => mockGetById(...args),
  },
  foodLogRepository: {
    addEntry: (...args: unknown[]) => mockAddEntry(...args),
    getEntriesByDate: (...args: unknown[]) => mockGetEntriesByDate(...args),
    getDailySummary: (...args: unknown[]) => mockGetDailySummary(...args),
    getDailySummaries: (...args: unknown[]) => mockGetDailySummaries(...args),
    getWeeklyAverageCalories: (...args: unknown[]) => mockGetWeeklyAverageCalories(...args),
    deleteById: (...args: unknown[]) => mockDeleteById(...args),
    deleteManyByIds: (...args: unknown[]) => mockDeleteManyByIds(...args),
    getPreviousMealEntries: (...args: unknown[]) => mockGetPreviousMealEntries(...args),
    cloneEntriesToDate: (...args: unknown[]) => mockCloneEntriesToDate(...args),
  },
  mealPlanRepository: {
    savePlan: (...args: unknown[]) => mockSavePlan(...args),
    getActivePlan: () => mockGetActivePlan(),
    deactivatePlan: (...args: unknown[]) => mockDeactivatePlan(...args),
    updatePlanMacros: (...args: unknown[]) => mockUpdatePlanMacros(...args),
  },
  savedMealRepository: {
    saveMeal: (...args: unknown[]) => mockSaveMeal(...args),
    getSavedMeals: () => mockGetSavedMeals(),
    deleteSavedMeal: (...args: unknown[]) => mockDeleteSavedMeal(...args),
  },
  weeklyCheckInRepository: {
    saveCheckIn: (...args: unknown[]) => mockSaveCheckIn(...args),
    getLatestCheckIn: () => mockGetLatestCheckIn(),
    getRecentCheckIns: (...args: unknown[]) => mockGetRecentCheckIns(...args),
  },
  measurementRepository: {
    addMeasurement: (...args: unknown[]) => mockAddMeasurement(...args),
    getMeasurementsByDateRange: (...args: unknown[]) => mockGetMeasurementsByDateRange(...args),
    getWeeklyAverageWeight: (...args: unknown[]) => mockGetWeeklyAverageWeight(...args),
  },
  todayISO: () => '2026-04-07',
  nowISO: () => '2026-04-07T09:00:00Z',
}))

// Mock algorithms
const mockGenerateWeeklyMealPlan = jest.fn()
const mockCalculateNutritionTargets = jest.fn()
const mockRecalibrate = jest.fn()

jest.mock('../algorithms/meal-plan-generator', () => ({
  generateWeeklyMealPlan: (...args: unknown[]) => mockGenerateWeeklyMealPlan(...args),
}))

jest.mock('../algorithms/macro-calculator', () => ({
  calculateNutritionTargets: (...args: unknown[]) => mockCalculateNutritionTargets(...args),
}))

jest.mock('../algorithms/weekly-recalibration', () => ({
  recalibrate: (...args: unknown[]) => mockRecalibrate(...args),
}))

jest.mock('../i18n', () => ({
  he: {
    recalibration: {
      stay_course: 'אתה בדיוק במסלול!',
      log_more: 'אין מספיק נתונים',
    },
  },
  en: {
    recalibration: {
      stay_course: "You're right on track!",
      log_more: 'Not enough data',
    },
  },
}))

// Mock food data (for logSavedMeal macro computation)
jest.mock('../data/foods', () => ({
  FOOD_MAP: new Map([
    [
      'food_006',
      {
        id: 'food_006',
        nameHe: 'ביצה',
        nameEn: 'Egg',
        caloriesPer100g: 155,
        proteinPer100g: 13,
        fatPer100g: 11,
        carbsPer100g: 1,
        fiberPer100g: 0,
      },
    ],
    [
      'food_015',
      {
        id: 'food_015',
        nameHe: 'סלט ישראלי',
        nameEn: 'Israeli Salad',
        caloriesPer100g: 60,
        proteinPer100g: 1.5,
        fatPer100g: 3,
        carbsPer100g: 7,
        fiberPer100g: 2,
      },
    ],
  ]),
}))

// Mock cross-store access
const MOCK_PROFILE = {
  id: 'user-123',
  heightCm: 175,
  weightKg: 80,
  age: 28,
  sex: 'male' as const,
  bodyFatPercent: 18,
  goal: 'fat_loss' as const,
  experience: 'beginner' as const,
  trainingDays: [0, 2, 4] as DayOfWeek[],
  equipment: {
    location: 'full_gym' as const,
    availableEquipment: ['barbell', 'dumbbells'] as const,
  },
  lifestyle: {
    occupation: 'office' as const,
    dailySteps: 8000,
    sleepHours: 7.5,
    stressLevel: 'moderate' as const,
  },
}

const MOCK_TDEE_BREAKDOWN = {
  bmr: 1800,
  neat: 400,
  eat: 300,
  tef: 200,
  total: 2700,
}

jest.mock('./useUserStore', () => ({
  useUserStore: {
    getState: () => ({ profile: MOCK_PROFILE, tdeeBreakdown: MOCK_TDEE_BREAKDOWN }),
  },
}))

// ── Test fixtures ─────────────────────────────────────────────────

const MOCK_MEAL_PLAN_DAY: MealPlanDay = {
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
}

const MOCK_MEAL_PLAN: MealPlan = {
  id: 'plan-1',
  startDate: '2026-04-07',
  endDate: '2026-04-13',
  status: 'active',
  targetCalories: 2300,
  targetProtein: 200,
  targetFat: 90,
  targetCarbs: 170,
  mealsPerDay: 4,
  days: [MOCK_MEAL_PLAN_DAY],
  createdAt: '2026-04-07T08:00:00.000Z',
}

const MOCK_FOOD_LOG_ENTRY: FoodLogEntry = {
  id: 'entry-1',
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

const MOCK_DAILY_SUMMARY: DailyNutritionSummary = {
  date: '2026-04-07',
  totalCalories: 1500,
  totalProtein: 130,
  totalFat: 60,
  totalCarbs: 110,
  totalFiber: 0,
  mealCount: 3,
}

const MOCK_SAVED_MEAL: SavedMeal = {
  id: 'sm-1',
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

const MOCK_CHECKIN: WeeklyCheckIn = {
  id: 'ci-1',
  weekStartDate: '2026-04-01',
  weekEndDate: '2026-04-07',
  avgWeight: 79.5,
  prevAvgWeight: 80.0,
  weightChange: -0.5,
  expectedChange: -0.5,
  calorieAdjustment: 0,
  newTargetCalories: 2300,
  coachMessage: 'מצוין!',
  coachMessageEn: 'Great!',
  createdAt: '2026-04-07T20:00:00Z',
}

const MOCK_MEASUREMENT: BodyMeasurement = {
  id: 'meas-1',
  date: '2026-04-07',
  weightKg: 79.5,
  bodyFatPercent: null,
  notes: '',
}

const MOCK_RECALIBRATION_RESULT: RecalibrationResult = {
  weightChange: -0.5,
  expectedChange: -0.75,
  isOnTrack: true,
  calorieAdjustment: 0,
  newTargetCalories: 2300,
  newProteinGrams: 200,
  newFatGrams: 90,
  newCarbGrams: 170,
  action: 'stay_course',
  severity: 'on_track',
  coachMessageKey: 'recalibration.stay_course',
}

// ── Helpers ───────────────────────────────────────────────────────

function resetStore() {
  useNutritionStore.setState({
    activePlan: null,
    todaysLog: [],
    selectedDateLog: [],
    dailySummary: null,
    savedMeals: [],
    recentCheckIns: [],
    latestRecalibration: null,
    weightLog: [],
    dateAdherence: [],
    mealTargets: null,
    lastGeneratedFoodIds: {},
    lastGeneratedEntryIds: {},
    redistributionToast: null,
    relogToast: null,
    previousMealSourceDates: {},
    isLoading: false,
    error: null,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  resetStore()
})

// ═══════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════

describe('initial state', () => {
  it('has null activePlan, dailySummary, and latestRecalibration', () => {
    const state = useNutritionStore.getState()
    expect(state.activePlan).toBeNull()
    expect(state.dailySummary).toBeNull()
    expect(state.latestRecalibration).toBeNull()
  })

  it('has empty arrays for todaysLog, savedMeals, recentCheckIns, weightLog', () => {
    const state = useNutritionStore.getState()
    expect(state.todaysLog).toEqual([])
    expect(state.savedMeals).toEqual([])
    expect(state.recentCheckIns).toEqual([])
    expect(state.weightLog).toEqual([])
  })

  it('is not loading and has no error', () => {
    const state = useNutritionStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════
// MEAL PLAN ACTIONS
// ═══════════════════════════════════════════════════════════════════

describe('loadActivePlan', () => {
  it('should load the active plan from the repository', async () => {
    mockGetActivePlan.mockResolvedValueOnce(MOCK_MEAL_PLAN)

    await useNutritionStore.getState().loadActivePlan()

    const state = useNutritionStore.getState()
    expect(state.activePlan).toEqual(MOCK_MEAL_PLAN)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should set activePlan to null when no plan exists', async () => {
    mockGetActivePlan.mockResolvedValueOnce(null)

    await useNutritionStore.getState().loadActivePlan()

    expect(useNutritionStore.getState().activePlan).toBeNull()
  })

  it('should set error on failure', async () => {
    mockGetActivePlan.mockRejectedValueOnce(new Error('DB error'))

    await useNutritionStore.getState().loadActivePlan()

    const state = useNutritionStore.getState()
    expect(state.error).toBe('DB error')
    expect(state.isLoading).toBe(false)
  })
})

describe('generateMealPlan', () => {
  it('should generate a plan using profile macros and save it', async () => {
    const mockDays: MealPlanDay[] = [MOCK_MEAL_PLAN_DAY]
    mockCalculateNutritionTargets.mockReturnValueOnce({
      bmr: 1800,
      tdee: 2700,
      targetCalories: 2300,
      proteinGrams: 200,
      fatGrams: 90,
      carbGrams: 170,
    })
    mockGenerateWeeklyMealPlan.mockReturnValueOnce(mockDays)
    mockSavePlan.mockResolvedValueOnce(MOCK_MEAL_PLAN)

    await useNutritionStore.getState().generateMealPlan(4)

    expect(mockCalculateNutritionTargets).toHaveBeenCalledWith(
      1800, // bmr from tdeeBreakdown
      2700, // total from tdeeBreakdown
      80, // weightKg from profile
      175, // heightCm from profile
      18, // bodyFatPercent from profile
      'fat_loss', // goal from profile
    )
    expect(mockGenerateWeeklyMealPlan).toHaveBeenCalledWith({
      proteinGrams: 200,
      fatGrams: 90,
      carbGrams: 170,
      mealsPerDay: 4,
      trainingDays: [0, 2, 4],
    })
    expect(mockSavePlan).toHaveBeenCalledTimes(1)

    const state = useNutritionStore.getState()
    expect(state.activePlan).toEqual(MOCK_MEAL_PLAN)
    expect(state.isLoading).toBe(false)
  })

  it('should set error when no profile exists', async () => {
    // Override useUserStore mock for this test
    const userStoreMock = jest.requireMock('./useUserStore') as {
      useUserStore: { getState: () => unknown }
    }
    const originalGetState = userStoreMock.useUserStore.getState
    userStoreMock.useUserStore.getState = () => ({ profile: null, tdeeBreakdown: null })

    await useNutritionStore.getState().generateMealPlan(4)

    const state = useNutritionStore.getState()
    expect(state.error).toBe('No user profile found. Complete onboarding first.')
    expect(mockGenerateWeeklyMealPlan).not.toHaveBeenCalled()

    // Restore
    userStoreMock.useUserStore.getState = originalGetState
  })

  it('should set error on algorithm failure', async () => {
    mockCalculateNutritionTargets.mockImplementation(() => {
      throw new Error('Algorithm failed')
    })

    await useNutritionStore.getState().generateMealPlan(4)

    expect(useNutritionStore.getState().error).toBe('Algorithm failed')
  })
})

describe('regenerateMealPlan', () => {
  it('should deactivate current plan and generate a new one', async () => {
    // Set up existing plan
    useNutritionStore.setState({ activePlan: MOCK_MEAL_PLAN })

    mockCalculateNutritionTargets.mockReturnValueOnce({
      bmr: 1800,
      tdee: 2700,
      targetCalories: 2300,
      proteinGrams: 200,
      fatGrams: 90,
      carbGrams: 170,
    })
    mockGenerateWeeklyMealPlan.mockReturnValueOnce([MOCK_MEAL_PLAN_DAY])
    mockSavePlan.mockResolvedValueOnce({ ...MOCK_MEAL_PLAN, id: 'plan-2' })

    await useNutritionStore.getState().regenerateMealPlan()

    expect(mockDeactivatePlan).toHaveBeenCalledWith('plan-1')
    expect(mockGenerateWeeklyMealPlan).toHaveBeenCalledTimes(1)
    expect(useNutritionStore.getState().activePlan?.id).toBe('plan-2')
  })

  it('should generate without deactivating when no current plan exists', async () => {
    mockCalculateNutritionTargets.mockReturnValueOnce({
      bmr: 1800,
      tdee: 2700,
      targetCalories: 2300,
      proteinGrams: 200,
      fatGrams: 90,
      carbGrams: 170,
    })
    mockGenerateWeeklyMealPlan.mockReturnValueOnce([MOCK_MEAL_PLAN_DAY])
    mockSavePlan.mockResolvedValueOnce(MOCK_MEAL_PLAN)

    await useNutritionStore.getState().regenerateMealPlan()

    expect(mockDeactivatePlan).not.toHaveBeenCalled()
    expect(mockGenerateWeeklyMealPlan).toHaveBeenCalledTimes(1)
  })
})

// ═══════════════════════════════════════════════════════════════════
// FOOD LOGGING
// ═══════════════════════════════════════════════════════════════════

describe('logFood', () => {
  it('should add entry via repo, prepend to todaysLog, and refresh summary', async () => {
    const entryData: Omit<FoodLogEntry, 'id'> = {
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

    mockAddEntry.mockResolvedValueOnce(MOCK_FOOD_LOG_ENTRY)
    mockGetDailySummary.mockResolvedValueOnce(MOCK_DAILY_SUMMARY)

    await useNutritionStore.getState().logFood(entryData)

    expect(mockAddEntry).toHaveBeenCalledWith(entryData)
    const state = useNutritionStore.getState()
    expect(state.todaysLog).toHaveLength(1)
    expect(state.todaysLog[0].id).toBe('entry-1')
    expect(state.dailySummary).toEqual(MOCK_DAILY_SUMMARY)
  })

  it('should set error on failure', async () => {
    mockAddEntry.mockRejectedValueOnce(new Error('Insert failed'))

    await useNutritionStore.getState().logFood({
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
    })

    expect(useNutritionStore.getState().error).toBe('Insert failed')
  })

  it('should reject invalid food log entry and set error', async () => {
    await useNutritionStore.getState().logFood({
      foodId: '',
      nameHe: '',
      mealType: 'lunch',
      date: 'not-a-date',
      servingAmount: -5,
      servingUnit: 'piece',
      gramsConsumed: 170,
      calories: 281,
      protein: 53,
      fat: 6,
      carbs: 0,
    })

    expect(mockAddEntry).not.toHaveBeenCalled()
    expect(useNutritionStore.getState().error).toBeTruthy()
  })
})

describe('removeFood', () => {
  it('should delete entry, filter from todaysLog, and refresh summary', async () => {
    useNutritionStore.setState({ todaysLog: [MOCK_FOOD_LOG_ENTRY] })
    mockDeleteById.mockResolvedValueOnce(true)
    mockGetDailySummary.mockResolvedValueOnce({
      ...MOCK_DAILY_SUMMARY,
      totalCalories: 0,
      mealCount: 0,
    })

    await useNutritionStore.getState().removeFood('entry-1')

    expect(mockDeleteById).toHaveBeenCalledWith('entry-1')
    const state = useNutritionStore.getState()
    expect(state.todaysLog).toHaveLength(0)
    expect(state.dailySummary?.totalCalories).toBe(0)
  })
})

describe('loadTodaysLog', () => {
  it('should load entries and summary for today', async () => {
    mockGetEntriesByDate.mockResolvedValueOnce([MOCK_FOOD_LOG_ENTRY])
    mockGetDailySummary.mockResolvedValueOnce(MOCK_DAILY_SUMMARY)

    await useNutritionStore.getState().loadTodaysLog()

    const state = useNutritionStore.getState()
    expect(state.todaysLog).toHaveLength(1)
    expect(state.dailySummary).toEqual(MOCK_DAILY_SUMMARY)
    expect(mockGetEntriesByDate).toHaveBeenCalledWith('2026-04-07')
    expect(mockGetDailySummary).toHaveBeenCalledWith('2026-04-07')
  })
})

// ═══════════════════════════════════════════════════════════════════
// SAVED MEALS
// ═══════════════════════════════════════════════════════════════════

describe('saveMeal', () => {
  it('should save meal via repo and append to savedMeals', async () => {
    const mealData: Omit<SavedMeal, 'id'> = {
      nameHe: 'ארוחת הבוקר שלי',
      items: MOCK_SAVED_MEAL.items,
      totalCalories: 435,
      totalProtein: 28,
      totalFat: 19,
      totalCarbs: 39,
    }
    mockSaveMeal.mockResolvedValueOnce(MOCK_SAVED_MEAL)

    await useNutritionStore.getState().saveMeal(mealData)

    expect(mockSaveMeal).toHaveBeenCalledWith(mealData)
    expect(useNutritionStore.getState().savedMeals).toHaveLength(1)
    expect(useNutritionStore.getState().savedMeals[0].id).toBe('sm-1')
  })
})

describe('logSavedMeal', () => {
  it('should compute macros from foodRepository and log each item', async () => {
    useNutritionStore.setState({ savedMeals: [MOCK_SAVED_MEAL] })
    mockAddEntry.mockImplementation(async (data: Omit<FoodLogEntry, 'id'>) => ({
      id: 'entry-' + Math.random().toString(36).slice(2, 6),
      ...data,
    }))
    mockGetDailySummary.mockResolvedValue(MOCK_DAILY_SUMMARY)
    mockGetById.mockImplementation(async (id: string) => {
      if (id === 'food_006') {
        return {
          id: 'food_006',
          nameHe: 'ביצה',
          nameEn: 'Egg',
          caloriesPer100g: 155,
          proteinPer100g: 13,
          fatPer100g: 11,
          carbsPer100g: 1,
          fiberPer100g: 0,
          category: 'protein',
          isUserCreated: false,
          servingSizes: [],
        }
      }
      if (id === 'food_015') {
        return {
          id: 'food_015',
          nameHe: 'סלט ישראלי',
          nameEn: 'Israeli Salad',
          caloriesPer100g: 60,
          proteinPer100g: 1.5,
          fatPer100g: 3,
          carbsPer100g: 7,
          fiberPer100g: 2,
          category: 'vegetables',
          isUserCreated: false,
          servingSizes: [],
        }
      }
      return null
    })

    await useNutritionStore.getState().logSavedMeal('sm-1', 'breakfast', '2026-04-07')

    // Should log 2 items (food_006 and food_015)
    expect(mockAddEntry).toHaveBeenCalledTimes(2)

    // First item: food_006 (egg), 100g → 155 cal, 13p, 11f, 1c
    expect(mockAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        foodId: 'food_006',
        mealType: 'breakfast',
        date: '2026-04-07',
        gramsConsumed: 100,
        calories: 155,
        protein: 13,
        fat: 11,
        carbs: 1,
      }),
    )

    // Second item: food_015 (salad), 150g → 90 cal, 2p, 5f, 11c
    expect(mockAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        foodId: 'food_015',
        mealType: 'breakfast',
        date: '2026-04-07',
        gramsConsumed: 150,
        calories: 90,
        protein: 2,
        fat: 5,
        carbs: 11,
      }),
    )
  })

  it('should set error when saved meal not found', async () => {
    useNutritionStore.setState({ savedMeals: [] })

    await useNutritionStore.getState().logSavedMeal('sm-nonexistent', 'breakfast', '2026-04-07')

    expect(useNutritionStore.getState().error).toBe('Saved meal not found.')
    expect(mockAddEntry).not.toHaveBeenCalled()
  })
})

describe('loadSavedMeals', () => {
  it('should load saved meals from repo', async () => {
    mockGetSavedMeals.mockResolvedValueOnce([MOCK_SAVED_MEAL])

    await useNutritionStore.getState().loadSavedMeals()

    expect(useNutritionStore.getState().savedMeals).toHaveLength(1)
  })
})

describe('deleteSavedMeal', () => {
  it('should delete from repo and remove from state', async () => {
    useNutritionStore.setState({ savedMeals: [MOCK_SAVED_MEAL] })

    await useNutritionStore.getState().deleteSavedMeal('sm-1')

    expect(mockDeleteSavedMeal).toHaveBeenCalledWith('sm-1')
    expect(useNutritionStore.getState().savedMeals).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// WEIGHT TRACKING
// ═══════════════════════════════════════════════════════════════════

describe('logWeight', () => {
  it('should save measurement via repo and append to weightLog', async () => {
    mockAddMeasurement.mockResolvedValueOnce(MOCK_MEASUREMENT)

    await useNutritionStore.getState().logWeight(79.5, '2026-04-07')

    expect(mockAddMeasurement).toHaveBeenCalledWith({
      date: '2026-04-07',
      weightKg: 79.5,
      bodyFatPercent: null,
      notes: '',
    })
    expect(useNutritionStore.getState().weightLog).toHaveLength(1)
    expect(useNutritionStore.getState().weightLog[0].weightKg).toBe(79.5)
  })

  it('should reject invalid weight and set error', async () => {
    await useNutritionStore.getState().logWeight(-10, '2026-04-07')

    expect(mockAddMeasurement).not.toHaveBeenCalled()
    expect(useNutritionStore.getState().error).toBeTruthy()
  })

  it('should reject invalid date and set error', async () => {
    await useNutritionStore.getState().logWeight(79.5, 'invalid-date')

    expect(mockAddMeasurement).not.toHaveBeenCalled()
    expect(useNutritionStore.getState().error).toBeTruthy()
  })
})

describe('loadWeightLog', () => {
  it('should load measurements for date range', async () => {
    mockGetMeasurementsByDateRange.mockResolvedValueOnce([MOCK_MEASUREMENT])

    await useNutritionStore.getState().loadWeightLog('2026-04-01', '2026-04-07')

    expect(mockGetMeasurementsByDateRange).toHaveBeenCalledWith('2026-04-01', '2026-04-07')
    expect(useNutritionStore.getState().weightLog).toHaveLength(1)
  })
})

// ═══════════════════════════════════════════════════════════════════
// WEEKLY CHECK-IN
// ═══════════════════════════════════════════════════════════════════

describe('runWeeklyCheckIn', () => {
  it('should gather data, recalibrate, save check-in, and update plan macros', async () => {
    useNutritionStore.setState({ activePlan: MOCK_MEAL_PLAN })

    mockGetWeeklyAverageWeight.mockResolvedValueOnce(80.0) // previous week
    mockGetWeeklyAverageWeight.mockResolvedValueOnce(79.5) // current week
    mockGetDailySummaries.mockResolvedValueOnce([
      {
        date: '2026-04-01',
        totalCalories: 2200,
        totalProtein: 180,
        totalFat: 85,
        totalCarbs: 160,
        totalFiber: 0,
        mealCount: 4,
      },
      {
        date: '2026-04-02',
        totalCalories: 2300,
        totalProtein: 190,
        totalFat: 90,
        totalCarbs: 170,
        totalFiber: 0,
        mealCount: 4,
      },
      {
        date: '2026-04-03',
        totalCalories: 2100,
        totalProtein: 170,
        totalFat: 80,
        totalCarbs: 150,
        totalFiber: 0,
        mealCount: 3,
      },
      {
        date: '2026-04-04',
        totalCalories: 2250,
        totalProtein: 185,
        totalFat: 88,
        totalCarbs: 165,
        totalFiber: 0,
        mealCount: 4,
      },
      {
        date: '2026-04-05',
        totalCalories: 2200,
        totalProtein: 180,
        totalFat: 85,
        totalCarbs: 160,
        totalFiber: 0,
        mealCount: 4,
      },
    ])
    mockRecalibrate.mockReturnValueOnce(MOCK_RECALIBRATION_RESULT)
    mockSaveCheckIn.mockResolvedValueOnce(MOCK_CHECKIN)

    await useNutritionStore.getState().runWeeklyCheckIn()

    expect(mockRecalibrate).toHaveBeenCalledWith(
      expect.objectContaining({
        weeklyAverages: [80.0, 79.5],
        goal: 'fat_loss',
        sex: 'male',
        currentCalories: 2300,
      }),
    )
    // Verify coach messages are resolved i18n strings, not raw keys
    expect(mockSaveCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        coachMessage: 'אתה בדיוק במסלול!',
        coachMessageEn: "You're right on track!",
      }),
    )

    const state = useNutritionStore.getState()
    expect(state.latestRecalibration).toEqual(MOCK_RECALIBRATION_RESULT)
    expect(state.recentCheckIns).toHaveLength(1)
    expect(state.error).toBeNull()
  })

  it('should set error when no active plan exists', async () => {
    await useNutritionStore.getState().runWeeklyCheckIn()

    expect(useNutritionStore.getState().error).toBe('No active meal plan. Generate a plan first.')
    expect(mockRecalibrate).not.toHaveBeenCalled()
  })

  it('should set error when no weight data available', async () => {
    useNutritionStore.setState({ activePlan: MOCK_MEAL_PLAN })
    mockGetWeeklyAverageWeight.mockResolvedValueOnce(null)
    mockGetWeeklyAverageWeight.mockResolvedValueOnce(null)

    await useNutritionStore.getState().runWeeklyCheckIn()

    expect(useNutritionStore.getState().error).toBe(
      'Not enough weight data for recalibration. Log weight daily.',
    )
  })
})

describe('loadRecentCheckIns', () => {
  it('should load check-ins from repo', async () => {
    mockGetRecentCheckIns.mockResolvedValueOnce([MOCK_CHECKIN])

    await useNutritionStore.getState().loadRecentCheckIns()

    expect(useNutritionStore.getState().recentCheckIns).toHaveLength(1)
    expect(mockGetRecentCheckIns).toHaveBeenCalledWith(expect.any(Number))
  })
})

// ═══════════════════════════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════════════════════════

describe('getRemainingMacros', () => {
  it('should return remaining macros when plan and summary exist', () => {
    useNutritionStore.setState({
      activePlan: MOCK_MEAL_PLAN,
      dailySummary: MOCK_DAILY_SUMMARY,
    })

    const remaining = useNutritionStore.getState().getRemainingMacros()

    expect(remaining).toEqual({
      calories: 2300 - 1500,
      protein: 200 - 130,
      fat: 90 - 60,
      carbs: 170 - 110,
    })
  })

  it('should return null when no plan exists', () => {
    useNutritionStore.setState({ dailySummary: MOCK_DAILY_SUMMARY })

    expect(useNutritionStore.getState().getRemainingMacros()).toBeNull()
  })

  it('should return null when no summary exists', () => {
    useNutritionStore.setState({ activePlan: MOCK_MEAL_PLAN })

    expect(useNutritionStore.getState().getRemainingMacros()).toBeNull()
  })
})

describe('getMealPlanForToday', () => {
  // Pin "now" to 2026-04-07T12:00:00 local time so new Date().getDay() is deterministic
  const FAKE_NOW = new Date('2026-04-07T12:00:00')
  const FAKE_DOW = FAKE_NOW.getDay() as DayOfWeek // Tuesday = 2

  beforeEach(() => {
    jest.useFakeTimers({ now: FAKE_NOW })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return todays meal plan day when plan exists', () => {
    const todayPlanDay: MealPlanDay = {
      ...MOCK_MEAL_PLAN_DAY,
      dayOfWeek: FAKE_DOW,
    }
    useNutritionStore.setState({
      activePlan: { ...MOCK_MEAL_PLAN, days: [todayPlanDay] },
    })

    const result = useNutritionStore.getState().getMealPlanForToday()

    expect(result).not.toBeNull()
    expect(result!.dayOfWeek).toBe(FAKE_DOW)
  })

  it('should return null when no plan exists', () => {
    expect(useNutritionStore.getState().getMealPlanForToday()).toBeNull()
  })

  it('should return null when today has no scheduled meals', () => {
    // FAKE_DOW is Tuesday (2), so Saturday (6) won't match
    useNutritionStore.setState({
      activePlan: { ...MOCK_MEAL_PLAN, days: [{ ...MOCK_MEAL_PLAN_DAY, dayOfWeek: 6 }] },
    })

    const result = useNutritionStore.getState().getMealPlanForToday()

    expect(result).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════
// RE-LOG PREVIOUS MEAL
// ═══════════════════════════════════════════════════════════════════

const MOCK_PRIOR_ENTRY_A: FoodLogEntry = {
  id: 'prior-a',
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
}

const MOCK_PRIOR_ENTRY_B: FoodLogEntry = {
  ...MOCK_PRIOR_ENTRY_A,
  id: 'prior-b',
  foodId: 'food_006',
  gramsConsumed: 100,
  calories: 155,
  protein: 13,
  fat: 11,
  carbs: 1,
}

describe('relogPreviousMeal', () => {
  it('clones previous-day entries to the target date and sets relogToast', async () => {
    mockGetPreviousMealEntries.mockResolvedValueOnce({
      entries: [MOCK_PRIOR_ENTRY_A, MOCK_PRIOR_ENTRY_B],
      sourceDate: '2026-04-22',
    })
    mockCloneEntriesToDate.mockResolvedValueOnce([
      { ...MOCK_PRIOR_ENTRY_A, id: 'new-1', date: '2026-04-23' },
      { ...MOCK_PRIOR_ENTRY_B, id: 'new-2', date: '2026-04-23' },
    ])
    mockGetEntriesByDate.mockResolvedValueOnce([])

    await useNutritionStore.getState().relogPreviousMeal('breakfast', '2026-04-23')

    expect(mockGetPreviousMealEntries).toHaveBeenCalledWith('breakfast', '2026-04-23', 7)
    expect(mockCloneEntriesToDate).toHaveBeenCalledWith(
      [MOCK_PRIOR_ENTRY_A, MOCK_PRIOR_ENTRY_B],
      '2026-04-23',
    )
    const { relogToast } = useNutritionStore.getState()
    expect(relogToast).not.toBeNull()
    expect(relogToast!.count).toBe(2)
    expect(relogToast!.insertedIds).toEqual(['new-1', 'new-2'])
    expect(mockGetEntriesByDate).toHaveBeenCalledWith('2026-04-23')
  })

  it('is a silent no-op when no prior meal is found', async () => {
    mockGetPreviousMealEntries.mockResolvedValueOnce(null)

    await useNutritionStore.getState().relogPreviousMeal('breakfast', '2026-04-23')

    expect(mockCloneEntriesToDate).not.toHaveBeenCalled()
    expect(useNutritionStore.getState().relogToast).toBeNull()
    expect(useNutritionStore.getState().error).toBeNull()
  })

  it('sets error state and leaves relogToast null when clone throws', async () => {
    mockGetPreviousMealEntries.mockResolvedValueOnce({
      entries: [MOCK_PRIOR_ENTRY_A],
      sourceDate: '2026-04-22',
    })
    mockCloneEntriesToDate.mockRejectedValueOnce(new Error('db locked'))

    await useNutritionStore.getState().relogPreviousMeal('breakfast', '2026-04-23')

    expect(useNutritionStore.getState().relogToast).toBeNull()
    expect(useNutritionStore.getState().error).toBe('db locked')
  })
})

describe('undoRelog', () => {
  it('deletes the inserted rows transactionally and clears the toast', async () => {
    useNutritionStore.setState({
      relogToast: { insertedIds: ['new-1', 'new-2'], count: 2 },
      selectedDateLog: [
        { ...MOCK_PRIOR_ENTRY_A, id: 'new-1', date: '2026-04-23' },
        { ...MOCK_PRIOR_ENTRY_B, id: 'new-2', date: '2026-04-23' },
      ],
    })
    mockDeleteManyByIds.mockResolvedValueOnce(undefined)
    mockGetEntriesByDate.mockResolvedValueOnce([])

    await useNutritionStore.getState().undoRelog('2026-04-23')

    expect(mockDeleteManyByIds).toHaveBeenCalledWith(['new-1', 'new-2'])
    expect(useNutritionStore.getState().relogToast).toBeNull()
    expect(mockGetEntriesByDate).toHaveBeenCalledWith('2026-04-23')
  })

  it('is a no-op when relogToast is null', async () => {
    useNutritionStore.setState({ relogToast: null })

    await useNutritionStore.getState().undoRelog('2026-04-23')

    expect(mockDeleteManyByIds).not.toHaveBeenCalled()
  })
})

describe('loadPreviousMealLookup', () => {
  it('queries all four meal types and stores their sourceDates', async () => {
    mockGetPreviousMealEntries.mockImplementation(async (mealType: string) => {
      if (mealType === 'breakfast')
        return { entries: [MOCK_PRIOR_ENTRY_A], sourceDate: '2026-04-22' }
      if (mealType === 'lunch') return { entries: [MOCK_PRIOR_ENTRY_B], sourceDate: '2026-04-20' }
      return null
    })

    await useNutritionStore.getState().loadPreviousMealLookup('2026-04-23')

    expect(mockGetPreviousMealEntries).toHaveBeenCalledTimes(4)
    const lookup = useNutritionStore.getState().previousMealSourceDates
    expect(lookup.breakfast).toBe('2026-04-22')
    expect(lookup.lunch).toBe('2026-04-20')
    expect(lookup.dinner).toBeNull()
    expect(lookup.snack).toBeNull()
  })

  it('sets error state if any lookup throws', async () => {
    mockGetPreviousMealEntries.mockRejectedValueOnce(new Error('db failure'))

    await useNutritionStore.getState().loadPreviousMealLookup('2026-04-23')

    expect(useNutritionStore.getState().error).toBe('db failure')
  })
})

describe('clearRelogToast', () => {
  it('sets relogToast to null', () => {
    useNutritionStore.setState({
      relogToast: { insertedIds: ['a'], count: 1 },
    })

    useNutritionStore.getState().clearRelogToast()

    expect(useNutritionStore.getState().relogToast).toBeNull()
  })
})

describe('consecutive re-logs', () => {
  it('a second relog replaces the toast; undo deletes only the second batch', async () => {
    // First relog: ids a, b
    mockGetPreviousMealEntries.mockResolvedValueOnce({
      entries: [MOCK_PRIOR_ENTRY_A],
      sourceDate: '2026-04-22',
    })
    mockCloneEntriesToDate.mockResolvedValueOnce([
      { ...MOCK_PRIOR_ENTRY_A, id: 'a', date: '2026-04-23' },
    ])
    mockGetEntriesByDate.mockResolvedValueOnce([])
    await useNutritionStore.getState().relogPreviousMeal('breakfast', '2026-04-23')

    // Second relog: ids c, d
    mockGetPreviousMealEntries.mockResolvedValueOnce({
      entries: [MOCK_PRIOR_ENTRY_B],
      sourceDate: '2026-04-21',
    })
    mockCloneEntriesToDate.mockResolvedValueOnce([
      { ...MOCK_PRIOR_ENTRY_B, id: 'c', date: '2026-04-23' },
      { ...MOCK_PRIOR_ENTRY_B, id: 'd', date: '2026-04-23' },
    ])
    mockGetEntriesByDate.mockResolvedValueOnce([])
    await useNutritionStore.getState().relogPreviousMeal('lunch', '2026-04-23')

    expect(useNutritionStore.getState().relogToast!.insertedIds).toEqual(['c', 'd'])

    mockDeleteManyByIds.mockResolvedValueOnce(undefined)
    mockGetEntriesByDate.mockResolvedValueOnce([])
    await useNutritionStore.getState().undoRelog('2026-04-23')

    expect(mockDeleteManyByIds).toHaveBeenCalledWith(['c', 'd'])
    const deletedBatch = mockDeleteManyByIds.mock.calls[0][0] as string[]
    expect(deletedBatch).not.toContain('a')
  })
})
