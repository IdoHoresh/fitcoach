import { recommendSplitType, assignDayTypes, createSplitRecommendation } from './split-selector'
import type { DayOfWeek } from '../types'

// ── recommendSplitType ──────────────────────────────────────────────

describe('recommendSplitType', () => {
  it('returns_full_body_for_2_days', () => {
    expect(recommendSplitType(2, 'beginner')).toBe('full_body')
    expect(recommendSplitType(2, 'intermediate')).toBe('full_body')
  })

  it('returns_full_body_for_3_days', () => {
    expect(recommendSplitType(3, 'beginner')).toBe('full_body')
    expect(recommendSplitType(3, 'intermediate')).toBe('full_body')
  })

  it('returns_upper_lower_for_4_days', () => {
    expect(recommendSplitType(4, 'beginner')).toBe('upper_lower')
    expect(recommendSplitType(4, 'intermediate')).toBe('upper_lower')
  })

  it('returns_upper_lower_for_5_days_beginner', () => {
    expect(recommendSplitType(5, 'beginner')).toBe('upper_lower')
  })

  it('returns_upper_lower_for_6_days_beginner', () => {
    expect(recommendSplitType(6, 'beginner')).toBe('upper_lower')
  })

  it('returns_ppl_for_5_days_intermediate', () => {
    expect(recommendSplitType(5, 'intermediate')).toBe('push_pull_legs')
  })

  it('returns_ppl_for_6_days_intermediate', () => {
    expect(recommendSplitType(6, 'intermediate')).toBe('push_pull_legs')
  })

  it('returns_full_body_for_1_day', () => {
    expect(recommendSplitType(1, 'beginner')).toBe('full_body')
  })
})

// ── assignDayTypes ──────────────────────────────────────────────────

describe('assignDayTypes', () => {
  // Full Body

  describe('full_body', () => {
    it('assigns_a_b_c_cycle_for_3_days', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const result = assignDayTypes(days, 'full_body')

      expect(result).toEqual([
        { dayOfWeek: 1, dayType: 'full_body_a' },
        { dayOfWeek: 3, dayType: 'full_body_b' },
        { dayOfWeek: 5, dayType: 'full_body_c' },
      ])
    })

    it('assigns_a_b_for_2_days', () => {
      const days: DayOfWeek[] = [0, 4]
      const result = assignDayTypes(days, 'full_body')

      expect(result).toEqual([
        { dayOfWeek: 0, dayType: 'full_body_a' },
        { dayOfWeek: 4, dayType: 'full_body_b' },
      ])
    })

    it('assigns_single_day_as_a', () => {
      const days: DayOfWeek[] = [2]
      const result = assignDayTypes(days, 'full_body')

      expect(result).toEqual([{ dayOfWeek: 2, dayType: 'full_body_a' }])
    })

    it('wraps_cycle_back_to_a_for_4_or_more_days', () => {
      const days: DayOfWeek[] = [0, 1, 3, 5]
      const result = assignDayTypes(days, 'full_body')

      expect(result[3].dayType).toBe('full_body_a')
    })
  })

  // Upper/Lower

  describe('upper_lower', () => {
    it('assigns_upper_lower_alternating_for_4_days', () => {
      const days: DayOfWeek[] = [1, 2, 4, 5]
      const result = assignDayTypes(days, 'upper_lower')

      expect(result).toEqual([
        { dayOfWeek: 1, dayType: 'upper_a' },
        { dayOfWeek: 2, dayType: 'lower_a' },
        { dayOfWeek: 4, dayType: 'upper_b' },
        { dayOfWeek: 5, dayType: 'lower_b' },
      ])
    })

    it('assigns_upper_lower_for_5_days_with_wrap', () => {
      const days: DayOfWeek[] = [0, 1, 3, 4, 6]
      const result = assignDayTypes(days, 'upper_lower')

      expect(result).toHaveLength(5)
      expect(result[0].dayType).toBe('upper_a')
      expect(result[1].dayType).toBe('lower_a')
      expect(result[2].dayType).toBe('upper_b')
      expect(result[3].dayType).toBe('lower_b')
      // 5th day wraps back to upper_a
      expect(result[4].dayType).toBe('upper_a')
    })

    it('assigns_upper_lower_for_2_days', () => {
      const days: DayOfWeek[] = [1, 4]
      const result = assignDayTypes(days, 'upper_lower')

      expect(result).toEqual([
        { dayOfWeek: 1, dayType: 'upper_a' },
        { dayOfWeek: 4, dayType: 'lower_a' },
      ])
    })
  })

  // Push/Pull/Legs

  describe('push_pull_legs', () => {
    it('assigns_ppl_a_then_b_for_6_days', () => {
      const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5]
      const result = assignDayTypes(days, 'push_pull_legs')

      expect(result).toEqual([
        { dayOfWeek: 0, dayType: 'push_a' },
        { dayOfWeek: 1, dayType: 'pull_a' },
        { dayOfWeek: 2, dayType: 'legs_a' },
        { dayOfWeek: 3, dayType: 'push_b' },
        { dayOfWeek: 4, dayType: 'pull_b' },
        { dayOfWeek: 5, dayType: 'legs_b' },
      ])
    })

    it('assigns_ppl_a_only_for_3_days', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const result = assignDayTypes(days, 'push_pull_legs')

      expect(result).toEqual([
        { dayOfWeek: 1, dayType: 'push_a' },
        { dayOfWeek: 3, dayType: 'pull_a' },
        { dayOfWeek: 5, dayType: 'legs_a' },
      ])
    })

    it('assigns_ppl_for_5_days_with_partial_b', () => {
      const days: DayOfWeek[] = [0, 1, 2, 4, 5]
      const result = assignDayTypes(days, 'push_pull_legs')

      expect(result).toHaveLength(5)
      expect(result[0].dayType).toBe('push_a')
      expect(result[1].dayType).toBe('pull_a')
      expect(result[2].dayType).toBe('legs_a')
      expect(result[3].dayType).toBe('push_b')
      expect(result[4].dayType).toBe('pull_b')
    })
  })

  // Sorting

  describe('day_sorting', () => {
    it('sorts_days_before_assigning', () => {
      const unorderedDays: DayOfWeek[] = [5, 1, 3]
      const result = assignDayTypes(unorderedDays, 'full_body')

      expect(result[0].dayOfWeek).toBe(1)
      expect(result[1].dayOfWeek).toBe(3)
      expect(result[2].dayOfWeek).toBe(5)
    })

    it('assigns_types_based_on_sorted_order', () => {
      const unorderedDays: DayOfWeek[] = [6, 0, 3]
      const result = assignDayTypes(unorderedDays, 'full_body')

      expect(result).toEqual([
        { dayOfWeek: 0, dayType: 'full_body_a' },
        { dayOfWeek: 3, dayType: 'full_body_b' },
        { dayOfWeek: 6, dayType: 'full_body_c' },
      ])
    })
  })

  // Empty input

  it('returns_empty_array_for_no_days', () => {
    const result = assignDayTypes([], 'full_body')
    expect(result).toEqual([])
  })
})

// ── createSplitRecommendation ───────────────────────────────────────

describe('createSplitRecommendation', () => {
  it('returns_full_body_recommendation_for_3_days', () => {
    const days: DayOfWeek[] = [1, 3, 5]
    const result = createSplitRecommendation(days, 'beginner')

    expect(result.splitType).toBe('full_body')
    expect(result.schedule).toHaveLength(3)
    expect(result.schedule[0].dayType).toBe('full_body_a')
    expect(result.schedule[1].dayType).toBe('full_body_b')
    expect(result.schedule[2].dayType).toBe('full_body_c')
  })

  it('returns_upper_lower_recommendation_for_4_days', () => {
    const days: DayOfWeek[] = [0, 2, 4, 6]
    const result = createSplitRecommendation(days, 'intermediate')

    expect(result.splitType).toBe('upper_lower')
    expect(result.schedule).toHaveLength(4)
  })

  it('returns_ppl_recommendation_for_6_days_intermediate', () => {
    const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5]
    const result = createSplitRecommendation(days, 'intermediate')

    expect(result.splitType).toBe('push_pull_legs')
    expect(result.schedule).toHaveLength(6)
  })

  it('returns_upper_lower_for_5_days_beginner', () => {
    const days: DayOfWeek[] = [0, 1, 3, 4, 6]
    const result = createSplitRecommendation(days, 'beginner')

    expect(result.splitType).toBe('upper_lower')
    expect(result.schedule).toHaveLength(5)
  })

  // Reasoning strings

  describe('reasoning_strings', () => {
    it('includes_day_count_in_english_reasoning', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const result = createSplitRecommendation(days, 'beginner')

      expect(result.reasoning).toContain('3 training days')
      expect(result.reasoning).toContain('Full Body')
    })

    it('includes_day_count_in_hebrew_reasoning', () => {
      const days: DayOfWeek[] = [1, 3, 5]
      const result = createSplitRecommendation(days, 'beginner')

      expect(result.reasoningHe).toContain('3')
    })

    it('mentions_upper_lower_in_reasoning_for_4_days', () => {
      const days: DayOfWeek[] = [0, 2, 4, 6]
      const result = createSplitRecommendation(days, 'beginner')

      expect(result.reasoning).toContain('4 training days')
      expect(result.reasoning).toContain('Upper/Lower')
    })

    it('mentions_ppl_in_reasoning_for_6_days_intermediate', () => {
      const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5]
      const result = createSplitRecommendation(days, 'intermediate')

      expect(result.reasoning).toContain('6 training days')
      expect(result.reasoning).toContain('Push/Pull/Legs')
    })

    it('includes_hebrew_reasoning_for_upper_lower', () => {
      const days: DayOfWeek[] = [0, 2, 4, 6]
      const result = createSplitRecommendation(days, 'beginner')

      expect(result.reasoningHe).toContain('4')
    })

    it('includes_hebrew_reasoning_for_ppl', () => {
      const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5]
      const result = createSplitRecommendation(days, 'intermediate')

      expect(result.reasoningHe).toContain('6')
    })
  })

  // Schedule correctness through the full pipeline

  describe('schedule_integration', () => {
    it('schedule_days_match_input_days_for_full_body', () => {
      const days: DayOfWeek[] = [0, 3, 5]
      const result = createSplitRecommendation(days, 'beginner')

      const scheduledDays = result.schedule.map((s) => s.dayOfWeek)
      expect(scheduledDays).toEqual([0, 3, 5])
    })

    it('schedule_days_match_input_days_for_ppl', () => {
      const days: DayOfWeek[] = [0, 1, 3, 4, 5, 6]
      const result = createSplitRecommendation(days, 'intermediate')

      const scheduledDays = result.schedule.map((s) => s.dayOfWeek)
      expect(scheduledDays).toEqual([0, 1, 3, 4, 5, 6])
    })

    it('sorts_unordered_input_days', () => {
      const days: DayOfWeek[] = [5, 1, 3]
      const result = createSplitRecommendation(days, 'beginner')

      const scheduledDays = result.schedule.map((s) => s.dayOfWeek)
      expect(scheduledDays).toEqual([1, 3, 5])
    })
  })
})
