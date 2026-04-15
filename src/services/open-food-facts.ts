/**
 * Open Food Facts integration.
 *
 * normalizeOffProduct — pure function, maps raw OFF JSON to FoodItem.
 * fetchOffProduct     — network call, returns null on 404 / no product.
 *
 * SECURITY: No user data sent to OFF. EAN barcode only (non-PII).
 */

import type { FoodItem } from '../types'

// ── Types ─────────────────────────────────────────────────────────────

export interface OffResult {
  food: FoodItem
  /** True when any of protein / fat / carbs was absent in the OFF response. */
  isPartial: boolean
}

// ── Pure normalizer ───────────────────────────────────────────────────

/**
 * Maps a raw Open Food Facts API response to a FoodItem.
 *
 * Name priority: product_name_he → product_name_en → product_name → EAN.
 * Missing macros default to 0; isPartial is set to true so the UI can warn.
 */
export function normalizeOffProduct(raw: unknown, ean: string): OffResult {
  const response = raw as Record<string, unknown>
  const product = (response.product ?? {}) as Record<string, unknown>
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>

  const nameHe =
    (product.product_name_he as string | undefined) ||
    (product.product_name_en as string | undefined) ||
    (product.product_name as string | undefined) ||
    ean

  const nameEn =
    (product.product_name_en as string | undefined) ||
    (product.product_name as string | undefined) ||
    ean

  const protein = nutriments['proteins_100g'] as number | undefined
  const fat = nutriments['fat_100g'] as number | undefined
  const carbs = nutriments['carbohydrates_100g'] as number | undefined

  const isPartial = protein == null || fat == null || carbs == null

  const food: FoodItem = {
    id: `manual_${ean}`,
    nameHe,
    nameEn,
    category: 'snacks',
    caloriesPer100g: (nutriments['energy-kcal_100g'] as number | undefined) ?? 0,
    proteinPer100g: protein ?? 0,
    fatPer100g: fat ?? 0,
    carbsPer100g: carbs ?? 0,
    fiberPer100g: (nutriments['fiber_100g'] as number | undefined) ?? 0,
    isUserCreated: false,
    servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
  }

  return { food, isPartial }
}

// ── Network fetcher ───────────────────────────────────────────────────

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'

/**
 * Fetches a product from Open Food Facts by EAN barcode.
 *
 * Returns null when the product is not found (status=0 or HTTP 404).
 * Throws on network errors — caller is responsible for error handling.
 */
export async function fetchOffProduct(ean: string): Promise<OffResult | null> {
  const response = await fetch(`${OFF_BASE}/${ean}.json`)

  if (response.status === 404) return null

  const json = (await response.json()) as Record<string, unknown>

  // OFF returns status=0 when barcode is unknown
  if (!json || json.status === 0) return null

  return normalizeOffProduct(json, ean)
}
