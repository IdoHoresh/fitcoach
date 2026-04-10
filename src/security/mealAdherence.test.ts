/**
 * Tests for mealAdherenceSchema validation.
 * RED phase: written before the schema exists.
 */

import { validateInput, mealAdherenceSchema } from './validation'

describe('mealAdherenceSchema', () => {
  const validInput = {
    date: '2026-04-10',
    mealType: 'breakfast',
    level: 'accurate',
  }

  it('accepts valid accurate adherence', () => {
    const result = validateInput(mealAdherenceSchema, validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('accepts valid roughly adherence', () => {
    const result = validateInput(mealAdherenceSchema, { ...validInput, level: 'roughly' })
    expect(result.success).toBe(true)
  })

  it('accepts valid not_accurate adherence', () => {
    const result = validateInput(mealAdherenceSchema, { ...validInput, level: 'not_accurate' })
    expect(result.success).toBe(true)
  })

  it('accepts all valid meal types', () => {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']
    for (const mealType of mealTypes) {
      const result = validateInput(mealAdherenceSchema, { ...validInput, mealType })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid adherence level', () => {
    const result = validateInput(mealAdherenceSchema, { ...validInput, level: 'perfect' })
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects invalid meal type', () => {
    const result = validateInput(mealAdherenceSchema, { ...validInput, mealType: 'brunch' })
    expect(result.success).toBe(false)
  })

  it('rejects badly formatted date', () => {
    const result = validateInput(mealAdherenceSchema, { ...validInput, date: '10-04-2026' })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = validateInput(mealAdherenceSchema, { date: '2026-04-10' })
    expect(result.success).toBe(false)
  })
})
