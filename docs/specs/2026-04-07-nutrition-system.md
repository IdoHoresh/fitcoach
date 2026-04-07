# Feature: Nutrition System (Meal Planning + Weekly Recalibration)

**Date:** 2026-04-07
**Status:** Draft
**GitHub Issue:** N/A

## What

A complete nutrition system that: (1) generates personalized daily meal plans based on the user's calorie/macro targets and food preferences, scheduled around their workouts, (2) tracks daily weigh-ins, and (3) performs weekly check-ins with coach-style explanations that recalibrate calories/macros based on actual vs. expected weight change.

## Why

The workout side is done — the app can generate training plans. But without nutrition, users are left guessing what to eat. Most fitness apps either skip meal planning or make users manually assemble meals. FitCoach's differentiator: tell the user **exactly what to eat, when**, like a personal coach would. The weekly recalibration closes the feedback loop — no more guessing if your calories are right.

## Decisions Made (Brainstorm 2026-04-07)

| Decision              | Choice                                                   | Why                                                                            |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Food source           | Built-in Israeli DB (~100-150 foods) + user custom foods | Need enough variety for good plans, plus user flexibility                      |
| Weigh-ins             | Daily weigh-in, weekly average                           | Gold standard — smooths out water/food fluctuations (RP, MacroFactor approach) |
| Meals per day         | User chooses 3-6                                         | Different people, different schedules                                          |
| Plan engine           | Hybrid — templates for main meals, per-food for snacks   | Templates = predictable good meals, per-food snacks = hit exact targets        |
| Recalibration style   | Coach-style explanation in conversational Hebrew         | Fits FitCoach identity, educational for beginners                              |
| Training day strategy | Same total calories, shift carb timing around workouts   | Simpler for beginners, evidence-based (most coaches recommend this)            |
| Build approach        | Bottom-up in 4 tasks                                     | Each layer independently testable and mergeable                                |

## Requirements

- [ ] Israeli food database with ~100-150 foods (macros per 100g, serving sizes, Hebrew+English names)
- [ ] Meal templates for main meals (breakfast, lunch, dinner) that combine foods into real meals
- [ ] Meal plan generator that assembles a daily plan hitting calorie/macro targets
- [ ] User chooses 3-6 meals per day; plan distributes macros accordingly
- [ ] Training days shift carbs toward pre/post workout meals (same total calories)
- [ ] Food logging — user can log what they actually ate (may differ from plan)
- [ ] Daily weigh-in tracking with weekly average calculation
- [ ] Weekly check-in: compare avg weight change to expected, recalibrate calories
- [ ] Coach-style Hebrew explanation for each weekly adjustment
- [ ] User can add custom foods to the database
- [ ] Saved meals (user's frequently eaten combos)
- [ ] Nutrition store (Zustand) connecting all layers to UI

## Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      UI Screens                          │
│  (Nutrition tab, Meal Plan, Food Log, Weekly Check-in)   │
└───────────┬──────────────────────────────────────────────┘
            │
     ┌──────▼──────────┐
     │  useNutrition   │ ──── reads from ──── useUserStore
     │     Store       │ ──── reads from ──── useWorkoutStore
     └──┬─────┬────────┘
        │     │
   ┌────▼──┐  └──────┐
   │ Repos │    ┌────▼─────────────────┐
   │(SQLite)│   │    Algorithms         │
   └────────┘   │ - meal-plan-generator │
                │ - macro-distributor   │
                │ - weekly-recalibration│
                └──────────────────────┘
                         │
                  ┌──────▼──────┐
                  │    Data     │
                  │ - foods.ts  │
                  │ - meals.ts  │
                  └─────────────┘
```

### Data Flow

#### Meal plan generation:

```
User completes onboarding (or weekly check-in adjusts targets)
  → useNutritionStore.generateMealPlan()
  → reads profile from useUserStore (TDEE, macros, goal)
  → reads training schedule from useWorkoutStore (which days)
  → calls mealPlanGenerator(targets, schedule, mealCount, foodDB)
    → for each day:
      → distributeMacros(dailyTargets, mealCount, isTrainingDay)
      → for main meals: pick best-fit template
      → for snacks: assemble per-food to fill remaining macros
  → saves plan to SQLite
  → sets plan in store state
```

#### Weekly check-in:

```
User opens weekly check-in (scheduled notification)
  → loadWeeklyWeights() → calculate weekly average
  → compare to previous week's average
  → calculateRecalibration(weightChange, currentTargets, goal)
    → determine if on track, too fast, or too slow
    → calculate calorie adjustment (±100-200 kcal)
    → generate coach message in Hebrew
  → show coach explanation to user
  → user confirms → apply new targets
  → regenerate meal plan with new targets
```

### New Types Needed

```typescript
// Meal plan types
interface MealPlan {
  readonly id: string
  readonly startDate: string // ISO date
  readonly endDate: string // ISO date
  readonly status: 'active' | 'archived'
  readonly days: readonly MealPlanDay[]
}

interface MealPlanDay {
  readonly dayOfWeek: DayOfWeek
  readonly isTrainingDay: boolean
  readonly totalCalories: number
  readonly totalProtein: number
  readonly totalFat: number
  readonly totalCarbs: number
  readonly meals: readonly PlannedMeal[]
}

interface PlannedMeal {
  readonly id: string
  readonly mealType: MealType
  readonly orderIndex: number // 1-6
  readonly timeSlot: string // "08:00", "13:00", etc.
  readonly items: readonly PlannedMealItem[]
  readonly totalCalories: number
  readonly totalProtein: number
  readonly totalFat: number
  readonly totalCarbs: number
}

interface PlannedMealItem {
  readonly foodId: string
  readonly servingAmount: number
  readonly servingUnit: ServingUnit
  readonly gramsConsumed: number
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
}

// Weekly check-in types
interface WeeklyCheckIn {
  readonly id: string
  readonly weekStartDate: string
  readonly weekEndDate: string
  readonly avgWeight: number
  readonly prevAvgWeight: number | null
  readonly weightChange: number | null // kg
  readonly expectedChange: number // kg (based on goal)
  readonly calorieAdjustment: number // kcal (positive = increase)
  readonly newTargetCalories: number
  readonly coachMessage: string // Hebrew explanation
  readonly coachMessageEn: string // English explanation
  readonly createdAt: string
}

// Recalibration result (algorithm output)
interface RecalibrationResult {
  readonly weightChange: number
  readonly expectedChange: number
  readonly isOnTrack: boolean
  readonly calorieAdjustment: number
  readonly newTargetCalories: number
  readonly newProteinGrams: number
  readonly newFatGrams: number
  readonly newCarbGrams: number
  readonly coachMessageKey: string // i18n key
  readonly severity: 'on_track' | 'minor_adjust' | 'significant_adjust' | 'concern'
}

// Meal template (data, not DB)
interface MealTemplate {
  readonly id: string
  readonly nameHe: string
  readonly nameEn: string
  readonly mealType: MealType // breakfast, lunch, dinner
  readonly category: 'high_protein' | 'balanced' | 'high_carb' | 'light'
  readonly items: readonly MealTemplateItem[]
  readonly approxCalories: number
  readonly approxProtein: number
  readonly approxFat: number
  readonly approxCarbs: number
  readonly requiredEquipment: string[] // e.g., ['stove'] or []
}

interface MealTemplateItem {
  readonly foodId: string
  readonly defaultServingAmount: number
  readonly servingUnit: ServingUnit
  readonly scalable: boolean // can portion be adjusted?
}
```

### New DB Tables

```sql
-- Generated meal plans
CREATE TABLE IF NOT EXISTS meal_plan (
  id TEXT PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  target_calories REAL NOT NULL,
  target_protein REAL NOT NULL,
  target_fat REAL NOT NULL,
  target_carbs REAL NOT NULL,
  meal_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
)

-- Individual planned meals within a plan
CREATE TABLE IF NOT EXISTS planned_meal (
  id TEXT PRIMARY KEY,
  meal_plan_id TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  is_training_day INTEGER NOT NULL DEFAULT 0,
  meal_type TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  time_slot TEXT,
  items_json TEXT NOT NULL,
  total_calories REAL NOT NULL,
  total_protein REAL NOT NULL,
  total_fat REAL NOT NULL,
  total_carbs REAL NOT NULL,
  FOREIGN KEY (meal_plan_id) REFERENCES meal_plan(id)
)

-- Weekly check-in results
CREATE TABLE IF NOT EXISTS weekly_checkin (
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
  created_at TEXT NOT NULL
)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meal_plan_status ON meal_plan(status)
CREATE INDEX IF NOT EXISTS idx_planned_meal_plan ON planned_meal(meal_plan_id)
CREATE INDEX IF NOT EXISTS idx_weekly_checkin_date ON weekly_checkin(week_start_date)
```

Note: `body_measurement` table (already exists) will be reused for daily weigh-ins via existing `MeasurementRepository`.

### New Algorithms

#### 1. Macro Distributor (`src/algorithms/macro-distributor.ts`)

Splits daily macro targets across N meals, shifting carbs on training days.

```typescript
function distributeMacros(
  dailyTargets: NutritionTargets,
  mealCount: number,
  isTrainingDay: boolean,
  workoutMealIndex: number | null, // which meal is pre/post workout
): MealMacroTarget[]
```

#### 2. Meal Plan Generator (`src/algorithms/meal-plan-generator.ts`)

Assembles a weekly meal plan from templates + food database.

```typescript
function generateMealPlan(
  targets: NutritionTargets,
  trainingSchedule: DayOfWeek[],
  mealCount: number,
  foodDatabase: FoodItem[],
  mealTemplates: MealTemplate[],
  preferences?: MealPreferences,
): MealPlan
```

#### 3. Weekly Recalibration (`src/algorithms/weekly-recalibration.ts`)

Analyzes weight trend and calculates calorie adjustment.

```typescript
function calculateRecalibration(
  currentWeekAvg: number,
  previousWeekAvg: number | null,
  currentTargets: NutritionTargets,
  goal: TrainingGoal,
  bodyWeightKg: number,
): RecalibrationResult
```

### Store Interface

```typescript
interface NutritionStore {
  // Derived state (from user profile)
  nutritionTargets: NutritionTargets | null

  // Meal plan state
  activePlan: MealPlan | null
  todaysMeals: PlannedMeal[]

  // Food logging state
  todaysLog: FoodLogEntry[]
  todaysSummary: DailyNutritionSummary | null

  // Weekly check-in state
  latestCheckIn: WeeklyCheckIn | null
  weeklyWeights: BodyMeasurement[]

  // Loading / error
  isLoading: boolean
  error: string | null

  // Meal plan actions
  generateMealPlan: () => Promise<void>
  regenerateMealPlan: () => Promise<void>
  loadActivePlan: () => Promise<void>

  // Food logging actions
  logFood: (entry: Omit<FoodLogEntry, 'id'>) => Promise<void>
  removeFood: (entryId: string) => Promise<void>
  loadTodaysLog: () => Promise<void>

  // Saved meals
  saveMeal: (name: string, items: FoodLogEntry[]) => Promise<void>
  getSavedMeals: () => Promise<SavedMeal[]>
  logSavedMeal: (savedMealId: string, mealType: MealType) => Promise<void>

  // Custom foods
  addCustomFood: (food: Omit<FoodItem, 'id' | 'isUserCreated'>) => Promise<void>

  // Weight tracking
  logWeight: (weightKg: number, date?: string) => Promise<void>
  loadWeeklyWeights: () => Promise<void>

  // Weekly check-in
  runWeeklyCheckIn: () => Promise<WeeklyCheckIn>
  loadLatestCheckIn: () => Promise<void>
  applyRecalibration: (checkIn: WeeklyCheckIn) => Promise<void>

  // Computed
  getRemainingMacros: () => { calories: number; protein: number; fat: number; carbs: number }
  getMealPlanForDay: (dayOfWeek: DayOfWeek) => MealPlanDay | null
}
```

### Files to Create/Modify

| File                                     | Action | Task | Description                                              |
| ---------------------------------------- | ------ | ---- | -------------------------------------------------------- |
| `src/types/nutrition.ts`                 | Modify | 1    | Add MealPlan, WeeklyCheckIn, MealTemplate types          |
| `src/data/foods.ts`                      | Create | 1    | Israeli food database (~100-150 items)                   |
| `src/data/meal-templates.ts`             | Create | 1    | Pre-built meal templates                                 |
| `src/db/schema.ts`                       | Modify | 2    | Add meal_plan, planned_meal, weekly_checkin tables       |
| `src/db/nutrition-repository.ts`         | Create | 2    | FoodLogRepository, MealPlanRepository, CheckInRepository |
| `src/algorithms/macro-distributor.ts`    | Create | 3    | Per-meal macro distribution                              |
| `src/algorithms/meal-plan-generator.ts`  | Create | 3    | Meal plan assembly from templates + foods                |
| `src/algorithms/weekly-recalibration.ts` | Create | 3    | Weight analysis + calorie adjustment                     |
| `src/stores/useNutritionStore.ts`        | Create | 4    | Zustand store connecting everything                      |
| `src/i18n/he.ts`                         | Modify | 3    | Coach-style recalibration messages                       |
| `src/i18n/en.ts`                         | Modify | 3    | English recalibration messages                           |

## Acceptance Criteria

- [ ] ~100-150 Israeli foods with accurate macros, Hebrew+English names, serving sizes
- [ ] Meal templates cover breakfast/lunch/dinner for different calorie ranges
- [ ] Meal plan generator produces valid plans that hit macro targets within ±5%
- [ ] Training day plans shift carbs to pre/post workout meals
- [ ] Food logging CRUD works with Zod validation
- [ ] Daily weigh-in uses existing MeasurementRepository
- [ ] Weekly recalibration correctly identifies on-track vs. needs-adjustment
- [ ] Coach messages are conversational Hebrew, not clinical
- [ ] Calorie adjustments are conservative (±100-200 kcal per week)
- [ ] Store integrates with useUserStore and useWorkoutStore
- [ ] All new code has TDD tests
- [ ] Lint, typecheck, and all tests pass

## Task Breakdown (4 PRs, bottom-up)

### Task 1: Foundation — Types + Israeli Food DB + Meal Templates (L)

New types, ~100-150 foods with macros, meal templates for plan generation.

### Task 2: Data Layer — Repositories + DB Schema (M)

FoodLogRepository, MealPlanRepository, WeeklyCheckInRepository, new tables.

### Task 3: Algorithms — Plan Generator + Recalibration (L)

Macro distributor, meal plan generator (hybrid), weekly recalibration with coach messages.

### Task 4: Store — useNutritionStore (L)

Zustand store connecting repos + algorithms + cross-store access. Full TDD.

## Open Questions

- None — all decisions resolved during brainstorm.
