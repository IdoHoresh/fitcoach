/**
 * Rami Levy product ID sweep.
 *
 * Sweeps the search API with broad Hebrew terms to collect all food product IDs.
 * Two passes ("ה" then "א") cover the full ~6,755 product catalog.
 * Results are filtered to food departments only and deduplicated by product ID.
 *
 * Output: tmp/rami-levy-ids.json — array of RLProductSummary
 *
 * Usage:
 *   npm run scrape-rl-ids              — full sweep (skips if output already exists)
 *   npm run scrape-rl-ids -- --force   — re-sweep even if output exists
 *   npm run scrape-rl-ids -- --dry-run — first page of first term only, print 3 products
 */

import * as fs from 'fs'
import * as path from 'path'
import { FOOD_DEPARTMENT_IDS, SWEEP_TERMS, SEARCH_PAGE_SIZE, RL_API_BASE } from './rami-levy-types'
import type { RLProductSummary, RLSearchResponse } from './rami-levy-types'

// ── Constants ──────────────────────────────────────────────────────────────

const RATE_LIMIT_MS = 300
const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'rami-levy-ids.json')

// ── CLI flags ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const DRY_RUN = args.includes('--dry-run')

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── API ────────────────────────────────────────────────────────────────────

async function fetchSearchPage(term: string, from: number): Promise<RLSearchResponse> {
  const url = `${RL_API_BASE}/api/search?q=${encodeURIComponent(term)}&size=${SEARCH_PAGE_SIZE}&from=${from}`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'he-IL,he;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Search "${term}" from=${from}: HTTP ${res.status}`)
  }

  const json = (await res.json()) as RLSearchResponse | string[]

  // ES returns ["Internal Server Error"] on bad params — treat as empty
  if (Array.isArray(json)) {
    return { q: term, status: 500, total: 0, data: [] }
  }

  return json
}

// ── Main sweep ─────────────────────────────────────────────────────────────

async function sweep(): Promise<void> {
  if (!FORCE && !DRY_RUN && fs.existsSync(OUTPUT_PATH)) {
    console.log(`[RL IDs] Output already exists at ${OUTPUT_PATH}. Use --force to re-sweep.`)
    return
  }

  const seen = new Map<number, RLProductSummary>() // id → product
  let totalRequests = 0

  const termsToSweep = DRY_RUN ? [SWEEP_TERMS[0]] : SWEEP_TERMS

  for (const term of termsToSweep) {
    console.log(`\n[RL IDs] ── Sweeping term: "${term}" ──`)
    let from = 0

    do {
      try {
        const response = await fetchSearchPage(term, from)
        totalRequests++

        const foodProducts = response.data.filter((p) => FOOD_DEPARTMENT_IDS.has(p.department_id))
        let newCount = 0

        for (const product of foodProducts) {
          if (!seen.has(product.id)) {
            seen.set(product.id, product)
            newCount++
          }
        }

        console.log(
          `  from=${from}: ${response.data.length} results, ${foodProducts.length} food, ${newCount} new (total unique: ${seen.size})`,
        )

        if (DRY_RUN) {
          const samples = [...seen.values()].slice(0, 3)
          console.log('\n[Dry-run] Sample products:')
          samples.forEach((p) =>
            console.log(`  id=${p.id} barcode=${p.barcode} dept=${p.department_id} "${p.name}"`),
          )
          return
        }

        // Stop if we've received fewer results than a full page (last page)
        if (response.data.length < SEARCH_PAGE_SIZE) break

        from += SEARCH_PAGE_SIZE

        // ES hard cap: from + size must stay ≤ 10,000
        if (from + SEARCH_PAGE_SIZE > 10000) {
          console.log(`  [warn] Approaching ES 10k limit at from=${from} — stopping this term`)
          break
        }

        await sleep(RATE_LIMIT_MS)
      } catch (err) {
        console.error(`  [error] term="${term}" from=${from}: ${(err as Error).message}`)
        break
      }
    } while (true)
  }

  const allProducts = [...seen.values()]

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allProducts, null, 2), 'utf8')

  console.log(`\n[RL IDs] ── Complete ──`)
  console.log(`  Unique food products : ${allProducts.length}`)
  console.log(`  Total requests       : ${totalRequests}`)
  console.log(`  Output               : ${OUTPUT_PATH}`)
}

sweep().catch((err) => {
  console.error('[RL IDs] Fatal error:', err)
  process.exit(1)
})
