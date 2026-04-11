/**
 * Shufersal API — Types and Category Whitelist
 *
 * API findings (investigated 2026-04-11 via Chrome DevTools):
 *
 * ARCHITECTURE: SAP Commerce (Hybris) storefront. No clean REST JSON API —
 * category listings and product details return server-rendered HTML fragments.
 * A small number of utility endpoints return true JSON (subcategories, siblings).
 *
 * ── Endpoint 1: Category Product Listing (paginated HTML) ────────────────
 *
 *   GET /online/he/c/{categoryCode}/fragment?q=%3Arelevance&page={N}&pageSize={S}
 *
 *   Returns: HTML fragment. Root div has:
 *     data-results="1032"   — total product count
 *     data-pages="11"       — total pages
 *     data-has-next-page="true"
 *
 *   Each product tile is an <li> with:
 *     data-product-name="דנונה פרו 25 גרם חלבון"
 *     data-food="true"           — true only for food products
 *     data-product-code="P_7290119377411"   — "P_" + 13-digit EAN barcode
 *
 *   NOTE: No nutrition data in the listing — requires a separate product detail call.
 *
 * ── Endpoint 2: Product Detail (HTML fragment — despite "/json" in URL) ───
 *
 *   GET /online/he/p/{productCode}/json
 *   e.g. GET /online/he/p/P_7290119377411/json
 *
 *   Returns: HTML modal fragment. Contains:
 *     <h2> — Hebrew product name
 *     <input name="productCodePost" value="P_7290119377411"> — barcode
 *     .dataList <li> items:
 *       "מידה/סוג:" → container size (e.g. "215 גרם")
 *       "מק\"ט:"    → barcode/SKU
 *       "חלבי/בשרי/פרווה:" → kosher classification
 *     Two .nutritionList sections:
 *       First  — per 100g  (preceded by .subInfo = "100 גרם")
 *       Second — per serving (preceded by .subInfo = "מנה")
 *     Each .nutritionItem div has:
 *       .number[title] — numeric value (e.g. "11.6")
 *       .name          — unit in Hebrew (גרם / קל / מג)
 *       .text          — nutrient label (חלבונים / אנרגיה / שומנים / פחמימות / סיבים תזונתיים)
 *
 *   Hebrew nutrient label → field mapping:
 *     אנרגיה            → calories (unit: קל = kcal)
 *     חלבונים            → protein  (unit: גרם)
 *     פחמימות            → carbs    (unit: גרם)
 *     שומנים             → fat      (unit: גרם)
 *     סיבים תזונתיים     → fiber    (unit: גרם)
 *
 * ── Endpoint 3: Subcategory Tree (true JSON) ─────────────────────────────
 *
 *   GET /online/he/categoryfeatures/subcategories/{categoryCode}
 *   Returns: Array<{ code, name: { iw, en }, ... }>
 *
 * ── Rate limiting ─────────────────────────────────────────────────────────
 *   No rate limiting observed. Use 1 req/sec to be respectful.
 *   No auth headers required. Plain GET with standard User-Agent works.
 *
 * ── English names ─────────────────────────────────────────────────────────
 *   Product pages are Hebrew-only. English names not available from Shufersal.
 *   The scraper generates a transliterated fallback from the Hebrew name.
 */

// ── Raw types (what we extract from Shufersal's HTML) ─────────────────────

/** Nutrition values for a single serving (per 100g or per package serving). */
export interface RawNutrition {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

/**
 * Fully parsed product data extracted from Shufersal.
 * Two-step: listing tile → detail page.
 */
export interface RawShufersalProduct {
  /** Full product code including P_ prefix, e.g. "P_7290119377411" */
  productCode: string
  /** 13-digit EAN barcode, e.g. "7290119377411" */
  barcode: string
  /** Hebrew product name from <h2> on detail page */
  nameHe: string
  /** Container/package size in grams (from "מידה/סוג" field). null if not listed. */
  containerGrams: number | null
  /** Serving size in grams from the "מנה" nutrition table. null if not listed. */
  servingSizeGrams: number | null
  /** Nutrition per 100g — always present */
  per100g: RawNutrition
  /** Nutrition per package serving — present only when the "מנה" table exists */
  perServing: RawNutrition | null
}

// ── Category whitelist ─────────────────────────────────────────────────────

export interface ShufersalCategory {
  /** Shufersal category code, e.g. "A01" */
  code: string
  /** Hebrew name for logging */
  nameHe: string
}

/**
 * Food-only category whitelist.
 *
 * Includes all subcategories of each top-level code EXCEPT explicit exclusions.
 * Non-food departments (cleaning, cosmetics, pets, baby, alcohol) are omitted.
 *
 * Top-level strategy:
 *   A01  Dairy & Eggs              — all subcategories
 *   A04  Fruits & Vegetables       — all subcategories
 *   A07  Meat, Chicken & Fish      — all subcategories (excl. A0720 BBQ equipment)
 *   A10  Bread & Bakery            — all subcategories
 *   A16  Chilled & Frozen          — all subcategories
 *   A22  Cooking, Baking & Canned  — all subcategories
 *   A25  Snacks, Sweets & Cereals  — all subcategories (excl. A2510 disposables)
 *   A13  Beverages (partial)       — non-alcohol only: water, coffee, tea, soft drinks
 *   A28  Organic & Health (partial)— food only (excl. cleaning, pharm/baby)
 */
export const FOOD_CATEGORIES: ShufersalCategory[] = [
  // ── Dairy & Eggs ──────────────────────────────────────────────────────
  { code: 'A0104', nameHe: 'מדף הגבינות' },
  { code: 'A0105', nameHe: 'גבינות מעדנייה' },
  { code: 'A0107', nameHe: 'מוצרי חלב וביצים' },
  { code: 'A0110', nameHe: 'מעדנים וקינוחים' },
  { code: 'A0112', nameHe: 'תחליפי חלב וטופו' },
  { code: 'A0113', nameHe: 'יוגורט ומשקאות יוגורט' },
  { code: 'A0119', nameHe: 'מוצרי אפיה ובישול (חלב)' },

  // ── Fruits & Vegetables ───────────────────────────────────────────────
  { code: 'A0402', nameHe: 'פיצוחים ופירות יבשים' },
  { code: 'A0405', nameHe: 'פירות' },
  { code: 'A0408', nameHe: 'ירקות' },
  { code: 'A0409', nameHe: 'ירקות ופירות מצוננים' },
  { code: 'A0411', nameHe: 'פירות וירקות אורגניים' },

  // ── Meat, Chicken & Fish ──────────────────────────────────────────────
  { code: 'A0702', nameHe: 'בשר בקר וכבש' },
  { code: 'A0705', nameHe: 'דגים' },
  { code: 'A0707', nameHe: 'תחליפי בשר' },
  { code: 'A0711', nameHe: 'מוצרי בשר על האש' },
  { code: 'A0714', nameHe: 'מוצרי עוף והודו' },
  { code: 'A0717', nameHe: 'מוצרים להכנה מהירה (בשר)' },
  // A0720 (BBQ equipment) intentionally excluded — non-food accessories

  // ── Bread & Bakery ────────────────────────────────────────────────────
  { code: 'A1002', nameHe: 'מאפים ועוגות מהמאפיה' },
  { code: 'A1005', nameHe: 'לחמים ולחמניות מהמאפיה' },
  { code: 'A1008', nameHe: 'לחם, לחמניות ופיתות' },
  { code: 'A1011', nameHe: 'עוגות ארוזות' },
  { code: 'A1013', nameHe: 'פתית, פריכות וצנימים' },
  { code: 'A1014', nameHe: 'לחמי מחמצת, חלות ולחמים פרוסים' },
  { code: 'A1015', nameHe: 'לחמניות, פיתות ובגטים' },
  { code: 'A1016', nameHe: 'מאפים מלוחים ומתוקים' },
  { code: 'A1017', nameHe: 'עוגות ועוגיות' },
  { code: 'A1018', nameHe: 'לחמים ולחמניות ללא גלוטן' },

  // ── Chilled & Frozen ──────────────────────────────────────────────────
  { code: 'A1602', nameHe: 'גלידות' },
  { code: 'A1603', nameHe: 'מוצרי בשר עוף ודגים קפואים' },
  { code: 'A1605', nameHe: 'ירקות ופירות קפואים' },
  { code: 'A1608', nameHe: 'בצקים ומאפים קפואים' },
  { code: 'A1611', nameHe: 'תחליפי בשר קפוא' },
  { code: 'A1614', nameHe: 'קפואים ללא גלוטן' },
  { code: 'A1617', nameHe: 'קינוחים ומנות אחרונות' },
  { code: 'A1622', nameHe: 'דגים במעדניה' },
  { code: 'A1624', nameHe: 'חומוס וסלטים' },
  { code: 'A1626', nameHe: 'נקניקים ודגים מעושנים' },
  { code: 'A1628', nameHe: 'אוכל מוכן להכנה מהירה' },

  // ── Cooking, Baking & Canned ──────────────────────────────────────────
  { code: 'A2202', nameHe: 'דבש ריבות וממרחים' },
  { code: 'A2205', nameHe: 'מוצרים לאפיה ובישול' },
  { code: 'A2206', nameHe: 'טעמי המזרח הרחוק' },
  { code: 'A2208', nameHe: 'מרקים קרוטונים ותבשילים' },
  { code: 'A2211', nameHe: 'פסטה אורז קוסקוס וקטניות' },
  { code: 'A2214', nameHe: 'רטבים ותוספות' },
  { code: 'A2217', nameHe: 'שימורים' },
  { code: 'A2220', nameHe: 'מוצרים מיוחדים' },
  { code: 'A2223', nameHe: 'מוצרי יסוד ותבלינים' },
  { code: 'A2226', nameHe: 'שמן חומץ ומיץ לימון' },

  // ── Snacks, Sweets & Cereals ──────────────────────────────────────────
  { code: 'A2502', nameHe: 'דגנים וחטיפי דגנים' },
  { code: 'A2505', nameHe: 'ממתקים' },
  { code: 'A2506', nameHe: 'חטיפים מלוחים' },
  { code: 'A2507', nameHe: 'פריכיות וקרקרים' },
  { code: 'A2508', nameHe: 'עוגות עוגיות ווופלים ארוז' },
  { code: 'A2512', nameHe: 'מיוחדים בחטיפים' },
  // A2510 (birthday/disposables) intentionally excluded

  // ── Beverages — non-alcohol only ──────────────────────────────────────
  { code: 'A1302', nameHe: 'מים וסודה' },
  { code: 'A1305', nameHe: 'קפה ותה' },
  { code: 'A1306', nameHe: 'קפסולות ופולים לאספרסו' },
  { code: 'A1308', nameHe: 'משקאות קלים' },
  { code: 'A1314', nameHe: 'בירה ומשקאות אנרגיה' },
  // A1317/A1320/A1323 (spirits/wine) excluded
  // A1326 (cigarettes) excluded

  // ── Organic & Health — food subcategories only ────────────────────────
  { code: 'A2802', nameHe: 'מוצרים לבישול ואפיה אורגני' },
  { code: 'A2803', nameHe: 'דגנים משקאות ומתוקים אורגני' },
  { code: 'A2805', nameHe: 'בריאות במקרר' },
  { code: 'A2808', nameHe: 'דיאט וללא סוכר' },
  { code: 'A2811', nameHe: 'לחם קרקרים ופריכיות אורגני' },
  { code: 'A2814', nameHe: 'מוצרים ללא גלוטן' },
  { code: 'A2817', nameHe: 'פירות וירקות אורגני' },
  { code: 'A2820', nameHe: 'קפואים אורגני' },
  // A2809 (eco cleaning), A2823 (pharm/baby) excluded
]

/** Set of category codes for O(1) lookup */
export const FOOD_CATEGORY_CODES = new Set(FOOD_CATEGORIES.map((c) => c.code))
