/**
 * buildTodaysPlan — pure function that assembles the Home tab "Today's plan" list.
 *
 * Given today's meal plan, workout day, and logged food / workout state,
 * returns an ordered array of PlanItem that the UI renders as-is.
 * Owns all layout logic: ordering, done detection, isNext marker,
 * rest-day handling, and fresh-install ghost mode.
 *
 * The function is deterministic and side-effect-free — every input
 * (including "today") is passed in, nothing is read from globals.
 */

import type { GeneratedWorkoutDay } from '../algorithms/workout-generator'
import type { FoodLogEntry, MealPlan, MealsPerDay, MealType, PlannedMeal } from '../types/nutrition'
import type { DayOfWeek } from '../types/user'
import type { WorkoutLog } from '../types/workout'

// ── Public types ──────────────────────────────────────────────────

/** What kind of row a PlanItem represents. */
export type PlanItemKind = 'meal' | 'workout' | 'rest' | 'ghost'

/**
 * A single row in the Today's plan list.
 *
 * The list renderer is a dumb mapper — everything it needs to know
 * about ordering, completion, and the "next" highlight is baked into
 * these fields by buildTodaysPlan.
 */
export interface PlanItem {
  readonly kind: PlanItemKind
  /** Stable React key: mealType for meals, 'workout' / 'rest' / 'ghost-N'. */
  readonly id: string
  /**
   * i18n key under `home.v2.planItems` (e.g. 'breakfast', 'workout',
   * 'ghostMeal'). The component resolves to the localized string.
   */
  readonly labelKey: string
  /**
   * Secondary label used by the workout row — the template's
   * localized name ('Push A' / 'דחיפה A'). Null for non-workout rows.
   */
  readonly secondaryLabel: string | null
  /** Calorie target for meal rows. Null for workout, rest, and ghost rows. */
  readonly calories: number | null
  /** Duration in minutes for workout rows. Null for other rows. */
  readonly durationMinutes: number | null
  /** True when the user has logged food / completed the workout today. */
  readonly done: boolean
  /**
   * Marks the first undone, non-rest row so exactly one row at a time
   * is visually highlighted. Ghost rows get isNext on the FIRST ghost
   * row in fresh-install mode.
   */
  readonly isNext: boolean
  /** Where tapping the row should navigate. Null for rest rows. */
  readonly routeTarget: 'nutrition' | 'workout' | 'onboarding' | null
}

/** Inputs to buildTodaysPlan. All external state is passed in explicitly. */
export interface BuildTodaysPlanInput {
  readonly activePlan: MealPlan | null
  readonly todaysWorkoutDay: GeneratedWorkoutDay | null
  readonly todaysLog: readonly FoodLogEntry[]
  readonly todaysCompletedWorkoutLog: WorkoutLog | null
  /**
   * Today's day-of-week (0 = Sunday ... 6 = Saturday).
   * Caller derives this from `new Date().getDay()` at call time —
   * passing it in keeps this function pure.
   */
  readonly todayDayOfWeek: DayOfWeek
  /**
   * Used only in fresh-install ghost mode to decide how many ghost
   * meal rows to render. When activePlan is set we use its mealsPerDay.
   */
  readonly mealsPerDayFallback: MealsPerDay
  /**
   * Localized workout name passed in by the caller. The function is
   * i18n-agnostic; it just copies this string into `secondaryLabel`.
   */
  readonly workoutDisplayName: string | null
}

// ── Implementation ────────────────────────────────────────────────

/**
 * Pure function — returns the ordered plan list for today's Home tab.
 *
 * Three branches:
 * 1. Fresh install (no plan AND no workout day) → ghost mode
 * 2. Plan exists, workout day is null → meal rows only (no workout slot)
 * 3. Everything else → real meal rows + workout/rest row inserted via heuristic
 */
export function buildTodaysPlan(input: BuildTodaysPlanInput): readonly PlanItem[] {
  const {
    activePlan,
    todaysWorkoutDay,
    todaysLog,
    todaysCompletedWorkoutLog,
    todayDayOfWeek,
    mealsPerDayFallback,
    workoutDisplayName,
  } = input

  // Branch 1: fresh install — both plan and workout day missing.
  if (activePlan === null && todaysWorkoutDay === null) {
    return buildGhostPlan(mealsPerDayFallback)
  }

  // Branch 2 & 3: at least one of plan / workout day exists.
  // When the plan is missing but the workout day exists, we still want
  // ghost meal rows so the screen doesn't look empty — keeps Home
  // visually consistent across mixed empty-state permutations.
  const mealRows =
    activePlan === null
      ? buildGhostMealRows(mealsPerDayFallback)
      : buildMealRows(activePlan, todayDayOfWeek, todaysLog)

  const workoutOrRestRow = buildWorkoutOrRestRow(
    todaysWorkoutDay,
    todaysCompletedWorkoutLog,
    workoutDisplayName,
  )

  // Insert workout/rest row via heuristic if present.
  const combined =
    workoutOrRestRow === null
      ? [...mealRows]
      : insertWorkoutByHeuristic(mealRows, workoutOrRestRow, activePlan, todayDayOfWeek)

  return assignIsNext(combined)
}

// ── Ghost mode ────────────────────────────────────────────────────

function buildGhostMealRows(mealsPerDay: MealsPerDay): PlanItem[] {
  const ghosts: PlanItem[] = []
  for (let i = 0; i < mealsPerDay; i++) {
    ghosts.push({
      kind: 'ghost',
      id: `ghost-meal-${i}`,
      labelKey: 'ghostMeal',
      secondaryLabel: null,
      calories: null,
      durationMinutes: null,
      done: false,
      isNext: false,
      routeTarget: 'onboarding',
    })
  }
  return ghosts
}

function buildGhostPlan(mealsPerDay: MealsPerDay): readonly PlanItem[] {
  const ghosts = buildGhostMealRows(mealsPerDay)
  ghosts.push({
    kind: 'ghost',
    id: 'ghost-workout',
    labelKey: 'ghostWorkout',
    secondaryLabel: null,
    calories: null,
    durationMinutes: null,
    done: false,
    isNext: false,
    routeTarget: 'onboarding',
  })
  // Mark the first ghost row as next.
  return assignIsNext(ghosts)
}

// ── Meal rows ─────────────────────────────────────────────────────

function buildMealRows(
  activePlan: MealPlan | null,
  todayDayOfWeek: DayOfWeek,
  todaysLog: readonly FoodLogEntry[],
): PlanItem[] {
  if (activePlan === null) {
    return []
  }
  const today = activePlan.days.find((d) => d.dayOfWeek === todayDayOfWeek)
  if (!today) {
    return []
  }

  // Sort by orderIndex so the list is deterministic even if the input is out of order.
  const orderedMeals = [...today.meals].sort((a, b) => a.orderIndex - b.orderIndex)

  return orderedMeals.map((meal) => {
    const done = todaysLog.some((entry) => entry.mealType === meal.mealType)
    return {
      kind: 'meal' as const,
      id: meal.mealType,
      labelKey: meal.mealType,
      secondaryLabel: null,
      calories: meal.totalCalories,
      durationMinutes: null,
      done,
      isNext: false,
      routeTarget: 'nutrition' as const,
    }
  })
}

// ── Workout / rest row ────────────────────────────────────────────

function buildWorkoutOrRestRow(
  todaysWorkoutDay: GeneratedWorkoutDay | null,
  todaysCompletedWorkoutLog: WorkoutLog | null,
  workoutDisplayName: string | null,
): PlanItem | null {
  if (todaysWorkoutDay === null) {
    return null
  }

  // Rest day — template is null.
  if (todaysWorkoutDay.template === null) {
    return {
      kind: 'rest',
      id: 'rest',
      labelKey: 'restDay',
      secondaryLabel: null,
      calories: null,
      durationMinutes: null,
      done: false,
      isNext: false,
      routeTarget: null,
    }
  }

  // Workout day — template exists.
  const template = todaysWorkoutDay.template
  const done = todaysCompletedWorkoutLog !== null && todaysCompletedWorkoutLog.completedAt !== null

  return {
    kind: 'workout',
    id: 'workout',
    labelKey: 'workout',
    secondaryLabel: workoutDisplayName,
    calories: null,
    durationMinutes: template.estimatedMinutes,
    done,
    isNext: false,
    routeTarget: 'workout',
  }
}

// ── Workout insertion heuristic ───────────────────────────────────

/**
 * Inserts the workout (or rest) row into the meal rows using the
 * following priority:
 *   1. Immediately BEFORE post_workout meal
 *   2. Immediately AFTER pre_workout meal
 *   3. Immediately BEFORE dinner meal
 *   4. At the end of the list
 */
function insertWorkoutByHeuristic(
  mealRows: readonly PlanItem[],
  workoutRow: PlanItem,
  activePlan: MealPlan | null,
  todayDayOfWeek: DayOfWeek,
): PlanItem[] {
  // If there are no meal rows (no plan), the workout row is the whole list.
  if (mealRows.length === 0) {
    return [workoutRow]
  }

  // Look up meal types present in the actual planned meals for today.
  const plannedMealTypes = getPlannedMealTypesForToday(activePlan, todayDayOfWeek)

  const hasPostWorkout = plannedMealTypes.has('post_workout')
  const hasPreWorkout = plannedMealTypes.has('pre_workout')
  const hasDinner = plannedMealTypes.has('dinner')

  const result = [...mealRows]

  if (hasPostWorkout) {
    const idx = result.findIndex((i) => i.id === 'post_workout')
    result.splice(idx, 0, workoutRow)
    return result
  }

  if (hasPreWorkout) {
    const idx = result.findIndex((i) => i.id === 'pre_workout')
    result.splice(idx + 1, 0, workoutRow)
    return result
  }

  if (hasDinner) {
    const idx = result.findIndex((i) => i.id === 'dinner')
    result.splice(idx, 0, workoutRow)
    return result
  }

  // Fallback: append to the end.
  result.push(workoutRow)
  return result
}

function getPlannedMealTypesForToday(
  activePlan: MealPlan | null,
  todayDayOfWeek: DayOfWeek,
): ReadonlySet<MealType> {
  if (activePlan === null) {
    return new Set()
  }
  const today = activePlan.days.find((d) => d.dayOfWeek === todayDayOfWeek)
  if (!today) {
    return new Set()
  }
  return new Set(today.meals.map((m: PlannedMeal) => m.mealType))
}

// ── isNext marker ─────────────────────────────────────────────────

/**
 * Marks exactly one row as the "next" row — the first undone,
 * non-rest row from the top. When all rows are done (or all are rest)
 * no row is marked.
 *
 * Returns a new array; never mutates the input.
 */
function assignIsNext(items: readonly PlanItem[]): readonly PlanItem[] {
  const nextIdx = items.findIndex((i) => !i.done && i.kind !== 'rest')
  if (nextIdx === -1) {
    // Either all done, or the list is empty, or all rows are rest rows.
    return items.map((i) => ({ ...i, isNext: false }))
  }
  return items.map((i, idx) => ({ ...i, isNext: idx === nextIdx }))
}
