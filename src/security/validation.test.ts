import { workoutLogSchema, mesocycleStateSchema, validateInput } from './validation'

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
