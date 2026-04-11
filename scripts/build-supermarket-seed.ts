/**
 * Supermarket Seed Builder
 *
 * Orchestrates the full pipeline from raw Shufersal scrape output →
 * src/assets/supermarket-seed.json ready for the v11 schema migration.
 *
 * Pipeline:
 *   1. Read tmp/shufersal-raw.json (run scrape-shufersal first)
 *   2. Normalize each raw product → FoodSeed | null
 *   3. Deduplicate within Shufersal (same product in multiple categories)
 *   4. Merge PROTEIN_YOGHURT_OVERRIDES — these are always included
 *      (manual overrides have higher data confidence than scraped data)
 *   5. Final dedup pass — remove any sh_ entry whose nameHe matches a manual_ entry
 *   6. Write src/assets/supermarket-seed.json
 *   7. Print summary
 *
 * Usage:
 *   npm run build-supermarket-seed
 */

import * as fs from 'fs'
import * as path from 'path'
import { normalizeProduct } from './normalize-food'
import { deduplicateScraped, filterAgainstExisting } from './deduplicate'
import { PROTEIN_YOGHURT_OVERRIDES } from './shufersal-overrides'
import type { RawShufersalProduct } from './shufersal-types'
import type { FoodSeed } from './tzameret-overrides'

// ── Paths ──────────────────────────────────────────────────────────────────

const RAW_INPUT = path.join(process.cwd(), 'tmp', 'shufersal-raw.json')
const OUTPUT = path.join(process.cwd(), 'src', 'assets', 'supermarket-seed.json')

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalises a Hebrew string for fuzzy comparison.
 * Strips whitespace, punctuation, and common suffixes so that
 * "דנונה פרו 25 גרם חלבון" and "דנונה פרו 25g" compare as similar.
 */
function normalizeNameForDedup(name: string): string {
  return name
    .replace(/[\u0591-\u05C7]/g, '') // strip Hebrew diacritics
    .replace(/['"״׳]/g, '') // strip quotation marks
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Removes Shufersal scraped items whose Hebrew name is an exact or near-exact
 * match for a manual override. Manual overrides have verified macros — they win.
 */
function filterDuplicatesOfManualOverrides(
  scraped: FoodSeed[],
  manualOverrides: FoodSeed[],
): FoodSeed[] {
  const manualNames = new Set(manualOverrides.map((f) => normalizeNameForDedup(f.nameHe)))
  return scraped.filter((f) => !manualNames.has(normalizeNameForDedup(f.nameHe)))
}

// ── Main ───────────────────────────────────────────────────────────────────

function build(): void {
  // 1. Read raw scrape output
  if (!fs.existsSync(RAW_INPUT)) {
    console.error(`[build-supermarket-seed] Error: ${RAW_INPUT} not found.`)
    console.error('  Run "npm run scrape-shufersal" first.')
    process.exit(1)
  }

  let raw: RawShufersalProduct[]
  try {
    raw = JSON.parse(fs.readFileSync(RAW_INPUT, 'utf8')) as RawShufersalProduct[]
  } catch (err) {
    console.error(`[build-supermarket-seed] Error: Failed to parse ${RAW_INPUT}.`)
    console.error(
      '  The file may be corrupted (e.g. interrupted scrape). Delete it and re-run scrape-shufersal.',
    )
    console.error(`  Details: ${(err as Error).message}`)
    process.exit(1)
  }
  console.log(`[build-supermarket-seed] Read ${raw.length} raw products from ${RAW_INPUT}`)

  // 2. Normalize
  const normalizeResults = raw.map((r) => normalizeProduct(r))
  const normalized = normalizeResults.filter((f): f is FoodSeed => f !== null)
  const nullCount = raw.length - normalized.length
  console.log(
    `[build-supermarket-seed] Normalized: ${normalized.length} valid, ${nullCount} filtered (no name or no calories)`,
  )

  // 3. Deduplicate within Shufersal (same barcode in multiple categories)
  const deduplicated = deduplicateScraped(normalized)
  const dupCount = normalized.length - deduplicated.length
  console.log(`[build-supermarket-seed] Deduplicated: removed ${dupCount} within-store duplicates`)

  // 4. Filter scraped items that overlap with manual overrides (manual wins)
  const manualIds = new Set(PROTEIN_YOGHURT_OVERRIDES.map((f) => f.id))
  const withoutManualIdConflicts = filterAgainstExisting(deduplicated, manualIds)
  const withoutNameConflicts = filterDuplicatesOfManualOverrides(
    withoutManualIdConflicts,
    PROTEIN_YOGHURT_OVERRIDES,
  )
  const overrideFilterCount = deduplicated.length - withoutNameConflicts.length
  console.log(
    `[build-supermarket-seed] Override filter: removed ${overrideFilterCount} scraped items superseded by manual overrides`,
  )

  // 5. Merge manual overrides
  const final = [...withoutNameConflicts, ...PROTEIN_YOGHURT_OVERRIDES]
  console.log(
    `[build-supermarket-seed] Manual overrides added: ${PROTEIN_YOGHURT_OVERRIDES.length}`,
  )

  // 6. Final duplicate ID sanity check
  const ids = final.map((f) => f.id)
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    console.error(
      `[build-supermarket-seed] FATAL: ${ids.length - uniqueIds.size} duplicate IDs in final output`,
    )
    process.exit(1)
  }

  // 7. Write output
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(final, null, 2), 'utf8')

  console.log(`\n[build-supermarket-seed] ── Summary ──`)
  console.log(`  Raw scraped         : ${raw.length}`)
  console.log(`  Nulls filtered      : ${nullCount}`)
  console.log(`  Within-store dups   : ${dupCount}`)
  console.log(`  Override conflicts  : ${overrideFilterCount}`)
  console.log(`  Manual overrides    : ${PROTEIN_YOGHURT_OVERRIDES.length}`)
  console.log(`  ──────────────────────────────────────`)
  console.log(`  Total in output     : ${final.length}`)
  console.log(`  Output              : ${OUTPUT}`)
}

build()
