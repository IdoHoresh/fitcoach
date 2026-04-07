/**
 * Result screen computation tests.
 *
 * TDD: These tests verify the business logic that wires algorithms together
 * on the result screen — computing TDEE, macros, and split from a complete draft.
 */

import {
  calculateBmr,
  calculateTdeeBreakdown,
  calculateNutritionTargets,
  createSplitRecommendation,
} from '@/algorithms'
import type { UserProfile, LifestyleProfile, DayOfWeek } from '@/types'

// ── Test helpers ────────────────────────────────────────────────────

/** Builds a complete draft matching what screens 1-10 produce. */
function buildCompleteDraft(overrides?: Partial<UserProfile>): Partial<UserProfile> {
  const lifestyle: LifestyleProfile = {
    occupation: 'desk',
    afterWorkActivity: 'moderate',
    dailySteps: null,
    exerciseDaysPerWeek: 4,
    sessionDurationMinutes: 60,
    exerciseType: 'strength',
    exerciseIntensity: 'moderate',
    sleepHoursPerNight: 7.5,
  }

  return {
    heightCm: 175,
    weightKg: 80,
    age: 30,
    sex: 'male',
    bodyFatPercent: null,
    goal: 'muscle_gain',
    experience: 'beginner',
    trainingDays: [0, 1, 3, 5] as readonly DayOfWeek[],
    equipment: {
      location: 'full_gym',
      availableEquipment: ['barbell', 'dumbbells', 'bench', 'squat_rack'],
    },
    lifestyle,
    ...overrides,
  }
}

/** Computes result screen data from a draft — same logic the screen will use. */
function computeResults(draft: Partial<UserProfile>) {
  const bmr = calculateBmr(
    draft.weightKg!,
    draft.heightCm!,
    draft.age!,
    draft.sex!,
    draft.bodyFatPercent ?? null,
  )
  const tdeeBreakdown = calculateTdeeBreakdown(bmr, draft.weightKg!, draft.lifestyle!)
  const nutrition = calculateNutritionTargets(
    bmr,
    tdeeBreakdown.total,
    draft.weightKg!,
    draft.heightCm!,
    draft.bodyFatPercent ?? null,
    draft.goal!,
  )
  const split = createSplitRecommendation(draft.trainingDays!, draft.experience!)

  return { bmr, tdeeBreakdown, nutrition, split }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('Result screen computations', () => {
  describe('TDEE breakdown from complete draft', () => {
    it('returns all positive components for a standard male profile', () => {
      const draft = buildCompleteDraft()
      const { tdeeBreakdown } = computeResults(draft)

      expect(tdeeBreakdown.bmr).toBeGreaterThan(0)
      expect(tdeeBreakdown.neat).toBeGreaterThan(0)
      expect(tdeeBreakdown.eat).toBeGreaterThan(0)
      expect(tdeeBreakdown.tef).toBeGreaterThan(0)
      expect(tdeeBreakdown.total).toBeGreaterThan(0)
    })

    it('total equals sum of components', () => {
      const draft = buildCompleteDraft()
      const { tdeeBreakdown } = computeResults(draft)

      const sum = tdeeBreakdown.bmr + tdeeBreakdown.neat + tdeeBreakdown.eat + tdeeBreakdown.tef
      expect(tdeeBreakdown.total).toBe(sum)
    })

    it('returns higher TDEE for active occupation vs desk', () => {
      const desk = computeResults(
        buildCompleteDraft({
          lifestyle: { ...buildCompleteDraft().lifestyle!, occupation: 'desk' },
        }),
      )
      const active = computeResults(
        buildCompleteDraft({
          lifestyle: { ...buildCompleteDraft().lifestyle!, occupation: 'physical_labor' },
        }),
      )

      expect(active.tdeeBreakdown.total).toBeGreaterThan(desk.tdeeBreakdown.total)
    })
  })

  describe('BMR formula selection', () => {
    it('uses Mifflin-St Jeor when bodyFatPercent is null', () => {
      const withoutBf = computeResults(buildCompleteDraft({ bodyFatPercent: null }))
      const withBf = computeResults(buildCompleteDraft({ bodyFatPercent: 20 }))

      // Different formulas should produce different BMR values
      expect(withoutBf.bmr).not.toBe(withBf.bmr)
    })

    it('uses Katch-McArdle when bodyFatPercent is provided', () => {
      const draft = buildCompleteDraft({ bodyFatPercent: 15 })
      const { bmr } = computeResults(draft)

      // Katch-McArdle: 370 + 21.6 × LBM
      // LBM = 80 × (1 - 0.15) = 68
      // BMR = 370 + 21.6 × 68 = 370 + 1468.8 = 1838.8 ≈ 1839
      expect(bmr).toBeCloseTo(1839, -1) // within ~10 kcal
    })
  })

  describe('nutrition targets', () => {
    it('returns valid macro values (no NaN, no negative, no Infinity)', () => {
      const draft = buildCompleteDraft()
      const { nutrition } = computeResults(draft)

      expect(Number.isFinite(nutrition.targetCalories)).toBe(true)
      expect(Number.isFinite(nutrition.proteinGrams)).toBe(true)
      expect(Number.isFinite(nutrition.carbGrams)).toBe(true)
      expect(Number.isFinite(nutrition.fatGrams)).toBe(true)

      expect(nutrition.targetCalories).toBeGreaterThan(0)
      expect(nutrition.proteinGrams).toBeGreaterThan(0)
      expect(nutrition.carbGrams).toBeGreaterThan(0)
      expect(nutrition.fatGrams).toBeGreaterThan(0)
    })

    it('macro calories approximately match target calories', () => {
      const draft = buildCompleteDraft()
      const { nutrition } = computeResults(draft)

      const macroCalories =
        nutrition.proteinGrams * 4 + nutrition.carbGrams * 4 + nutrition.fatGrams * 9

      // Should be within 5% of target (rounding causes small differences)
      expect(macroCalories).toBeCloseTo(nutrition.targetCalories, -2)
    })

    it('muscle_gain has higher calories than maintenance', () => {
      const gain = computeResults(buildCompleteDraft({ goal: 'muscle_gain' }))
      const maint = computeResults(buildCompleteDraft({ goal: 'maintenance' }))

      expect(gain.nutrition.targetCalories).toBeGreaterThan(maint.nutrition.targetCalories)
    })

    it('fat_loss has lower calories than maintenance', () => {
      const loss = computeResults(buildCompleteDraft({ goal: 'fat_loss' }))
      const maint = computeResults(buildCompleteDraft({ goal: 'maintenance' }))

      expect(loss.nutrition.targetCalories).toBeLessThan(maint.nutrition.targetCalories)
    })
  })

  describe('split recommendation', () => {
    it('recommends correct split for 4 training days + beginner', () => {
      const draft = buildCompleteDraft({
        trainingDays: [0, 1, 3, 5] as readonly DayOfWeek[],
        experience: 'beginner',
      })
      const { split } = computeResults(draft)

      expect(split.splitType).toBe('upper_lower')
      expect(split.schedule).toHaveLength(4)
    })

    it('recommends full_body for 3 days beginner', () => {
      const draft = buildCompleteDraft({
        trainingDays: [1, 3, 5] as readonly DayOfWeek[],
        experience: 'beginner',
      })
      const { split } = computeResults(draft)

      expect(split.splitType).toBe('full_body')
    })

    it('recommends push_pull_legs for 6 days intermediate', () => {
      const draft = buildCompleteDraft({
        trainingDays: [0, 1, 2, 3, 4, 5] as readonly DayOfWeek[],
        experience: 'intermediate',
      })
      const { split } = computeResults(draft)

      expect(split.splitType).toBe('push_pull_legs')
    })
  })

  describe('edge cases', () => {
    it('handles minimum body stats without errors', () => {
      const draft = buildCompleteDraft({
        heightCm: 100,
        weightKg: 30,
        age: 14,
      })
      const { tdeeBreakdown, nutrition } = computeResults(draft)

      expect(Number.isFinite(tdeeBreakdown.total)).toBe(true)
      expect(Number.isFinite(nutrition.targetCalories)).toBe(true)
      expect(tdeeBreakdown.total).toBeGreaterThan(0)
    })

    it('handles maximum body stats without errors', () => {
      const draft = buildCompleteDraft({
        heightCm: 250,
        weightKg: 300,
        age: 100,
      })
      const { tdeeBreakdown, nutrition } = computeResults(draft)

      expect(Number.isFinite(tdeeBreakdown.total)).toBe(true)
      expect(Number.isFinite(nutrition.targetCalories)).toBe(true)
      expect(tdeeBreakdown.total).toBeGreaterThan(0)
    })

    it('handles null dailySteps (falls back to estimation)', () => {
      const draft = buildCompleteDraft()
      // dailySteps is already null in default draft
      expect(draft.lifestyle!.dailySteps).toBeNull()

      const { tdeeBreakdown } = computeResults(draft)
      expect(tdeeBreakdown.neat).toBeGreaterThan(0)
    })

    it('handles female profile', () => {
      const draft = buildCompleteDraft({ sex: 'female' })
      const { tdeeBreakdown, nutrition } = computeResults(draft)

      expect(tdeeBreakdown.total).toBeGreaterThan(0)
      expect(nutrition.targetCalories).toBeGreaterThan(0)
    })
  })
})
