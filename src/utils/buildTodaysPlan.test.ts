import { buildTodaysPlan, type BuildTodaysPlanInput, type PlanItem } from './buildTodaysPlan'
import type { GeneratedWorkoutDay } from '../algorithms/workout-generator'
import type { FoodLogEntry, MealPlan, MealType, PlannedMeal } from '../types/nutrition'
import type { DayOfWeek } from '../types/user'
import type { WorkoutLog, WorkoutTemplate } from '../types/workout'

// ── Fixture builders ──────────────────────────────────────────────

const TODAY_ISO = '2026-04-09'
const TODAY_DOW: DayOfWeek = 4 // Thursday

function makeMeal(mealType: MealType, orderIndex: number, calories: number): PlannedMeal {
  return {
    id: `meal-${mealType}`,
    mealType,
    orderIndex,
    timeSlot: null,
    templateId: null,
    items: [],
    totalCalories: calories,
    totalProtein: 30,
    totalFat: 10,
    totalCarbs: 40,
  }
}

function makePlan(meals: readonly PlannedMeal[]): MealPlan {
  return {
    id: 'plan-1',
    startDate: TODAY_ISO,
    endDate: '2026-04-16',
    status: 'active',
    targetCalories: 2400,
    targetProtein: 180,
    targetFat: 70,
    targetCarbs: 260,
    mealsPerDay: 4,
    days: [
      {
        dayOfWeek: TODAY_DOW,
        isTrainingDay: true,
        meals,
        totalCalories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
        totalProtein: meals.reduce((sum, m) => sum + m.totalProtein, 0),
        totalFat: meals.reduce((sum, m) => sum + m.totalFat, 0),
        totalCarbs: meals.reduce((sum, m) => sum + m.totalCarbs, 0),
      },
    ],
    createdAt: '2026-04-07T09:00:00Z',
  }
}

function makeTemplate(): WorkoutTemplate {
  return {
    id: 'tmpl-push-a',
    dayType: 'push_a',
    splitType: 'push_pull_legs',
    nameHe: 'דחיפה A',
    nameEn: 'Push A',
    exercises: [],
    estimatedMinutes: 45,
  }
}

function makeWorkoutDay(template: WorkoutTemplate | null): GeneratedWorkoutDay {
  return {
    dayOfWeek: TODAY_DOW,
    dayType: template ? 'push_a' : 'rest',
    template,
  }
}

function makeLogEntry(mealType: MealType): FoodLogEntry {
  return {
    id: `log-${mealType}`,
    foodId: 'food-1',
    mealType,
    date: TODAY_ISO,
    servingAmount: 1,
    servingUnit: 'serving',
    gramsConsumed: 100,
    calories: 150,
    protein: 10,
    fat: 5,
    carbs: 20,
  }
}

function makeCompletedWorkoutLog(): WorkoutLog {
  return {
    id: 'log-workout-1',
    date: TODAY_ISO,
    templateId: 'tmpl-push-a',
    dayType: 'push_a',
    startedAt: '2026-04-09T18:00:00Z',
    completedAt: '2026-04-09T18:45:00Z',
    exercises: [],
    durationMinutes: 45,
  }
}

function defaultInput(overrides: Partial<BuildTodaysPlanInput> = {}): BuildTodaysPlanInput {
  return {
    activePlan: null,
    todaysWorkoutDay: null,
    todaysLog: [],
    todaysCompletedWorkoutLog: null,
    todayDayOfWeek: TODAY_DOW,
    mealsPerDayFallback: 4,
    workoutDisplayName: null,
    ...overrides,
  }
}

// Helper — find the first index where kind matches. Makes assertions readable.
function indexOfKind(items: readonly PlanItem[], kind: PlanItem['kind']): number {
  return items.findIndex((i) => i.kind === kind)
}

function indexOfMeal(items: readonly PlanItem[], mealType: MealType): number {
  return items.findIndex((i) => i.kind === 'meal' && i.id === mealType)
}

// ══════════════════════════════════════════════════════════════════
//  Ordering rules — workout insertion heuristic
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — workout insertion ordering', () => {
  it('places workout immediately before post_workout meal when one exists', () => {
    const meals = [
      makeMeal('breakfast', 0, 320),
      makeMeal('lunch', 1, 540),
      makeMeal('pre_workout', 2, 150),
      makeMeal('post_workout', 3, 250),
      makeMeal('dinner', 4, 600),
    ]
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
      }),
    )

    const workoutIdx = indexOfKind(items, 'workout')
    const postIdx = indexOfMeal(items, 'post_workout')
    expect(workoutIdx).toBeGreaterThanOrEqual(0)
    expect(postIdx).toBe(workoutIdx + 1)
  })

  it('places workout immediately after pre_workout meal when no post_workout meal exists', () => {
    const meals = [
      makeMeal('breakfast', 0, 320),
      makeMeal('lunch', 1, 540),
      makeMeal('pre_workout', 2, 150),
      makeMeal('dinner', 3, 600),
    ]
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
      }),
    )

    const workoutIdx = indexOfKind(items, 'workout')
    const preIdx = indexOfMeal(items, 'pre_workout')
    expect(preIdx).toBe(workoutIdx - 1)
  })

  it('places workout before dinner when no pre/post_workout meals exist', () => {
    const meals = [
      makeMeal('breakfast', 0, 320),
      makeMeal('lunch', 1, 540),
      makeMeal('dinner', 2, 600),
      makeMeal('snack', 3, 200),
    ]
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
      }),
    )

    const workoutIdx = indexOfKind(items, 'workout')
    const dinnerIdx = indexOfMeal(items, 'dinner')
    expect(workoutIdx).toBe(dinnerIdx - 1)
  })

  it('places workout last when plan has no pre/post_workout and no dinner', () => {
    const meals = [
      makeMeal('breakfast', 0, 320),
      makeMeal('lunch', 1, 540),
      makeMeal('snack', 2, 200),
    ]
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
      }),
    )

    expect(items[items.length - 1]?.kind).toBe('workout')
  })

  it('preserves meal orderIndex within the list', () => {
    const meals = [
      makeMeal('breakfast', 0, 320),
      makeMeal('lunch', 1, 540),
      makeMeal('dinner', 2, 600),
      makeMeal('snack', 3, 200),
    ]
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
      }),
    )

    const mealRows = items.filter((i) => i.kind === 'meal')
    expect(mealRows.map((m) => m.id)).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
  })
})

// ══════════════════════════════════════════════════════════════════
//  Done detection
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — done detection', () => {
  const meals = [
    makeMeal('breakfast', 0, 320),
    makeMeal('lunch', 1, 540),
    makeMeal('dinner', 2, 600),
  ]

  it('marks a meal done when the log has at least one entry for that mealType', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysLog: [makeLogEntry('breakfast')],
      }),
    )
    const breakfast = items.find((i) => i.id === 'breakfast')
    expect(breakfast?.done).toBe(true)
  })

  it('leaves a meal pending when the log has entries only for other meal types', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysLog: [makeLogEntry('lunch')],
      }),
    )
    const breakfast = items.find((i) => i.id === 'breakfast')
    expect(breakfast?.done).toBe(false)
  })

  it('marks the workout done when todaysCompletedWorkoutLog has completedAt set', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        todaysCompletedWorkoutLog: makeCompletedWorkoutLog(),
        workoutDisplayName: 'Push A',
      }),
    )
    const workout = items.find((i) => i.kind === 'workout')
    expect(workout?.done).toBe(true)
  })

  it('leaves the workout pending when todaysCompletedWorkoutLog is null', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        todaysCompletedWorkoutLog: null,
        workoutDisplayName: 'Push A',
      }),
    )
    const workout = items.find((i) => i.kind === 'workout')
    expect(workout?.done).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
//  isNext marker
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — isNext marker', () => {
  const meals = [
    makeMeal('breakfast', 0, 320),
    makeMeal('lunch', 1, 540),
    makeMeal('dinner', 2, 600),
  ]

  it('marks the first undone row as next', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        todaysLog: [makeLogEntry('breakfast')],
        workoutDisplayName: 'Push A',
      }),
    )

    const nextItems = items.filter((i) => i.isNext)
    expect(nextItems).toHaveLength(1)
    expect(nextItems[0]?.id).toBe('lunch')
  })

  it('has exactly one isNext row at any time', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
      }),
    )
    expect(items.filter((i) => i.isNext)).toHaveLength(1)
  })

  it('has zero isNext rows when all meals and workout are done', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        todaysLog: [makeLogEntry('breakfast'), makeLogEntry('lunch'), makeLogEntry('dinner')],
        todaysCompletedWorkoutLog: makeCompletedWorkoutLog(),
        workoutDisplayName: 'Push A',
      }),
    )
    expect(items.filter((i) => i.isNext)).toHaveLength(0)
  })

  it('skips rest-day rows when assigning isNext', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(null), // rest day
      }),
    )
    const rest = items.find((i) => i.kind === 'rest')
    expect(rest?.isNext).toBe(false)
    // First undone MEAL should be next
    const nextItems = items.filter((i) => i.isNext)
    expect(nextItems).toHaveLength(1)
    expect(nextItems[0]?.kind).toBe('meal')
    expect(nextItems[0]?.id).toBe('breakfast')
  })

  it('marks the first ghost row as next in fresh-install mode', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: null,
        todaysWorkoutDay: null,
        mealsPerDayFallback: 4,
      }),
    )
    const nextItems = items.filter((i) => i.isNext)
    expect(nextItems).toHaveLength(1)
    expect(nextItems[0]?.kind).toBe('ghost')
    expect(items.indexOf(nextItems[0]!)).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════
//  Rest day
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — rest day', () => {
  const meals = [
    makeMeal('breakfast', 0, 320),
    makeMeal('lunch', 1, 540),
    makeMeal('dinner', 2, 600),
  ]

  it('inserts a rest row instead of a workout row when template is null', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(null),
      }),
    )

    expect(items.some((i) => i.kind === 'rest')).toBe(true)
    expect(items.some((i) => i.kind === 'workout')).toBe(false)
  })

  it('rest row has routeTarget null and done false', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(null),
      }),
    )
    const rest = items.find((i) => i.kind === 'rest')
    expect(rest?.routeTarget).toBeNull()
    expect(rest?.done).toBe(false)
  })

  it('rest row is placed at the same position the workout row would have used', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: makeWorkoutDay(null),
      }),
    )
    // With meals [breakfast, lunch, dinner] and no pre/post_workout,
    // the heuristic puts the workout (or here, rest) before dinner.
    const restIdx = indexOfKind(items, 'rest')
    const dinnerIdx = indexOfMeal(items, 'dinner')
    expect(restIdx).toBe(dinnerIdx - 1)
  })
})

// ══════════════════════════════════════════════════════════════════
//  Ghost / fresh-install mode
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — fresh-install ghost mode', () => {
  it('returns ghost rows when both activePlan and todaysWorkoutDay are null', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: null,
        todaysWorkoutDay: null,
        mealsPerDayFallback: 4,
      }),
    )
    // All rows should be ghosts
    expect(items.every((i) => i.kind === 'ghost')).toBe(true)
    // 4 meal ghosts + 1 workout ghost = 5 rows
    expect(items).toHaveLength(5)
  })

  it('respects mealsPerDayFallback for ghost count', () => {
    const items3 = buildTodaysPlan(
      defaultInput({
        activePlan: null,
        todaysWorkoutDay: null,
        mealsPerDayFallback: 3,
      }),
    )
    expect(items3).toHaveLength(4) // 3 meals + 1 workout

    const items6 = buildTodaysPlan(
      defaultInput({
        activePlan: null,
        todaysWorkoutDay: null,
        mealsPerDayFallback: 6,
      }),
    )
    expect(items6).toHaveLength(7) // 6 meals + 1 workout
  })

  it('ghost rows have done=false, calories=null, routeTarget=onboarding', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: null,
        todaysWorkoutDay: null,
        mealsPerDayFallback: 4,
      }),
    )
    for (const item of items) {
      expect(item.done).toBe(false)
      expect(item.calories).toBeNull()
      expect(item.routeTarget).toBe('onboarding')
    }
  })
})

// ══════════════════════════════════════════════════════════════════
//  Mixed empty states
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — mixed empty states', () => {
  it('renders real meal rows + no workout row when workout day is null but plan exists', () => {
    const meals = [
      makeMeal('breakfast', 0, 320),
      makeMeal('lunch', 1, 540),
      makeMeal('dinner', 2, 600),
    ]
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: makePlan(meals),
        todaysWorkoutDay: null,
      }),
    )
    // Real meals, no workout row, no rest row (rest only appears when there IS a workout day with null template)
    expect(items.some((i) => i.kind === 'ghost')).toBe(false)
    expect(items.some((i) => i.kind === 'workout')).toBe(false)
    expect(items.some((i) => i.kind === 'rest')).toBe(false)
    expect(items.filter((i) => i.kind === 'meal')).toHaveLength(3)
  })

  it('renders ghost meal rows + real workout row when plan is null but workout day exists', () => {
    const items = buildTodaysPlan(
      defaultInput({
        activePlan: null,
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        workoutDisplayName: 'Push A',
        mealsPerDayFallback: 4,
      }),
    )
    expect(items.filter((i) => i.kind === 'ghost')).toHaveLength(4)
    expect(items.filter((i) => i.kind === 'workout')).toHaveLength(1)
    const workout = items.find((i) => i.kind === 'workout')
    expect(workout?.secondaryLabel).toBe('Push A')
    expect(workout?.durationMinutes).toBe(45)
  })
})

// ══════════════════════════════════════════════════════════════════
//  Purity guarantees
// ══════════════════════════════════════════════════════════════════

describe('buildTodaysPlan — purity', () => {
  it('same input produces same output (deterministic)', () => {
    const input = defaultInput({
      activePlan: makePlan([makeMeal('breakfast', 0, 320), makeMeal('lunch', 1, 540)]),
      todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
      workoutDisplayName: 'Push A',
    })
    const a = buildTodaysPlan(input)
    const b = buildTodaysPlan(input)
    expect(a).toEqual(b)
  })

  it('does not mutate input arrays', () => {
    const meals = [makeMeal('breakfast', 0, 320), makeMeal('lunch', 1, 540)]
    const plan = makePlan(meals)
    const log: readonly FoodLogEntry[] = [makeLogEntry('breakfast')]
    const logSnapshot = [...log]
    const mealsSnapshot = [...meals]

    buildTodaysPlan(
      defaultInput({
        activePlan: plan,
        todaysWorkoutDay: makeWorkoutDay(makeTemplate()),
        todaysLog: log,
        workoutDisplayName: 'Push A',
      }),
    )

    expect(log).toEqual(logSnapshot)
    expect(meals).toEqual(mealsSnapshot)
  })
})
