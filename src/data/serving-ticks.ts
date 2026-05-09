/**
 * Serving-tick metadata for the slider primitive (A2).
 *
 * Slug-keyed map. Each entry provides:
 *   - tick anchors (grams + Hebrew/English labels) at intuitive portion sizes
 *   - hand-portion icon for visual estimation without a scale
 *   - cookedVariantSlug pointer for raw/cooked siblings (currently only chicken)
 *
 * Decoupled from the FoodItem schema by design. When E3 ships the
 * dietitian-verified gold list, these entries fold onto FoodItem rows;
 * helpers (getServingTicks, getCookedVariant) stay unchanged.
 *
 * Foods not in this map fall back to deriving ticks from food.servingSizes.
 *
 * Tick gram values are based on:
 *   - Israeli Ministry of Health portion conventions (typical home-cook portions)
 *   - USDA standard nutrition-label serving sizes (almonds 28g = 1 oz, etc.)
 *   - Standard Israeli supermarket package sizes (Tnuva 250g cottage tub,
 *     Tara/Yotvata yogurt 150g/200g, Israeli small pita ~80g, etc.)
 *   - Common Israeli kitchen measures (כף = ~15g for liquids/pastes,
 *     כפית = ~5g, כוס = ~200g for cooked rice/pasta)
 *
 * Spec: docs/specs/2026-04-30-shared-slider-primitive.md
 */

import type { ServingTickEntry } from '@/types/nutrition'

export const SERVING_TICKS: Record<string, ServingTickEntry> = {
  // ── Protein ────────────────────────────────────────────────────

  chicken_breast_raw: {
    ticks: [
      { grams: 50, nameHe: '¼ חזה', nameEn: 'quarter breast', isPrimary: false },
      { grams: 100, nameHe: '½ חזה', nameEn: 'half breast', isPrimary: false },
      { grams: 150, nameHe: '¾ חזה', nameEn: 'three-quarter breast', isPrimary: true },
      { grams: 200, nameHe: 'חזה אחד', nameEn: 'one breast', isPrimary: true },
      { grams: 300, nameHe: 'חזה גדול', nameEn: 'large breast', isPrimary: true },
    ],
    handPortion: 'palm',
    cookedVariantSlug: 'chicken_breast_cooked',
  },

  chicken_breast_cooked: {
    ticks: [
      { grams: 50, nameHe: '¼ חזה', nameEn: 'quarter breast', isPrimary: false },
      { grams: 100, nameHe: '½ חזה', nameEn: 'half breast', isPrimary: true },
      { grams: 150, nameHe: 'חזה אחד', nameEn: 'one breast', isPrimary: true },
      { grams: 200, nameHe: 'חזה גדול', nameEn: 'large breast', isPrimary: true },
      { grams: 250, nameHe: '2 חצאי חזות', nameEn: 'two halves', isPrimary: false },
    ],
    handPortion: 'palm',
    cookedVariantSlug: 'chicken_breast_raw',
  },

  egg: {
    ticks: [
      { grams: 50, nameHe: 'ביצה', nameEn: 'one egg', isPrimary: true },
      { grams: 100, nameHe: '2 ביצים', nameEn: 'two eggs', isPrimary: true },
      { grams: 150, nameHe: '3 ביצים', nameEn: 'three eggs', isPrimary: true },
      { grams: 200, nameHe: '4 ביצים', nameEn: 'four eggs', isPrimary: false },
    ],
    handPortion: 'unit',
    cookedVariantSlug: null,
  },

  greek_yogurt_0pct: {
    // Israeli Greek yogurt (Yotvata/Tara עשיר) ships in 150g cups.
    // 200g single-serve does not exist in IL retail — anchors stay on
    // multiples of the actual 150g cup.
    ticks: [
      { grams: 75, nameHe: '½ גביע', nameEn: 'half cup', isPrimary: false },
      { grams: 150, nameHe: 'גביע', nameEn: 'one cup', isPrimary: true },
      { grams: 300, nameHe: '2 גביעים', nameEn: 'two cups', isPrimary: true },
      { grams: 450, nameHe: '3 גביעים', nameEn: 'three cups', isPrimary: true },
    ],
    handPortion: 'cupped_hand',
    cookedVariantSlug: null,
  },

  cottage_5pct: {
    ticks: [
      { grams: 60, nameHe: '¼ גביע', nameEn: 'quarter tub', isPrimary: false },
      { grams: 125, nameHe: '½ גביע', nameEn: 'half tub', isPrimary: true },
      { grams: 250, nameHe: 'גביע', nameEn: 'one tub', isPrimary: true },
      { grams: 375, nameHe: '1.5 גביעים', nameEn: '1.5 tubs', isPrimary: false },
      { grams: 500, nameHe: '2 גביעים', nameEn: 'two tubs', isPrimary: false },
    ],
    handPortion: 'cupped_hand',
    cookedVariantSlug: null,
  },

  tuna_water: {
    ticks: [
      { grams: 80, nameHe: 'קופסה קטנה', nameEn: 'small can drained', isPrimary: true },
      { grams: 120, nameHe: 'קופסה רגילה', nameEn: 'regular can drained', isPrimary: true },
      { grams: 200, nameHe: 'קופסה גדולה', nameEn: 'large can drained', isPrimary: true },
    ],
    handPortion: 'palm',
    cookedVariantSlug: null,
  },

  white_cheese_5pct: {
    ticks: [
      { grams: 30, nameHe: 'כף', nameEn: 'tablespoon', isPrimary: true },
      { grams: 60, nameHe: '2 כפות', nameEn: 'two tablespoons', isPrimary: true },
      { grams: 125, nameHe: '½ גביע', nameEn: 'half container', isPrimary: true },
      { grams: 250, nameHe: 'גביע', nameEn: 'one container', isPrimary: false },
    ],
    handPortion: 'thumb',
    cookedVariantSlug: null,
  },

  // ── Carbs ──────────────────────────────────────────────────────

  rice_cooked: {
    ticks: [
      { grams: 50, nameHe: '¼ כוס', nameEn: 'quarter cup', isPrimary: false },
      { grams: 100, nameHe: '½ כוס', nameEn: 'half cup', isPrimary: true },
      { grams: 200, nameHe: 'כוס', nameEn: 'one cup', isPrimary: true },
      { grams: 300, nameHe: '1.5 כוס', nameEn: '1.5 cups', isPrimary: true },
      { grams: 400, nameHe: '2 כוסות', nameEn: 'two cups', isPrimary: false },
    ],
    handPortion: 'cupped_hand',
    cookedVariantSlug: null,
  },

  bread_white: {
    ticks: [
      { grams: 25, nameHe: '½ פרוסה', nameEn: 'half slice', isPrimary: false },
      { grams: 50, nameHe: 'פרוסה', nameEn: 'one slice', isPrimary: true },
      { grams: 100, nameHe: '2 פרוסות', nameEn: 'two slices', isPrimary: true },
      { grams: 150, nameHe: '3 פרוסות', nameEn: 'three slices', isPrimary: true },
    ],
    handPortion: 'unit',
    cookedVariantSlug: null,
  },

  pita: {
    ticks: [
      { grams: 30, nameHe: '¼ פיתה', nameEn: 'quarter pita', isPrimary: false },
      { grams: 60, nameHe: '½ פיתה', nameEn: 'half pita', isPrimary: true },
      { grams: 80, nameHe: 'פיתה', nameEn: 'one pita', isPrimary: true },
      { grams: 100, nameHe: 'פיתה גדולה', nameEn: 'large pita', isPrimary: true },
    ],
    handPortion: 'unit',
    cookedVariantSlug: null,
  },

  oatmeal_dry: {
    // Rolled oats (the typical Israeli `שיבולת שועל`) is less dense than
    // quick oats: 1 IL כוס (240ml) ≈ 90g rolled, not 80g. Anchors fixed
    // to the rolled-oat density (most common in fitness use).
    ticks: [
      { grams: 30, nameHe: '3 כפות', nameEn: 'three tablespoons', isPrimary: false },
      { grams: 45, nameHe: '½ כוס', nameEn: 'half cup', isPrimary: true },
      { grams: 90, nameHe: 'כוס', nameEn: 'one cup', isPrimary: true },
      { grams: 135, nameHe: '1.5 כוס', nameEn: '1.5 cups', isPrimary: true },
    ],
    handPortion: 'cupped_hand',
    cookedVariantSlug: null,
  },

  pasta_cooked: {
    ticks: [
      { grams: 100, nameHe: '½ צלחת', nameEn: 'half plate', isPrimary: false },
      { grams: 150, nameHe: 'צלחת קטנה', nameEn: 'small plate', isPrimary: true },
      { grams: 250, nameHe: 'צלחת רגילה', nameEn: 'regular plate', isPrimary: true },
      { grams: 350, nameHe: 'צלחת גדולה', nameEn: 'large plate', isPrimary: true },
    ],
    handPortion: 'cupped_hand',
    cookedVariantSlug: null,
  },

  // ── Fats ───────────────────────────────────────────────────────

  olive_oil: {
    ticks: [
      { grams: 5, nameHe: 'כפית', nameEn: 'teaspoon', isPrimary: true },
      { grams: 10, nameHe: '2 כפיות', nameEn: 'two teaspoons', isPrimary: false },
      { grams: 15, nameHe: 'כף', nameEn: 'tablespoon', isPrimary: true },
      { grams: 30, nameHe: '2 כפות', nameEn: 'two tablespoons', isPrimary: true },
      { grams: 60, nameHe: '¼ כוס', nameEn: 'quarter cup', isPrimary: false },
    ],
    handPortion: 'thumb',
    cookedVariantSlug: null,
  },

  avocado: {
    ticks: [
      { grams: 50, nameHe: '¼ אבוקדו', nameEn: 'quarter avocado', isPrimary: false },
      { grams: 100, nameHe: '½ אבוקדו', nameEn: 'half avocado', isPrimary: true },
      { grams: 200, nameHe: 'אבוקדו', nameEn: 'one avocado', isPrimary: true },
      { grams: 300, nameHe: 'אבוקדו גדול', nameEn: 'large avocado', isPrimary: true },
    ],
    handPortion: 'fist',
    cookedVariantSlug: null,
  },

  tahini: {
    ticks: [
      { grams: 15, nameHe: 'כף', nameEn: 'tablespoon', isPrimary: true },
      { grams: 30, nameHe: '2 כפות', nameEn: 'two tablespoons', isPrimary: true },
      { grams: 60, nameHe: '¼ כוס', nameEn: 'quarter cup', isPrimary: true },
      { grams: 120, nameHe: '½ כוס', nameEn: 'half cup', isPrimary: false },
    ],
    handPortion: 'thumb',
    cookedVariantSlug: null,
  },

  almonds: {
    // `אונקיה` (ounce) and `חופן` (cupped-hand handful) replaced — first is
    // not natural Israeli kitchen language; second contradicts the thumb
    // hand-portion icon. Labels keep the slider in thumb-register.
    ticks: [
      { grams: 14, nameHe: '10 שקדים', nameEn: 'ten almonds', isPrimary: true },
      { grams: 28, nameHe: '~25 שקדים', nameEn: '~25 almonds', isPrimary: true },
      { grams: 50, nameHe: '~40 שקדים', nameEn: '~40 almonds', isPrimary: true },
      { grams: 100, nameHe: '½ כוס', nameEn: 'half cup', isPrimary: false },
    ],
    handPortion: 'thumb',
    cookedVariantSlug: null,
  },

  // ── Dairy ──────────────────────────────────────────────────────

  milk_3pct: {
    ticks: [
      { grams: 100, nameHe: '½ כוס', nameEn: 'half cup', isPrimary: false },
      { grams: 200, nameHe: 'כוס', nameEn: 'one cup', isPrimary: true },
      { grams: 250, nameHe: 'כוס גדולה', nameEn: 'large glass', isPrimary: true },
      { grams: 500, nameHe: '½ ליטר', nameEn: 'half liter', isPrimary: true },
    ],
    handPortion: 'cupped_hand',
    cookedVariantSlug: null,
  },

  // ── Fruit ──────────────────────────────────────────────────────

  banana: {
    ticks: [
      { grams: 60, nameHe: 'בננה קטנה', nameEn: 'small banana', isPrimary: false },
      { grams: 100, nameHe: 'בננה', nameEn: 'one banana', isPrimary: true },
      { grams: 130, nameHe: 'בננה גדולה', nameEn: 'large banana', isPrimary: true },
      { grams: 200, nameHe: '2 בננות', nameEn: 'two bananas', isPrimary: true },
    ],
    handPortion: 'unit',
    cookedVariantSlug: null,
  },

  apple: {
    ticks: [
      { grams: 80, nameHe: 'תפוח קטן', nameEn: 'small apple', isPrimary: false },
      { grams: 150, nameHe: 'תפוח', nameEn: 'one apple', isPrimary: true },
      { grams: 200, nameHe: 'תפוח גדול', nameEn: 'large apple', isPrimary: true },
      { grams: 300, nameHe: '2 תפוחים', nameEn: 'two apples', isPrimary: true },
    ],
    handPortion: 'fist',
    cookedVariantSlug: null,
  },

  // ── Vegetables ─────────────────────────────────────────────────

  tomato: {
    ticks: [
      { grams: 50, nameHe: 'עגבנייה קטנה', nameEn: 'small tomato', isPrimary: false },
      { grams: 100, nameHe: 'עגבנייה', nameEn: 'one tomato', isPrimary: true },
      { grams: 150, nameHe: 'עגבנייה גדולה', nameEn: 'large tomato', isPrimary: true },
      { grams: 200, nameHe: '2 עגבניות', nameEn: 'two tomatoes', isPrimary: true },
    ],
    handPortion: 'fist',
    cookedVariantSlug: null,
  },
}
