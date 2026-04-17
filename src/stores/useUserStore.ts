/**
 * User Profile Store.
 *
 * The central store for user data — connects onboarding UI to algorithms and SQLite.
 *
 * Flow:
 *   Onboarding screens → updateDraft() → completeOnboarding() → profile + TDEE ready
 *   App startup → loadProfile() → profile + TDEE recalculated from SQLite
 *   Settings changes → updateProfile() → profile + TDEE recalculated
 *
 * Design decisions:
 * - Draft pattern: onboarding builds up a partial profile, saves all at once at the end
 * - TDEE is recalculated on every load (not cached in SQLite) — fast and always fresh
 * - Store calls algorithms automatically — UI never needs to trigger calculations
 */

import { create } from 'zustand'
import type { UserProfile, TdeeBreakdown } from '../types'
import { calculateBmr, calculateTdeeBreakdown } from '../algorithms'
import { userRepository } from '../db'

// ── Store Interface ────────────────────────────────────────────────

interface UserStore {
  // State
  profile: UserProfile | null
  tdeeBreakdown: TdeeBreakdown | null
  isOnboarded: boolean
  /**
   * True once the user has completed (or skipped) the post-onboarding
   * coach marks tour. Persisted in SQLite via UserRepository.
   * Stays false after completeOnboarding so the tour runs immediately.
   */
  coachMarksCompleted: boolean
  isLoading: boolean
  error: string | null

  // Onboarding draft (temporary, not persisted)
  draft: Partial<UserProfile>
  updateDraft: (fields: Partial<UserProfile>) => void
  resetDraft: () => void

  // Actions
  completeOnboarding: () => Promise<void>
  loadProfile: () => Promise<void>
  updateProfile: (fields: Partial<UserProfile>) => Promise<void>
  markCoachMarksComplete: () => Promise<void>
}

// ── Required Draft Fields ──────────────────────────────────────────

const REQUIRED_DRAFT_FIELDS = [
  'name',
  'heightCm',
  'weightKg',
  'age',
  'sex',
  'goal',
  'experience',
  'trainingDays',
  'equipment',
  'lifestyle',
  'workoutTime',
] as const

/** Validates that all required fields are present in the draft. */
function validateDraft(
  draft: Partial<UserProfile>,
): draft is Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  return REQUIRED_DRAFT_FIELDS.every((field) => draft[field] !== undefined)
}

/** Strips id/createdAt/updatedAt from a profile for saving. */
function stripMetaFields(
  profile: UserProfile,
): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = profile
  return rest
}

// ── TDEE Calculation Helper ────────────────────────────────────────

/**
 * Calculates BMR + TDEE breakdown from a user profile.
 * Called automatically whenever the profile changes.
 */
function calculateTdeeFromProfile(profile: UserProfile): TdeeBreakdown {
  const bmr = calculateBmr(
    profile.weightKg,
    profile.heightCm,
    profile.age,
    profile.sex,
    profile.bodyFatPercent,
  )

  return calculateTdeeBreakdown(bmr, profile.weightKg, profile.lifestyle)
}

// ── Store ──────────────────────────────────────────────────────────

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  profile: null,
  tdeeBreakdown: null,
  isOnboarded: false,
  coachMarksCompleted: false,
  isLoading: false,
  error: null,
  draft: {},

  updateDraft: (fields) => {
    set((state) => ({
      draft: { ...state.draft, ...fields },
      error: null,
    }))
  },

  resetDraft: () => {
    set({ draft: {}, error: null })
  },

  completeOnboarding: async () => {
    // Idempotent: if the profile was already saved (e.g. plan generation
    // failed on the Result screen and the user taps retry), don't try to
    // re-save with the now-empty draft — that would fail validation and
    // strand the user with a misleading "Missing required fields" error.
    if (get().isOnboarded) return

    const { draft } = get()

    if (!validateDraft(draft)) {
      set({ error: 'Missing required profile fields. Complete all onboarding steps.' })
      return
    }

    // Derive exerciseDaysPerWeek from selected training days
    const resolvedDraft = {
      ...draft,
      lifestyle: {
        ...draft.lifestyle,
        exerciseDaysPerWeek: draft.trainingDays!.length,
      },
    }

    set({ isLoading: true, error: null })

    try {
      // validateDraft() confirmed all fields exist; spread loses that narrowing
      const saved = await userRepository.saveProfile(
        resolvedDraft as Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>,
      )
      const tdeeBreakdown = calculateTdeeFromProfile(saved)

      set({
        profile: saved,
        tdeeBreakdown,
        isOnboarded: true,
        draft: {},
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save profile' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadProfile: async () => {
    set({ isLoading: true, error: null })

    try {
      const profile = await userRepository.getProfile()

      if (!profile) {
        set({
          profile: null,
          tdeeBreakdown: null,
          isOnboarded: false,
          coachMarksCompleted: false,
        })
        return
      }

      const tdeeBreakdown = calculateTdeeFromProfile(profile)
      const coachMarksCompleted = await userRepository.getCoachMarksCompleted()

      set({
        profile,
        tdeeBreakdown,
        isOnboarded: true,
        coachMarksCompleted,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load profile' })
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * Marks the post-onboarding coach marks tour as complete.
   *
   * Optimistic update: state flips to `true` first so the overlay closes
   * immediately. Persistence to SQLite happens after — if it fails, we still
   * keep the in-memory flag true (the tour should never re-open mid-session)
   * but record the error so the next loadProfile will reflect actual DB state.
   */
  markCoachMarksComplete: async () => {
    set({ coachMarksCompleted: true, error: null })

    try {
      await userRepository.setCoachMarksCompleted(true)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save coach marks state' })
    }
  },

  updateProfile: async (fields) => {
    const { profile } = get()
    if (!profile) return

    set({ error: null })

    try {
      const updated = { ...profile, ...fields } as UserProfile
      const saved = await userRepository.saveProfile(stripMetaFields(updated))
      const tdeeBreakdown = calculateTdeeFromProfile(saved)

      set({
        profile: saved,
        tdeeBreakdown,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update profile' })
    }
  },
}))
