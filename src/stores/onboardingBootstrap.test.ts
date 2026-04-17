import { finishOnboarding, rehydratePlans } from './onboardingBootstrap'

// ── Helper: build a deps object with sensible success defaults ─────
// Each test overrides only the fields that matter for that case.

function buildDeps(overrides: Partial<Parameters<typeof finishOnboarding>[0]> = {}) {
  const calls: string[] = []
  const deps = {
    completeOnboarding: jest.fn().mockImplementation(async () => {
      calls.push('completeOnboarding')
    }),
    getUserError: jest.fn().mockReturnValue(null),
    generateWorkoutPlan: jest.fn().mockImplementation(async () => {
      calls.push('generateWorkoutPlan')
    }),
    getWorkoutError: jest.fn().mockReturnValue(null),
    generateMealPlan: jest.fn().mockImplementation(async () => {
      calls.push('generateMealPlan')
    }),
    getNutritionError: jest.fn().mockReturnValue(null),
    ...overrides,
  }
  return { deps, calls }
}

describe('finishOnboarding', () => {
  it('runs_complete_onboarding_then_generates_workout_then_meal_plan', async () => {
    const { deps, calls } = buildDeps()

    const result = await finishOnboarding(deps)

    expect(result.ok).toBe(true)
    expect(calls).toEqual(['completeOnboarding', 'generateWorkoutPlan', 'generateMealPlan'])
    expect(deps.generateMealPlan).toHaveBeenCalledWith(4)
  })

  it('stops_with_error_when_complete_onboarding_fails', async () => {
    const { deps, calls } = buildDeps({
      getUserError: jest.fn().mockReturnValue('missing required fields'),
    })

    const result = await finishOnboarding(deps)

    expect(result).toEqual({ ok: false, error: 'missing required fields' })
    expect(calls).toEqual(['completeOnboarding'])
    expect(deps.generateWorkoutPlan).not.toHaveBeenCalled()
    expect(deps.generateMealPlan).not.toHaveBeenCalled()
  })

  it('stops_with_error_when_workout_generation_fails', async () => {
    const { deps, calls } = buildDeps({
      getWorkoutError: jest.fn().mockReturnValue('workout generation failed'),
    })

    const result = await finishOnboarding(deps)

    expect(result).toEqual({ ok: false, error: 'workout generation failed' })
    expect(calls).toEqual(['completeOnboarding', 'generateWorkoutPlan'])
    expect(deps.generateMealPlan).not.toHaveBeenCalled()
  })

  it('stops_with_error_when_meal_plan_generation_fails', async () => {
    const { deps, calls } = buildDeps({
      getNutritionError: jest.fn().mockReturnValue('meal plan generation failed'),
    })

    const result = await finishOnboarding(deps)

    expect(result).toEqual({ ok: false, error: 'meal plan generation failed' })
    expect(calls).toEqual(['completeOnboarding', 'generateWorkoutPlan', 'generateMealPlan'])
  })
})

// ── rehydratePlans ─────────────────────────────────────────────────

function buildRehydrateDeps(overrides: Partial<Parameters<typeof rehydratePlans>[0]> = {}) {
  const calls: string[] = []
  const deps = {
    isOnboarded: true,
    loadWorkoutPlan: jest.fn().mockImplementation(async () => {
      calls.push('loadWorkoutPlan')
    }),
    loadActiveMealPlan: jest.fn().mockImplementation(async () => {
      calls.push('loadActiveMealPlan')
    }),
    loadTodaysLog: jest.fn().mockImplementation(async () => {
      calls.push('loadTodaysLog')
    }),
    refreshMealTargets: jest.fn().mockImplementation(() => {
      calls.push('refreshMealTargets')
    }),
    ...overrides,
  }
  return { deps, calls }
}

describe('rehydratePlans', () => {
  it('loads_all_plans_and_refreshes_targets_when_onboarded', async () => {
    const { deps, calls } = buildRehydrateDeps()

    await rehydratePlans(deps)

    expect(deps.loadWorkoutPlan).toHaveBeenCalledTimes(1)
    expect(deps.loadActiveMealPlan).toHaveBeenCalledTimes(1)
    expect(deps.loadTodaysLog).toHaveBeenCalledTimes(1)
    expect(deps.refreshMealTargets).toHaveBeenCalledTimes(1)
    // refreshMealTargets must run AFTER the three loaders so targets compute
    // against freshly-loaded state.
    expect(calls[calls.length - 1]).toBe('refreshMealTargets')
  })

  it('skips_everything_when_not_onboarded', async () => {
    const { deps } = buildRehydrateDeps({ isOnboarded: false })

    await rehydratePlans(deps)

    expect(deps.loadWorkoutPlan).not.toHaveBeenCalled()
    expect(deps.loadActiveMealPlan).not.toHaveBeenCalled()
    expect(deps.loadTodaysLog).not.toHaveBeenCalled()
    expect(deps.refreshMealTargets).not.toHaveBeenCalled()
  })
})
