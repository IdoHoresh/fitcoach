/**
 * Detects foods where the user logged calories but skipped the macro
 * breakdown (calories-only mode in ManualFoodForm).
 *
 * Derivation: `calories > 0 AND protein = fat = carbs = 0`.
 *
 * Safe against false positives for genuinely zero-macro items like water,
 * salt, plain brewed coffee — those have `calories = 0` too. Any food
 * with real calories has SOMETHING by mass conservation; the only way to
 * land on "all-zero macros + positive calories" is user-skipped entry.
 */

type MacroFields = {
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
}

export function isMacroIncomplete(food: MacroFields): boolean {
  return (
    food.caloriesPer100g > 0 &&
    food.proteinPer100g === 0 &&
    food.fatPer100g === 0 &&
    food.carbsPer100g === 0
  )
}
