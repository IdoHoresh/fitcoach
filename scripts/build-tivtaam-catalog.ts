/**
 * Phase 1 orchestrator — Tiv Taam transparency-feed catalog gap analysis.
 *
 * Composes the pure functions from parse/filter tasks with barcode dedup
 * against the existing Shufersal + Rami Levy seeds. Prints a summary that
 * answers: "Is Tiv Taam worth a Phase 2 OFF-enrichment PR?"
 *
 * Usage:
 *   npm run build-tivtaam-catalog             — run full pipeline, write tmp/tivtaam-catalog.json
 *   npm run build-tivtaam-catalog -- --force  — (passed through to download; forces re-download)
 *
 * No nutrition, no schema migration, no app-facing changes. Phase 2 spec
 * is kicked off separately based on this script's output.
 *
 * Spec: docs/specs/2026-04-21-tiv-taam-phase1-catalog-gap.md
 */

import * as fs from 'fs'
import * as path from 'path'
import { spawnSync } from 'child_process'
import { parseTransparencyFeed } from './parse-transparency-feed'
import { filterFoodItems } from './filter-food-items'
import type { CatalogItem, DedupStatus, TransparencyItem } from './transparency-feed-types'

// ── Paths ──

const REPO_ROOT = process.cwd()
const FEED_CACHE_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-raw.xml.gz')
const SHUFERSAL_SEED_PATH = path.join(REPO_ROOT, 'src', 'assets', 'supermarket-seed.json')
const RAMI_LEVY_SEED_PATH = path.join(REPO_ROOT, 'src', 'assets', 'rami-levy-seed.json')
const OUTPUT_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-catalog.json')

// ── CLI flags ──

const args = process.argv.slice(2)
const FORCE = args.includes('--force')

// ── Types ──

interface SeedRow {
  id: string
}

interface Summary {
  totalItems: number
  nonFoodFiltered: number
  weightedNoEan: number
  inShufersal: number
  inRamiLevy: number
  netNew: number
  netNewImported: number
}

interface Output {
  source: 'tivtaam-transparency-feed'
  fetchedAt: string
  feedFile: string
  summary: Summary
  items: CatalogItem[]
}

// ── Helpers ──

/**
 * Returns true if the cached feed exists, is non-empty, and has a meta
 * marker alongside it (proof of a completed — not interrupted — download).
 */
function cachedFeedIsValid(): boolean {
  if (!fs.existsSync(FEED_CACHE_PATH)) return false
  const stat = fs.statSync(FEED_CACHE_PATH)
  if (stat.size === 0) return false
  // Meta marker is written at the end of a successful download — its
  // presence proves the gz body finished streaming.
  if (!fs.existsSync(`${FEED_CACHE_PATH}.meta.json`)) return false
  return true
}

function ensureFeed(): void {
  if (cachedFeedIsValid() && !FORCE) {
    console.log(
      `[Tiv Taam catalog] using cached feed: ${path.relative(REPO_ROOT, FEED_CACHE_PATH)}`,
    )
    return
  }
  console.log(`[Tiv Taam catalog] downloading fresh feed${FORCE ? ' (--force)' : ''}...`)
  const forceArg = FORCE ? ['--', '--force'] : []
  const res = spawnSync('npm', ['run', 'download-tivtaam-feed', ...forceArg], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  })
  if (res.status !== 0) {
    throw new Error(`[Tiv Taam catalog] download step failed with exit ${res.status}`)
  }
  if (!cachedFeedIsValid()) {
    throw new Error(
      `[Tiv Taam catalog] download reported success but cache is missing/empty/incomplete at ${FEED_CACHE_PATH}`,
    )
  }
}

function extractBarcodes(seedPath: string, prefix: string): Set<string> {
  const raw = fs.readFileSync(seedPath, 'utf8')
  let rows: SeedRow[]
  try {
    rows = JSON.parse(raw) as SeedRow[]
  } catch (err) {
    throw new Error(
      `[Tiv Taam catalog] failed to parse ${path.relative(REPO_ROOT, seedPath)} as JSON: ${
        (err as Error).message
      }. Delete it and re-run the corresponding build-<chain>-seed script.`,
    )
  }
  if (!Array.isArray(rows)) {
    throw new Error(
      `[Tiv Taam catalog] ${path.relative(REPO_ROOT, seedPath)} is not a JSON array — seed shape is unexpected`,
    )
  }
  const out = new Set<string>()
  for (const row of rows) {
    if (row.id.startsWith(prefix)) {
      out.add(row.id.slice(prefix.length))
    }
  }
  return out
}

/** EAN shape: 8–14 digits, all numeric. Stricter than GS1 spec to reject noise. */
function isValidEan(code: string): boolean {
  return /^\d{8,14}$/.test(code)
}

/**
 * Tiv Taam feed uses inconsistent country labels:
 * Hebrew ('ישראל', 'ארה"ב', 'ארצות הברית'), ISO-3166 alpha-2 ('IL', 'US'),
 * occasional trailing whitespace, and 'לא ידוע' for unknown.
 * Treat any Israel spelling + unknown + empty as NOT imported.
 */
const NOT_IMPORTED_TOKENS = new Set(['ישראל', 'IL', 'ISR', 'ISRAEL', 'לא ידוע', ''])

function isImported(country: string): boolean {
  // `.toUpperCase()` only affects ASCII; Hebrew strings pass through unchanged,
  // so a single set handles both Hebrew ('ישראל') and ISO-3166 ('il' / 'IL').
  const normalized = country.trim().toUpperCase()
  return !NOT_IMPORTED_TOKENS.has(normalized)
}

function classify(
  item: TransparencyItem,
  shufersalBarcodes: Set<string>,
  ramiLevyBarcodes: Set<string>,
): DedupStatus {
  if (!isValidEan(item.itemCode)) return 'no-ean'
  if (shufersalBarcodes.has(item.itemCode)) return 'in-shufersal'
  if (ramiLevyBarcodes.has(item.itemCode)) return 'in-rami-levy'
  return 'net-new'
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatFeedAgeDays(isoTime: string | undefined): string {
  if (!isoTime) return 'unknown'
  const ms = Date.now() - new Date(isoTime).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return `${days} day${days === 1 ? '' : 's'}`
}

/**
 * Reads the feed filename from a small marker we drop alongside the cache.
 * Nice-to-have; falls back to the raw cache path when the marker is missing.
 */
function readFeedMeta(): { fname: string; time?: string } {
  const markerPath = `${FEED_CACHE_PATH}.meta.json`
  if (fs.existsSync(markerPath)) {
    try {
      return JSON.parse(fs.readFileSync(markerPath, 'utf8'))
    } catch {
      // fall through
    }
  }
  return { fname: path.basename(FEED_CACHE_PATH) }
}

// ── Main ──

function main(): void {
  ensureFeed()

  console.log('[Tiv Taam catalog] loading existing seed barcodes...')
  const shufersalBarcodes = extractBarcodes(SHUFERSAL_SEED_PATH, 'sh_')
  const ramiLevyBarcodes = extractBarcodes(RAMI_LEVY_SEED_PATH, 'rl_')
  console.log(
    `[Tiv Taam catalog] Shufersal IDs: ${formatNumber(shufersalBarcodes.size)}, Rami Levy IDs: ${formatNumber(ramiLevyBarcodes.size)}`,
  )

  console.log('[Tiv Taam catalog] parsing XML...')
  const gz = fs.readFileSync(FEED_CACHE_PATH)
  const rawItems = parseTransparencyFeed(gz)
  console.log(`[Tiv Taam catalog] parsed ${formatNumber(rawItems.length)} items`)

  console.log('[Tiv Taam catalog] filtering food-only...')
  const foodItems = filterFoodItems(rawItems)
  const nonFoodFiltered = rawItems.length - foodItems.length

  console.log('[Tiv Taam catalog] classifying against existing seeds...')
  const catalogItems: CatalogItem[] = foodItems.map((item) => ({
    ...item,
    dedupStatus: classify(item, shufersalBarcodes, ramiLevyBarcodes),
  }))

  // Counts.
  const counts: Record<DedupStatus, number> = {
    'net-new': 0,
    'in-shufersal': 0,
    'in-rami-levy': 0,
    'no-ean': 0,
  }
  let netNewImported = 0
  for (const item of catalogItems) {
    counts[item.dedupStatus]++
    if (item.dedupStatus === 'net-new' && isImported(item.manufactureCountry)) {
      netNewImported++
    }
  }

  const summary: Summary = {
    totalItems: rawItems.length,
    nonFoodFiltered,
    weightedNoEan: counts['no-ean'],
    inShufersal: counts['in-shufersal'],
    inRamiLevy: counts['in-rami-levy'],
    netNew: counts['net-new'],
    netNewImported,
  }

  // Invariant: every food item is tagged into exactly one bucket.
  const bucketsSum =
    summary.weightedNoEan + summary.inShufersal + summary.inRamiLevy + summary.netNew
  if (bucketsSum !== foodItems.length) {
    throw new Error(
      `[Tiv Taam catalog] bucket-sum invariant violated: ${bucketsSum} !== ${foodItems.length}`,
    )
  }

  const feedMeta = readFeedMeta()

  const output: Output = {
    source: 'tivtaam-transparency-feed',
    fetchedAt: new Date().toISOString(),
    feedFile: feedMeta.fname,
    summary,
    items: catalogItems,
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')

  // Summary print.
  console.log('')
  console.log('──────────────────────────────────────────')
  console.log('[Tiv Taam catalog gap]')
  console.log('──────────────────────────────────────────')
  console.log(`Feed file            : ${output.feedFile}`)
  console.log(`Feed age             : ${formatFeedAgeDays(feedMeta.time)}`)
  console.log(`Total items parsed   : ${formatNumber(summary.totalItems).padStart(7)}`)
  console.log(`Non-food filtered    : ${formatNumber(summary.nonFoodFiltered).padStart(7)}`)
  console.log(`Weighted / no-EAN    : ${formatNumber(summary.weightedNoEan).padStart(7)}`)
  console.log(`In Shufersal         : ${formatNumber(summary.inShufersal).padStart(7)}`)
  console.log(`In Rami Levy         : ${formatNumber(summary.inRamiLevy).padStart(7)}`)
  console.log(
    `Net-new              : ${formatNumber(summary.netNew).padStart(7)}   ← Phase 2 size signal`,
  )
  console.log(`  of which imported  : ${formatNumber(summary.netNewImported).padStart(7)}`)
  console.log(`Output               : ${path.relative(REPO_ROOT, OUTPUT_PATH)}`)
  console.log('──────────────────────────────────────────')
  console.log('')
  console.log('Note: only 71% of Shufersal IDs are 13-digit EANs (rest are internal SKU codes).')
  console.log('      Rami Levy is 97% EANs. Cross-chain dedup by barcode may under-report overlap.')
}

try {
  main()
} catch (err) {
  console.error('[Tiv Taam catalog] FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
}
