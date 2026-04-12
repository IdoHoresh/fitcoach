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
import type { RLProductDetail } from './rami-levy-types'
import type { FoodSeed } from './tzameret-overrides'

// ── Paths ──────────────────────────────────────────────────────────────────

const RAW_INPUT = path.join(process.cwd(), 'tmp', 'rami-levy-raw.json')
const OUTPUT = path.join(process.cwd(), 'src', 'assets', 'rami-levy-seed.json')

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
  const deduplicated: FoodSeed[] = []
  for (const food of normalized) {
    if (!seen.has(food.id)) {
      seen.add(food.id)
      deduplicated.push(food)
    }
  }
  const dupCount = normalized.length - deduplicated.length
  console.log(`[build-rami-levy-seed] Deduplicated: removed ${dupCount} within-store duplicates`)

  // 4. Final duplicate ID sanity check
  const ids = deduplicated.map((f) => f.id)
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    console.error(
      `[build-rami-levy-seed] FATAL: ${ids.length - uniqueIds.size} duplicate IDs in final output`,
    )
    process.exit(1)
  }

  // 5. Write output
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(deduplicated, null, 2), 'utf8')

  console.log(`\n[build-rami-levy-seed] ── Summary ──`)
  console.log(`  Raw products        : ${raw.length}`)
  console.log(`  Nulls filtered      : ${nullCount}`)
  console.log(`  Within-store dups   : ${dupCount}`)
  console.log(`  ──────────────────────────────────────`)
  console.log(`  Total in output     : ${deduplicated.length}`)
  console.log(`  Output              : ${OUTPUT}`)
}

build()
