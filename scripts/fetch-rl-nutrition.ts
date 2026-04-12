/**
 * Rami Levy nutrition fetcher.
 *
 * Reads tmp/rami-levy-ids.json, skips barcodes already in the Shufersal seed,
 * then fetches /api/items/{id} for each remaining product. Responses are cached
 * to tmp/rl-nutrition-cache/{id}.json — fully resumable on restart.
 *
 * Only products with gs.Nutritional_Values present are written to output.
 *
 * Usage:
 *   npm run fetch-rl-nutrition              — fetch (resumable via cache)
 *   npm run fetch-rl-nutrition -- --force   — clear cache and re-fetch everything
 *   npm run fetch-rl-nutrition -- --dry-run — first 5 products only, print sample
 */

import * as fs from 'fs'
import * as path from 'path'
import { RL_API_BASE } from './rami-levy-types'
import type { RLProductSummary, RLProductDetail, RLItemResponse } from './rami-levy-types'

// ── Paths ──────────────────────────────────────────────────────────────────

const IDS_INPUT = path.join(process.cwd(), 'tmp', 'rami-levy-ids.json')
const CACHE_DIR = path.join(process.cwd(), 'tmp', 'rl-nutrition-cache')
const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'rami-levy-raw.json')
const SHUFERSAL_SEED = path.join(process.cwd(), 'src', 'assets', 'supermarket-seed.json')

// ── Constants ──────────────────────────────────────────────────────────────

const RATE_LIMIT_MS = 500

// ── CLI flags ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const DRY_RUN = args.includes('--dry-run')

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cachePath(id: number): string {
  return path.join(CACHE_DIR, `${id}.json`)
}

/**
 * Builds a Set of barcodes already covered by the Shufersal seed.
 * Shufersal IDs are "sh_<barcode>" — extract the numeric suffix.
 * Only 13-digit EAN barcodes will match Rami Levy's integer barcodes.
 */
function loadShufersalBarcodes(): Set<string> {
  if (!fs.existsSync(SHUFERSAL_SEED)) {
    console.warn(`[RL Nutrition] Warning: ${SHUFERSAL_SEED} not found — skipping Shufersal dedup`)
    return new Set()
  }

  let seed: { id: string }[]
  try {
    seed = JSON.parse(fs.readFileSync(SHUFERSAL_SEED, 'utf8')) as { id: string }[]
  } catch (err) {
    console.warn(
      `[RL Nutrition] Warning: Failed to parse Shufersal seed — ${(err as Error).message}`,
    )
    return new Set()
  }

  const barcodes = new Set<string>()
  for (const item of seed) {
    // id format: "sh_<barcode>" — extract suffix
    const barcode = item.id.replace(/^sh_/, '')
    barcodes.add(barcode)
  }
  return barcodes
}

// ── API ────────────────────────────────────────────────────────────────────

async function fetchProductDetail(id: number): Promise<RLProductDetail | null> {
  const cached = cachePath(id)

  if (!FORCE && fs.existsSync(cached)) {
    try {
      const detail = JSON.parse(fs.readFileSync(cached, 'utf8')) as RLProductDetail
      return detail
    } catch {
      // Corrupt cache entry — re-fetch
    }
  }

  const url = `${RL_API_BASE}/api/items/${id}`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'he-IL,he;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  })

  if (!res.ok) return null

  const json = (await res.json()) as RLItemResponse
  const detail = json.data?.[0] ?? null
  if (!detail) return null

  // Cache the result
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(cached, JSON.stringify(detail), 'utf8')

  return detail
}

// ── Main ───────────────────────────────────────────────────────────────────

async function fetchNutrition(): Promise<void> {
  // Read product IDs
  if (!fs.existsSync(IDS_INPUT)) {
    console.error(
      `[RL Nutrition] Error: ${IDS_INPUT} not found. Run "npm run scrape-rl-ids" first.`,
    )
    process.exit(1)
  }

  let products: RLProductSummary[]
  try {
    products = JSON.parse(fs.readFileSync(IDS_INPUT, 'utf8')) as RLProductSummary[]
  } catch (err) {
    console.error(
      `[RL Nutrition] Error: Failed to parse ${IDS_INPUT}. File may be corrupted — delete it and re-run scrape-rl-ids.`,
    )
    console.error(`  Details: ${(err as Error).message}`)
    process.exit(1)
  }

  console.log(`[RL Nutrition] Loaded ${products.length} products from ${IDS_INPUT}`)

  // Load Shufersal barcodes for dedup
  const shufersalBarcodes = loadShufersalBarcodes()
  console.log(`[RL Nutrition] Shufersal seed: ${shufersalBarcodes.size} barcodes loaded`)

  // Filter out products already in Shufersal
  const toFetch = products.filter((p) => !shufersalBarcodes.has(String(p.barcode)))
  const skippedShufersal = products.length - toFetch.length
  console.log(`[RL Nutrition] Skipping ${skippedShufersal} products already in Shufersal seed`)
  console.log(`[RL Nutrition] Fetching nutrition for ${toFetch.length} products...`)

  const productsToProcess = DRY_RUN ? toFetch.slice(0, 5) : toFetch

  const results: RLProductDetail[] = []
  let cached = 0
  let fetched = 0
  let noNutrition = 0
  let errors = 0

  for (let i = 0; i < productsToProcess.length; i++) {
    const product = productsToProcess[i]
    const isCached = !FORCE && fs.existsSync(cachePath(product.id))

    try {
      const detail = await fetchProductDetail(product.id)

      // Rate-limit all real network calls regardless of response validity
      if (!isCached) {
        fetched++
        await sleep(RATE_LIMIT_MS)
      } else {
        cached++
      }

      if (!detail) {
        errors++
        continue
      }

      // Only keep products with nutrition data
      if (!detail.gs?.Nutritional_Values?.length) {
        noNutrition++
        continue
      }

      results.push(detail)

      if (i % 100 === 0 && i > 0) {
        console.log(
          `  [${i}/${productsToProcess.length}] ${results.length} with nutrition, ${noNutrition} without...`,
        )
      }
    } catch (err) {
      console.warn(`  [warn] id=${product.id}: ${(err as Error).message}`)
      errors++
    }
  }

  if (DRY_RUN) {
    console.log('\n[Dry-run] Sample enriched product:')
    if (results.length > 0) {
      const sample = results[0]
      console.log(
        JSON.stringify(
          {
            id: sample.id,
            barcode: sample.barcode,
            name: sample.name,
            nutritionalValues: sample.gs?.Nutritional_Values?.slice(0, 2),
          },
          null,
          2,
        ),
      )
    } else {
      console.log('  No products with nutrition data in dry-run sample.')
    }
    return
  }

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8')

  console.log(`\n[RL Nutrition] ── Summary ──`)
  console.log(`  Total food products     : ${products.length}`)
  console.log(`  Already in Shufersal    : ${skippedShufersal}`)
  console.log(`  Fetched from API        : ${fetched}`)
  console.log(`  Loaded from cache       : ${cached}`)
  console.log(`  No nutrition data       : ${noNutrition}`)
  console.log(`  Errors / not found      : ${errors}`)
  console.log(`  ──────────────────────────────────────`)
  console.log(`  With nutrition (output) : ${results.length}`)
  console.log(`  Output                  : ${OUTPUT_PATH}`)
}

fetchNutrition().catch((err) => {
  console.error('[RL Nutrition] Fatal error:', err)
  process.exit(1)
})
