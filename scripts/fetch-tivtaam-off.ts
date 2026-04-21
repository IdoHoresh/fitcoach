/**
 * Tiv Taam OFF nutrition fetcher — Task 0 probe stage.
 *
 * Currently implements only the `--probe` mode: stratified 100-item sample
 * (50 domestic + 50 imported) measuring OFF hit rate before committing to
 * the full 10k-item fetch. Full fetcher arrives in Task 3.
 *
 * Spec: docs/specs/2026-04-21-tiv-taam-phase2-off-enrichment.md
 *
 * Usage:
 *   npm run fetch-tivtaam-off -- --probe   — run stratified 100-item hit-rate probe
 */

import * as fs from 'fs'
import * as path from 'path'
import { fetchOffProduct, OffNetworkError } from '../src/services/open-food-facts'

// ── Paths ──

const REPO_ROOT = process.cwd()
const CATALOG_PATH = path.join(REPO_ROOT, 'tmp', 'tivtaam-catalog.json')

// ── Constants ──

const PROBE_DOMESTIC = 50
const PROBE_IMPORTED = 50
const GAP_MS = 500
const SHUFFLE_SEED = 20260421 // today's date — reproducibility

// Mirrors build-tivtaam-catalog.ts's NOT_IMPORTED_TOKENS so the same
// items classified as "imported" in Phase 1's summary are used here.
const NOT_IMPORTED_TOKENS = new Set(['ישראל', 'IL', 'ISR', 'ISRAEL', 'לא ידוע', ''])

// ── CLI ──

const args = process.argv.slice(2)
const PROBE = args.includes('--probe')

if (!PROBE) {
  console.error('[Tiv Taam OFF] Task 0 stage only supports --probe. Full fetcher lands in Task 3.')
  console.error('Usage: npm run fetch-tivtaam-off -- --probe')
  process.exit(2)
}

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

type ProbeOutcome = 'hit-full' | 'hit-partial' | 'miss' | 'error'

interface ProbeRow {
  ean: string
  nameHe: string
  slice: 'domestic' | 'imported'
  outcome: ProbeOutcome
}

// ── Helpers ──

function isImported(country: string): boolean {
  const normalized = country.trim().toUpperCase()
  return !NOT_IMPORTED_TOKENS.has(normalized)
}

/**
 * Deterministic Fisher-Yates shuffle via a mulberry32 PRNG so that re-runs
 * of the probe sample the same EANs. Keeps the decision gate reproducible.
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

async function classifyOne(ean: string): Promise<ProbeOutcome> {
  try {
    const result = await fetchOffProduct(ean)
    if (result === null) return 'miss'
    return result.isPartial ? 'hit-partial' : 'hit-full'
  } catch (err) {
    if (err instanceof OffNetworkError) return 'error'
    throw err
  }
}

// ── Main ──

async function main(): Promise<void> {
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
      outcome: 'miss' as ProbeOutcome, // overwritten below
    })),
    ...importedSample.map((i) => ({
      ean: i.itemCode,
      nameHe: i.nameHe,
      slice: 'imported' as const,
      outcome: 'miss' as ProbeOutcome,
    })),
  ]

  console.log(
    `[Tiv Taam OFF probe] fetching ${plan.length} items (${PROBE_DOMESTIC} domestic + ${PROBE_IMPORTED} imported), gap=${GAP_MS}ms...`,
  )

  for (let i = 0; i < plan.length; i++) {
    const row = plan[i]
    const start = Date.now()
    row.outcome = await classifyOne(row.ean)
    if (i % 10 === 9) {
      const done = i + 1
      const hits = plan.slice(0, done).filter((r) => r.outcome.startsWith('hit')).length
      console.log(`  [${done}/${plan.length}] hits so far: ${hits}`)
    }
    if (i < plan.length - 1) {
      const elapsed = Date.now() - start
      const remaining = GAP_MS - elapsed
      if (remaining > 0) await sleep(remaining)
    }
  }

  // ── Tally ──

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

  // Dump full outcome JSON for follow-up diagnostics (re-classifying errors, etc.)
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

  // Sample the first few misses per slice so we can eyeball pattern
  const domesticMisses = plan
    .filter((r) => r.slice === 'domestic' && r.outcome === 'miss')
    .slice(0, 5)
  const importedMisses = plan
    .filter((r) => r.slice === 'imported' && r.outcome === 'miss')
    .slice(0, 5)
  if (domesticMisses.length > 0) {
    console.log('Sample domestic misses:')
    for (const r of domesticMisses) console.log(`  ${r.ean}  ${r.nameHe}`)
  }
  if (importedMisses.length > 0) {
    console.log('Sample imported misses:')
    for (const r of importedMisses) console.log(`  ${r.ean}  ${r.nameHe}`)
  }
}

main().catch((err) => {
  console.error('[Tiv Taam OFF probe] FATAL:', err instanceof Error ? err.message : err)
  process.exit(1)
})
