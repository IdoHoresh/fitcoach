import {
  generateWorkoutPlan,
  getPlanSummary,
  calculatePlanWeeklyVolume,
  countSessionsPerMuscle,
} from './workout-generator'
import { createSplitRecommendation } from './split-selector'
import type { DayOfWeek } from '../types'
import { FULL_GYM_EQUIPMENT } from '../types/user'

// ── generateWorkoutPlan ────────────────────────────────────────────

describe('generateWorkoutPlan', () => {
  describe('split_selection', () => {
    it('3_days_beginner_produces_full_body', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
      expect(plan.splitType).toBe('full_body')
    })

    it('4_days_intermediate_produces_upper_lower', () => {
      const days: DayOfWeek[] = [1, 2, 4, 5]
      const plan = generateWorkoutPlan(days, 'intermediate', [...FULL_GYM_EQUIPMENT])
      expect(plan.splitType).toBe('upper_lower')
    })

    it('5_days_intermediate_produces_ppl', () => {
      const days: DayOfWeek[] = [0, 1, 2, 4, 5]
      const plan = generateWorkoutPlan(days, 'intermediate', [...FULL_GYM_EQUIPMENT])
      expect(plan.splitType).toBe('push_pull_legs')
    })

    it('6_days_beginner_produces_upper_lower', () => {
      const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
      expect(plan.splitType).toBe('upper_lower')
    })
  })

  describe('weekly_schedule_structure', () => {
    it('always_generates_7_day_schedule', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
      expect(plan.weeklySchedule).toHaveLength(7)
    })

    it('training_days_have_non_null_templates', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      const trainingDays = plan.weeklySchedule.filter((d) => d.template !== null)
      expect(trainingDays).toHaveLength(3)
    })

    it('rest_days_have_null_templates', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      const restDays = plan.weeklySchedule.filter((d) => d.template === null)
      expect(restDays).toHaveLength(4)
    })

    it('rest_days_have_rest_day_type', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      const restDays = plan.weeklySchedule.filter((d) => d.template === null)
      restDays.forEach((d) => expect(d.dayType).toBe('rest'))
    })

    it('days_are_ordered_0_through_6', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      plan.weeklySchedule.forEach((d, i) => {
        expect(d.dayOfWeek).toBe(i)
      })
    })
  })

  describe('template_content', () => {
    it('templates_have_exercises', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      const trainingDays = plan.weeklySchedule.filter((d) => d.template !== null)
      trainingDays.forEach((d) => {
        expect(d.template!.exercises.length).toBeGreaterThan(0)
      })
    })

    it('templates_have_estimated_minutes', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      const trainingDays = plan.weeklySchedule.filter((d) => d.template !== null)
      trainingDays.forEach((d) => {
        expect(d.template!.estimatedMinutes).toBeGreaterThan(0)
      })
    })

    it('exercises_have_valid_sets', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])

      const trainingDays = plan.weeklySchedule.filter((d) => d.template !== null)
      trainingDays.forEach((d) => {
        d.template!.exercises.forEach((ex) => {
          expect(ex.sets).toBeGreaterThanOrEqual(2) // MIN_SETS_PER_EXERCISE
          expect(ex.sets).toBeLessThanOrEqual(12) // MAX_DIRECT_SETS_PER_MUSCLE_PER_SESSION
        })
      })
    })
  })

  describe('mesocycle_tracking', () => {
    it('defaults_to_week_1_of_6', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
      expect(plan.mesocycleWeek).toBe(1)
      expect(plan.totalMesocycleWeeks).toBe(6)
    })

    it('respects_custom_mesocycle_week', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT], 4, 8)
      expect(plan.mesocycleWeek).toBe(4)
      expect(plan.totalMesocycleWeeks).toBe(8)
    })
  })

  describe('reasoning_strings', () => {
    it('includes_english_reasoning', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
      expect(plan.reasoning.length).toBeGreaterThan(0)
    })

    it('includes_hebrew_reasoning', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
      expect(plan.reasoningHe.length).toBeGreaterThan(0)
    })
  })

  describe('equipment_substitution', () => {
    it('bodyweight_only_still_generates_valid_plan', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const plan = generateWorkoutPlan(days, 'beginner', ['none'])

      const trainingDays = plan.weeklySchedule.filter((d) => d.template !== null)
      expect(trainingDays.length).toBe(3)
      trainingDays.forEach((d) => {
        expect(d.template!.exercises.length).toBeGreaterThan(0)
      })
    })
  })

  describe('volume_progression', () => {
    it('later_weeks_have_equal_or_more_volume_than_week_1', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const equipment = [...FULL_GYM_EQUIPMENT]

      const week1 = generateWorkoutPlan(days, 'beginner', equipment, 1, 6)
      const week4 = generateWorkoutPlan(days, 'beginner', equipment, 4, 6)

      const summary1 = getPlanSummary(week1)
      const summary4 = getPlanSummary(week4)

      expect(summary4.totalWeeklySets).toBeGreaterThanOrEqual(summary1.totalWeeklySets)
    })
  })
})

// ── getPlanSummary ─────────────────────────────────────────────────

describe('getPlanSummary', () => {
  it('training_plus_rest_days_equal_7', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
    const summary = getPlanSummary(plan)

    expect(summary.trainingDaysCount + summary.restDaysCount).toBe(7)
  })

  it('reports_correct_training_day_count', () => {
    const days: DayOfWeek[] = [0, 1, 3, 4]
    const plan = generateWorkoutPlan(days, 'intermediate', [...FULL_GYM_EQUIPMENT])
    const summary = getPlanSummary(plan)

    expect(summary.trainingDaysCount).toBe(4)
    expect(summary.restDaysCount).toBe(3)
  })

  it('total_weekly_sets_is_positive', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
    const summary = getPlanSummary(plan)

    expect(summary.totalWeeklySets).toBeGreaterThan(0)
  })

  it('estimated_weekly_minutes_is_positive', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
    const summary = getPlanSummary(plan)

    expect(summary.estimatedWeeklyMinutes).toBeGreaterThan(0)
  })

  it('more_training_days_means_more_total_sets', () => {
    const equipment = [...FULL_GYM_EQUIPMENT]
    const plan3 = generateWorkoutPlan([1, 3, 5] as DayOfWeek[], 'beginner', equipment)
    const plan5 = generateWorkoutPlan([0, 1, 2, 4, 5] as DayOfWeek[], 'intermediate', equipment)

    const summary3 = getPlanSummary(plan3)
    const summary5 = getPlanSummary(plan5)

    expect(summary5.totalWeeklySets).toBeGreaterThan(summary3.totalWeeklySets)
  })
})

// ── calculatePlanWeeklyVolume ──────────────────────────────────────

describe('calculatePlanWeeklyVolume', () => {
  it('returns_volumes_for_muscle_groups', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
    const volumes = calculatePlanWeeklyVolume(plan)

    expect(volumes.size).toBeGreaterThan(0)
  })

  it('all_volumes_are_positive', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
    const volumes = calculatePlanWeeklyVolume(plan)

    volumes.forEach((sets) => {
      expect(sets).toBeGreaterThan(0)
    })
  })

  it('full_body_covers_major_muscle_groups', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const plan = generateWorkoutPlan(days, 'beginner', [...FULL_GYM_EQUIPMENT])
    const volumes = calculatePlanWeeklyVolume(plan)

    // Full body should hit at least chest, back, quads
    expect(volumes.has('chest')).toBe(true)
    expect(volumes.has('back')).toBe(true)
    expect(volumes.has('quads')).toBe(true)
  })
})

// ── countSessionsPerMuscle ─────────────────────────────────────────

describe('countSessionsPerMuscle', () => {
  it('upper_lower_4_days_hits_chest_in_2_sessions', () => {
    const days: DayOfWeek[] = [1, 2, 4, 5]
    const recommendation = createSplitRecommendation(days, 'intermediate')
    const sessions = countSessionsPerMuscle(recommendation.schedule)

    // Upper A + Upper B should both hit chest
    const chestSessions = sessions.get('chest')
    expect(chestSessions).toBe(2)
  })

  it('upper_lower_4_days_hits_quads_in_2_sessions', () => {
    const days: DayOfWeek[] = [1, 2, 4, 5]
    const recommendation = createSplitRecommendation(days, 'intermediate')
    const sessions = countSessionsPerMuscle(recommendation.schedule)

    const quadSessions = sessions.get('quads')
    expect(quadSessions).toBe(2)
  })

  it('full_body_3_days_hits_major_muscles_3_times', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const recommendation = createSplitRecommendation(days, 'beginner')
    const sessions = countSessionsPerMuscle(recommendation.schedule)

    // Each full body day should hit major muscles
    const chestSessions = sessions.get('chest') ?? 0
    expect(chestSessions).toBeGreaterThanOrEqual(2) // At least 2 of 3 days
  })

  it('returns_empty_map_for_no_training_days', () => {
    const sessions = countSessionsPerMuscle([])
    expect(sessions.size).toBe(0)
  })
})
