/**
 * Tzameret data quality overrides and manually added foods.
 *
 * OVERRIDES: correct known bad entries in the Tzameret dataset.
 *   Key = smlmitzrach (the Tzameret food code as a string).
 *
 * MANUAL_FOODS: common foods missing from Tzameret entirely.
 *   IDs use the 'manual_' prefix.
 */

export interface FoodSeed {
  id: string
  nameHe: string
  nameEn: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
  fiberPer100g: number
  isUserCreated: boolean
  servingSizesJson: string
}

type FieldOverride = Partial<
  Pick<
    FoodSeed,
    | 'caloriesPer100g'
    | 'proteinPer100g'
    | 'fatPer100g'
    | 'carbsPer100g'
    | 'fiberPer100g'
    | 'category'
  >
>

/**
 * Corrections for known bad Tzameret entries.
 * Verified against current manufacturer labels (April 2026).
 */
export const FIELD_OVERRIDES: Record<string, FieldOverride> = {
  // Angel whole wheat bread: Tzameret shows fat=8.8g, carbs=29.6g (outdated formulation).
  // Current Angel label: fat=3g, carbs=43g, fiber=6g.
  '51201029': { fatPer100g: 3, carbsPer100g: 43, fiberPer100g: 6 },

  // Danone Pro yoghurt (plain): Tzameret shows protein=8g. Label shows 9.5g.
  '11412299': { proteinPer100g: 9.5, caloriesPer100g: 76 },
}

/**
 * Foods missing from Tzameret — added manually with USDA / label values.
 */
export const MANUAL_FOODS: FoodSeed[] = [
  {
    id: 'manual_tortilla_flour',
    nameHe: 'טורטייה / לאפה (קמח לבן)',
    nameEn: 'Tortilla / Wrap (flour)',
    category: 'carbs',
    caloriesPer100g: 310,
    proteinPer100g: 8,
    fatPer100g: 7,
    carbsPer100g: 53,
    fiberPer100g: 2,
    isUserCreated: false,
    servingSizesJson: JSON.stringify([
      { nameHe: 'טורטייה אחת (קטנה)', nameEn: 'Small tortilla', unit: 'piece', grams: 30 },
      { nameHe: 'טורטייה אחת (בינונית)', nameEn: 'Medium tortilla', unit: 'piece', grams: 45 },
      { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
    ]),
  },
]
