/**
 * Normalization pipeline for raw Shufersal product data.
 * Pure functions — no network calls, no side effects.
 *
 * Flow: RawShufersalProduct → FoodSeed | null
 */

import { assignCategory } from './category-mapper'
import type { FoodSeed } from './tzameret-overrides'
import type { RawShufersalProduct } from './shufersal-types'

// ── ServingSize (mirrors src/types) ──────────────────────────────────────

interface ServingSize {
  nameHe: string
  nameEn: string
  unit: 'grams' | 'ml' | 'piece' | 'tablespoon' | 'teaspoon' | 'cup' | 'serving'
  grams: number
}

// ── Container label keywords ──────────────────────────────────────────────

const CUP_KEYWORDS = ['יוגורט', 'גבינה', 'קוטג', 'שמנת', 'גביע', 'פודינג', 'מוס', 'קרם']
const LOAF_KEYWORDS = ['לחם', 'חלה', 'בגט', 'פיתה', 'לאפה']
const BOTTLE_KEYWORDS = ['בקבוק', 'שמן', 'חומץ', 'רוטב', 'מיץ', 'משקה']
const BAG_KEYWORDS = ['שקית', 'אורז', 'קמח', 'סוכר', 'קינואה', 'עדשים', 'גריסים']
const CAN_KEYWORDS = ['שימור', 'קופסא', 'טונה', 'שעועית', 'גרגרי']

/**
 * Infers a container label from the Hebrew product name.
 * Returns Hebrew + English names for the "full package" serving size.
 */
export function inferContainerLabel(nameHe: string): { nameHe: string; nameEn: string } {
  const name = nameHe.trim()

  if (CUP_KEYWORDS.some((k) => name.includes(k)))
    return { nameHe: 'גביע שלם', nameEn: 'Full container' }
  if (LOAF_KEYWORDS.some((k) => name.includes(k))) return { nameHe: 'כיכר', nameEn: 'Loaf' }
  if (BOTTLE_KEYWORDS.some((k) => name.includes(k))) return { nameHe: 'בקבוק', nameEn: 'Bottle' }
  if (BAG_KEYWORDS.some((k) => name.includes(k))) return { nameHe: 'שקית', nameEn: 'Bag' }
  if (CAN_KEYWORDS.some((k) => name.includes(k))) return { nameHe: 'קופסא', nameEn: 'Can' }

  return { nameHe: 'אריזה שלמה', nameEn: 'Full package' }
}

/**
 * Builds the serving sizes array for a product.
 * Always includes 100g. Adds container and per-serving sizes when available,
 * deduplicating by gram weight.
 */
export function extractServingSizes(raw: RawShufersalProduct): ServingSize[] {
  const sizes: ServingSize[] = [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }]
  const seen = new Set<number>([100])

  // Container serving (whole package)
  if (raw.containerGrams && raw.containerGrams > 0 && !seen.has(raw.containerGrams)) {
    const label = inferContainerLabel(raw.nameHe)
    sizes.push({
      nameHe: label.nameHe,
      nameEn: label.nameEn,
      unit: 'grams',
      grams: raw.containerGrams,
    })
    seen.add(raw.containerGrams)
  }

  // Per-serving (e.g. 1 slice, 1 scoop)
  if (raw.servingSizeGrams && raw.servingSizeGrams > 0 && !seen.has(raw.servingSizeGrams)) {
    sizes.push({ nameHe: 'מנה', nameEn: 'Serving', unit: 'grams', grams: raw.servingSizeGrams })
    seen.add(raw.servingSizeGrams)
  }

  return sizes
}

/**
 * Converts a raw Shufersal product into a FoodSeed ready for the database.
 * Returns null if the product is missing required fields (name or calories).
 */
export function normalizeProduct(raw: RawShufersalProduct): FoodSeed | null {
  const nameHe = raw.nameHe.trim()

  if (!nameHe) return null
  if (raw.per100g.calories <= 0) return null

  const servingSizes = extractServingSizes(raw)

  return {
    id: `sh_${raw.barcode}`,
    nameHe,
    nameEn: nameHe, // Shufersal has no English names — use Hebrew as fallback
    category: assignCategory(nameHe, raw.per100g.protein, raw.per100g.fat, raw.per100g.carbs),
    caloriesPer100g: raw.per100g.calories,
    proteinPer100g: raw.per100g.protein,
    fatPer100g: raw.per100g.fat,
    carbsPer100g: raw.per100g.carbs,
    fiberPer100g: raw.per100g.fiber,
    isUserCreated: false,
    servingSizesJson: JSON.stringify(servingSizes),
  }
}
