/**
 * Normalization pipeline for raw Rami Levy product data.
 * Pure functions — no network calls, no side effects.
 *
 * Flow: RLProductDetail → FoodSeed | null
 */

import { assignCategory } from './category-mapper'
import { inferContainerLabel } from './normalize-food'
import type { FoodSeed } from './tzameret-overrides'
import type { RLProductDetail, RLNutritionalValue } from './rami-levy-types'
import { NUTRIENT_FIELD_NAMES } from './rami-levy-types'

// ── ServingSize (mirrors src/types) ───────────────────────────────────────

interface ServingSize {
  nameHe: string
  nameEn: string
  unit: 'grams' | 'ml' | 'piece' | 'tablespoon' | 'teaspoon' | 'cup' | 'serving'
  grams: number
}

// ── extractNutrient ───────────────────────────────────────────────────────

/**
 * Extracts a single per-100g nutrient value from a Nutritional_Values array.
 * Searches all entries' fields for the given field_name.
 * Returns 0 if not found or if the value is non-numeric.
 */
export function extractNutrient(values: RLNutritionalValue[], fieldName: string): number {
  for (const entry of values) {
    for (const field of entry.fields) {
      if (field.field_name === fieldName) {
        const n = parseFloat(field.value)
        return isNaN(n) ? 0 : n
      }
    }
  }
  return 0
}

// ── parseNetContent ───────────────────────────────────────────────────────

/**
 * Parses a Rami Levy Net_Content object into { grams, unit }.
 * Handles: גרם (grams), ק"ג (kg→g), מ"ל (ml), ליטר (L→ml).
 * Returns null for null input, unknown UOMs, or non-numeric values.
 */
export function parseNetContent(
  netContent: { UOM: string; value: string; text: string } | null,
): { grams: number; unit: 'grams' | 'ml' } | null {
  if (!netContent) return null

  const raw = parseFloat(netContent.value)
  if (isNaN(raw) || raw <= 0) return null

  const uom = netContent.UOM.trim()

  if (uom === 'גרם') return { grams: raw, unit: 'grams' }
  if (uom === 'ק"ג') return { grams: raw * 1000, unit: 'grams' }
  if (uom === 'מ"ל') return { grams: raw, unit: 'ml' }
  if (uom === 'ליטר') return { grams: raw * 1000, unit: 'ml' }

  return null
}

// ── normalizeRLProduct ────────────────────────────────────────────────────

/**
 * Converts a raw Rami Levy product detail into a FoodSeed ready for the database.
 * Returns null if the product is missing required fields (name or calories).
 */
export function normalizeRLProduct(raw: RLProductDetail): FoodSeed | null {
  const nameHe = raw.name.trim()
  if (!nameHe) return null

  const nutritionalValues = raw.gs?.Nutritional_Values
  if (!nutritionalValues?.length) return null

  const calories = extractNutrient(nutritionalValues, NUTRIENT_FIELD_NAMES.calories)
  if (calories <= 0) return null

  const protein = extractNutrient(nutritionalValues, NUTRIENT_FIELD_NAMES.protein)
  const fat = extractNutrient(nutritionalValues, NUTRIENT_FIELD_NAMES.fat)
  const carbs = extractNutrient(nutritionalValues, NUTRIENT_FIELD_NAMES.carbs)
  const fiber = extractNutrient(nutritionalValues, NUTRIENT_FIELD_NAMES.fiber)

  const servingSizes = buildServingSizes(nameHe, raw.gs.Net_Content)

  return {
    id: `rl_${raw.barcode}`,
    nameHe,
    nameEn: nameHe, // Rami Levy API is Hebrew-only
    category: assignCategory(nameHe, protein, fat, carbs),
    caloriesPer100g: calories,
    proteinPer100g: protein,
    fatPer100g: fat,
    carbsPer100g: carbs,
    fiberPer100g: fiber,
    isUserCreated: false,
    servingSizesJson: JSON.stringify(servingSizes),
  }
}

// ── buildServingSizes ─────────────────────────────────────────────────────

function buildServingSizes(
  nameHe: string,
  netContent: { UOM: string; value: string; text: string } | null,
): ServingSize[] {
  const sizes: ServingSize[] = [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }]

  const container = parseNetContent(netContent)
  if (container && container.grams !== 100) {
    const label = inferContainerLabel(nameHe)
    sizes.push({
      nameHe: label.nameHe,
      nameEn: label.nameEn,
      unit: container.unit,
      grams: container.grams,
    })
  }

  return sizes
}
