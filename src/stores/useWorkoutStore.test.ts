import type { GeneratedWorkoutDay, GeneratedWorkoutPlan } from '../algorithms/workout-generator'
import type { DayOfWeek, LoggedSet, Mesocycle, WorkoutLog } from '../types'
import { useWorkoutStore } from './useWorkoutStore'

// ── Mock dependencies ─────────────────────────────────────────────

const mockSavePlan = jest.fn()
const mockGetActivePlan = jest.fn()
const mockDeactivatePlan = jest.fn()
const mockSaveMesocycle = jest.fn()
const mockGetActiveMesocycle = jest.fn()
const mockUpdateMesocycle = jest.fn()
const mockSaveWorkoutLog = jest.fn()
const mockGetRecentLogs = jest.fn()
const mockGetLogsByExercise = jest.fn()
const mockArchivePlan = jest.fn()
const mockGetArchivedPlans = jest.fn()

jest.mock('../db', () => ({
  workoutRepository: {
    savePlan: (...args: unknown[]) => mockSavePlan(...args),
    getActivePlan: () => mockGetActivePlan(),
    deactivatePlan: (id: string) => mockDeactivatePlan(id),
    saveMesocycle: (data: unknown) => mockSaveMesocycle(data),
    getActiveMesocycle: () => mockGetActiveMesocycle(),
    updateMesocycle: (...args: unknown[]) => mockUpdateMesocycle(...args),
    saveWorkoutLog: (data: unknown) => mockSaveWorkoutLog(data),
    getRecentLogs: (limit: number) => mockGetRecentLogs(limit),
    getLogsByExercise: (...args: unknown[]) => mockGetLogsByExercise(...args),
    archivePlan: (...args: unknown[]) => mockArchivePlan(...args),
    getArchivedPlans: () => mockGetArchivedPlans(),
  },
  todayISO: () => '2026-04-07',
  nowISO: () => '2026-04-07T09:00:00Z',
}))

const mockGenerateWorkoutPlan = jest.fn()

jest.mock('../algorithms/workout-generator', () => ({
  generateWorkoutPlan: (...args: unknown[]) => mockGenerateWorkoutPlan(...args),
}))

const mockShouldDeload = jest.fn()

jest.mock('../algorithms/volume-manager', () => ({
  shouldDeload: (...args: unknown[]) => mockShouldDeload(...args),
}))

const mockGetProgressionAdvice = jest.fn()

jest.mock('../algorithms/progressive-overload', () => ({
  getProgressionAdvice: (...args: unknown[]) => mockGetProgressionAdvice(...args),
}))

// Mock useUserStore to provide profile data
const MOCK_PROFILE = {
  id: 'user-123',
  trainingDays: [0, 2, 4] as DayOfWeek[],
  experience: 'beginner' as const,
  equipment: {
    location: 'full_gym' as const,
    availableEquipment: ['none', 'barbell', 'dumbbells', 'bench'] as const,
  },
}

jest.mock('./useUserStore', () => ({
  useUserStore: {
    getState: () => ({ profile: MOCK_PROFILE }),
  },
}))

// ── Test fixtures ─────────────────────────────────────────────────

const MOCK_TEMPLATE_A = {
  id: 'tmpl-fb-a',
  dayType: 'full_body_a' as const,
  splitType: 'full_body' as const,
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
}

const MOCK_PLAN: GeneratedWorkoutPlan = {
  splitType: 'full_body',
  reasoning: 'Best for 3 days',
  reasoningHe: 'הכי מתאים ל-3 ימים',
  mesocycleWeek: 1,
  totalMesocycleWeeks: 6,
  weeklySchedule: [
    { dayOfWeek: 0, dayType: 'full_body_a', template: MOCK_TEMPLATE_A },
    { dayOfWeek: 1, dayType: 'rest', template: null },
    {
      dayOfWeek: 2,
      dayType: 'full_body_b',
      template: {
        ...MOCK_TEMPLATE_A,
        id: 'tmpl-fb-b',
        dayType: 'full_body_b',
        nameEn: 'Full Body B',
      },
    },
    { dayOfWeek: 3, dayType: 'rest', template: null },
    {
      dayOfWeek: 4,
      dayType: 'full_body_c',
      template: {
        ...MOCK_TEMPLATE_A,
        id: 'tmpl-fb-c',
        dayType: 'full_body_c',
        nameEn: 'Full Body C',
      },
    },
    { dayOfWeek: 5, dayType: 'rest', template: null },
    { dayOfWeek: 6, dayType: 'rest', template: null },
  ],
}

const MOCK_MESOCYCLE: Mesocycle = {
  id: 'meso-1',
  startDate: '2026-04-07',
  endDate: null,
  weekNumber: 1,
  totalWeeks: 6,
  isDeloadWeek: false,
}

const MOCK_WORKOUT_LOG: WorkoutLog = {
  id: 'log-1',
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

// ── Helpers ───────────────────────────────────────────────────────

function resetStore() {
  useWorkoutStore.setState({
    plan: null,
    planId: null,
    mesocycle: null,
    dayMapping: null,
    activeSession: null,
    recentLogs: [],
    isLoading: false,
    error: null,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  resetStore()
})

// ── Phase 3: Plan Lifecycle ───────────────────────────────────────

describe('initial state', () => {
  it('has null plan, planId, mesocycle, dayMapping, activeSession', () => {
    const state = useWorkoutStore.getState()
    expect(state.plan).toBeNull()
    expect(state.planId).toBeNull()
    expect(state.mesocycle).toBeNull()
    expect(state.dayMapping).toBeNull()
    expect(state.activeSession).toBeNull()
  })

  it('has empty recentLogs', () => {
    expect(useWorkoutStore.getState().recentLogs).toEqual([])
  })

  it('is not loading and has no error', () => {
    const state = useWorkoutStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })
})

describe('generatePlan', () => {
  beforeEach(() => {
    mockGenerateWorkoutPlan.mockReturnValue(MOCK_PLAN)
    mockSavePlan.mockResolvedValue('plan-1')
    mockSaveMesocycle.mockResolvedValue(MOCK_MESOCYCLE)
  })

  it('calls generateWorkoutPlan with profile data', async () => {
    await useWorkoutStore.getState().generatePlan()

    expect(mockGenerateWorkoutPlan).toHaveBeenCalledWith(
      [0, 2, 4],
      'beginner',
      MOCK_PROFILE.equipment.availableEquipment,
    )
  })

  it('persists the plan to SQLite', async () => {
    await useWorkoutStore.getState().generatePlan()

    expect(mockSavePlan).toHaveBeenCalledWith(MOCK_PLAN, 'user-123')
  })

  it('creates a new mesocycle', async () => {
    await useWorkoutStore.getState().generatePlan()

    expect(mockSaveMesocycle).toHaveBeenCalledWith(
      expect.objectContaining({
        weekNumber: 1,
        totalWeeks: 6,
        isDeloadWeek: false,
        endDate: null,
      }),
    )
  })

  it('sets plan, planId, mesocycle, and dayMapping in state', async () => {
    await useWorkoutStore.getState().generatePlan()

    const state = useWorkoutStore.getState()
    expect(state.plan).toEqual(MOCK_PLAN)
    expect(state.planId).toBe('plan-1')
    expect(state.mesocycle).not.toBeNull()
    expect(state.mesocycle!.planId).toBe('plan-1')
    expect(state.dayMapping).not.toBeNull()
  })

  it('builds dayMapping for training days only', async () => {
    await useWorkoutStore.getState().generatePlan()

    const { dayMapping } = useWorkoutStore.getState()
    expect(dayMapping!.size).toBe(3)
    expect(dayMapping!.get(0)!.dayType).toBe('full_body_a')
    expect(dayMapping!.get(2)!.dayType).toBe('full_body_b')
    expect(dayMapping!.get(4)!.dayType).toBe('full_body_c')
    expect(dayMapping!.has(1)).toBe(false)
  })

  it('sets isLoading during operation', async () => {
    let loadingDuringCall = false
    mockSavePlan.mockImplementation(() => {
      loadingDuringCall = useWorkoutStore.getState().isLoading
      return Promise.resolve('plan-1')
    })

    await useWorkoutStore.getState().generatePlan()
    expect(loadingDuringCall).toBe(true)
    expect(useWorkoutStore.getState().isLoading).toBe(false)
  })

  it('sets error if no profile exists', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const userStore = require('./useUserStore') as { useUserStore: { getState: () => unknown } }
    const original = userStore.useUserStore.getState
    userStore.useUserStore.getState = () => ({ profile: null })

    await useWorkoutStore.getState().generatePlan()

    expect(useWorkoutStore.getState().error).toBe(
      'No user profile found. Complete onboarding first.',
    )
    userStore.useUserStore.getState = original
  })

  it('sets error on algorithm failure', async () => {
    mockGenerateWorkoutPlan.mockImplementation(() => {
      throw new Error('Algorithm failed')
    })

    await useWorkoutStore.getState().generatePlan()
    expect(useWorkoutStore.getState().error).toBe('Algorithm failed')
  })
})

describe('loadPlan', () => {
  it('loads plan + mesocycle + recent logs from SQLite', async () => {
    mockGetActivePlan.mockResolvedValue({ ...MOCK_PLAN, planId: 'plan-1' })
    mockGetActiveMesocycle.mockResolvedValue(MOCK_MESOCYCLE)
    mockGetRecentLogs.mockResolvedValue([MOCK_WORKOUT_LOG])

    await useWorkoutStore.getState().loadPlan()

    const state = useWorkoutStore.getState()
    expect(state.plan).not.toBeNull()
    expect(state.planId).toBe('plan-1')
    expect(state.mesocycle).not.toBeNull()
    expect(state.recentLogs).toHaveLength(1)
    expect(state.dayMapping).not.toBeNull()
  })

  it('sets empty state when no active plan', async () => {
    mockGetActivePlan.mockResolvedValue(null)
    mockGetActiveMesocycle.mockResolvedValue(null)
    mockGetRecentLogs.mockResolvedValue([])

    await useWorkoutStore.getState().loadPlan()

    const state = useWorkoutStore.getState()
    expect(state.plan).toBeNull()
    expect(state.planId).toBeNull()
    expect(state.mesocycle).toBeNull()
    expect(state.dayMapping).toBeNull()
  })

  it('sets error on failure', async () => {
    mockGetActivePlan.mockRejectedValue(new Error('DB error'))

    await useWorkoutStore.getState().loadPlan()
    expect(useWorkoutStore.getState().error).toBe('DB error')
  })
})

describe('regeneratePlan', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      plan: MOCK_PLAN,
      planId: 'plan-1',
      mesocycle: {
        id: 'meso-1',
        planId: 'plan-1',
        startDate: '2026-04-07',
        currentWeek: 3,
        totalWeeks: 6,
        isDeloadWeek: false,
        weekStartDate: '2026-04-07',
      },
      recentLogs: [MOCK_WORKOUT_LOG],
    })

    mockArchivePlan.mockResolvedValue(undefined)
    mockUpdateMesocycle.mockResolvedValue(undefined)
    mockGenerateWorkoutPlan.mockReturnValue(MOCK_PLAN)
    mockSavePlan.mockResolvedValue('plan-2')
    mockSaveMesocycle.mockResolvedValue({ ...MOCK_MESOCYCLE, id: 'meso-2' })
  })

  it('archives the current plan with correct planId', async () => {
    await useWorkoutStore.getState().regeneratePlan()

    expect(mockArchivePlan).toHaveBeenCalledWith(
      'plan-1',
      'full_body',
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
    )
    expect(mockGenerateWorkoutPlan).toHaveBeenCalled()
  })

  it('closes the current mesocycle', async () => {
    await useWorkoutStore.getState().regeneratePlan()

    expect(mockUpdateMesocycle).toHaveBeenCalledWith(
      'meso-1',
      expect.objectContaining({ endDate: expect.any(String) }),
    )
  })

  it('starts a fresh mesocycle at week 1', async () => {
    await useWorkoutStore.getState().regeneratePlan()

    expect(mockSaveMesocycle).toHaveBeenCalledWith(expect.objectContaining({ weekNumber: 1 }))
  })

  it('does nothing if no current plan exists', async () => {
    useWorkoutStore.setState({ plan: null, planId: null, mesocycle: null })

    await useWorkoutStore.getState().regeneratePlan()

    expect(mockArchivePlan).not.toHaveBeenCalled()
    expect(mockGenerateWorkoutPlan).toHaveBeenCalled()
  })
})

// ── Phase 4: Mesocycle ────────────────────────────────────────────

describe('advanceWeek', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      plan: MOCK_PLAN,
      mesocycle: {
        id: 'meso-1',
        planId: 'plan-1',
        startDate: '2026-04-07',
        currentWeek: 2,
        totalWeeks: 6,
        isDeloadWeek: false,
        weekStartDate: '2026-04-07',
      },
    })
    mockUpdateMesocycle.mockResolvedValue(undefined)
  })

  it('increments the current week', async () => {
    await useWorkoutStore.getState().advanceWeek()

    const { mesocycle } = useWorkoutStore.getState()
    expect(mesocycle!.currentWeek).toBe(3)
  })

  it('updates mesocycle in SQLite', async () => {
    await useWorkoutStore.getState().advanceWeek()

    expect(mockUpdateMesocycle).toHaveBeenCalledWith(
      'meso-1',
      expect.objectContaining({ weekNumber: 3 }),
    )
  })

  it('does nothing if no mesocycle exists', async () => {
    useWorkoutStore.setState({ mesocycle: null })
    await useWorkoutStore.getState().advanceWeek()
    expect(mockUpdateMesocycle).not.toHaveBeenCalled()
  })
})

describe('triggerDeload', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      plan: MOCK_PLAN,
      mesocycle: {
        id: 'meso-1',
        planId: 'plan-1',
        startDate: '2026-04-07',
        currentWeek: 4,
        totalWeeks: 6,
        isDeloadWeek: false,
        weekStartDate: '2026-04-07',
      },
    })
    mockUpdateMesocycle.mockResolvedValue(undefined)
  })

  it('sets isDeloadWeek to true', async () => {
    await useWorkoutStore.getState().triggerDeload()

    const { mesocycle } = useWorkoutStore.getState()
    expect(mesocycle!.isDeloadWeek).toBe(true)
  })

  it('updates mesocycle in SQLite with deload flag', async () => {
    await useWorkoutStore.getState().triggerDeload()

    expect(mockUpdateMesocycle).toHaveBeenCalledWith(
      'meso-1',
      expect.objectContaining({ isDeloadWeek: true }),
    )
  })
})

describe('checkWeekAdvance', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      plan: MOCK_PLAN,
      mesocycle: {
        id: 'meso-1',
        planId: 'plan-1',
        startDate: '2026-04-07',
        currentWeek: 1,
        totalWeeks: 6,
        isDeloadWeek: false,
        weekStartDate: '2026-04-07',
      },
      recentLogs: [],
    })
    mockUpdateMesocycle.mockResolvedValue(undefined)
    mockShouldDeload.mockReturnValue(false)
  })

  it('does not advance if week is incomplete and not expired', async () => {
    await useWorkoutStore.getState().checkWeekAdvance()
    expect(mockUpdateMesocycle).not.toHaveBeenCalled()
  })

  it('does nothing if no plan or mesocycle', async () => {
    useWorkoutStore.setState({ plan: null, mesocycle: null })
    await useWorkoutStore.getState().checkWeekAdvance()
    expect(mockUpdateMesocycle).not.toHaveBeenCalled()
  })

  it('advances when all workouts for the week are completed', async () => {
    // MOCK_PLAN has 3 training days — provide 3 completed logs
    useWorkoutStore.setState({
      recentLogs: [
        { ...MOCK_WORKOUT_LOG, id: 'log-1', date: '2026-04-07' },
        { ...MOCK_WORKOUT_LOG, id: 'log-2', date: '2026-04-07' },
        { ...MOCK_WORKOUT_LOG, id: 'log-3', date: '2026-04-07' },
      ],
    })

    await useWorkoutStore.getState().checkWeekAdvance()

    expect(mockUpdateMesocycle).toHaveBeenCalledWith(
      'meso-1',
      expect.objectContaining({ weekNumber: 2 }),
    )
  })

  it('advances when 7 days have elapsed since week start', async () => {
    // `todayISO()` is mocked to return '2026-04-07' (see top of file).
    // Use a weekStartDate 8 days before THAT, not before real Date.now(),
    // otherwise the expiry math runs against a mismatched reference and
    // the 7-day threshold is never crossed.
    const eightDaysBeforeMockedToday = '2026-03-30'
    useWorkoutStore.setState({
      mesocycle: {
        id: 'meso-1',
        planId: 'plan-1',
        startDate: eightDaysBeforeMockedToday,
        currentWeek: 1,
        totalWeeks: 6,
        isDeloadWeek: false,
        weekStartDate: eightDaysBeforeMockedToday,
      },
    })

    await useWorkoutStore.getState().checkWeekAdvance()

    expect(mockUpdateMesocycle).toHaveBeenCalledWith(
      'meso-1',
      expect.objectContaining({ weekNumber: 2 }),
    )
  })
})

// ── Phase 5: Workout Session ──────────────────────────────────────

describe('startWorkout', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      plan: MOCK_PLAN,
      dayMapping: new Map<DayOfWeek, GeneratedWorkoutDay>([
        [0, MOCK_PLAN.weeklySchedule[0]],
        [2, MOCK_PLAN.weeklySchedule[2]],
        [4, MOCK_PLAN.weeklySchedule[4]],
      ]),
    })
  })

  it('creates an active session with correct templateId', () => {
    useWorkoutStore.getState().startWorkout(0)

    const { activeSession } = useWorkoutStore.getState()
    expect(activeSession).not.toBeNull()
    expect(activeSession!.templateId).toBe('tmpl-fb-a')
    expect(activeSession!.workoutDayType).toBe('full_body_a')
    expect(activeSession!.currentExerciseIndex).toBe(0)
    expect(activeSession!.loggedExercises).toEqual([])
  })

  it('sets startedAt to current ISO time', () => {
    useWorkoutStore.getState().startWorkout(0)

    const { activeSession } = useWorkoutStore.getState()
    expect(activeSession!.startedAt).toBeDefined()
    expect(new Date(activeSession!.startedAt).getTime()).not.toBeNaN()
  })

  it('sets error if no workout for that day', () => {
    useWorkoutStore.getState().startWorkout(1)

    expect(useWorkoutStore.getState().activeSession).toBeNull()
    expect(useWorkoutStore.getState().error).toBe('No workout scheduled for this day.')
  })

  it('sets error if no dayMapping', () => {
    useWorkoutStore.setState({ dayMapping: null })
    useWorkoutStore.getState().startWorkout(0)

    expect(useWorkoutStore.getState().error).toBe(
      'No workout plan generated. Generate a plan first.',
    )
  })
})

describe('logSet', () => {
  const VALID_SET: LoggedSet = {
    setNumber: 1,
    weightKg: 80,
    reps: 8,
    rpe: 7,
    isWarmup: false,
  }

  beforeEach(() => {
    useWorkoutStore.setState({
      activeSession: {
        templateId: 'tmpl-fb-a',
        workoutDayType: 'full_body_a',
        startedAt: '2026-04-07T09:00:00Z',
        currentExerciseIndex: 0,
        loggedExercises: [],
      },
    })
  })

  it('appends a set to the active session', () => {
    useWorkoutStore.getState().logSet('barbell_squat', VALID_SET)

    const { activeSession } = useWorkoutStore.getState()
    expect(activeSession!.loggedExercises).toHaveLength(1)
    expect(activeSession!.loggedExercises[0].exerciseId).toBe('barbell_squat')
    expect(activeSession!.loggedExercises[0].sets).toHaveLength(1)
  })

  it('appends multiple sets to the same exercise', () => {
    useWorkoutStore.getState().logSet('barbell_squat', VALID_SET)
    useWorkoutStore.getState().logSet('barbell_squat', { ...VALID_SET, setNumber: 2 })

    const { activeSession } = useWorkoutStore.getState()
    expect(activeSession!.loggedExercises).toHaveLength(1)
    expect(activeSession!.loggedExercises[0].sets).toHaveLength(2)
  })

  it('creates separate exercise entries for different exercises', () => {
    useWorkoutStore.getState().logSet('barbell_squat', VALID_SET)
    useWorkoutStore.getState().logSet('barbell_bench_press', VALID_SET)

    const { activeSession } = useWorkoutStore.getState()
    expect(activeSession!.loggedExercises).toHaveLength(2)
  })

  it('sets error if no active session', () => {
    useWorkoutStore.setState({ activeSession: null })
    useWorkoutStore.getState().logSet('barbell_squat', VALID_SET)
    expect(useWorkoutStore.getState().error).toBe('No active workout session.')
  })
})

describe('completeExercise', () => {
  it('advances currentExerciseIndex', () => {
    useWorkoutStore.setState({
      activeSession: {
        templateId: 'tmpl-fb-a',
        workoutDayType: 'full_body_a',
        startedAt: '2026-04-07T09:00:00Z',
        currentExerciseIndex: 0,
        loggedExercises: [],
      },
    })

    useWorkoutStore.getState().completeExercise()

    expect(useWorkoutStore.getState().activeSession!.currentExerciseIndex).toBe(1)
  })

  it('does nothing if no active session', () => {
    useWorkoutStore.setState({ activeSession: null })
    useWorkoutStore.getState().completeExercise()
    expect(useWorkoutStore.getState().activeSession).toBeNull()
  })
})

describe('finishWorkout', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      activeSession: {
        templateId: 'tmpl-fb-a',
        workoutDayType: 'full_body_a',
        startedAt: '2026-04-07T09:00:00Z',
        currentExerciseIndex: 1,
        loggedExercises: [
          {
            exerciseId: 'barbell_squat',
            sets: [{ setNumber: 1, weightKg: 80, reps: 8, rpe: 7, isWarmup: false }],
            notes: '',
          },
        ],
      },
      plan: MOCK_PLAN,
      recentLogs: [],
    })

    mockSaveWorkoutLog.mockResolvedValue(MOCK_WORKOUT_LOG)
  })

  it('persists the workout log with correct templateId', async () => {
    await useWorkoutStore.getState().finishWorkout()

    expect(mockSaveWorkoutLog).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'tmpl-fb-a',
        dayType: 'full_body_a',
        startedAt: '2026-04-07T09:00:00Z',
        exercises: expect.arrayContaining([
          expect.objectContaining({ exerciseId: 'barbell_squat' }),
        ]),
      }),
    )
  })

  it('clears the active session', async () => {
    await useWorkoutStore.getState().finishWorkout()
    expect(useWorkoutStore.getState().activeSession).toBeNull()
  })

  it('adds the log to recentLogs', async () => {
    await useWorkoutStore.getState().finishWorkout()
    expect(useWorkoutStore.getState().recentLogs).toHaveLength(1)
  })

  it('sets completedAt to current time', async () => {
    await useWorkoutStore.getState().finishWorkout()

    const logCall = mockSaveWorkoutLog.mock.calls[0][0]
    expect(logCall.completedAt).toBeDefined()
    expect(new Date(logCall.completedAt).getTime()).not.toBeNaN()
  })

  it('sets error if no active session', async () => {
    useWorkoutStore.setState({ activeSession: null })
    await useWorkoutStore.getState().finishWorkout()
    expect(useWorkoutStore.getState().error).toBe('No active workout session.')
  })
})

describe('abandonWorkout', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      activeSession: {
        templateId: 'tmpl-fb-a',
        workoutDayType: 'full_body_a',
        startedAt: '2026-04-07T09:00:00Z',
        currentExerciseIndex: 0,
        loggedExercises: [
          {
            exerciseId: 'barbell_squat',
            sets: [{ setNumber: 1, weightKg: 80, reps: 8, rpe: 7, isWarmup: false }],
            notes: '',
          },
        ],
      },
      plan: MOCK_PLAN,
      recentLogs: [],
    })

    mockSaveWorkoutLog.mockResolvedValue({ ...MOCK_WORKOUT_LOG, completedAt: null })
  })

  it('persists with completedAt = null', async () => {
    await useWorkoutStore.getState().abandonWorkout()

    const logCall = mockSaveWorkoutLog.mock.calls[0][0]
    expect(logCall.completedAt).toBeNull()
  })

  it('clears the active session', async () => {
    await useWorkoutStore.getState().abandonWorkout()
    expect(useWorkoutStore.getState().activeSession).toBeNull()
  })

  it('does nothing if no active session', async () => {
    useWorkoutStore.setState({ activeSession: null })
    await useWorkoutStore.getState().abandonWorkout()
    expect(mockSaveWorkoutLog).not.toHaveBeenCalled()
  })
})

// ── Phase 6: Computed ─────────────────────────────────────────────

describe('getTodaysWorkout', () => {
  it('returns the workout for today from dayMapping', () => {
    const todayDow = new Date().getDay() as DayOfWeek
    const mockDay: GeneratedWorkoutDay = {
      dayOfWeek: todayDow,
      dayType: 'full_body_a',
      template: MOCK_TEMPLATE_A,
    }

    useWorkoutStore.setState({
      dayMapping: new Map<DayOfWeek, GeneratedWorkoutDay>([[todayDow, mockDay]]),
    })

    const result = useWorkoutStore.getState().getTodaysWorkout()
    expect(result).not.toBeNull()
    expect(result!.dayType).toBe('full_body_a')
  })

  it('returns null if no workout today', () => {
    useWorkoutStore.setState({
      dayMapping: new Map<DayOfWeek, GeneratedWorkoutDay>(),
    })

    const result = useWorkoutStore.getState().getTodaysWorkout()
    expect(result).toBeNull()
  })

  it('returns null if no dayMapping', () => {
    useWorkoutStore.setState({ dayMapping: null })
    expect(useWorkoutStore.getState().getTodaysWorkout()).toBeNull()
  })
})

describe('getCompletedThisWeek', () => {
  it('returns logs from current week', () => {
    const today = new Date().toISOString().split('T')[0]
    useWorkoutStore.setState({
      recentLogs: [{ ...MOCK_WORKOUT_LOG, date: today, completedAt: '2026-04-07T10:00:00Z' }],
      mesocycle: {
        id: 'meso-1',
        planId: 'plan-1',
        startDate: '2026-04-07',
        currentWeek: 1,
        totalWeeks: 6,
        isDeloadWeek: false,
        weekStartDate: today,
      },
    })

    const result = useWorkoutStore.getState().getCompletedThisWeek()
    expect(result).toHaveLength(1)
  })

  it('returns empty array if no mesocycle', () => {
    useWorkoutStore.setState({ mesocycle: null })
    expect(useWorkoutStore.getState().getCompletedThisWeek()).toEqual([])
  })
})

describe('getProgressionAdvice', () => {
  it('returns advice from algorithm for known exercise', async () => {
    // Repository now returns LoggedSet[] (not raw rows)
    mockGetLogsByExercise.mockResolvedValue([
      { setNumber: 1, weightKg: 80, reps: 8, rpe: 7, isWarmup: false },
    ])
    mockGetProgressionAdvice.mockReturnValue({
      exerciseId: 'barbell_squat',
      action: 'stay',
      suggestedWeightKg: 80,
      reason: 'Keep current weight',
      reasonHe: 'שמור על המשקל',
    })

    useWorkoutStore.setState({ plan: MOCK_PLAN })

    const result = await useWorkoutStore.getState().getProgressionAdvice('barbell_squat')
    expect(result).not.toBeNull()
    expect(result!.action).toBe('stay')
  })

  it('returns null when no logs exist for exercise', async () => {
    mockGetLogsByExercise.mockResolvedValue([])

    useWorkoutStore.setState({ plan: MOCK_PLAN })

    const result = await useWorkoutStore.getState().getProgressionAdvice('barbell_squat')
    expect(result).toBeNull()
  })

  it('returns null when no plan exists', async () => {
    mockGetLogsByExercise.mockResolvedValue([
      { setNumber: 1, weightKg: 80, reps: 8, rpe: 7, isWarmup: false },
    ])

    useWorkoutStore.setState({ plan: null })

    const result = await useWorkoutStore.getState().getProgressionAdvice('barbell_squat')
    expect(result).toBeNull()
  })

  it('returns null when exercise not in plan', async () => {
    mockGetLogsByExercise.mockResolvedValue([
      { setNumber: 1, weightKg: 80, reps: 8, rpe: 7, isWarmup: false },
    ])

    useWorkoutStore.setState({ plan: MOCK_PLAN })

    const result = await useWorkoutStore.getState().getProgressionAdvice('unknown_exercise')
    expect(result).toBeNull()
  })
})

describe('getArchivedPlans', () => {
  it('delegates to repository', async () => {
    mockGetArchivedPlans.mockResolvedValue([
      {
        id: 'arch-1',
        splitType: 'full_body',
        mesocycleWeeks: 6,
        workoutsCompleted: 12,
        archivedAt: '2026-04-07T10:00:00Z',
      },
    ])

    const result = await useWorkoutStore.getState().getArchivedPlans()
    expect(result).toHaveLength(1)
    expect(mockGetArchivedPlans).toHaveBeenCalled()
  })
})
