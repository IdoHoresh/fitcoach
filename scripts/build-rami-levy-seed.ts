/**
 * Rami Levy Seed Builder
 *
 * Orchestrates the final pipeline step: raw Rami Levy nutrition data →
 * src/assets/rami-levy-seed.json ready for the v15 schema migration.
 *
 * Pipeline:
 *   1. Read tmp/rami-levy-raw.json (run fetch-rl-nutrition first)
 *   2. Normalize each raw product → FoodSeed | null
 *   3. Deduplicate within Rami Levy (same rl_<barcode> appearing twice)
 *   4. Write src/assets/rami-levy-seed.json
 *   5. Print summary
 *
 * Usage:
 *   npm run build-rami-levy-seed
 */

import * as fs from 'fs'
import * as path from 'path'
import { normalizeRLProduct } from './normalize-rl-product'
import { buildContentHash, deduplicateFuzzy, filterAgainstContentHashes } from './deduplicate'
import type { RLProductDetail } from './rami-levy-types'
import type { FoodSeed } from './tzameret-overrides'

// ── Paths ──────────────────────────────────────────────────────────────────

const RAW_INPUT = path.join(process.cwd(), 'tmp', 'rami-levy-raw.json')
const OUTPUT = path.join(process.cwd(), 'src', 'assets', 'rami-levy-seed.json')
const SHUFERSAL_SEED = path.join(process.cwd(), 'src', 'assets', 'supermarket-seed.json')

// ── Main ───────────────────────────────────────────────────────────────────

function build(): void {
  // 1. Read raw nutrition data
  if (!fs.existsSync(RAW_INPUT)) {
    console.log(`[build-rami-levy-seed] No raw data found — building empty seed.`)
    console.log(`  Run "npm run fetch-rl-nutrition" then re-run to include products.`)
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
    fs.writeFileSync(OUTPUT, '[]', 'utf8')
    return
  }

  let raw: RLProductDetail[]
  try {
    raw = JSON.parse(fs.readFileSync(RAW_INPUT, 'utf8')) as RLProductDetail[]
  } catch (err) {
    console.error(`[build-rami-levy-seed] Error: Failed to parse ${RAW_INPUT}.`)
    console.error(
      '  The file may be corrupted (e.g. interrupted fetch). Delete it and re-run fetch-rl-nutrition.',
    )
    console.error(`  Details: ${(err as Error).message}`)
    process.exit(1)
  }

  console.log(`[build-rami-levy-seed] Read ${raw.length} products from ${RAW_INPUT}`)

  // 2. Normalize
  const normalizeResults = raw.map((r) => normalizeRLProduct(r))
  const normalized = normalizeResults.filter((f): f is FoodSeed => f !== null)
  const nullCount = raw.length - normalized.length
  console.log(
    `[build-rami-levy-seed] Normalized: ${normalized.length} valid, ${nullCount} filtered (no name or no calories)`,
  )

  // 3. Deduplicate within Rami Levy (same barcode in multiple departments)
  const seen = new Set<string>()
  const idDeduped: FoodSeed[] = []
  for (const food of normalized) {
    if (!seen.has(food.id)) {
      seen.add(food.id)
      idDeduped.push(food)
    }
  }
  const dupCount = normalized.length - idDeduped.length
  console.log(`[build-rami-levy-seed] Deduplicated: removed ${dupCount} within-store duplicates`)

  // 3b. Fuzzy dedup (same product across barcode, plural, modifier, macro drift)
  const contentDeduped = deduplicateFuzzy(idDeduped)
  const contentDupCount = idDeduped.length - contentDeduped.length
  console.log(`[build-rami-levy-seed] Fuzzy dedup: removed ${contentDupCount} near-duplicate rows`)

  // 3c. Cross-seed content dedup against Shufersal (skip RL rows that duplicate sh_ rows)
  const shufersalHashes = loadShufersalContentHashes()
  const crossDeduped = filterAgainstContentHashes(contentDeduped, shufersalHashes)
  const crossDupCount = contentDeduped.length - crossDeduped.length
  console.log(
    `[build-rami-levy-seed] Cross-seed dedup: removed ${crossDupCount} rows duplicating Shufersal seed`,
  )

  // 4. Final duplicate ID sanity check
  const ids = crossDeduped.map((f) => f.id)
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    console.error(
      `[build-rami-levy-seed] FATAL: ${ids.length - uniqueIds.size} duplicate IDs in final output`,
    )
    process.exit(1)
  }

  // 5. Write output
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(crossDeduped, null, 2), 'utf8')

  console.log(`\n[build-rami-levy-seed] ── Summary ──`)
  console.log(`  Raw products        : ${raw.length}`)
  console.log(`  Nulls filtered      : ${nullCount}`)
  console.log(`  Within-store dups   : ${dupCount}`)
  console.log(`  Fuzzy dups          : ${contentDupCount}`)
  console.log(`  Cross-seed dups     : ${crossDupCount}`)
  console.log(`  ──────────────────────────────────────`)
  console.log(`  Total in output     : ${crossDeduped.length}`)
  console.log(`  Output              : ${OUTPUT}`)
}

/**
 * Loads the Shufersal seed and returns a Set of content hashes for every row.
 * Used to drop Rami Levy rows that duplicate an existing Shufersal product.
 * Returns empty set if the Shufersal seed is missing (first-time build).
 */
function loadShufersalContentHashes(): Set<string> {
  if (!fs.existsSync(SHUFERSAL_SEED)) {
    console.warn(
      `[build-rami-levy-seed] Warning: ${SHUFERSAL_SEED} not found — skipping cross-seed dedup`,
    )
    return new Set()
  }

  try {
    const seed = JSON.parse(fs.readFileSync(SHUFERSAL_SEED, 'utf8')) as FoodSeed[]
    return new Set(seed.map((f) => buildContentHash(f)))
  } catch (err) {
    console.warn(
      `[build-rami-levy-seed] Warning: Failed to parse Shufersal seed — ${(err as Error).message}`,
    )
    return new Set()
  }
}

build()
