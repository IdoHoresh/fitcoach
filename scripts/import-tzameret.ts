/**
 * Tzameret Import Script
 *
 * Converts Israeli Ministry of Health Tzameret CSV files into
 * src/assets/tzameret-seed.json — the food database bundled with the app.
 *
 * Run once after downloading the CSVs:
 *   npm run import-tzameret
 *
 * Input files (default: ~/Downloads/):
 *   moh_mitzrachim.csv              — main food table (4,624 foods)
 *   moh_yehidot_mida_lemitzrachim.csv — serving sizes per food
 *   moh_yehidot_mida.csv             — serving unit definitions
 *
 * Output:
 *   src/assets/tzameret-seed.json
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { parse } from 'csv-parse/sync'
import { assignCategory } from './category-mapper'
import { FIELD_OVERRIDES, MANUAL_FOODS, type FoodSeed } from './tzameret-overrides'

// ── Paths ────────────────────────────────────────────────────────────

const DOWNLOADS = path.join(os.homedir(), 'Downloads')
const FOODS_CSV = path.join(DOWNLOADS, 'moh_mitzrachim.csv')
const SERVINGS_PER_FOOD_CSV = path.join(DOWNLOADS, 'moh_yehidot_mida_lemitzrachim.csv')
const SERVING_UNITS_CSV = path.join(DOWNLOADS, 'moh_yehidot_mida.csv')
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'assets', 'tzameret-seed.json')

// ── Types ────────────────────────────────────────────────────────────

type ServingUnit = 'grams' | 'ml' | 'piece' | 'tablespoon' | 'teaspoon' | 'cup' | 'serving'

interface ServingSize {
  nameHe: string
  nameEn: string
  unit: ServingUnit
  grams: number
}

interface ServingUnitRow {
  smlmida: string
  shmmida: string
}

interface ServingPerFoodRow {
  mmitzrach: string
  mida: string
  mishkal: string
}

interface FoodRow {
  smlmitzrach: string
  shmmitzrach: string
  english_name: string
  food_energy: string
  protein: string
  total_fat: string
  carbohydrates: string
  total_dietary_fiber: string
}

// ── Serving unit code → ServingUnit + English label ──────────────────

function midaCodeToUnit(code: number): ServingUnit {
  if (code >= 100 && code <= 107) return 'piece' // יחידה
  if (code >= 200 && code <= 209) return 'cup' // כוס
  if (code >= 300 && code <= 308) return 'tablespoon' // כף
  if (code >= 400 && code <= 402) return 'teaspoon' // כפית
  if (code >= 500 && code <= 503) return 'piece' // פרוסה (slice)
  if (code >= 600 && code <= 605) return 'serving' // גביע
  if (code === 700) return 'grams' // גרמים
  if (code >= 800 && code <= 803) return 'serving' // מנה
  if (code >= 900 && code <= 912) return 'serving' // אריזה
  if (code >= 1001 && code <= 1007) return 'serving' // צלחת
  if (code >= 1100 && code <= 1106) return 'serving' // בקבוק/פחית
  if (code >= 1201 && code <= 1237) return 'piece' // shapes
  if (code === 2000) return 'grams' // קילוגרם
  return 'serving'
}

function midaCodeToEnglish(code: number, hebrewName: string): string {
  if (code >= 100 && code <= 107)
    return hebrewName.includes('קטנ')
      ? 'Small unit'
      : hebrewName.includes('גדול')
        ? 'Large unit'
        : 'Unit'
  if (code >= 200 && code <= 209) return 'Cup'
  if (code >= 300 && code <= 308) return 'Tablespoon'
  if (code >= 400 && code <= 402) return 'Teaspoon'
  if (code >= 500 && code <= 503)
    return hebrewName.includes('דק')
      ? 'Thin slice'
      : hebrewName.includes('עב')
        ? 'Thick slice'
        : 'Slice'
  if (code >= 600 && code <= 605) return 'Container'
  if (code === 700) return 'Grams'
  if (code >= 800 && code <= 803)
    return hebrewName.includes('קטנ')
      ? 'Small serving'
      : hebrewName.includes('גדול')
        ? 'Large serving'
        : 'Serving'
  if (code >= 900 && code <= 912) return 'Package'
  if (code >= 1001 && code <= 1007) return 'Plate'
  if (code >= 1100 && code <= 1106) return code >= 1104 ? 'Can' : 'Bottle'
  if (code === 2000) return 'Kilogram'
  return 'Serving'
}

// ── CSV parsing helper ────────────────────────────────────────────────

function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath)
  // Strip UTF-8 BOM if present
  const text =
    content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf
      ? content.slice(3).toString('utf8')
      : content.toString('utf8')

  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as T[]
}

// ── Safe number parser ────────────────────────────────────────────────

function toNum(value: string | undefined): number {
  const n = parseFloat(value ?? '')
  return isNaN(n) ? 0 : n
}

// ── Default 100g serving ──────────────────────────────────────────────

const DEFAULT_100G: ServingSize = {
  nameHe: '100 גרם',
  nameEn: '100g',
  unit: 'grams',
  grams: 100,
}

// ── Main ──────────────────────────────────────────────────────────────

function run(): void {
  console.log('Reading CSV files...')

  const unitRows = readCsv<ServingUnitRow>(SERVING_UNITS_CSV)
  const servingRows = readCsv<ServingPerFoodRow>(SERVINGS_PER_FOOD_CSV)
  const foodRows = readCsv<FoodRow>(FOODS_CSV)

  // Build unit code → {nameHe, unit, englishLabel} map
  const unitMap = new Map<number, { nameHe: string; unit: ServingUnit; nameEn: string }>()
  for (const row of unitRows) {
    const code = parseInt(row.smlmida, 10)
    unitMap.set(code, {
      nameHe: row.shmmida,
      unit: midaCodeToUnit(code),
      nameEn: midaCodeToEnglish(code, row.shmmida),
    })
  }

  // Build food code → serving sizes map
  const servingsByFood = new Map<string, ServingSize[]>()
  for (const row of servingRows) {
    const foodCode = row.mmitzrach
    const midaCode = parseInt(row.mida, 10)
    const grams = parseFloat(row.mishkal)

    // Skip raw grams reference (code 700, mishkal=1) and tiny servings
    if (midaCode === 700 && grams < 5) continue
    if (grams < 10) continue
    // Cap unreasonably large values (> 2kg = package size, not useful for logging)
    if (grams > 2000) continue

    const unitDef = unitMap.get(midaCode)
    if (!unitDef) continue

    if (!servingsByFood.has(foodCode)) servingsByFood.set(foodCode, [])
    servingsByFood.get(foodCode)!.push({
      nameHe: unitDef.nameHe,
      nameEn: unitDef.nameEn,
      unit: unitDef.unit,
      grams,
    })
  }

  console.log(`Processing ${foodRows.length} foods...`)

  const output: FoodSeed[] = []
  let skipped = 0

  for (const row of foodRows) {
    const calories = toNum(row.food_energy)
    const protein = toNum(row.protein)
    const fat = toNum(row.total_fat)
    const carbs = toNum(row.carbohydrates)
    const fiber = toNum(row.total_dietary_fiber)
    const nameHe = row.shmmitzrach?.trim() ?? ''
    const nameEn = row.english_name?.trim() ?? ''
    const code = row.smlmitzrach?.trim() ?? ''

    // Skip foods with no name or zero calories
    if (!nameHe || calories === 0) {
      skipped++
      continue
    }

    const id = `tz_${code}`
    const category = assignCategory(nameHe, protein, fat, carbs)

    // Build serving sizes: start with any from join table, always add 100g
    const fromTable = servingsByFood.get(code) ?? []
    // Deduplicate by grams value — keep first occurrence
    const seen = new Set<number>()
    const dedupedServings: ServingSize[] = []
    for (const s of fromTable) {
      if (!seen.has(s.grams)) {
        seen.add(s.grams)
        dedupedServings.push(s)
      }
    }
    // Add 100g default if not already present
    if (!seen.has(100)) {
      dedupedServings.push(DEFAULT_100G)
    }

    let food: FoodSeed = {
      id,
      nameHe,
      nameEn,
      category,
      caloriesPer100g: calories,
      proteinPer100g: protein,
      fatPer100g: fat,
      carbsPer100g: carbs,
      fiberPer100g: fiber,
      isUserCreated: false,
      servingSizesJson: JSON.stringify(dedupedServings),
    }

    // Apply field overrides
    const override = FIELD_OVERRIDES[code]
    if (override) {
      food = { ...food, ...override }
      console.log(`  Override applied: ${nameHe} (${code})`)
    }

    output.push(food)
  }

  // Append manually added foods
  output.push(...MANUAL_FOODS)

  console.log(`Skipped: ${skipped} foods (no name or zero calories)`)
  console.log(`Total foods: ${output.length}`)

  // Verify category coverage
  const categoryCounts: Record<string, number> = {}
  for (const food of output) {
    categoryCounts[food.category] = (categoryCounts[food.category] ?? 0) + 1
  }
  console.log('\nCategory breakdown:')
  for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8')
  console.log(`\nWrote ${output.length} foods to ${OUTPUT_PATH}`)
}

run()
