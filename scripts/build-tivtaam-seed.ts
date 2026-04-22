/**
 * Phase 2 seed builder.
 *
 * Reads `tmp/off-cache/<ean>.json` (populated by fetch-tivtaam-off) plus
 * `tmp/tivtaam-catalog.json` (Phase 1 output), normalizes OFF hits into
 * TivTaamSeedRow with tt_<ean> ids, and writes:
 *
 *   - `src/assets/tivtaam-seed.json`       (hits — committed, seeded by v19)
 *   - `tmp/tivtaam-review-queue.json`      (misses — Phase 2.5 curation input)
 *
 * Spec: docs/specs/2026-04-21-tiv-taam-phase2-off-enrichment.md
 *
 * Usage:
 *   npm run build-tivtaam-seed
 */

import * as fs from 'fs'
import * as path from 'path'
import { normalizeOffProduct } from '../src/services/open-food-facts'
import type { OffCacheEntry, ReviewQueueItem, TivTaamSeedRow } from './tivtaam-seed-types'

// ── Paths ──

const REPO_ROOT = process.cwd()
const CATALOG_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-catalog.json')
const CACHE_DIR = path.join(REPO_ROOT, 'tmp', 'off-cache')
const SEED_OUTPUT = path.join(REPO_ROOT, 'src', 'assets', 'tivtaam-seed.json')
const REVIEW_QUEUE_OUTPUT = path.join(REPO_ROOT, 'tmp', 'tivtaam-review-queue.json')

// Mirrors build-tivtaam-catalog.ts and fetch-tivtaam-off.ts — same set so
// the three scripts classify imported-vs-domestic consistently.
const NOT_IMPORTED_TOKENS = new Set(['ישראל', 'IL', 'ISR', 'ISRAEL', 'לא ידוע', ''])

// ── Types (subset of the Phase 1 catalog we read) ──

interface CatalogItem {
  itemCode: string
  nameHe: string
  manufactureCountry: string
  dedupStatus: 'net-new' | 'in-shufersal' | 'in-rami-levy' | 'no-ean'
}

interface CatalogFile {
  items: CatalogItem[]
}

// ── Pure functions (unit-tested in build-tivtaam-seed.test.ts) ──

/**
 * Normalizes a transparency-feed `manufactureCountry` into the value we
 * store in `foods.origin_country`. Returns `null` for domestic / unknown /
 * empty so the column serves as a simple "imported only" predicate for
 * Phase 3 UI filters.
 */
export function normalizeOriginCountry(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (NOT_IMPORTED_TOKENS.has(trimmed.toUpperCase())) return null
  return trimmed
}

/**
 * Builds one TivTaamSeedRow from a catalog item + its cached OFF response.
 * Returns null when the cache entry is a miss — the caller pushes the
 * corresponding item onto the review queue instead.
 *
 * Name-fallback: when OFF's response has no Hebrew / English name and the
 * normalizer's ultimate fallback is the EAN itself, use the transparency-
 * feed name instead (always a real Hebrew string).
 */
export function buildSeedRow(
  catalogItem: Pick<CatalogItem, 'itemCode' | 'nameHe' | 'manufactureCountry'>,
  cacheEntry: OffCacheEntry,
): TivTaamSeedRow | null {
  if (cacheEntry.status === 'miss') return null

  const { food } = normalizeOffProduct(cacheEntry.raw, catalogItem.itemCode, { idPrefix: 'tt' })

  // Drop rows where protein + fat + carbs all 0 — OFF has the barcode
  // indexed but no usable nutrition data. Shipping these would display
  // "0g protein / 0g fat / 0g carbs" in the macro-tracking UI and mislead
  // users. The real fetch surfaced ~31% of hits as these nutrition-empty
  // rows (824 all-zero + 53 kcal-only on the 2,797-hit sample). Caller
  // pushes them to the review queue for Phase 2.5 manual curation.
  if (food.proteinPer100g === 0 && food.fatPer100g === 0 && food.carbsPer100g === 0) {
    return null
  }

  // When OFF had no name at all, the normalizer returns the EAN as nameHe.
  // Use the transparency-feed name in that case — always a real Hebrew string.
  const nameHe = food.nameHe === catalogItem.itemCode ? catalogItem.nameHe : food.nameHe

  // When OFF has a Hebrew name but no English name, the normalizer's nameEn
  // fallback chain lands on the EAN (bare digits). Matches the sh_/rl_
  // convention: fall back to nameHe so the UI never renders raw barcode
  // numbers as the English subtitle.
  const nameEn = food.nameEn === catalogItem.itemCode ? nameHe : food.nameEn

  return {
    id: food.id,
    nameHe,
    nameEn,
    category: food.category,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    fatPer100g: food.fatPer100g,
    carbsPer100g: food.carbsPer100g,
    fiberPer100g: food.fiberPer100g,
    isUserCreated: false,
    servingSizesJson: JSON.stringify(food.servingSizes),
    originCountry: normalizeOriginCountry(catalogItem.manufactureCountry),
  }
}

// ── I/O glue ──

function readCacheEntry(ean: string): OffCacheEntry | null {
  const p = path.join(CACHE_DIR, `${ean}.json`)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as OffCacheEntry
  } catch {
    return null
  }
}

function loadCatalog(): CatalogFile {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(
      `[build-tivtaam-seed] ${CATALOG_PATH} not found — run build-tivtaam-catalog first.`,
    )
  }
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as CatalogFile
}

function main(): void {
  const catalog = loadCatalog()
  const netNew = catalog.items.filter((i) => i.dedupStatus === 'net-new')

  if (!fs.existsSync(CACHE_DIR)) {
    console.error(
      `[build-tivtaam-seed] ${CACHE_DIR} not found — run 'npm run fetch-tivtaam-off' first.`,
    )
    process.exit(1)
  }

  const seed: TivTaamSeedRow[] = []
  const reviewQueue: ReviewQueueItem[] = []

  let cachedHits = 0
  let cachedMisses = 0
  let droppedEmptyMacros = 0
  let uncached = 0
  let withOriginCountry = 0

  for (const item of netNew) {
    const entry = readCacheEntry(item.itemCode)
    if (entry === null) {
      uncached++
      continue
    }

    if (entry.status === 'miss') {
      cachedMisses++
      reviewQueue.push({
        ean: item.itemCode,
        nameHe: item.nameHe,
        manufactureCountry: item.manufactureCountry,
      })
      continue
    }

    cachedHits++
    const row = buildSeedRow(item, entry)
    if (row === null) {
      // OFF indexed the EAN but returned no usable macros. Route to review
      // queue so Phase 2.5 can hand-curate from the label.
      droppedEmptyMacros++
      reviewQueue.push({
        ean: item.itemCode,
        nameHe: item.nameHe,
        manufactureCountry: item.manufactureCountry,
      })
      continue
    }
    seed.push(row)
    if (row.originCountry !== null) withOriginCountry++
  }

  if (uncached > 0) {
    console.warn(
      `[build-tivtaam-seed] ${uncached} items have no cache entry yet — fetch not complete. Seed will be incomplete.`,
    )
  }

  // Write outputs (pretty-printed for git diff readability — matches other seeds).
  fs.mkdirSync(path.dirname(SEED_OUTPUT), { recursive: true })
  fs.writeFileSync(SEED_OUTPUT, JSON.stringify(seed, null, 2) + '\n')
  fs.writeFileSync(REVIEW_QUEUE_OUTPUT, JSON.stringify(reviewQueue, null, 2) + '\n')

  // Summary.
  const total = netNew.length
  const seedCount = seed.length
  const hitRate = total === 0 ? 0 : (cachedHits / total) * 100

  console.log('')
  console.log('──────────────────────────────────────────')
  console.log('[Tiv Taam seed build]')
  console.log('──────────────────────────────────────────')
  console.log(`  Net-new input         : ${total.toLocaleString()}`)
  console.log(`  Cached hits           : ${cachedHits.toLocaleString()} (${hitRate.toFixed(1)}%)`)
  console.log(`    dropped (no macros) : ${droppedEmptyMacros.toLocaleString()}`)
  console.log(`  Cached misses         : ${cachedMisses.toLocaleString()}`)
  console.log(`  Un-cached (errors)    : ${uncached.toLocaleString()}`)
  console.log(`  Seed rows             : ${seedCount.toLocaleString()}`)
  console.log(`    with origin_country : ${withOriginCountry.toLocaleString()}`)
  console.log(`  Review queue          : ${reviewQueue.length.toLocaleString()}`)
  console.log('──────────────────────────────────────────')
  console.log(`  Wrote ${path.relative(REPO_ROOT, SEED_OUTPUT)}`)
  console.log(`  Wrote ${path.relative(REPO_ROOT, REVIEW_QUEUE_OUTPUT)}`)

  if (uncached > 0) {
    console.log('')
    console.log(`Note: ${uncached} items still need a cache entry. Re-run:`)
    console.log(`  npm run fetch-tivtaam-off`)
    console.log(`then re-run this build to pick up the newly-cached items.`)
  }
}

// Only run main() when this file is invoked directly (not when the test file imports it).
if (require.main === module) {
  main()
}
