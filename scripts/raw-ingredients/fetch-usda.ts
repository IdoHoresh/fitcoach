/**
 * USDA SR Legacy fetcher for the raw ingredient catalog (Task 2 of spec
 * docs/specs/2026-04-13-raw-ingredients-seed.md).
 *
 * Reads scripts/raw-ingredients/usda-targets.json, queries FoodData Central
 * SR Legacy for each entry, caches the raw response per (slug, state) to
 * tmp/usda-cache/, and writes a compact normalized list to tmp/usda-raw.json.
 *
 * Requires USDA_API_KEY in the environment. Get a free key at
 * https://fdc.nal.usda.gov/api-key-signup.html. Never committed.
 *
 * Usage:
 *   USDA_API_KEY=xxx npm run fetch-usda-raw             — fetch (resumable via cache)
 *   USDA_API_KEY=xxx npm run fetch-usda-raw -- --force  — clear cache and re-fetch
 *   USDA_API_KEY=xxx npm run fetch-usda-raw -- --dry-run — first 5 targets, print sample
 *   USDA_API_KEY=xxx npm run fetch-usda-raw -- --slugs chicken_thigh,beef_sirloin
 *                                                       — force re-fetch only listed slugs
 *                                                         (all states); leaves other caches
 *                                                         untouched. Used to surgically
 *                                                         correct entries after pinning a
 *                                                         better fdcIdHint in usda-targets.
 */

import * as fs from 'fs'
import * as path from 'path'

// ── Paths ──────────────────────────────────────────────────────────────────

const TARGETS_INPUT = path.join(process.cwd(), 'scripts', 'raw-ingredients', 'usda-targets.json')
const CACHE_DIR = path.join(process.cwd(), 'tmp', 'usda-cache')
const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'usda-raw.json')

// ── Constants ──────────────────────────────────────────────────────────────

const RATE_LIMIT_MS = 1000
const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'
const USDA_FOOD_URL = 'https://api.nal.usda.gov/fdc/v1/food'

const NUTRIENT_ID_CALORIES = 1008
const NUTRIENT_ID_PROTEIN = 1003
const NUTRIENT_ID_FAT = 1004
const NUTRIENT_ID_CARBS = 1005
const NUTRIENT_ID_FIBER = 1079

// ── CLI flags ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const DRY_RUN = args.includes('--dry-run')

/**
 * `--slugs chicken_thigh,beef_sirloin` — process only listed slugs (all their
 * states) and bypass the cache for those. Other slugs are skipped entirely,
 * their cache files are untouched. Lets us correct a handful of bad fetches
 * without re-running the whole 200-item pull.
 */
function parseSlugsFlag(): Set<string> | null {
  const idx = args.indexOf('--slugs')
  if (idx === -1) return null
  const csv = args[idx + 1]
  if (!csv || csv.startsWith('--')) {
    console.error(
      '[USDA] Error: --slugs requires a comma-separated list, e.g. --slugs chicken_thigh,beef_sirloin',
    )
    process.exit(1)
  }
  const slugs = csv
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (slugs.length === 0) {
    console.error('[USDA] Error: --slugs list is empty')
    process.exit(1)
  }
  return new Set(slugs)
}

const SLUGS_FILTER = parseSlugsFlag()

// ── Types ──────────────────────────────────────────────────────────────────

interface Target {
  slug: string
  englishName: string
  state: 'raw' | 'cooked'
  category: string
  priority: 'P0' | 'P1' | 'P2'
  fdcIdHint?: number | null
}

/**
 * USDA returns two different nutrient shapes depending on endpoint:
 *   /foods/search         → { nutrientId, value }
 *   /food/{fdcId}         → { nutrient: { id }, amount }
 * We accept both and normalize in getNutrient().
 */
interface UsdaNutrient {
  nutrientId?: number
  value?: number
  nutrient?: { id?: number; number?: string }
  amount?: number
}

interface UsdaFoodPortion {
  id?: number
  amount?: number
  modifier?: string
  gramWeight: number
  portionDescription?: string
  measureUnit?: { name?: string; abbreviation?: string }
}

interface UsdaFood {
  fdcId: number
  description: string
  dataType?: string
  foodNutrients?: UsdaNutrient[]
  foodPortions?: UsdaFoodPortion[]
}

interface UsdaSearchResponse {
  foods?: UsdaFood[]
}

interface NormalizedEntry {
  slug: string
  state: 'raw' | 'cooked'
  category: string
  priority: 'P0' | 'P1' | 'P2'
  fdcId: number
  description: string
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  foodPortions: UsdaFoodPortion[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cachePath(slug: string, state: string): string {
  return path.join(CACHE_DIR, `${slug}__${state}.json`)
}

function requireApiKey(): string {
  const key = process.env.USDA_API_KEY
  if (!key || key.trim().length === 0) {
    console.error('[USDA] Error: USDA_API_KEY env var is not set.')
    console.error('        Get a free key at https://fdc.nal.usda.gov/api-key-signup.html')
    console.error('        Run as: USDA_API_KEY=xxx npm run fetch-usda-raw')
    process.exit(1)
  }
  return key
}

function getNutrient(food: UsdaFood, nutrientId: number): number {
  const match = food.foodNutrients?.find(
    (n) => n.nutrientId === nutrientId || n.nutrient?.id === nutrientId,
  )
  return match?.value ?? match?.amount ?? 0
}

function normalize(food: UsdaFood, target: Target): NormalizedEntry {
  return {
    slug: target.slug,
    state: target.state,
    category: target.category,
    priority: target.priority,
    fdcId: food.fdcId,
    description: food.description,
    calories: getNutrient(food, NUTRIENT_ID_CALORIES),
    protein: getNutrient(food, NUTRIENT_ID_PROTEIN),
    fat: getNutrient(food, NUTRIENT_ID_FAT),
    carbs: getNutrient(food, NUTRIENT_ID_CARBS),
    fiber: getNutrient(food, NUTRIENT_ID_FIBER),
    foodPortions: food.foodPortions ?? [],
  }
}

// ── API ────────────────────────────────────────────────────────────────────

/**
 * Fetch by explicit fdcId. Used when target has fdcIdHint set — bypasses
 * search entirely and pulls the exact row.
 */
async function fetchByFdcId(fdcId: number, apiKey: string): Promise<UsdaFood | null> {
  const url = `${USDA_FOOD_URL}/${fdcId}?api_key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  return (await res.json()) as UsdaFood
}

/**
 * Search SR Legacy for the English name, return only the top-ranked fdcId.
 * The search endpoint omits foodPortions, so callers must follow up with
 * fetchByFdcId to get the full record.
 */
async function searchSrLegacyTopFdcId(query: string, apiKey: string): Promise<number | null> {
  const params = new URLSearchParams({
    query,
    dataType: 'SR Legacy',
    pageSize: '5',
    api_key: apiKey,
  })
  const url = `${USDA_SEARCH_URL}?${params.toString()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const json = (await res.json()) as UsdaSearchResponse
  return json.foods?.[0]?.fdcId ?? null
}

/**
 * Two-stage fetch: resolve fdcId (from hint or search), then pull the full
 * detail record which includes foodPortions. Result is cached per
 * (slug, state) so re-runs are free.
 *
 * Returns `networkCalls` so the caller can rate-limit proportionally — a
 * search + detail costs two requests, a cached hit costs zero.
 */
async function fetchOne(
  target: Target,
  apiKey: string,
): Promise<{ food: UsdaFood | null; networkCalls: number }> {
  const cached = cachePath(target.slug, target.state)
  const slugForced = SLUGS_FILTER?.has(target.slug) ?? false

  if (!FORCE && !slugForced && fs.existsSync(cached)) {
    try {
      const food = JSON.parse(fs.readFileSync(cached, 'utf8')) as UsdaFood
      return { food, networkCalls: 0 }
    } catch {
      // corrupt cache — re-fetch
    }
  }

  let networkCalls = 0
  let fdcId = target.fdcIdHint ?? null
  if (!fdcId) {
    fdcId = await searchSrLegacyTopFdcId(target.englishName, apiKey)
    networkCalls++
    if (!fdcId) return { food: null, networkCalls }
    // Space search + detail calls apart so we don't burst the USDA limiter
    await sleep(RATE_LIMIT_MS)
  }

  const food = await fetchByFdcId(fdcId, apiKey)
  networkCalls++

  if (food) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(cached, JSON.stringify(food), 'utf8')
  }

  return { food, networkCalls }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function fetchUsda(): Promise<void> {
  const apiKey = requireApiKey()

  if (!fs.existsSync(TARGETS_INPUT)) {
    console.error(`[USDA] Error: ${TARGETS_INPUT} not found.`)
    process.exit(1)
  }

  let targetsFile: { targets: Target[] }
  try {
    targetsFile = JSON.parse(fs.readFileSync(TARGETS_INPUT, 'utf8')) as { targets: Target[] }
  } catch (err) {
    console.error(`[USDA] Error: Failed to parse ${TARGETS_INPUT}: ${(err as Error).message}`)
    process.exit(1)
  }

  const allTargets = targetsFile.targets
  const targets = DRY_RUN ? allTargets.slice(0, 5) : allTargets

  console.log(`[USDA] Loaded ${allTargets.length} targets from ${TARGETS_INPUT}`)
  if (DRY_RUN) console.log(`[USDA] Dry-run: fetching first ${targets.length} only`)

  const results: NormalizedEntry[] = []
  let cachedCount = 0
  let fetchedCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]
    try {
      const { food, networkCalls } = await fetchOne(target, apiKey)

      if (networkCalls > 0) {
        fetchedCount++
        await sleep(RATE_LIMIT_MS)
      } else {
        cachedCount++
      }

      if (!food) {
        notFoundCount++
        console.warn(`  [miss] ${target.slug}/${target.state} — no SR Legacy match`)
        continue
      }

      const entry = normalize(food, target)
      results.push(entry)

      // Log description for every network-fetched item so search mismatches
      // (e.g. search for "chicken thigh" returning "chicken skin") are visible
      // in the run output rather than hidden in the cache.
      if (networkCalls > 0) {
        console.log(
          `  [ok  ] ${target.slug}/${target.state} fdcId=${entry.fdcId} ${entry.calories}kcal — ${entry.description}`,
        )
      }

      if (i % 25 === 0 && i > 0) {
        console.log(
          `  [${i}/${targets.length}] ok=${results.length} miss=${notFoundCount} err=${errorCount}`,
        )
      }
    } catch (err) {
      errorCount++
      console.warn(`  [err ] ${target.slug}/${target.state}: ${(err as Error).message}`)
    }
  }

  if (DRY_RUN) {
    console.log('\n[Dry-run] Sample normalized entry:')
    if (results.length > 0) {
      console.log(JSON.stringify(results[0], null, 2))
    } else {
      console.log('  No results.')
    }
    return
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8')

  console.log(`\n[USDA] ── Summary ──`)
  console.log(`  Targets total    : ${allTargets.length}`)
  console.log(`  Fetched (network): ${fetchedCount}`)
  console.log(`  Loaded (cache)   : ${cachedCount}`)
  console.log(`  Not found        : ${notFoundCount}`)
  console.log(`  Errors           : ${errorCount}`)
  console.log(`  ──────────────────────────────────────`)
  console.log(`  Written to output: ${results.length}`)
  console.log(`  Output           : ${OUTPUT_PATH}`)
}

fetchUsda().catch((err) => {
  console.error('[USDA] Fatal error:', err)
  process.exit(1)
})
