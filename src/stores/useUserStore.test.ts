import { useUserStore } from './useUserStore'
import type { UserProfile } from '../types'

// ── Mock the database layer ────────────────────────────────────────
// We test store logic only — SQLite calls are mocked.

const mockGetProfile = jest.fn()
const mockSaveProfile = jest.fn()

jest.mock('../db', () => ({
  userRepository: {
    getProfile: () => mockGetProfile(),
    saveProfile: (data: unknown) => mockSaveProfile(data),
  },
}))

// ── Test fixtures ──────────────────────────────────────────────────

const COMPLETE_DRAFT: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
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
    isLoading: false,
    error: null,
    draft: {},
  })
  jest.clearAllMocks()
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
