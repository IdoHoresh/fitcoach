/**
 * Rami Levy API — Types and Department Whitelist
 *
 * API findings (investigated 2026-04-12 via DevTools + direct API calls):
 *
 * ARCHITECTURE: Custom Nuxt.js (Vue 2 SSR) app with Elasticsearch backend.
 * No SAP Commerce — fully proprietary API, no auth required.
 *
 * ── Endpoint 1: Product Search (paginated JSON) ──────────────────────────
 *
 *   GET https://www.rami-levy.co.il/api/search?q={term}&size={S}&from={offset}
 *
 *   Returns: { q, status, total, data: RLProductSummary[] }
 *
 *   IMPORTANT quirks:
 *   - Empty q= returns HTTP 200 but JSON ["Internal Server Error"] — must use a term
 *   - depId= parameter is accepted but has NO effect on filtering — filter in memory
 *   - Pagination uses `from` (Elasticsearch offset), not `page`
 *   - ES hard cap: from + size must be ≤ 10,000 or returns ["Internal Server Error"]
 *   - total is capped at 10,000 even when more products exist
 *   - Full catalog size: ~6,755 products (confirmed via /api/menu aggregation)
 *
 *   Coverage strategy: two broad sweeps are enough to cover the full catalog —
 *   q=ה ("the" prefix/suffix, appears in ~90% of Hebrew product names) covers most,
 *   q=א catches any remaining. Deduplicate by `id` across both sweeps.
 *
 * ── Endpoint 2: Product Detail with Nutrition (JSON) ────────────────────
 *
 *   GET https://www.rami-levy.co.il/api/items/{id}
 *
 *   Returns: { status, total, data: [RLProductDetail] }
 *
 *   Additional fields vs. search:
 *   - gs.Nutritional_Values: RLNutritionalValue[] — GS1 structured nutrition
 *   - gs.Product_Dimensions: gross weight, net weight
 *   - full_desc, short_desc, ingredients, allergens
 *
 *   Nutritional_Values field_name → FoodSeed mapping:
 *     Energy_per_100_grams        → caloriesPer100g
 *     Proteins_per_100_grams      → proteinPer100g
 *     Fats_per_100_grams          → fatPer100g
 *     Carbohydrates_per_100_grams → carbsPer100g
 *     Dietary_Fiber_per_100_grams → fiberPer100g  (may be absent)
 *
 * ── Endpoint 3: Menu / Aggregation (JSON) ────────────────────────────────
 *
 *   GET https://www.rami-levy.co.il/api/menu
 *   Returns ES aggregation of all products by department. Used for discovery only.
 *
 * ── Rate limiting ─────────────────────────────────────────────────────────
 *   No explicit rate limiting observed. Use 300ms between search requests,
 *   500ms between detail requests to be respectful.
 *   No auth headers required.
 *
 * ── Department IDs (confirmed 2026-04-12 via /api/menu) ──────────────────
 *   49  Deli / Salads / Prepared foods
 *   50  Dairy
 *   51  Meat & Poultry
 *   52  Bakery & Pastries
 *   53  Frozen & Fish
 *   54  Pantry / Dry Goods / Canned
 *   55  Staples (Rice, Pasta, Breakfast cereals)
 *   56  Snacks & Confectionery
 *   57  Coffee, Tea & Hot Drinks
 *   59  Produce & Fresh Eggs
 *   61  Bread
 *   85  Specialty / Imported Dairy
 *   --- EXCLUDED ---
 *   58  Housewares / Kitchen (non-food)
 *   60  Personal Care / Hygiene (non-food)
 *   1237 Alcohol
 *   1238 Cosmetics
 *   1243 Toys
 *   1244 Appliances
 *   1245 Kitchen Gadgets (non-food)
 *   1246 Eyewear
 */

// ── Raw types (search endpoint) ───────────────────────────────────────────

/** Nutrition field from /api/items/{id} gs.Nutritional_Values */
export interface RLNutritionalField {
  /** e.g. "Energy_per_100_grams", "Proteins_per_100_grams" */
  field_name: string
  /** Numeric value as string, e.g. "60" */
  value: string
  /** Unit in Hebrew, e.g. "קלוריות", "גרם", "מג" */
  UOM: string
  /** Column label, e.g. "ל-100 גרם", "למנה" */
  col_label: string
}

export interface RLNutritionalValue {
  code: string
  /** Hebrew nutrient label, e.g. "אנרגיה (קלוריות)", "חלבונים" */
  label: string
  fields: RLNutritionalField[]
}

/** Product summary from /api/search */
export interface RLProductSummary {
  /** Internal Rami Levy product ID */
  id: number
  /** EAN-13 barcode as integer — stringify when building rl_<barcode> ID */
  barcode: number
  /** Hebrew product name */
  name: string
  department_id: number
  gs: {
    BrandName: string
    /** Container/package size, e.g. { UOM: "ליטר", text: "1 ליטר", value: "1" } */
    Net_Content: { UOM: string; text: string; value: string } | null
  }
}

/** Full product detail from /api/items/{id} */
export interface RLProductDetail extends RLProductSummary {
  gs: RLProductSummary['gs'] & {
    /** GS1-structured nutrition data. May be absent for some products. */
    Nutritional_Values?: RLNutritionalValue[]
  }
}

/** Response shape from /api/search */
export interface RLSearchResponse {
  q: string
  status: number
  /** Total matching products. Capped at 10,000 by Elasticsearch. */
  total: number
  data: RLProductSummary[]
}

/** Response shape from /api/items/{id} */
export interface RLItemResponse {
  status: number
  total: number
  data: RLProductDetail[]
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Food-only department IDs. Used to filter search results in memory (depId= param is broken). */
export const FOOD_DEPARTMENT_IDS = new Set<number>([
  49, // Deli / Salads / Prepared
  50, // Dairy
  51, // Meat & Poultry
  52, // Bakery & Pastries
  53, // Frozen & Fish
  54, // Pantry / Dry Goods / Canned
  55, // Staples (Rice, Pasta, Breakfast)
  56, // Snacks & Confectionery
  57, // Coffee, Tea & Hot Drinks
  59, // Produce & Fresh Eggs
  61, // Bread
  85, // Specialty / Imported Dairy
])

/**
 * Hebrew search terms for full-catalog sweep.
 *
 * IMPORTANT: Single-char queries (e.g. "ה") return ≤100 results regardless of `size=`.
 * The API appears to treat single-char queries as a special case. Use 2+ char terms.
 *
 * Chosen terms and expected totals (verified 2026-04-12):
 *   'גב'  → ~7,400 total (גבינה, גביע, גב… — very broad)
 *   'עם'  → ~4,243 total (עם / "with" — appears in most compound product names)
 *   'לח'  → ~3,511 total (לחם, לחוץ… — covers bread + more)
 *   'חל'  → ~3,105 total (חלב, חלה, חלפון… — covers dairy)
 *   'קפ'  → ~2,318 total (קפה, קפוא… — covers coffee + frozen)
 *   'שמ'  → ~2,608 total (שמן, שמנת, שמיר… — covers oils + cream)
 *
 * Together these 6 terms return >> 6,755 unique results.
 * In-memory deduplication by product `id` eliminates all overlaps.
 */
export const SWEEP_TERMS = ['גב', 'עם', 'לח', 'חל', 'קפ', 'שמ'] as const

/** Max results per page (Elasticsearch from + size must be ≤ 10,000) */
export const SEARCH_PAGE_SIZE = 500

/** Base URL for all Rami Levy API calls */
export const RL_API_BASE = 'https://www.rami-levy.co.il'

/** field_name values used to extract per-100g macros from Nutritional_Values */
export const NUTRIENT_FIELD_NAMES = {
  calories: 'Energy_per_100_grams',
  protein: 'Proteins_per_100_grams',
  fat: 'Fats_per_100_grams',
  carbs: 'Carbohydrates_per_100_grams',
  fiber: 'Dietary_Fiber_per_100_grams',
} as const
