import { useUserStore } from './useUserStore'
import type { UserProfile } from '../types'

// ── Mock the database layer ────────────────────────────────────────
// We test store logic only — SQLite calls are mocked.

const mockGetProfile = jest.fn()
const mockSaveProfile = jest.fn()
const mockGetCoachMarksCompleted = jest.fn()
const mockSetCoachMarksCompleted = jest.fn()

jest.mock('../db', () => ({
  userRepository: {
    getProfile: () => mockGetProfile(),
    saveProfile: (data: unknown) => mockSaveProfile(data),
    getCoachMarksCompleted: () => mockGetCoachMarksCompleted(),
    setCoachMarksCompleted: (value: boolean) => mockSetCoachMarksCompleted(value),
  },
}))

// ── Test fixtures ──────────────────────────────────────────────────

const COMPLETE_DRAFT: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'דני',
  heightCm: 189,
  weightKg: 113,
  age: 30,
  sex: 'male',
  bodyFatPercent: null,
  goal: 'fat_loss',
  experience: 'beginner',
  trainingDays: [0, 2, 4],
  equipment: {
    location: 'full_gym',
    availableEquipment: ['none', 'barbell', 'dumbbells', 'bench'],
  },
  lifestyle: {
    occupation: 'desk',
    dailySteps: 5500,
    afterWorkActivity: 'sedentary',
    exerciseDaysPerWeek: 3,
    exerciseType: 'strength',
    sessionDurationMinutes: 60,
    exerciseIntensity: 'light',
    sleepHoursPerNight: 7,
  },
  workoutTime: 'flexible',
}

const SAVED_PROFILE: UserProfile = {
  id: 'test-id-123',
  createdAt: '2026-04-06T12:00:00Z',
  updatedAt: '2026-04-06T12:00:00Z',
  ...COMPLETE_DRAFT,
}

// ── Reset store between tests ──────────────────────────────────────

beforeEach(() => {
  // Reset Zustand store to initial state
  useUserStore.setState({
    profile: null,
    tdeeBreakdown: null,
    isOnboarded: false,
    coachMarksCompleted: false,
    isLoading: false,
    error: null,
    draft: {},
  })
  jest.clearAllMocks()
  // Default: no coach marks state in DB
  mockGetCoachMarksCompleted.mockResolvedValue(false)
  mockSetCoachMarksCompleted.mockResolvedValue(undefined)
})

// ── Draft management ───────────────────────────────────────────────

describe('draft management', () => {
  it('starts_with_empty_draft', () => {
    const { draft } = useUserStore.getState()
    expect(draft).toEqual({})
  })

  it('updateDraft_accumulates_fields', () => {
    const { updateDraft } = useUserStore.getState()

    updateDraft({ heightCm: 189 })
    expect(useUserStore.getState().draft.heightCm).toBe(189)

    updateDraft({ weightKg: 113 })
    expect(useUserStore.getState().draft.heightCm).toBe(189)
    expect(useUserStore.getState().draft.weightKg).toBe(113)
  })

  it('updateDraft_overwrites_existing_fields', () => {
    const { updateDraft } = useUserStore.getState()

    updateDraft({ heightCm: 180 })
    updateDraft({ heightCm: 189 })
    expect(useUserStore.getState().draft.heightCm).toBe(189)
  })

  it('updateDraft_handles_nested_objects', () => {
    const { updateDraft } = useUserStore.getState()

    updateDraft({
      equipment: {
        location: 'full_gym',
        availableEquipment: ['none', 'barbell'],
      },
    })
    expect(useUserStore.getState().draft.equipment?.location).toBe('full_gym')
  })

  it('resetDraft_clears_all_fields', () => {
    const { updateDraft, resetDraft } = useUserStore.getState()

    updateDraft({ heightCm: 189, weightKg: 113 })
    resetDraft()
    expect(useUserStore.getState().draft).toEqual({})
  })
})

// ── completeOnboarding ─────────────────────────────────────────────

describe('completeOnboarding', () => {
  it('saves_profile_and_sets_isOnboarded', async () => {
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)

    updateDraft(COMPLETE_DRAFT)
    await useUserStore.getState().completeOnboarding()

    const state = useUserStore.getState()
    expect(state.isOnboarded).toBe(true)
    expect(state.profile).toEqual(SAVED_PROFILE)
  })

  it('calls_saveProfile_on_repository', async () => {
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)

    updateDraft(COMPLETE_DRAFT)
    await useUserStore.getState().completeOnboarding()

    expect(mockSaveProfile).toHaveBeenCalledTimes(1)
  })

  it('calculates_tdee_breakdown_after_saving', async () => {
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)

    updateDraft(COMPLETE_DRAFT)
    await useUserStore.getState().completeOnboarding()

    const { tdeeBreakdown } = useUserStore.getState()
    expect(tdeeBreakdown).not.toBeNull()
    expect(tdeeBreakdown!.bmr).toBeGreaterThan(0)
    expect(tdeeBreakdown!.neat).toBeGreaterThan(0)
    expect(tdeeBreakdown!.total).toBe(
      tdeeBreakdown!.bmr + tdeeBreakdown!.neat + tdeeBreakdown!.eat + tdeeBreakdown!.tef,
    )
  })

  it('clears_draft_after_completing', async () => {
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)

    updateDraft(COMPLETE_DRAFT)
    await useUserStore.getState().completeOnboarding()

    expect(useUserStore.getState().draft).toEqual({})
  })

  it('is_idempotent_when_already_onboarded', async () => {
    // Regression: if plan generation fails AFTER completeOnboarding succeeds,
    // retry used to call completeOnboarding a second time — but draft was
    // already cleared to {}, so validateDraft failed and the user got stuck
    // with "Missing required profile fields". Idempotent short-circuit fixes
    // this: on re-entry, if already onboarded, do nothing (plans can retry
    // independently).
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)

    updateDraft(COMPLETE_DRAFT)
    await useUserStore.getState().completeOnboarding()
    expect(useUserStore.getState().isOnboarded).toBe(true)
    expect(mockSaveProfile).toHaveBeenCalledTimes(1)

    // Second call with the now-empty draft — must NOT error, must NOT re-save.
    await useUserStore.getState().completeOnboarding()

    const state = useUserStore.getState()
    expect(state.error).toBeNull()
    expect(state.isOnboarded).toBe(true)
    expect(mockSaveProfile).toHaveBeenCalledTimes(1)
  })

  it('derives_exerciseDaysPerWeek_from_trainingDays_length', async () => {
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)

    // Set trainingDays to 5 days but exerciseDaysPerWeek to a different value
    updateDraft({
      ...COMPLETE_DRAFT,
      trainingDays: [0, 1, 2, 3, 4],
      lifestyle: {
        ...COMPLETE_DRAFT.lifestyle,
        exerciseDaysPerWeek: 2, // intentionally wrong — should be overridden
      },
    })

    await useUserStore.getState().completeOnboarding()

    const savedArg = mockSaveProfile.mock.calls[0][0]
    expect(savedArg.lifestyle.exerciseDaysPerWeek).toBe(5)
  })

  it('sets_isLoading_during_save', async () => {
    const { updateDraft } = useUserStore.getState()

    // Create a promise we control
    let resolvePromise: (value: UserProfile) => void
    mockSaveProfile.mockReturnValue(
      new Promise<UserProfile>((resolve) => {
        resolvePromise = resolve
      }),
    )

    updateDraft(COMPLETE_DRAFT)
    const onboardingPromise = useUserStore.getState().completeOnboarding()

    // Should be loading while saving
    expect(useUserStore.getState().isLoading).toBe(true)

    resolvePromise!(SAVED_PROFILE)
    await onboardingPromise

    // Should stop loading after save
    expect(useUserStore.getState().isLoading).toBe(false)
  })
})

// ── loadProfile ────────────────────────────────────────────────────

describe('loadProfile', () => {
  it('loads_existing_profile_and_sets_isOnboarded', async () => {
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)

    await useUserStore.getState().loadProfile()

    const state = useUserStore.getState()
    expect(state.profile).toEqual(SAVED_PROFILE)
    expect(state.isOnboarded).toBe(true)
  })

  it('sets_isOnboarded_false_when_no_profile', async () => {
    mockGetProfile.mockResolvedValue(null)

    await useUserStore.getState().loadProfile()

    const state = useUserStore.getState()
    expect(state.profile).toBeNull()
    expect(state.isOnboarded).toBe(false)
  })

  it('recalculates_tdee_from_loaded_profile', async () => {
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)

    await useUserStore.getState().loadProfile()

    const { tdeeBreakdown } = useUserStore.getState()
    expect(tdeeBreakdown).not.toBeNull()
    expect(tdeeBreakdown!.total).toBeGreaterThan(0)
  })

  it('does_not_calculate_tdee_when_no_profile', async () => {
    mockGetProfile.mockResolvedValue(null)

    await useUserStore.getState().loadProfile()

    expect(useUserStore.getState().tdeeBreakdown).toBeNull()
  })

  it('sets_isLoading_during_load', async () => {
    let resolvePromise: (value: UserProfile | null) => void
    mockGetProfile.mockReturnValue(
      new Promise<UserProfile | null>((resolve) => {
        resolvePromise = resolve
      }),
    )

    const loadPromise = useUserStore.getState().loadProfile()
    expect(useUserStore.getState().isLoading).toBe(true)

    resolvePromise!(SAVED_PROFILE)
    await loadPromise

    expect(useUserStore.getState().isLoading).toBe(false)
  })
})

// ── updateProfile ──────────────────────────────────────────────────

describe('updateProfile', () => {
  it('updates_profile_and_recalculates_tdee', async () => {
    // First load a profile
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)
    await useUserStore.getState().loadProfile()

    const originalTdee = useUserStore.getState().tdeeBreakdown!.total

    // Update to a more active lifestyle
    const updatedProfile: UserProfile = {
      ...SAVED_PROFILE,
      lifestyle: {
        ...SAVED_PROFILE.lifestyle,
        occupation: 'active',
        exerciseDaysPerWeek: 5,
      },
    }
    mockSaveProfile.mockResolvedValue(updatedProfile)

    await useUserStore.getState().updateProfile({
      lifestyle: {
        ...SAVED_PROFILE.lifestyle,
        occupation: 'active',
        exerciseDaysPerWeek: 5,
      },
    })

    const newTdee = useUserStore.getState().tdeeBreakdown!.total
    expect(newTdee).toBeGreaterThan(originalTdee)
  })

  it('saves_to_repository', async () => {
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)
    await useUserStore.getState().loadProfile()

    mockSaveProfile.mockResolvedValue({ ...SAVED_PROFILE, goal: 'muscle_gain' })

    await useUserStore.getState().updateProfile({ goal: 'muscle_gain' })

    expect(mockSaveProfile).toHaveBeenCalled()
  })

  it('does_nothing_when_no_profile_loaded', async () => {
    await useUserStore.getState().updateProfile({ goal: 'muscle_gain' })

    expect(mockSaveProfile).not.toHaveBeenCalled()
    expect(useUserStore.getState().profile).toBeNull()
  })

  it('sets_error_when_save_fails', async () => {
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)
    await useUserStore.getState().loadProfile()

    mockSaveProfile.mockRejectedValue(new Error('DB write failed'))

    await useUserStore.getState().updateProfile({ goal: 'muscle_gain' })

    expect(useUserStore.getState().error).toBe('DB write failed')
  })
})

// ── Draft validation ───────────────────────────────────────────────

describe('draft validation', () => {
  it('blocks_onboarding_when_draft_is_incomplete', async () => {
    const { updateDraft } = useUserStore.getState()

    // Only fill some fields — missing goal, experience, etc.
    updateDraft({ heightCm: 189, weightKg: 113 })

    await useUserStore.getState().completeOnboarding()

    const state = useUserStore.getState()
    expect(state.isOnboarded).toBe(false)
    expect(state.error).toContain('Missing required')
    expect(mockSaveProfile).not.toHaveBeenCalled()
  })

  it('clears_error_when_draft_is_updated', async () => {
    // Trigger an error first
    const { updateDraft } = useUserStore.getState()
    updateDraft({ heightCm: 189 })
    await useUserStore.getState().completeOnboarding()
    expect(useUserStore.getState().error).not.toBeNull()

    // Updating draft should clear the error
    useUserStore.getState().updateDraft({ weightKg: 113 })
    expect(useUserStore.getState().error).toBeNull()
  })

  it('clears_error_when_draft_is_reset', async () => {
    const { updateDraft } = useUserStore.getState()
    updateDraft({ heightCm: 189 })
    await useUserStore.getState().completeOnboarding()

    useUserStore.getState().resetDraft()
    expect(useUserStore.getState().error).toBeNull()
  })
})

// ── Error handling ─────────────────────────────────────────────────

describe('error handling', () => {
  it('sets_error_when_completeOnboarding_save_fails', async () => {
    const { updateDraft } = useUserStore.getState()
    mockSaveProfile.mockRejectedValue(new Error('SQLite error'))

    updateDraft(COMPLETE_DRAFT)
    await useUserStore.getState().completeOnboarding()

    const state = useUserStore.getState()
    expect(state.error).toBe('SQLite error')
    expect(state.isOnboarded).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('sets_error_when_loadProfile_fails', async () => {
    mockGetProfile.mockRejectedValue(new Error('DB read failed'))

    await useUserStore.getState().loadProfile()

    const state = useUserStore.getState()
    expect(state.error).toBe('DB read failed')
    expect(state.isLoading).toBe(false)
  })

  it('clears_error_on_successful_action', async () => {
    // First cause an error
    mockGetProfile.mockRejectedValue(new Error('temporary failure'))
    await useUserStore.getState().loadProfile()
    expect(useUserStore.getState().error).not.toBeNull()

    // Now succeed
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)
    await useUserStore.getState().loadProfile()
    expect(useUserStore.getState().error).toBeNull()
  })

  it('handles_non_error_throws', async () => {
    mockGetProfile.mockRejectedValue('string error')

    await useUserStore.getState().loadProfile()

    expect(useUserStore.getState().error).toBe('Failed to load profile')
  })
})

// ── coachMarksCompleted ────────────────────────────────────────────

describe('coachMarksCompleted', () => {
  it('defaults_to_false', () => {
    expect(useUserStore.getState().coachMarksCompleted).toBe(false)
  })

  it('stays_false_after_completeOnboarding_so_tour_can_run', async () => {
    mockSaveProfile.mockResolvedValue(SAVED_PROFILE)
    useUserStore.getState().updateDraft(COMPLETE_DRAFT)

    await useUserStore.getState().completeOnboarding()

    expect(useUserStore.getState().isOnboarded).toBe(true)
    expect(useUserStore.getState().coachMarksCompleted).toBe(false)
  })

  it('hydrates_from_repository_in_loadProfile', async () => {
    mockGetProfile.mockResolvedValue(SAVED_PROFILE)
    mockGetCoachMarksCompleted.mockResolvedValue(true)

    await useUserStore.getState().loadProfile()

    expect(useUserStore.getState().coachMarksCompleted).toBe(true)
  })

  it('stays_false_when_no_profile_loaded', async () => {
    mockGetProfile.mockResolvedValue(null)
    mockGetCoachMarksCompleted.mockResolvedValue(true) // shouldn't matter

    await useUserStore.getState().loadProfile()

    expect(useUserStore.getState().coachMarksCompleted).toBe(false)
  })

  it('markCoachMarksComplete_persists_and_updates_state', async () => {
    await useUserStore.getState().markCoachMarksComplete()

    expect(mockSetCoachMarksCompleted).toHaveBeenCalledWith(true)
    expect(useUserStore.getState().coachMarksCompleted).toBe(true)
  })

  it('markCoachMarksComplete_optimistic_update_even_if_persistence_fails', async () => {
    mockSetCoachMarksCompleted.mockRejectedValue(new Error('DB write failed'))

    await useUserStore.getState().markCoachMarksComplete()

    // State updates regardless — the tour should never re-appear in this session
    expect(useUserStore.getState().coachMarksCompleted).toBe(true)
    // Error is recorded but non-fatal
    expect(useUserStore.getState().error).toBe('DB write failed')
  })
})
