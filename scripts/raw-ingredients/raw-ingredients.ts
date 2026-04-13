/**
 * Curated raw ingredient catalog — ~200 whole-food building blocks.
 *
 * Populated in Task 3 after Task 2's USDA fetch produces tmp/usda-raw.json.
 * Each entry must pass RawIngredientSchema (see ./schema.ts) or the build
 * script in Task 4 will fail.
 *
 * Priority tiers (ship order):
 *   P0 — ~73 must-ship items (globally top-tracked + Israeli staples)
 *   P1 — ~80 should-ship items (broader category coverage)
 *   P2 — ~60 nice-to-have items (prepared basics, edge condiments)
 */

import type { RawIngredient } from './schema'

export const RAW_INGREDIENTS: RawIngredient[] = []
