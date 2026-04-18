import {
  workoutLogSchema,
  mesocycleStateSchema,
  userProfileSchema,
  ManualFoodInputSchema,
  computeAtwaterDelta,
  validateInput,
} from './validation'

// ── Test fixtures ──────────────────────────────────────────────────

const VALID_SET = {
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  rpe: 8,
  isWarmup: false,
}

const VALID_EXERCISE = {
  exerciseId: 'bench_press',
  sets: [VALID_SET, { ...VALID_SET, setNumber: 2 }],
  notes: '',
}

const VALID_WORKOUT_LOG = {
  date: '2026-04-07',
  templateId: 'tmpl-001',
  dayType: 'push_a' as const,
  startedAt: '2026-04-07T09:00:00Z',
  completedAt: '2026-04-07T10:15:00Z',
  exercises: [VALID_EXERCISE],
  durationMinutes: 75,
}

const VALID_USER_PROFILE = {
  name: 'Dan',
  heightCm: 175,
  weightKg: 75,
  age: 28,
  sex: 'male' as const,
  bodyFatPercent: null,
  goal: 'muscle_gain' as const,
  experience: 'beginner' as const,
  trainingDays: [0, 2, 4],
  equipment: {
    location: 'full_gym' as const,
    availableEquipment: ['barbell', 'dumbbells'] as const,
  },
  lifestyle: {
    occupation: 'desk' as const,
    dailySteps: 6000,
    afterWorkActivity: 'moderate' as const,
    exerciseDaysPerWeek: 3,
    exerciseType: 'strength' as const,
    sessionDurationMinutes: 60,
    exerciseIntensity: 'moderate' as const,
    sleepHoursPerNight: 7.5,
  },
  workoutTime: 'morning' as const,
}

const VALID_MESOCYCLE_STATE = {
  currentWeek: 1,
  totalWeeks: 6,
  isDeloadWeek: false,
  startDate: '2026-04-07',
}

// ── workoutLogSchema ───────────────────────────────────────────────

describe('workoutLogSchema', () => {
  it('accepts a valid complete workout log', () => {
    const result = validateInput(workoutLogSchema, VALID_WORKOUT_LOG)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(VALID_WORKOUT_LOG)
  })

  it('accepts a workout log with null completedAt (abandoned)', () => {
    const abandoned = { ...VALID_WORKOUT_LOG, completedAt: null }
    const result = validateInput(workoutLogSchema, abandoned)
    expect(result.success).toBe(true)
    expect(result.data!.completedAt).toBeNull()
  })

  it('rejects missing date', () => {
    const { date: _, ...noDate } = VALID_WORKOUT_LOG
    const result = validateInput(workoutLogSchema, noDate)
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const bad = { ...VALID_WORKOUT_LOG, date: '07-04-2026' }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects empty templateId', () => {
    const bad = { ...VALID_WORKOUT_LOG, templateId: '' }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects invalid dayType', () => {
    const bad = { ...VALID_WORKOUT_LOG, dayType: 'chest_day' }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects invalid startedAt format', () => {
    const bad = { ...VALID_WORKOUT_LOG, startedAt: '2026-04-07' }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects empty exercises array', () => {
    const bad = { ...VALID_WORKOUT_LOG, exercises: [] }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('at least 1 exercise')
  })

  it('rejects negative durationMinutes', () => {
    const bad = { ...VALID_WORKOUT_LOG, durationMinutes: -5 }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects durationMinutes over 300', () => {
    const bad = { ...VALID_WORKOUT_LOG, durationMinutes: 301 }
    const result = validateInput(workoutLogSchema, bad)
    expect(result.success).toBe(false)
  })

  it('accepts all valid dayType values', () => {
    const dayTypes = [
      'full_body_a',
      'full_body_b',
      'full_body_c',
      'upper_a',
      'upper_b',
      'lower_a',
      'lower_b',
      'push_a',
      'push_b',
      'pull_a',
      'pull_b',
      'legs_a',
      'legs_b',
      'rest',
    ]
    for (const dayType of dayTypes) {
      const log = { ...VALID_WORKOUT_LOG, dayType }
      const result = validateInput(workoutLogSchema, log)
      expect(result.success).toBe(true)
    }
  })
})

// ── userProfileSchema (name field) ─────────────────────────────────

describe('userProfileSchema name field', () => {
  it('accepts a valid profile with a Latin name', () => {
    const result = validateInput(userProfileSchema, VALID_USER_PROFILE)
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('Dan')
  })

  it('accepts a valid Hebrew name', () => {
    const profile = { ...VALID_USER_PROFILE, name: 'דני' }
    const result = validateInput(userProfileSchema, profile)
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('דני')
  })

  it('trims surrounding whitespace', () => {
    const profile = { ...VALID_USER_PROFILE, name: '  Dan  ' }
    const result = validateInput(userProfileSchema, profile)
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('Dan')
  })

  it('rejects empty name', () => {
    const profile = { ...VALID_USER_PROFILE, name: '' }
    const result = validateInput(userProfileSchema, profile)
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only name', () => {
    const profile = { ...VALID_USER_PROFILE, name: '   ' }
    const result = validateInput(userProfileSchema, profile)
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 50 characters', () => {
    const profile = { ...VALID_USER_PROFILE, name: 'a'.repeat(51) }
    const result = validateInput(userProfileSchema, profile)
    expect(result.success).toBe(false)
  })

  it('rejects missing name field', () => {
    const { name: _, ...noName } = VALID_USER_PROFILE
    const result = validateInput(userProfileSchema, noName)
    expect(result.success).toBe(false)
  })
})

// ── userProfileSchema (workoutTime field) ──────────────────────────

describe('userProfileSchema workoutTime field', () => {
  it('accepts valid workoutTime values', () => {
    for (const value of ['morning', 'evening', 'flexible'] as const) {
      const result = validateInput(userProfileSchema, { ...VALID_USER_PROFILE, workoutTime: value })
      expect(result.success).toBe(true)
    }
  })

  it('rejects missing workoutTime field', () => {
    const { workoutTime: _, ...noWorkoutTime } = VALID_USER_PROFILE
    const result = validateInput(userProfileSchema, noWorkoutTime)
    expect(result.success).toBe(false)
  })

  it('rejects invalid workoutTime value', () => {
    const result = validateInput(userProfileSchema, {
      ...VALID_USER_PROFILE,
      workoutTime: 'afternoon',
    })
    expect(result.success).toBe(false)
  })
})

// ── mesocycleStateSchema ───────────────────────────────────────────

describe('mesocycleStateSchema', () => {
  it('accepts a valid mesocycle state', () => {
    const result = validateInput(mesocycleStateSchema, VALID_MESOCYCLE_STATE)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(VALID_MESOCYCLE_STATE)
  })

  it('accepts deload week', () => {
    const deload = { ...VALID_MESOCYCLE_STATE, isDeloadWeek: true }
    const result = validateInput(mesocycleStateSchema, deload)
    expect(result.success).toBe(true)
    expect(result.data!.isDeloadWeek).toBe(true)
  })

  it('accepts minimum weeks (4)', () => {
    const min = { ...VALID_MESOCYCLE_STATE, totalWeeks: 4 }
    const result = validateInput(mesocycleStateSchema, min)
    expect(result.success).toBe(true)
  })

  it('accepts maximum weeks (8)', () => {
    const max = { ...VALID_MESOCYCLE_STATE, totalWeeks: 8 }
    const result = validateInput(mesocycleStateSchema, max)
    expect(result.success).toBe(true)
  })

  it('rejects currentWeek below 1', () => {
    const bad = { ...VALID_MESOCYCLE_STATE, currentWeek: 0 }
    const result = validateInput(mesocycleStateSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects currentWeek above MAX_WEEKS (8)', () => {
    const bad = { ...VALID_MESOCYCLE_STATE, currentWeek: 9 }
    const result = validateInput(mesocycleStateSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects totalWeeks below MIN_WEEKS (4)', () => {
    const bad = { ...VALID_MESOCYCLE_STATE, totalWeeks: 3 }
    const result = validateInput(mesocycleStateSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects totalWeeks above MAX_WEEKS (8)', () => {
    const bad = { ...VALID_MESOCYCLE_STATE, totalWeeks: 9 }
    const result = validateInput(mesocycleStateSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects non-integer currentWeek', () => {
    const bad = { ...VALID_MESOCYCLE_STATE, currentWeek: 2.5 }
    const result = validateInput(mesocycleStateSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects invalid startDate format', () => {
    const bad = { ...VALID_MESOCYCLE_STATE, startDate: '2026/04/07' }
    const result = validateInput(mesocycleStateSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects missing isDeloadWeek', () => {
    const { isDeloadWeek: _, ...noDeload } = VALID_MESOCYCLE_STATE
    const result = validateInput(mesocycleStateSchema, noDeload)
    expect(result.success).toBe(false)
  })
})

// ── ManualFoodInputSchema ────────────────────────────────────────────

const VALID_MANUAL_FOOD = {
  nameHe: 'פתיבר חלבון שוקולד',
  nameEn: 'Protein Bar Chocolate',
  caloriesPer100g: 350,
  proteinPer100g: 30,
  fatPer100g: 10,
  carbsPer100g: 40,
  fiberPer100g: 5,
}

describe('ManualFoodInputSchema', () => {
  it('accepts minimal valid input (name + 4 macros)', () => {
    const minimal = {
      nameHe: 'מוצר',
      caloriesPer100g: 200,
      proteinPer100g: 10,
      fatPer100g: 5,
      carbsPer100g: 30,
    }
    const result = validateInput(ManualFoodInputSchema, minimal)
    expect(result.success).toBe(true)
    expect(result.data?.fiberPer100g).toBe(0)
  })

  it('accepts a fully-populated valid input', () => {
    const result = validateInput(ManualFoodInputSchema, VALID_MANUAL_FOOD)
    expect(result.success).toBe(true)
  })

  it('rejects empty nameHe (whitespace-only after trim)', () => {
    const bad = { ...VALID_MANUAL_FOOD, nameHe: '   ' }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
  })

  it('trims whitespace from nameHe', () => {
    const padded = { ...VALID_MANUAL_FOOD, nameHe: '  מוצר  ' }
    const result = validateInput(ManualFoodInputSchema, padded)
    expect(result.success).toBe(true)
    expect(result.data?.nameHe).toBe('מוצר')
  })

  it('defaults fiberPer100g to 0 when absent', () => {
    const { fiberPer100g: _fiber, ...noFiber } = VALID_MANUAL_FOOD
    const result = validateInput(ManualFoodInputSchema, noFiber)
    expect(result.success).toBe(true)
    expect(result.data?.fiberPer100g).toBe(0)
  })

  it('rejects calories below 0', () => {
    const bad = { ...VALID_MANUAL_FOOD, caloriesPer100g: -1 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects calories above 900', () => {
    const bad = { ...VALID_MANUAL_FOOD, caloriesPer100g: 901 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects protein above 100', () => {
    const bad = { ...VALID_MANUAL_FOOD, proteinPer100g: 101 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects fat above 100', () => {
    const bad = { ...VALID_MANUAL_FOOD, fatPer100g: 101 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects carbs above 100', () => {
    const bad = { ...VALID_MANUAL_FOOD, carbsPer100g: 101 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
  })

  it('rejects p+f+c > 101 with macroSumTooHigh token', () => {
    const bad = { ...VALID_MANUAL_FOOD, proteinPer100g: 40, fatPer100g: 35, carbsPer100g: 30 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
    expect(result.errors.some((e) => e.includes('macroSumTooHigh'))).toBe(true)
  })

  it('accepts p+f+c === 101 (1g rounding slack boundary)', () => {
    const boundary = { ...VALID_MANUAL_FOOD, proteinPer100g: 34, fatPer100g: 32, carbsPer100g: 35 }
    const result = validateInput(ManualFoodInputSchema, boundary)
    expect(result.success).toBe(true)
  })

  it('accepts p+f+c === 100 (pure sugar: 0/0/100)', () => {
    const pureSugar = {
      nameHe: 'סוכר',
      caloriesPer100g: 400,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbsPer100g: 100,
    }
    const result = validateInput(ManualFoodInputSchema, pureSugar)
    expect(result.success).toBe(true)
  })

  it('accepts both serving fields filled', () => {
    const withServing = { ...VALID_MANUAL_FOOD, servingName: 'יחידה', servingGrams: 40 }
    const result = validateInput(ManualFoodInputSchema, withServing)
    expect(result.success).toBe(true)
    expect(result.data?.servingName).toBe('יחידה')
    expect(result.data?.servingGrams).toBe(40)
  })

  it('accepts both serving fields blank', () => {
    const result = validateInput(ManualFoodInputSchema, VALID_MANUAL_FOOD)
    expect(result.success).toBe(true)
    expect(result.data?.servingName).toBeUndefined()
    expect(result.data?.servingGrams).toBeUndefined()
  })

  it('rejects servingName filled without servingGrams (servingFieldsIncomplete)', () => {
    const bad = { ...VALID_MANUAL_FOOD, servingName: 'יחידה' }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
    expect(result.errors.some((e) => e.includes('servingFieldsIncomplete'))).toBe(true)
  })

  it('rejects servingGrams filled without servingName (servingFieldsIncomplete)', () => {
    const bad = { ...VALID_MANUAL_FOOD, servingGrams: 40 }
    const result = validateInput(ManualFoodInputSchema, bad)
    expect(result.success).toBe(false)
    expect(result.errors.some((e) => e.includes('servingFieldsIncomplete'))).toBe(true)
  })

  it('treats empty-string servingName as absent (both blank → accepted)', () => {
    const withEmptyName = { ...VALID_MANUAL_FOOD, servingName: '', servingGrams: undefined }
    const result = validateInput(ManualFoodInputSchema, withEmptyName)
    expect(result.success).toBe(true)
    expect(result.data?.servingName).toBeUndefined()
  })

  it('accepts nameEn blank (empty string → undefined)', () => {
    const noEn = { ...VALID_MANUAL_FOOD, nameEn: '' }
    const result = validateInput(ManualFoodInputSchema, noEn)
    expect(result.success).toBe(true)
    expect(result.data?.nameEn).toBeUndefined()
  })

  it('accepts nameEn missing entirely', () => {
    const { nameEn: _en, ...noEn } = VALID_MANUAL_FOOD
    const result = validateInput(ManualFoodInputSchema, noEn)
    expect(result.success).toBe(true)
    expect(result.data?.nameEn).toBeUndefined()
  })
})

// ── computeAtwaterDelta ──────────────────────────────────────────────

describe('computeAtwaterDelta()', () => {
  it('returns 0 delta when kcal matches Atwater estimate exactly', () => {
    // 4*10 + 9*5 + 4*20 = 40 + 45 + 80 = 165 kcal
    const result = computeAtwaterDelta(165, 10, 5, 20)
    expect(result.expected).toBe(165)
    expect(result.deltaPct).toBe(0)
  })

  it('returns ~0.25 delta when kcal is 25% above expected', () => {
    // expected = 165 kcal, entered = 206.25 (25% above)
    const result = computeAtwaterDelta(206.25, 10, 5, 20)
    expect(result.expected).toBe(165)
    expect(result.deltaPct).toBeCloseTo(0.25, 4)
  })

  it('returns ~3 delta when kJ entered as kcal (kJ ≈ 4.184 × kcal)', () => {
    // Real label: 165 kcal / ~690 kJ — user mistakenly types kJ (690) into kcal field
    const result = computeAtwaterDelta(690, 10, 5, 20)
    expect(result.expected).toBe(165)
    expect(result.deltaPct).toBeGreaterThan(3) // far above the 0.25 warn threshold
  })

  it('returns { expected: 0, deltaPct: 0 } when all macros are 0', () => {
    // Water, salt, plain coffee, erythritol — all legitimately 0 across the board
    const result = computeAtwaterDelta(0, 0, 0, 0)
    expect(result.expected).toBe(0)
    expect(result.deltaPct).toBe(0)
  })

  it('handles kcal below expected as absolute delta (not signed)', () => {
    // expected = 165, entered = 100 — delta = |100-165|/165 ≈ 0.394
    const result = computeAtwaterDelta(100, 10, 5, 20)
    expect(result.expected).toBe(165)
    expect(result.deltaPct).toBeCloseTo(0.394, 2)
  })
})
