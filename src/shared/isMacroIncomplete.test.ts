import { isMacroIncomplete } from './isMacroIncomplete'

describe('isMacroIncomplete()', () => {
  it('returns false for a fully-specified food', () => {
    expect(
      isMacroIncomplete({
        caloriesPer100g: 350,
        proteinPer100g: 30,
        fatPer100g: 10,
        carbsPer100g: 40,
      }),
    ).toBe(false)
  })

  it('returns false when only protein is non-zero (rest zero)', () => {
    expect(
      isMacroIncomplete({
        caloriesPer100g: 120,
        proteinPer100g: 30,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
    ).toBe(false)
  })

  it('returns false for 0-calorie foods with 0 macros (water, salt, diet soda)', () => {
    expect(
      isMacroIncomplete({
        caloriesPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
    ).toBe(false)
  })

  it('returns true when calories > 0 and all three macros are 0 (user skipped macro entry)', () => {
    expect(
      isMacroIncomplete({
        caloriesPer100g: 500,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
    ).toBe(true)
  })

  it('returns false when any single macro is > 0', () => {
    expect(
      isMacroIncomplete({
        caloriesPer100g: 500,
        proteinPer100g: 0,
        fatPer100g: 0.1,
        carbsPer100g: 0,
      }),
    ).toBe(false)
  })
})
