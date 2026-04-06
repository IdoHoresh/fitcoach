import type { GeneratedWorkoutPlan } from '../algorithms/workout-generator'
import type { Mesocycle, WorkoutLog } from '../types'
import { workoutRepository } from './workout-repository'

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

const MOCK_PLAN: GeneratedWorkoutPlan = {
  splitType: 'full_body',
  reasoning: 'Best for 3 days',
  reasoningHe: 'הכי מתאים ל-3 ימים',
  mesocycleWeek: 1,
  totalMesocycleWeeks: 6,
  weeklySchedule: [
    {
      dayOfWeek: 0,
      dayType: 'full_body_a',
      template: {
        id: 'tmpl-fb-a',
        dayType: 'full_body_a',
        splitType: 'full_body',
        nameHe: 'אימון A',
        nameEn: 'Full Body A',
        exercises: [
          {
            exerciseId: 'barbell_squat',
            sets: 3,
            minReps: 6,
            maxReps: 10,
            restSeconds: 180,
            order: 1,
          },
        ],
        estimatedMinutes: 60,
      },
    },
    { dayOfWeek: 1, dayType: 'rest', template: null },
    {
      dayOfWeek: 2,
      dayType: 'full_body_b',
      template: {
        id: 'tmpl-fb-b',
        dayType: 'full_body_b',
        splitType: 'full_body',
        nameHe: 'אימון B',
        nameEn: 'Full Body B',
        exercises: [
          {
            exerciseId: 'barbell_rdl',
            sets: 3,
            minReps: 8,
            maxReps: 12,
            restSeconds: 150,
            order: 1,
          },
        ],
        estimatedMinutes: 55,
      },
    },
    { dayOfWeek: 3, dayType: 'rest', template: null },
    { dayOfWeek: 4, dayType: 'rest', template: null },
    { dayOfWeek: 5, dayType: 'rest', template: null },
    { dayOfWeek: 6, dayType: 'rest', template: null },
  ],
}

const MOCK_WORKOUT_LOG: Omit<WorkoutLog, 'id'> = {
  date: '2026-04-07',
  templateId: 'tmpl-fb-a',
  dayType: 'full_body_a',
  startedAt: '2026-04-07T09:00:00Z',
  completedAt: '2026-04-07T10:15:00Z',
  exercises: [
    {
      exerciseId: 'barbell_squat',
      sets: [
        { setNumber: 1, weightKg: 80, reps: 8, rpe: 7, isWarmup: false },
        { setNumber: 2, weightKg: 80, reps: 7, rpe: 8, isWarmup: false },
      ],
      notes: '',
    },
  ],
  durationMinutes: 75,
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── savePlan ──────────────────────────────────────────────────────

describe('savePlan', () => {
  it('inserts plan row with correct fields', async () => {
    await workoutRepository.savePlan(MOCK_PLAN, 'user-123')

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO workout_plan'),
      expect.arrayContaining(['user-123', 'full_body']),
    )
  })

  it('inserts template rows for non-rest days only', async () => {
    await workoutRepository.savePlan(MOCK_PLAN, 'user-123')

    const templateInserts = mockRunAsync.mock.calls.filter(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO workout_template'),
    )
    // 2 training days in MOCK_PLAN (full_body_a, full_body_b)
    expect(templateInserts).toHaveLength(2)
  })

  it('inserts exercise prescription rows for each exercise', async () => {
    await workoutRepository.savePlan(MOCK_PLAN, 'user-123')

    const prescriptionInserts = mockRunAsync.mock.calls.filter(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO exercise_prescription'),
    )
    // 1 exercise per template × 2 templates = 2 prescriptions
    expect(prescriptionInserts).toHaveLength(2)
  })

  it('runs within a transaction', async () => {
    await workoutRepository.savePlan(MOCK_PLAN, 'user-123')
    expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
  })

  it('stores the weekly schedule as JSON', async () => {
    await workoutRepository.savePlan(MOCK_PLAN, 'user-123')

    const planInsert = mockRunAsync.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO workout_plan'),
    )
    const params = planInsert![1] as unknown[]
    // The JSON schedule should be in the params
    const jsonParam = params.find((p) => typeof p === 'string' && p.includes('full_body_a'))
    expect(jsonParam).toBeDefined()
  })
})

// ── getActivePlan ─────────────────────────────────────────────────

describe('getActivePlan', () => {
  it('returns null when no active plan exists', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null)
    const result = await workoutRepository.getActivePlan()
    expect(result).toBeNull()
  })

  it('returns parsed plan when active plan exists', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'plan-1',
      user_id: 'user-123',
      split_type: 'full_body',
      created_at: '2026-04-07T09:00:00Z',
      is_active: 1,
      weekly_schedule_json: JSON.stringify(MOCK_PLAN.weeklySchedule),
      mesocycle_week: 1,
      total_mesocycle_weeks: 6,
      reasoning: 'Best for 3 days',
      reasoning_he: 'הכי מתאים ל-3 ימים',
    })

    const result = await workoutRepository.getActivePlan()
    expect(result).not.toBeNull()
    expect(result!.planId).toBe('plan-1')
    expect(result!.splitType).toBe('full_body')
    expect(result!.weeklySchedule).toHaveLength(7)
  })

  it('queries for is_active = 1', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null)
    await workoutRepository.getActivePlan()

    expect(mockGetFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('is_active = 1'),
      expect.anything(),
    )
  })
})

// ── deactivatePlan ────────────────────────────────────────────────

describe('deactivatePlan', () => {
  it('sets is_active to 0 for the given plan', async () => {
    await workoutRepository.deactivatePlan('plan-1')

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE workout_plan'),
      expect.arrayContaining(['plan-1']),
    )
  })
})

// ── saveMesocycle ─────────────────────────────────────────────────

describe('saveMesocycle', () => {
  const mesocycle: Omit<Mesocycle, 'id'> = {
    startDate: '2026-04-07',
    endDate: null,
    weekNumber: 1,
    totalWeeks: 6,
    isDeloadWeek: false,
  }

  it('inserts a new mesocycle row', async () => {
    const result = await workoutRepository.saveMesocycle(mesocycle)

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO mesocycle'),
      expect.arrayContaining(['2026-04-07', 1, 6]),
    )
    expect(result.id).toBeDefined()
    expect(result.startDate).toBe('2026-04-07')
  })
})

// ── getActiveMesocycle ────────────────────────────────────────────

describe('getActiveMesocycle', () => {
  it('returns null when no active mesocycle', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null)
    const result = await workoutRepository.getActiveMesocycle()
    expect(result).toBeNull()
  })

  it('returns mapped mesocycle when found', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'meso-1',
      start_date: '2026-04-07',
      end_date: null,
      week_number: 2,
      total_weeks: 6,
      is_deload_week: 0,
    })

    const result = await workoutRepository.getActiveMesocycle()
    expect(result).not.toBeNull()
    expect(result!.weekNumber).toBe(2)
    expect(result!.isDeloadWeek).toBe(false)
    expect(result!.endDate).toBeNull()
  })

  it('queries for end_date IS NULL', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null)
    await workoutRepository.getActiveMesocycle()

    expect(mockGetFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('end_date IS NULL'),
      expect.anything(),
    )
  })
})

// ── updateMesocycle ───────────────────────────────────────────────

describe('updateMesocycle', () => {
  const CURRENT_ROW = {
    id: 'meso-1',
    start_date: '2026-04-07',
    end_date: null,
    week_number: 1,
    total_weeks: 6,
    is_deload_week: 0,
  }

  beforeEach(() => {
    mockGetFirstAsync.mockResolvedValueOnce(CURRENT_ROW)
  })

  it('updates week_number while preserving other fields', async () => {
    await workoutRepository.updateMesocycle('meso-1', { weekNumber: 3 })

    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('UPDATE mesocycle'), [
      3,
      0,
      null,
      'meso-1',
    ])
  })

  it('can set end_date to close a mesocycle', async () => {
    await workoutRepository.updateMesocycle('meso-1', { endDate: '2026-05-18' })

    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('UPDATE mesocycle'), [
      1,
      0,
      '2026-05-18',
      'meso-1',
    ])
  })

  it('does nothing if mesocycle not found', async () => {
    // Clear the beforeEach mock and return null
    mockGetFirstAsync.mockReset()
    mockGetFirstAsync.mockResolvedValueOnce(null)

    await workoutRepository.updateMesocycle('nonexistent', { weekNumber: 2 })

    expect(mockRunAsync).not.toHaveBeenCalled()
  })
})

// ── saveWorkoutLog ────────────────────────────────────────────────

describe('saveWorkoutLog', () => {
  it('inserts workout_log row', async () => {
    await workoutRepository.saveWorkoutLog(MOCK_WORKOUT_LOG)

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO workout_log'),
      expect.arrayContaining(['2026-04-07', 'tmpl-fb-a', 'full_body_a']),
    )
  })

  it('inserts set_log rows for each set', async () => {
    await workoutRepository.saveWorkoutLog(MOCK_WORKOUT_LOG)

    const setInserts = mockRunAsync.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('INSERT INTO set_log'),
    )
    // 2 sets for 1 exercise
    expect(setInserts).toHaveLength(2)
  })

  it('runs within a transaction', async () => {
    await workoutRepository.saveWorkoutLog(MOCK_WORKOUT_LOG)
    expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
  })

  it('returns the log with a generated id', async () => {
    const result = await workoutRepository.saveWorkoutLog(MOCK_WORKOUT_LOG)
    expect(result.id).toBeDefined()
    expect(result.date).toBe('2026-04-07')
  })
})

// ── getRecentLogs ─────────────────────────────────────────────────

describe('getRecentLogs', () => {
  it('returns empty array when no logs exist', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])
    const result = await workoutRepository.getRecentLogs(20)
    expect(result).toEqual([])
  })

  it('returns mapped workout logs with sets', async () => {
    mockGetAllAsync
      // First call: workout_log rows
      .mockResolvedValueOnce([
        {
          id: 'log-1',
          date: '2026-04-07',
          template_id: 'tmpl-fb-a',
          day_type: 'full_body_a',
          started_at: '2026-04-07T09:00:00Z',
          completed_at: '2026-04-07T10:15:00Z',
          duration_minutes: 75,
        },
      ])
      // Second call: set_log rows for log-1
      .mockResolvedValueOnce([
        {
          id: 'set-1',
          workout_log_id: 'log-1',
          exercise_id: 'barbell_squat',
          set_number: 1,
          weight_kg: 80,
          reps: 8,
          rpe: 7,
          is_warmup: 0,
          notes: '',
        },
      ])

    const result = await workoutRepository.getRecentLogs(20)
    expect(result).toHaveLength(1)
    expect(result[0].exercises).toHaveLength(1)
    expect(result[0].exercises[0].sets).toHaveLength(1)
    expect(result[0].exercises[0].sets[0].weightKg).toBe(80)
  })

  it('passes the limit parameter', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])
    await workoutRepository.getRecentLogs(10)

    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      expect.arrayContaining([10]),
    )
  })
})

// ── getLogsByExercise ─────────────────────────────────────────────

describe('getLogsByExercise', () => {
  it('returns empty array when no logs for exercise', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])
    const result = await workoutRepository.getLogsByExercise('barbell_squat', 5)
    expect(result).toEqual([])
  })

  it('queries by exercise_id with limit', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])
    await workoutRepository.getLogsByExercise('barbell_squat', 5)

    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('exercise_id = ?'),
      expect.arrayContaining(['barbell_squat', 5]),
    )
  })

  it('maps DB rows to LoggedSet domain objects', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'set-1',
        workout_log_id: 'log-1',
        exercise_id: 'barbell_squat',
        set_number: 1,
        weight_kg: 80,
        reps: 8,
        rpe: 7,
        is_warmup: 0,
        notes: '',
      },
    ])

    const result = await workoutRepository.getLogsByExercise('barbell_squat', 5)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      setNumber: 1,
      weightKg: 80,
      reps: 8,
      rpe: 7,
      isWarmup: false,
    })
  })
})

// ── archivePlan ───────────────────────────────────────────────────

describe('archivePlan', () => {
  it('inserts into archived_plan table', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]) // no logs to archive

    await workoutRepository.archivePlan(
      'plan-1',
      'full_body',
      6,
      0,
      JSON.stringify(MOCK_PLAN.weeklySchedule),
    )

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO archived_plan'),
      expect.arrayContaining(['plan-1', 'full_body', 6, 0]),
    )
  })

  it('copies existing workout logs to archive', async () => {
    // Mock existing logs for this plan's templates
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'log-1',
        date: '2026-04-07',
        template_id: 'tmpl-fb-a',
        day_type: 'full_body_a',
        started_at: '2026-04-07T09:00:00Z',
        completed_at: '2026-04-07T10:15:00Z',
        duration_minutes: 75,
      },
    ])

    await workoutRepository.archivePlan(
      'plan-1',
      'full_body',
      6,
      1,
      JSON.stringify(MOCK_PLAN.weeklySchedule),
    )

    const archiveLogInserts = mockRunAsync.mock.calls.filter(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO archived_workout_log'),
    )
    expect(archiveLogInserts).toHaveLength(1)
  })

  it('runs within a transaction', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])

    await workoutRepository.archivePlan(
      'plan-1',
      'full_body',
      6,
      0,
      JSON.stringify(MOCK_PLAN.weeklySchedule),
    )

    expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
  })
})

// ── getArchivedPlans ──────────────────────────────────────────────

describe('getArchivedPlans', () => {
  it('returns empty array when no archives', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])
    const result = await workoutRepository.getArchivedPlans()
    expect(result).toEqual([])
  })

  it('returns mapped archived plans', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'arch-1',
        plan_id: 'plan-1',
        split_type: 'full_body',
        mesocycle_weeks: 6,
        workouts_completed: 12,
        weekly_schedule_json: '[]',
        archived_at: '2026-04-07T10:00:00Z',
      },
    ])

    const result = await workoutRepository.getArchivedPlans()
    expect(result).toHaveLength(1)
    expect(result[0].splitType).toBe('full_body')
    expect(result[0].workoutsCompleted).toBe(12)
    expect(result[0].archivedAt).toBe('2026-04-07T10:00:00Z')
  })
})
