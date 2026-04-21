/**
 * Tiv Taam Phase 2 — OFF nutrition fetcher.
 *
 * Reads `tmp/tivtaam-catalog.json` (Phase 1 output), filters to the
 * `net-new` slice, and fetches each EAN from Open Food Facts. Hits and
 * misses are cached per-EAN at `tmp/off-cache/<ean>.json` so the 4-hour
 * run is resumable on Ctrl-C + restart.
 *
 * Post-loop: runs a retry pass on all items that errored during the main
 * loop, with a wider 2500ms gap to escape OFF's rate-limit window. Task 0
 * proved this pattern drives transient errors to zero.
 *
 * Spec: docs/specs/2026-04-21-tiv-taam-phase2-off-enrichment.md
 *
 * Usage:
 *   npm run fetch-tivtaam-off              — full resumable fetch (~4h at 1500ms)
 *   npm run fetch-tivtaam-off -- --dry-run — first 100 net-new items only
 *   npm run fetch-tivtaam-off -- --probe   — stratified 100-item hit-rate probe
 *   npm run fetch-tivtaam-off -- --force   — wipe cache + re-fetch all items
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  fetchOffProduct,
  fetchRawOffProduct,
  normalizeOffProduct,
  OffNetworkError,
} from '../src/services/open-food-facts'
import type { OffCacheEntry } from './tivtaam-seed-types'

// ── Paths ──

const REPO_ROOT = process.cwd()
const CATALOG_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-catalog.json')
const CACHE_DIR = path.join(REPO_ROOT, 'tmp', 'off-cache')
const FETCH_DUMP_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-off-fetch.json')

// ── Constants ──

const PROBE_DOMESTIC = 50
const PROBE_IMPORTED = 50
const PROBE_GAP_MS = 500
const FETCH_GAP_MS = 1500 // Task 0 finding: 500ms triggers CDN 429s on ~40% of calls
const RETRY_GAP_MS = 2500 // Error retry pass — 2500ms drove remaining errors to zero
const DRY_RUN_LIMIT = 100
const SHUFFLE_SEED = 20260421

// Mirrors build-tivtaam-catalog.ts's NOT_IMPORTED_TOKENS.
const NOT_IMPORTED_TOKENS = new Set(['ישראל', 'IL', 'ISR', 'ISRAEL', 'לא ידוע', ''])

// ── CLI ──

const args = process.argv.slice(2)
const PROBE = args.includes('--probe')
const DRY_RUN = args.includes('--dry-run')
const FORCE = args.includes('--force')

// ── Types (subset of catalog output) ──

interface CatalogItem {
  itemCode: string
  nameHe: string
  manufactureCountry: string
  dedupStatus: 'net-new' | 'in-shufersal' | 'in-rami-levy' | 'no-ean'
}

interface CatalogFile {
  summary: { netNew: number; netNewImported: number }
  items: CatalogItem[]
}

type Outcome = 'hit-full' | 'hit-partial' | 'miss' | 'error'

interface ProbeRow {
  ean: string
  nameHe: string
  slice: 'domestic' | 'imported'
  outcome: Outcome
}

interface FetchStats {
  total: number
  fromCache: number
  fetched: number
  hits: number
  misses: number
  errors: number
}

// ── Shared helpers ──

function isImported(country: string): boolean {
  return !NOT_IMPORTED_TOKENS.has(country.trim().toUpperCase())
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadCatalog(): CatalogFile {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`[Tiv Taam OFF] ${CATALOG_PATH} not found — run build-tivtaam-catalog first.`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as CatalogFile
}

/**
 * Deterministic Fisher-Yates shuffle via mulberry32. Used only by probe
 * mode for reproducible sampling; the fetch pipeline iterates in catalog
 * order so resumed runs pick up exactly where they left off.
 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice()
  let s = seed >>> 0
  for (let i = out.length - 1; i > 0; i--) {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const rand = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    const j = Math.floor(rand * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ── Cache (full-fetch mode only) ──

function cachePath(ean: string): string {
  return path.join(CACHE_DIR, `${ean}.json`)
}

function readCache(ean: string): OffCacheEntry | null {
  const p = cachePath(ean)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as OffCacheEntry
  } catch {
    // Corrupt cache entry — treat as miss-in-cache so the main loop re-fetches.
    return null
  }
}

function writeCache(ean: string, entry: OffCacheEntry): void {
  fs.writeFileSync(cachePath(ean), JSON.stringify(entry))
}

/**
 * Fetches and caches a single EAN. Returns the outcome for stats.
 * Errors are NOT cached — a failed fetch re-attempts on the next run
 * and (within this run) feeds the retry-errors pass.
 */
async function fetchAndCache(ean: string): Promise<Outcome> {
  try {
    const raw = await fetchRawOffProduct(ean)
    if (raw === null) {
      writeCache(ean, { status: 'miss', fetchedAt: new Date().toISOString() })
      return 'miss'
    }
    writeCache(ean, { status: 'hit', fetchedAt: new Date().toISOString(), raw })
    // Normalize locally (pure function — no network) just for partial flag stats.
    // The seed builder later re-normalizes from the cached raw body with idPrefix: 'tt'.
    const { isPartial } = normalizeOffProduct(raw, ean)
    return isPartial ? 'hit-partial' : 'hit-full'
  } catch (err) {
    if (err instanceof OffNetworkError) return 'error'
    throw err
  }
}

// ── Fetch mode (default + --dry-run) ──

async function runFetch(): Promise<void> {
  // Prep cache dir / wipe on --force.
  if (FORCE && fs.existsSync(CACHE_DIR)) {
    console.log(`[Tiv Taam OFF] --force: wiping ${path.relative(REPO_ROOT, CACHE_DIR)}`)
    fs.rmSync(CACHE_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true })

  const catalog = loadCatalog()
  const netNew = catalog.items.filter((i) => i.dedupStatus === 'net-new')
  const pool = DRY_RUN ? netNew.slice(0, DRY_RUN_LIMIT) : netNew

  console.log(
    `[Tiv Taam OFF] mode=${DRY_RUN ? 'dry-run' : 'full'}, items=${pool.length.toLocaleString()}, gap=${FETCH_GAP_MS}ms`,
  )
  if (!DRY_RUN) {
    const etaMin = Math.ceil((pool.length * FETCH_GAP_MS) / 60_000)
    console.log(`[Tiv Taam OFF] ETA ~${etaMin} minutes for un-cached items`)
  }

  const stats: FetchStats = {
    total: pool.length,
    fromCache: 0,
    fetched: 0,
    hits: 0,
    misses: 0,
    errors: 0,
  }
  const erroredEans: string[] = []

  for (let i = 0; i < pool.length; i++) {
    const item = pool[i]
    const start = Date.now()

    const cached = readCache(item.itemCode)
    let outcome: Outcome
    if (cached) {
      stats.fromCache++
      outcome = cached.status === 'hit' ? 'hit-full' : 'miss'
    } else {
      outcome = await fetchAndCache(item.itemCode)
      stats.fetched++
    }

    if (outcome.startsWith('hit')) stats.hits++
    else if (outcome === 'miss') stats.misses++
    else {
      stats.errors++
      erroredEans.push(item.itemCode)
    }

    if ((i + 1) % 100 === 0 || i + 1 === pool.length) {
      const pct = ((i + 1) / pool.length) * 100
      console.log(
        `  [${i + 1}/${pool.length}] ${pct.toFixed(1)}% — hits ${stats.hits}, misses ${stats.misses}, errors ${stats.errors}, cached ${stats.fromCache}`,
      )
    }

    // Only rate-limit after an actual network call.
    if (!cached && i < pool.length - 1) {
      const elapsed = Date.now() - start
      const remaining = FETCH_GAP_MS - elapsed
      if (remaining > 0) await sleep(remaining)
    }
  }

  // ── Retry-errors pass at 2500ms gap ──
  if (erroredEans.length > 0) {
    console.log('')
    console.log(
      `[Tiv Taam OFF] retry-errors pass: ${erroredEans.length} items at ${RETRY_GAP_MS}ms gap`,
    )
    let recovered = 0
    for (let i = 0; i < erroredEans.length; i++) {
      const ean = erroredEans[i]
      const start = Date.now()
      const outcome = await fetchAndCache(ean)
      if (outcome !== 'error') {
        recovered++
        stats.errors--
        if (outcome.startsWith('hit')) stats.hits++
        else stats.misses++
      }
      if ((i + 1) % 10 === 0 || i + 1 === erroredEans.length) {
        console.log(
          `  [${i + 1}/${erroredEans.length}] recovered ${recovered}, still erroring ${i + 1 - recovered}`,
        )
      }
      if (i < erroredEans.length - 1) {
        const elapsed = Date.now() - start
        const remaining = RETRY_GAP_MS - elapsed
        if (remaining > 0) await sleep(remaining)
      }
    }
  }

  // ── Summary ──
  const hitRate = stats.total === 0 ? 0 : (stats.hits / stats.total) * 100
  const missRate = stats.total === 0 ? 0 : (stats.misses / stats.total) * 100

  console.log('')
  console.log('──────────────────────────────────────────')
  console.log(`[Tiv Taam OFF fetch] ${DRY_RUN ? '(DRY RUN)' : ''}`)
  console.log('──────────────────────────────────────────')
  console.log(`  Total net-new items    : ${stats.total.toLocaleString()}`)
  console.log(`  Served from cache      : ${stats.fromCache.toLocaleString()}`)
  console.log(`  Fetched this run       : ${stats.fetched.toLocaleString()}`)
  console.log(`  Hits                   : ${stats.hits.toLocaleString()} (${hitRate.toFixed(1)}%)`)
  console.log(
    `  Misses                 : ${stats.misses.toLocaleString()} (${missRate.toFixed(1)}%)`,
  )
  console.log(`  Persistent errors      : ${stats.errors.toLocaleString()} (will retry next run)`)
  console.log('──────────────────────────────────────────')

  // Dump stats JSON for downstream build steps / diagnostics.
  fs.writeFileSync(
    FETCH_DUMP_PATH,
    JSON.stringify(
      { mode: DRY_RUN ? 'dry-run' : 'full', completedAt: new Date().toISOString(), stats },
      null,
      2,
    ),
  )
  console.log(`[Tiv Taam OFF] wrote ${path.relative(REPO_ROOT, FETCH_DUMP_PATH)}`)

  if (!DRY_RUN) {
    console.log('')
    console.log('Next step: npm run build-tivtaam-seed')
  }
}

// ── Probe mode (unchanged from Task 0) ──

async function classifyOneProbe(ean: string): Promise<Outcome> {
  try {
    const result = await fetchOffProduct(ean)
    if (result === null) return 'miss'
    return result.isPartial ? 'hit-partial' : 'hit-full'
  } catch (err) {
    if (err instanceof OffNetworkError) return 'error'
    throw err
  }
}

async function runProbe(): Promise<void> {
  const catalog = loadCatalog()

  const netNew = catalog.items.filter((i) => i.dedupStatus === 'net-new')
  const domesticPool = netNew.filter((i) => !isImported(i.manufactureCountry))
  const importedPool = netNew.filter((i) => isImported(i.manufactureCountry))

  console.log(`[Tiv Taam OFF probe] net-new catalog: ${netNew.length} items`)
  console.log(`  domestic pool: ${domesticPool.length}, imported pool: ${importedPool.length}`)

  const domesticSample = seededShuffle(domesticPool, SHUFFLE_SEED).slice(0, PROBE_DOMESTIC)
  const importedSample = seededShuffle(importedPool, SHUFFLE_SEED ^ 0xdeadbeef).slice(
    0,
    PROBE_IMPORTED,
  )

  const plan: ProbeRow[] = [
    ...domesticSample.map((i) => ({
      ean: i.itemCode,
      nameHe: i.nameHe,
      slice: 'domestic' as const,
      outcome: 'miss' as Outcome,
    })),
    ...importedSample.map((i) => ({
      ean: i.itemCode,
      nameHe: i.nameHe,
      slice: 'imported' as const,
      outcome: 'miss' as Outcome,
    })),
  ]

  console.log(
    `[Tiv Taam OFF probe] fetching ${plan.length} items (${PROBE_DOMESTIC} domestic + ${PROBE_IMPORTED} imported), gap=${PROBE_GAP_MS}ms...`,
  )

  for (let i = 0; i < plan.length; i++) {
    const row = plan[i]
    const start = Date.now()
    row.outcome = await classifyOneProbe(row.ean)
    if (i % 10 === 9) {
      const done = i + 1
      const hits = plan.slice(0, done).filter((r) => r.outcome.startsWith('hit')).length
      console.log(`  [${done}/${plan.length}] hits so far: ${hits}`)
    }
    if (i < plan.length - 1) {
      const elapsed = Date.now() - start
      const remaining = PROBE_GAP_MS - elapsed
      if (remaining > 0) await sleep(remaining)
    }
  }

  function tally(rows: ProbeRow[]): {
    full: number
    partial: number
    miss: number
    err: number
    hitRate: number
  } {
    const full = rows.filter((r) => r.outcome === 'hit-full').length
    const partial = rows.filter((r) => r.outcome === 'hit-partial').length
    const miss = rows.filter((r) => r.outcome === 'miss').length
    const err = rows.filter((r) => r.outcome === 'error').length
    const hitRate = rows.length === 0 ? 0 : ((full + partial) / rows.length) * 100
    return { full, partial, miss, err, hitRate }
  }

  const domestic = tally(plan.filter((r) => r.slice === 'domestic'))
  const imported = tally(plan.filter((r) => r.slice === 'imported'))
  const overall = tally(plan)

  function line(
    label: string,
    t: { full: number; partial: number; miss: number; err: number; hitRate: number },
    n: number,
  ): string {
    const rate = t.hitRate.toFixed(1).padStart(5)
    return `  ${label.padEnd(22)}: ${String(t.full + t.partial).padStart(2)}/${n}  (${rate}%)  — full ${t.full}, partial ${t.partial}, miss ${t.miss}, error ${t.err}`
  }

  const DUMP_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-off-probe.json')
  fs.writeFileSync(DUMP_PATH, JSON.stringify({ seed: SHUFFLE_SEED, rows: plan }, null, 2))
  console.log(`[Tiv Taam OFF probe] wrote ${DUMP_PATH}`)

  console.log('')
  console.log('──────────────────────────────────────────')
  console.log(`[Tiv Taam OFF probe] (n=${plan.length}, seed=${SHUFFLE_SEED})`)
  console.log('──────────────────────────────────────────')
  console.log(line('Domestic', domestic, PROBE_DOMESTIC))
  console.log(line('Imported', imported, PROBE_IMPORTED))
  console.log(line('Overall', overall, plan.length))
  console.log('──────────────────────────────────────────')
  console.log('Decision gate:')
  console.log('  ≥ 35% overall       → proceed to Task 1+')
  console.log('  20–34% overall      → confirm with user; if imported ≥ 50%, still proceed')
  console.log('  < 20% overall       → stop, reassess Phase 2 strategy')
  console.log('──────────────────────────────────────────')
}

// ── Main entry ──

async function main(): Promise<void> {
  if (PROBE) {
    await runProbe()
  } else {
    await runFetch()
  }
}

main().catch((err) => {
  console.error('[Tiv Taam OFF] FATAL:', err instanceof Error ? err.message : err)
  process.exit(1)
})
