import {
  workoutLogSchema,
  mesocycleStateSchema,
  userProfileSchema,
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
