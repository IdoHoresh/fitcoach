/**
 * Serving-tick metadata for the slider primitive (A2).
 *
 * Slug-keyed map. Each entry provides:
 *   - tick anchors (grams + Hebrew/English labels) at intuitive portion sizes
 *   - hand-portion icon for visual estimation without a scale
 *   - cookedVariantSlug pointer for raw/cooked siblings (e.g. chicken)
 *
 * Decoupled from the FoodItem schema by design. When E3 ships the
 * dietitian-verified gold list, these entries fold onto FoodItem rows;
 * helpers (getServingTicks, getCookedVariant) stay unchanged.
 *
 * Foods not in this map fall back to deriving ticks from food.servingSizes.
 *
 * Spec: docs/specs/2026-04-30-shared-slider-primitive.md
 */

import type { ServingTickEntry } from '@/types/nutrition'

// Populated in Task 4 (next commit). Helpers ship first so the import path
// is stable.
export const SERVING_TICKS: Record<string, ServingTickEntry> = {}
