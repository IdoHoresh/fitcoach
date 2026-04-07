# Feature: Nutrition Store (useNutritionStore)

**Date:** 2026-04-07
**Status:** Draft
**Phase:** 1 — Foundation (last Zustand store)

## What

A Zustand store that connects the nutrition algorithms, food data, and repositories to the (future) UI. Handles meal plan generation, food logging, saved meals, weight tracking, and weekly recalibration — all through a single store interface.

## Why

The algorithms and DB layer are built but disconnected. The UI needs a clean API to generate meal plans, log food, track weight, and trigger weekly check-ins. This is the last store before we start building screens.

## Requirements

- [ ] Generate weekly meal plans from user profile macros + training days
- [ ] Load/regenerate active meal plan
- [ ] Log individual food items with full macro tracking
- [ ] Save and log frequently eaten meal combos (saved meals)
- [ ] Remove food log entries
- [ ] Track daily nutrition summary with remaining macros
- [ ] Log body weight (reuse existing `measurementRepository`)
- [ ] Run weekly recalibration (weight trend + calorie adjustment)
- [ ] Cross-store reads: profile from `useUserStore`, training days from profile

## Design

### Architecture

```
UI (future)
  ↓
useNutritionStore (Zustand)
  ├── useUserStore.getState()        → profile, TDEE, macros
  ├── generateWeeklyMealPlan()       → algorithm (pure)
  ├── recalibrate()                  → algorithm (pure)
  ├── foodLogRepository              → food log CRUD
  ├── mealPlanRepository             → meal plan persistence
  ├── savedMealRepository (NEW)      → saved meal CRUD
  ├── weeklyCheckInRepository        → check-in history
  └── measurementRepository          → weight logs (existing)
```

### State Shape

```typescript
interface NutritionStore {
  // Data
  activePlan: MealPlan | null
  todaysLog: FoodLogEntry[]
  dailySummary: DailyNutritionSummary | null
  savedMeals: SavedMeal[]
  recentCheckIns: WeeklyCheckIn[]
  latestRecalibration: RecalibrationResult | null
  weightLog: BodyMeasurement[]
  isLoading: boolean
  error: string | null

  // Meal Plan
  generateMealPlan: (mealsPerDay: MealsPerDay) => Promise<void>
  regenerateMealPlan: () => Promise<void>
  loadActivePlan: () => Promise<void>

  // Food Logging
  logFood: (entry: Omit<FoodLogEntry, 'id'>) => Promise<void>
  removeFood: (entryId: string) => Promise<void>
  loadTodaysLog: () => Promise<void>

  // Saved Meals
  saveMeal: (meal: Omit<SavedMeal, 'id'>) => Promise<void>
  logSavedMeal: (savedMealId: string, mealType: MealType, date: string) => Promise<void>
  loadSavedMeals: () => Promise<void>
  deleteSavedMeal: (mealId: string) => Promise<void>

  // Weight
  logWeight: (weightKg: number, date: string) => Promise<void>
  loadWeightLog: (startDate: string, endDate: string) => Promise<void>

  // Weekly Check-In
  runWeeklyCheckIn: () => Promise<void>
  loadRecentCheckIns: () => Promise<void>

  // Computed
  getRemainingMacros: () => { calories: number; protein: number; fat: number; carbs: number } | null
  getMealPlanForToday: () => MealPlanDay | null
}
```

### Key Decisions

1. **Cross-store access** — reads profile/macros from `useUserStore`, same pattern as workout store
2. **Saved meals from day one** — `SavedMeal` type + DB tables already exist, just need repository + store actions
3. **Weight in nutrition store** — tightly coupled to recalibration; reuses existing `measurementRepository`
4. **`logSavedMeal` macro computation** — uses `FOOD_MAP` to compute per-item macros from `gramsConsumed`, same pattern as `meal-plan-generator.ts`

### Files to Create/Modify

| File                                   | Action | Description                                                   |
| -------------------------------------- | ------ | ------------------------------------------------------------- |
| `src/stores/useNutritionStore.ts`      | Create | The Zustand store                                             |
| `src/stores/useNutritionStore.test.ts` | Create | Full test suite                                               |
| `src/db/nutrition-repository.ts`       | Modify | Add `SavedMealRepository` class + `deleteEntry()` on food log |
| `src/db/nutrition-repository.test.ts`  | Modify | Tests for new repo methods                                    |
| `src/db/user-repository.ts`            | Modify | Add `getWeeklyAverageWeight()` to `MeasurementRepository`     |
| `src/db/user-repository.test.ts`       | Modify | Test for new method                                           |
| `src/db/index.ts`                      | Modify | Export `savedMealRepository`                                  |
| `src/stores/index.ts`                  | Modify | Export `useNutritionStore` + `useWorkoutStore`                |

## Acceptance Criteria

- [ ] Store creates with correct initial state (all null/empty)
- [ ] `generateMealPlan` reads profile, calls algorithm, saves to DB
- [ ] `regenerateMealPlan` archives old plan, generates new
- [ ] `logFood` persists entry and updates daily summary
- [ ] `removeFood` deletes entry and refreshes summary
- [ ] `saveMeal` + `logSavedMeal` + `deleteSavedMeal` work end-to-end
- [ ] `logWeight` persists via `measurementRepository`
- [ ] `runWeeklyCheckIn` gathers data, calls recalibrate, saves check-in
- [ ] `getRemainingMacros` correctly subtracts consumed from targets
- [ ] All actions handle errors (set error state, don't crash)
- [ ] All tests pass, matching `useWorkoutStore` test pattern

## Task Breakdown

1. [ ] **Repository additions** — `SavedMealRepository`, `deleteEntry()`, `getWeeklyAverageWeight()` + tests (M)
2. [ ] **Store tests** — full test suite following workout store pattern (L)
3. [ ] **Store implementation** — all actions + computed methods (L)
4. [ ] **Integration** — exports from index files (S)
