/**
 * Raw Ingredients Seed Builder
 *
 * Reads the curated RAW_INGREDIENTS catalog, validates each entry with
 * RawIngredientSchema, strips non-DB fields (baseSlug, state, priority,
 * sourceComment), maps the raw food category to a FoodCategory union value,
 * and writes src/assets/raw-ingredients-seed.json in the same shape as
 * supermarket-seed.json / rami-levy-seed.json.
 *
 * Fails fast on the first invalid entry with the offending id in the message.
 *
 * Usage:
 *   npm run build-raw-ingredients-seed
 */

import * as fs from 'fs'
import * as path from 'path'
import { RAW_INGREDIENTS } from './raw-ingredients'
import { RawIngredientSchema, type RawIngredient } from './schema'

export interface BuiltFoodSeed {
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

const RAW_TO_FOOD_CATEGORY: Record<string, string> = {
  poultry: 'protein',
  meat: 'protein',
  fish: 'protein',
  eggs: 'protein',
  legumes: 'protein',
  nuts: 'protein',
  grains: 'carbs',
  fats: 'fats',
  dairy: 'dairy',
  vegetables: 'vegetables',
  fruits: 'fruits',
  condiments: 'snacks',
  beverages: 'snacks',
}

export function mapRawCategory(raw: string): string {
  const mapped = RAW_TO_FOOD_CATEGORY[raw]
  if (!mapped) {
    throw new Error(`unknown raw category: "${raw}"`)
  }
  return mapped
}

export function buildSeed(entries: RawIngredient[]): BuiltFoodSeed[] {
  const out: BuiltFoodSeed[] = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const parsed = RawIngredientSchema.safeParse(entry)
    if (!parsed.success) {
      const id = (entry as { id?: string }).id ?? '<no-id>'
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Invalid raw ingredient "${id}" — ${msg}`)
    }
    const e = parsed.data
    if (seen.has(e.id)) {
      throw new Error(`Duplicate raw ingredient id: "${e.id}"`)
    }
    seen.add(e.id)

    out.push({
      id: e.id,
      nameHe: e.nameHe,
      nameEn: e.nameEn,
      category: mapRawCategory(e.category),
      caloriesPer100g: e.caloriesPer100g,
      proteinPer100g: e.proteinPer100g,
      fatPer100g: e.fatPer100g,
      carbsPer100g: e.carbsPer100g,
      fiberPer100g: e.fiberPer100g,
      isUserCreated: false,
      servingSizesJson: e.servingSizesJson,
    })
  }

  return out
}

function main(): void {
  const seed = buildSeed(RAW_INGREDIENTS)
  const outputPath = path.join(process.cwd(), 'src', 'assets', 'raw-ingredients-seed.json')

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2), 'utf8')

  const byCategory: Record<string, number> = {}
  for (const row of seed) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1
  }

  console.log(`[build-raw-ingredients-seed] ── Summary ──`)
  console.log(`  Input entries       : ${RAW_INGREDIENTS.length}`)
  console.log(`  Validated + written : ${seed.length}`)
  for (const [cat, count] of Object.entries(byCategory).sort()) {
    console.log(`    ${cat.padEnd(12)} ${count}`)
  }
  console.log(`  Output              : ${outputPath}`)
}

if (require.main === module) {
  main()
}
