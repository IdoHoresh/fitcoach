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
  isLoading: boolean

  // Onboarding draft (temporary, not persisted)
  draft: Partial<UserProfile>
  updateDraft: (fields: Partial<UserProfile>) => void
  resetDraft: () => void

  // Actions
  completeOnboarding: () => Promise<void>
  loadProfile: () => Promise<void>
  updateProfile: (fields: Partial<UserProfile>) => Promise<void>
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
  isLoading: false,
  draft: {},

  updateDraft: (fields) => {
    set((state) => ({
      draft: { ...state.draft, ...fields },
    }))
  },

  resetDraft: () => {
    set({ draft: {} })
  },

  completeOnboarding: async () => {
    const { draft } = get()

    set({ isLoading: true })

    try {
      // Save the draft to SQLite — repository handles ID + timestamps
      const saved = await userRepository.saveProfile(
        draft as Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>,
      )

      // Calculate TDEE from the saved profile
      const tdeeBreakdown = calculateTdeeFromProfile(saved)

      set({
        profile: saved,
        tdeeBreakdown,
        isOnboarded: true,
        draft: {},
      })
    } finally {
      set({ isLoading: false })
    }
  },

  loadProfile: async () => {
    set({ isLoading: true })

    try {
      const profile = await userRepository.getProfile()

      if (!profile) {
        set({ profile: null, tdeeBreakdown: null, isOnboarded: false })
        return
      }

      const tdeeBreakdown = calculateTdeeFromProfile(profile)

      set({
        profile,
        tdeeBreakdown,
        isOnboarded: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (fields) => {
    const { profile } = get()
    if (!profile) return

    // Merge fields into existing profile
    const updated = { ...profile, ...fields }

    // Save to SQLite
    const saved = await userRepository.saveProfile(
      // Strip id/createdAt/updatedAt — repository manages those
      (({ id: _id, createdAt: _c, updatedAt: _u, ...rest }) => rest)(updated),
    )

    // Recalculate TDEE
    const tdeeBreakdown = calculateTdeeFromProfile(saved)

    set({
      profile: saved,
      tdeeBreakdown,
    })
  },
}))
