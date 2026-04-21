# Feature: Tiv Taam Phase 1 — Transparency-Feed Catalog Gap Analysis

**Date:** 2026-04-21
**Status:** Done
**GitHub Issue:** TBD

## What

A build-time script that downloads Tiv Taam's Israeli Price Transparency Law
XML feed, parses it into a normalized `(barcode, nameHe, manufacturer, country,
unit, quantity)` index, filters food-only items, deduplicates against the
existing Shufersal + Rami Levy seeds, and prints a summary of the **net-new
catalog gap** Tiv Taam would add if Phase 2 (nutrition enrichment) is built.

**No app changes.** No schema migration, no seed baked into SQLite, no
components touched. Output is a single build-artifact JSON (`tmp/tivtaam-catalog.json`)
plus a printed summary — the signal we need to decide whether Phase 2 is worth
the effort.

## Why

Phase 1 de-risks the whole Tiv Taam effort. Before committing to OFF
enrichment, a Tiv Taam-specific seed table, and a v19 schema migration, we
need to answer: **"How many net-new food products would Tiv Taam add after
deduplication against our existing 12k+ items?"**

If the answer is "~300 items" (massive overlap with Shufersal/Rami Levy), we
walk away — Tiv Taam isn't worth the effort. If the answer is "~3,000 items,
mostly imported non-kosher goods", Phase 2 is a clear win. Either way, we
know in under a day of work.

Secondary benefit: the transparency-feed parser built here is reusable. The
same XML schema (`<Root><Items><Item><ItemCode>…`) is used by ~15 Israeli
chains including Yohananof, Victory, Am-Pm, Osher Ad, Hatzi Hinam, King Store.
Phase 1 becomes a shared primitive for future supermarket expansions.

## Requirements

- [ ] Downloads a recent `PriceFull*.gz` for Tiv Taam from `url.publishedprices.co.il`
      (auth: `username=TivTaam`, empty password; session cookie required; CSRF
      token required on POST)
- [ ] Decompresses + streams the XML (files are ~1MB gzipped, ~10MB
      decompressed, ~2k–4k items) — no full-doc parsing memory blow-up
- [ ] Normalizes each `<Item>` to `{ itemCode, nameHe, manufactureName,
manufactureCountry, unitOfMeasure, quantity, isWeighted, itemType }`
- [ ] Filters food-only items (heuristic: keep `ItemType === '1'` packaged,
      drop obvious non-food keyword matches; see "Food Filter" below)
- [ ] Dedupes against barcode sets extracted from `src/assets/supermarket-seed.json`
      (Shufersal, `sh_<barcode>` IDs) and `src/assets/rami-levy-seed.json`
      (Rami Levy, `rl_<barcode>` IDs)
- [ ] Outputs `tmp/tivtaam-catalog.json` — array of normalized, deduped,
      food-only items
- [ ] Prints a summary report: - Total items parsed - Non-food items filtered out - Weighted / no-EAN items (cannot dedupe by barcode) - Items already in Shufersal seed - Items already in Rami Levy seed - **Net-new items** (the number that drives the Phase 2 decision) - Breakdown: how many net-new have a non-empty `ManufactureCountry`
      different from `ישראל`/empty (the imported-goods signal)
- [ ] Script is re-runnable (`--force` flag re-downloads; otherwise uses
      cached `tmp/tivtaam-raw.xml.gz`)

## Non-Requirements

- **No nutrition data** — that's Phase 2 (OFF enrichment).
- **No schema migration** — no `foods` table changes, no `SCHEMA_VERSION` bump.
- **No component or UI changes.**
- **No app-facing behavior** — this is a build-time analysis script only.
- **No hand-curated overrides** — Phase 2 scope if needed.

## Design

### Architecture

```
url.publishedprices.co.il (login: TivTaam / "")
          │
          │  POST /login/user  (form-encoded, CSRF from GET /login)
          │  POST /file/json/dir  (DataTables request, CSRF cookie)
          │  GET  /file/d/<filename>.gz  (binary download)
          ▼
┌───────────────────────────────┐
│  scripts/                     │
│  download-tivtaam-feed.ts     │  ← authenticates, picks newest PriceFull
└────────────┬──────────────────┘
             │  tmp/tivtaam-raw.xml.gz (binary, ~1MB)
             ▼
┌───────────────────────────────┐
│  scripts/                     │
│  parse-transparency-feed.ts   │  ← streaming gunzip + XML → raw items
└────────────┬──────────────────┘
             │  raw items: TransparencyItem[]
             ▼
┌───────────────────────────────┐
│  scripts/                     │
│  filter-food-items.ts         │  ← keyword + ItemType heuristic
└────────────┬──────────────────┘
             │  food-only TransparencyItem[]
             ▼
┌───────────────────────────────┐
│  scripts/                     │
│  catalog-gap-report.ts        │  ← dedup vs existing seeds, print summary
└────────────┬──────────────────┘
             │
             ▼
┌───────────────────────────────┐
│  tmp/tivtaam-catalog.json     │  ← normalized, deduped, food-only
└───────────────────────────────┘
```

### Transparency Feed — confirmed 2026-04-21

**Login flow** (standard for all `publishedprices.co.il` retailers):

```
GET  /login  → parse meta[name="csrftoken"] content → $CSRF1
POST /login/user
  headers:  Content-Type: application/x-www-form-urlencoded
  body:     csrftoken=$CSRF1&username=TivTaam&password=&r=
  side-effect: sets session cookie
```

**File listing** (DataTables-compatible endpoint):

```
GET  /file  → parse meta[name="csrftoken"] content → $CSRF2
POST /file/json/dir
  headers:  X-Requested-With: XMLHttpRequest
  body:     sEcho=1&iColumns=5&sColumns=,,,,&iDisplayStart=0
           &iDisplayLength=50&cd=%2F&csrftoken=$CSRF2
  returns:  { aaData: [ { fname: 'PriceFull7290873255550-…-…-…-….gz', size, time }, … ] }
```

**File download**:

```
GET /file/d/<fname>  → gzipped XML
```

**XML schema** (confirmed from `PriceFull7290873255550-000-002-20260421-004004.gz`):

```xml
<Root>
  <ChainID>7290873255550</ChainID>
  <SubChainID>000</SubChainID>
  <StoreID>002</StoreID>
  <Items>
    <Item>
      <ItemCode>7290004131074</ItemCode>     <!-- EAN13 for packaged; 7-11 digit internal for deli/weighted -->
      <ItemType>1</ItemType>                  <!-- 0 = bulk/weighted, 1 = packaged -->
      <ItemName>חלב תנובה 3% 1 ליטר</ItemName>
      <ManufactureName>תנובה</ManufactureName>
      <ManufactureCountry>ישראל</ManufactureCountry>
      <ManufactureItemDescription>חלב 3%</ManufactureItemDescription>
      <UnitQty>ליטר</UnitQty>
      <Quantity>1.00</Quantity>
      <UnitOfMeasure>ליטר</UnitOfMeasure>
      <bIsWeighted>0</bIsWeighted>
      <ItemPrice>8.90</ItemPrice>
      <!-- + other price fields not needed for this pipeline -->
    </Item>
    …
  </Items>
</Root>
```

### Store File Selection

Pick the **newest** `PriceFull<chainId>-*.gz` by the `time` field returned by
the DataTables endpoint. The catalog is chain-wide, so store ID is irrelevant
for our purposes. Guard: if the chosen file is older than 7 days, log a
warning (transparency feed may be stale).

### Food Filter Heuristic

Transparency feeds include everything the store sells — not just food.
Plastic wrap, cleaning supplies, baby clothes at Tiv Taam all show up.

**Two-stage filter:**

1. **Hard drop** — `ItemType === '1'` packaged items whose name matches any
   of a non-food keyword blacklist (Hebrew): `ניילון` (plastic wrap),
   `מגבות` (towels), `סבון כביסה` (laundry), `אקונומיקה` (bleach),
   `שמפו` (shampoo), `מרכך כביסה` (softener), `טואלט` (toilet),
   `נייר` (paper — context: toilet/kitchen paper, not food packaging),
   `סיגריות` (cigarettes), `אלכוהול` (alcohol category markers),
   etc. Maintain in a single `NON_FOOD_KEYWORDS` constant.
2. **Soft keep** — everything else passes. Accept some non-food noise in the
   output; the dedup step and Phase 2's OFF lookup will naturally drop items
   that don't exist in food databases.

**Weighted items** (`bIsWeighted === '1'`) are kept but flagged — they
typically have no EAN (deli counter, butcher, produce) so they can't dedupe
by barcode. Reported separately in the summary.

### Deduplication

Barcode sets are extracted at startup:

```ts
const shufersalBarcodes = extractBarcodes(supermarketSeed, 'sh_')
const ramiLevyBarcodes = extractBarcodes(ramiLevySeed, 'rl_')
```

Pure helper `extractBarcodes(seed, prefix)` reads `seed.foods[].id`, strips
the prefix, returns a `Set<string>`. Same pattern already used in
`scripts/build-rami-levy-seed.ts`.

For each Tiv Taam item with a valid EAN-shaped `ItemCode` (12–13 digits,
starts with `7290…` or other known GS1 prefix), check membership. Non-EAN
ItemCodes (weighted bulk, deli counter) are kept but marked
`dedupStatus: 'no-ean'` — they cannot be deduped by barcode and may overlap
with existing names in Shufersal/RL (a Phase 2 concern, not Phase 1).

### Output Schema

`tmp/tivtaam-catalog.json`:

```json
{
  "source": "tivtaam-transparency-feed",
  "fetchedAt": "2026-04-21T12:34:56Z",
  "feedFile": "PriceFull7290873255550-000-002-20260421-004004.gz",
  "summary": {
    "totalItems": 3847,
    "nonFoodFiltered": 612,
    "weightedNoEan": 284,
    "inShufersal": 1245,
    "inRamiLevy": 987,
    "netNew": 719,
    "netNewImported": 412
  },
  "items": [
    {
      "itemCode": "7290004131074",
      "nameHe": "חלב תנובה 3% 1 ליטר",
      "manufactureName": "תנובה",
      "manufactureCountry": "ישראל",
      "unitOfMeasure": "ליטר",
      "quantity": 1,
      "isWeighted": false,
      "itemType": 1,
      "dedupStatus": "in-shufersal"
    },
    { … }
  ]
}
```

`dedupStatus` one of: `net-new` | `in-shufersal` | `in-rami-levy` | `no-ean`.

### Files to Create

| File                                      | Action | Description                                                                                         |
| ----------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| `scripts/transparency-feed-types.ts`      | Create | Types: `TransparencyItem`, `TransparencyFeedFile`, `DedupStatus`, `NON_FOOD_KEYWORDS` constant      |
| `scripts/download-tivtaam-feed.ts`        | Create | Auth flow + newest-file selector + GZ download → `tmp/tivtaam-raw.xml.gz`                           |
| `scripts/parse-transparency-feed.ts`      | Create | Pure function: gzipped XML buffer → `TransparencyItem[]` (streaming parser)                         |
| `scripts/parse-transparency-feed.test.ts` | Create | Unit tests on a fixture XML — schema parsing, number coercion, missing optional fields              |
| `scripts/filter-food-items.ts`            | Create | Pure function: `TransparencyItem[] → TransparencyItem[]` (keyword blacklist + ItemType)             |
| `scripts/filter-food-items.test.ts`       | Create | Unit tests on fabricated items — keyword match, case-insensitive, ItemType 0 retained when weighted |
| `scripts/build-tivtaam-catalog.ts`        | Create | Orchestrator: download → parse → filter → dedup → write JSON + print summary                        |
| `package.json`                            | Modify | Add `build-tivtaam-catalog` script                                                                  |
| `.gitignore`                              | Verify | `tmp/` already ignored (confirm)                                                                    |

**No app-facing changes.** Nothing under `src/` is touched.

## Acceptance Criteria

- [ ] `npm run build-tivtaam-catalog -- --dry-run` completes in < 30s,
      authenticates, picks a file, downloads, parses, prints summary
- [ ] `npm run build-tivtaam-catalog` produces `tmp/tivtaam-catalog.json` with
      ≥ 2,000 food items
- [ ] Zero items have `itemCode` containing a non-digit character
- [ ] Every item has non-empty `nameHe`
- [ ] Summary math checks out: `totalItems === nonFoodFiltered + weightedNoEan
  - inShufersal + inRamiLevy + netNew`
- [ ] `netNew` count is printed prominently — the number we use to decide
      Phase 2
- [ ] `netNewImported` count is printed — imported-goods slice (Tiv Taam's
      moat thesis)
- [ ] `npm test` passes (2,269 + parse-feed tests + filter tests)
- [ ] `npm run lint && npm run typecheck` clean

## Task Breakdown

1. [ ] **Task 1: Types + constants (S)** — `transparency-feed-types.ts` with
       `TransparencyItem`, `DedupStatus`, `NON_FOOD_KEYWORDS`. No tests
       (pure types/constants).

2. [ ] **Task 2: XML parser + tests (M, TDD)** — `parse-transparency-feed.ts`.
       Streaming XML parser (use `sax` or `fast-xml-parser`; prefer `sax`
       for memory discipline on larger feeds). Pure function:
       `(xmlBuffer: Buffer) → TransparencyItem[]`. Tests against a 3-item
       fixture XML embedded in the test file. Verifies schema parsing,
       number coercion, Hebrew unicode preservation, missing-optional
       tolerance.

3. [ ] **Task 3: Food filter + tests (S, TDD)** — `filter-food-items.ts`.
       Pure function with `NON_FOOD_KEYWORDS` from types file. Case-
       insensitive substring match. Tests: milk passes, plastic wrap drops,
       weighted deli item passes, case variations.

4. [ ] **Task 4: Auth + download (M, manual-verify)** — `download-tivtaam-feed.ts`.
       Network-bound — no unit tests. Manual acceptance via `--dry-run`:
       authenticates, lists files, picks newest, downloads to
       `tmp/tivtaam-raw.xml.gz`, prints filename + size. `--force`
       re-downloads; otherwise uses cache. 10s timeout per HTTP call, no
       retry logic (transparency feed is public + stable).

5. [ ] **Task 5: Orchestrator + gap report (S)** — `build-tivtaam-catalog.ts`.
       Glue: `download → parse → filter → extract barcode sets from existing
seeds → tag each item with dedupStatus → write output JSON + print
summary`. Uses existing `src/assets/supermarket-seed.json` +
       `src/assets/rami-levy-seed.json`.

6. [ ] **Task 6: Run + decision (S)** — run the full pipeline end-to-end,
       capture summary numbers, record in `lessons.md` with date. Decision:
   - `netNew ≥ 2,000` → proceed to Phase 2
   - `netNew < 500` → walk away, update TASKS.md with findings
   - In between → present the data, decide with user

## Open Questions

- Is a single store's file catalog-complete, or does Tiv Taam use per-store
  assortment? (Initial inspection says chain-wide; verify by diffing two
  store files as part of Task 4 — expect < 5% divergence.)
- Should `NON_FOOD_KEYWORDS` be language-agnostic (only Hebrew) or also
  include English terms? (Hebrew-only suffices; Tiv Taam names are
  Hebrew-first. Revisit if Phase 2 surfaces English-only mis-classifications.)
- Login credentials — any risk of Tiv Taam revoking public access?
  (Low — this feed is legally mandated under the Israeli Price Transparency
  Law. Credential rotation happens for fraud/abuse, not for breaking
  integrations. If credentials rotate, new ones are public and easy to find.)

## Phase 2 — Reference Only (Not In Scope Here)

After Phase 1 answers "is the net-new slice big enough?", Phase 2 would:

1. For each `net-new` Tiv Taam item with an EAN, call OFF
   (`fetchOffProduct(ean)` already exists in
   `src/services/open-food-facts.ts` from PR #76)
2. Normalize OFF hits into `FoodSeed` with `id: tt_<barcode>`
3. Extend `foods` schema with `origin_country TEXT` column (v19 migration)
4. Write `tt_` rows to `src/assets/tivtaam-seed.json`
5. Bump `SCHEMA_VERSION` to 19, add `migrateToV19` following the v14/v15
   pattern
6. Items with no OFF hit are dropped (no hand curation in Phase 2 v1)

Phase 2 gets its own spec + PR after Phase 1 data lands.

---

## Implementation Plan

Tasks run sequentially. Task 1 is the foundation for all others. Tasks 2 and 3
are independently testable pure functions that depend only on Task 1's types.
Task 4 is the only network-bound task (manual verification). Task 5 glues
everything into a runnable pipeline. Task 6 runs it and records the decision.

**Dependency order:** 1 → { 2, 3 } → 4 → 5 → 6

**Structure decision — files stay flat in `scripts/` for Phase 1.** Match the
existing Shufersal/Rami Levy layout. When the 2nd transparency-feed chain is
added (Yohananof), refactor reusable pieces (`parse-transparency-feed`,
`filter-food-items`, `transparency-feed-types`, `publishedprices-auth`) into
a `scripts/transparency/` subdirectory at that time. Avoids premature
abstraction.

**XML parser choice: `fast-xml-parser`.** Rationale: feed is ~10MB
decompressed — fits in memory easily. `fast-xml-parser` returns a clean JS
object (`xml2js`-style) which is trivially testable and typed. Alternative
`sax` (streaming) would save ~20MB of transient heap but adds event-handler
complexity for no real benefit at this size. `cheerio` (already installed)
could parse XML but DOM-style traversal is clunkier than object-style for a
one-shot `Items → TransparencyItem[]` transform.

---

### Task 1: Types + constants (S)

**Files:**

- `scripts/transparency-feed-types.ts` (create)

**What:**
Shared types + constants consumed by every other task. No logic, no tests.

```ts
// scripts/transparency-feed-types.ts

/**
 * Normalized item from an Israeli Price Transparency Law XML feed.
 * Feed format is identical across all participating chains
 * (Tiv Taam, Yohananof, Victory, Am-Pm, Osher Ad, etc.).
 *
 * Source: https://url.publishedprices.co.il — chain-specific login
 * (username = chain slug, empty password).
 */
export interface TransparencyItem {
  itemCode: string
  nameHe: string
  manufactureName: string
  manufactureCountry: string
  unitOfMeasure: string
  quantity: number
  isWeighted: boolean
  itemType: number
}

export type DedupStatus = 'net-new' | 'in-shufersal' | 'in-rami-levy' | 'no-ean'

export interface CatalogItem extends TransparencyItem {
  dedupStatus: DedupStatus
}

export interface FeedFileEntry {
  fname: string
  size: number
  time: string // ISO-8601 UTC
}

/**
 * Hebrew keyword blacklist for non-food items in transparency feeds.
 * Substring match, case-insensitive. Add new entries when a manual spot-check
 * of the summary output surfaces non-food items leaking through.
 */
export const NON_FOOD_KEYWORDS: readonly string[] = [
  'ניילון', // plastic wrap
  'מגבות', // towels
  'אקונומיקה', // bleach
  'שמפו', // shampoo
  'מרכך כביסה', // fabric softener
  'סבון כביסה', // laundry soap
  'אבקת כביסה', // laundry powder
  'נייר טואלט', // toilet paper
  'נייר מגבת', // paper towels
  'טישו', // tissues
  'חיתולים', // diapers
  'תחבושות', // pads
  'סיגריות', // cigarettes
  'מצית', // lighter
  'גפרורים', // matches
  'סוללות', // batteries
  'שקית זבל', // trash bag
  'ספוג', // sponge
  'נרות', // candles
] as const
```

**Test first:** None — pure type + constant file. Validated by `tsc --noEmit`
in subsequent tasks' imports.

**Acceptance:**

- File compiles with `tsc --noEmit`
- `NON_FOOD_KEYWORDS` is a `readonly string[]` (no accidental mutation from
  consumers)
- Comment block documents the feed source and login pattern

---

### Task 2: XML parser + tests (M, TDD)

**Files:**

- `scripts/parse-transparency-feed.ts` (create)
- `scripts/parse-transparency-feed.test.ts` (create)
- `package.json` (modify: add `fast-xml-parser` dev dep)
- `package-lock.json` (auto-updated by `npm install`)

**What:**
Pure function that turns a gzipped XML buffer into `TransparencyItem[]`.
Runs fully in memory (Node's `zlib.gunzipSync` + `fast-xml-parser`).

```ts
// scripts/parse-transparency-feed.ts

import * as zlib from 'zlib'
import { XMLParser } from 'fast-xml-parser'
import type { TransparencyItem } from './transparency-feed-types'

/**
 * Parses a gzipped transparency-feed XML buffer into normalized items.
 * Tolerates missing optional fields (ManufactureCountry, UnitOfMeasure)
 * but skips any `<Item>` missing `ItemCode` or `ItemName`.
 *
 * Number coercion: Quantity / bIsWeighted / ItemType are parsed from
 * string, silently defaulting on parse failure.
 */
export function parseTransparencyFeed(gz: Buffer): TransparencyItem[]
```

**Test first** (RED phase — write these before the implementation):

```ts
// scripts/parse-transparency-feed.test.ts
import * as zlib from 'zlib'
import { parseTransparencyFeed } from './parse-transparency-feed'

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Root>
  <ChainID>7290873255550</ChainID>
  <Items>
    <Item>
      <ItemCode>7290004131074</ItemCode>
      <ItemType>1</ItemType>
      <ItemName>חלב תנובה 3% 1 ליטר</ItemName>
      <ManufactureName>תנובה</ManufactureName>
      <ManufactureCountry>ישראל</ManufactureCountry>
      <UnitOfMeasure>ליטר</UnitOfMeasure>
      <Quantity>1.00</Quantity>
      <bIsWeighted>0</bIsWeighted>
    </Item>
    <Item>
      <ItemCode>1101346</ItemCode>
      <ItemType>0</ItemType>
      <ItemName>בוזנינה לבנה להב</ItemName>
      <ManufactureName>לא ידוע</ManufactureName>
      <ManufactureCountry></ManufactureCountry>
      <UnitOfMeasure>יחידות</UnitOfMeasure>
      <Quantity>1.00</Quantity>
      <bIsWeighted>1</bIsWeighted>
    </Item>
    <Item>
      <!-- missing ItemCode — should be skipped -->
      <ItemName>invalid item</ItemName>
    </Item>
  </Items>
</Root>`

function makeGz(xml: string): Buffer {
  return zlib.gzipSync(Buffer.from(xml, 'utf8'))
}

describe('parseTransparencyFeed', () => {
  it('returns empty array for empty <Items> block', () => {
    const xml = '<Root><Items></Items></Root>'
    expect(parseTransparencyFeed(makeGz(xml))).toEqual([])
  })

  it('parses a packaged item correctly', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items[0]).toEqual({
      itemCode: '7290004131074',
      nameHe: 'חלב תנובה 3% 1 ליטר',
      manufactureName: 'תנובה',
      manufactureCountry: 'ישראל',
      unitOfMeasure: 'ליטר',
      quantity: 1,
      isWeighted: false,
      itemType: 1,
    })
  })

  it('parses a weighted deli item correctly', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items[1]).toMatchObject({
      itemCode: '1101346',
      isWeighted: true,
      itemType: 0,
      manufactureCountry: '', // missing tag → empty string
    })
  })

  it('skips items missing ItemCode or ItemName', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items).toHaveLength(2) // third <Item> dropped
  })

  it('preserves Hebrew unicode correctly (no mojibake)', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items[0].nameHe).toContain('תנובה')
  })

  it('coerces numeric fields (Quantity, bIsWeighted, ItemType)', () => {
    const xml = `<Root><Items><Item>
      <ItemCode>123</ItemCode>
      <ItemName>x</ItemName>
      <Quantity>2.50</Quantity>
      <bIsWeighted>0</bIsWeighted>
      <ItemType>1</ItemType>
    </Item></Items></Root>`
    const [item] = parseTransparencyFeed(makeGz(xml))
    expect(item.quantity).toBe(2.5)
    expect(item.isWeighted).toBe(false)
    expect(item.itemType).toBe(1)
  })

  it('defaults quantity to 0 when <Quantity> is absent', () => {
    const xml = `<Root><Items><Item>
      <ItemCode>123</ItemCode>
      <ItemName>x</ItemName>
    </Item></Items></Root>`
    const [item] = parseTransparencyFeed(makeGz(xml))
    expect(item.quantity).toBe(0)
  })

  it('handles a single-item feed (fast-xml-parser singleton vs array)', () => {
    // Guard: fast-xml-parser returns a single object (not array) when only
    // one <Item> is present unless `alwaysCreateTextNode` / `isArray` is
    // configured. Verifies we normalize to array.
    const xml = `<Root><Items><Item>
      <ItemCode>1</ItemCode><ItemName>solo</ItemName>
    </Item></Items></Root>`
    const items = parseTransparencyFeed(makeGz(xml))
    expect(Array.isArray(items)).toBe(true)
    expect(items).toHaveLength(1)
  })

  it('tolerates corrupt gzip input with clear error', () => {
    const bad = Buffer.from('not gzipped')
    expect(() => parseTransparencyFeed(bad)).toThrow(/gzip|decompression/i)
  })
})
```

**GREEN phase:** implement `parseTransparencyFeed`. Key `fast-xml-parser`
config — `isArray: (name) => name === 'Item'` forces array normalization for
single-item feeds. `parseTagValue: false` keeps everything as strings so we
control coercion.

**Install step before writing the impl:** `npm install --save-dev fast-xml-parser`
(see lesson 2026-04-11: update lock file same-commit or CI fails).

**Acceptance:**

- All 8 tests pass
- `npm run lint && npm run typecheck` clean
- Hebrew strings preserved byte-exact through `zlib.gunzipSync` + parser
  round-trip

---

### Task 3: Food filter + tests (S, TDD)

**Files:**

- `scripts/filter-food-items.ts` (create)
- `scripts/filter-food-items.test.ts` (create)

**What:**
Pure function that drops non-food items based on `NON_FOOD_KEYWORDS`
substring match against `nameHe`. Does **not** filter by `itemType` —
weighted deli items (type 0) include genuine food like meat/cheese counter
goods and must pass.

```ts
// scripts/filter-food-items.ts

import type { TransparencyItem } from './transparency-feed-types'
import { NON_FOOD_KEYWORDS } from './transparency-feed-types'

/**
 * Drops obvious non-food items by Hebrew keyword substring match on nameHe.
 * Case-insensitive. Soft-keep policy — accepts noise (dedup + Phase 2 OFF
 * lookup naturally filter further).
 */
export function filterFoodItems(items: TransparencyItem[]): TransparencyItem[]

/** Exported for testing — exact predicate used by the filter. */
export function isNonFood(nameHe: string): boolean
```

**Test first:**

```ts
// scripts/filter-food-items.test.ts
import { filterFoodItems, isNonFood } from './filter-food-items'
import type { TransparencyItem } from './transparency-feed-types'

const makeItem = (overrides: Partial<TransparencyItem> = {}): TransparencyItem => ({
  itemCode: '7290000000000',
  nameHe: 'חלב',
  manufactureName: 'תנובה',
  manufactureCountry: 'ישראל',
  unitOfMeasure: 'ליטר',
  quantity: 1,
  isWeighted: false,
  itemType: 1,
  ...overrides,
})

describe('isNonFood', () => {
  it('returns false for a generic food name', () => {
    expect(isNonFood('חלב תנובה 3%')).toBe(false)
  })

  it('returns true for plastic wrap', () => {
    expect(isNonFood('ניילון נצמד דיימונד 30 מטר')).toBe(true)
  })

  it('returns true for bleach', () => {
    expect(isNonFood('אקונומיקה סנו 4 ליטר')).toBe(true)
  })

  it('returns true when keyword is at start / middle / end of name', () => {
    expect(isNonFood('סיגריות מרלבורו')).toBe(true) // start
    expect(isNonFood('גליל נייר טואלט חברתי')).toBe(true) // middle
    expect(isNonFood('מבצע על שמפו')).toBe(true) // end
  })

  it('is case-insensitive (trivially — Hebrew has no case, but guard regression)', () => {
    expect(isNonFood('NYLON WRAP')).toBe(false) // English not in list — passes through
  })

  it('does not false-positive on food names containing substring fragments', () => {
    // `ניילון` must not match `ניל`-prefix foods (none exist in practice,
    // but assert we use whole-keyword substring, not prefix-only)
    expect(isNonFood('ניב גורמה')).toBe(false) // no keyword match
  })
})

describe('filterFoodItems', () => {
  it('drops non-food items, keeps food items', () => {
    const input = [
      makeItem({ nameHe: 'חלב תנובה' }),
      makeItem({ nameHe: 'ניילון נצמד' }),
      makeItem({ nameHe: 'יוגורט דנונה' }),
    ]
    const out = filterFoodItems(input)
    expect(out.map((i) => i.nameHe)).toEqual(['חלב תנובה', 'יוגורט דנונה'])
  })

  it('returns empty array for empty input', () => {
    expect(filterFoodItems([])).toEqual([])
  })

  it('keeps weighted deli items (itemType 0) when name is food', () => {
    const deli = makeItem({ nameHe: 'פסטרמה קוסטיצה להב', itemType: 0, isWeighted: true })
    expect(filterFoodItems([deli])).toHaveLength(1)
  })

  it('preserves all other fields unchanged', () => {
    const input = [makeItem({ nameHe: 'חלב' })]
    const [out] = filterFoodItems(input)
    expect(out).toEqual(input[0])
  })
})
```

**GREEN phase:** `isNonFood(name) = NON_FOOD_KEYWORDS.some(k => name.includes(k))`.
`filterFoodItems(items) = items.filter(i => !isNonFood(i.nameHe))`.

**Acceptance:**

- All 10 tests pass
- No test imports anything from Task 4 or 5 (filter is pure, fully
  independent)

---

### Task 4: Auth + download (M, manual-verify)

**Files:**

- `scripts/download-tivtaam-feed.ts` (create)
- `package.json` (modify: add `download-tivtaam-feed` script)

**What:**
The only network-bound task. Logs in to `url.publishedprices.co.il` as
`TivTaam` (empty password), lists files, picks the newest `PriceFull*.gz`,
downloads it to `tmp/tivtaam-raw.xml.gz`. Pure Node HTTP (no Playwright —
simple form-encoded auth + cookie jar).

```ts
// scripts/download-tivtaam-feed.ts

/**
 * Usage:
 *   npm run download-tivtaam-feed             — skip if cache exists
 *   npm run download-tivtaam-feed -- --force  — re-download even if cached
 *   npm run download-tivtaam-feed -- --dry-run — list files, pick newest, print; don't download
 */

const BASE_URL = 'https://url.publishedprices.co.il'
const USERNAME = 'TivTaam'
const PASSWORD = ''
const CHAIN_ID = '7290873255550'
const CACHE_PATH = path.join(process.cwd(), 'tmp', 'tivtaam-raw.xml.gz')
const HTTP_TIMEOUT_MS = 10_000

async function main() {
  // 1. GET /login → extract csrftoken meta
  // 2. POST /login/user with csrftoken + creds → session cookie
  // 3. GET /file → extract csrftoken (fresh per-page)
  // 4. POST /file/json/dir → list files
  // 5. Filter `PriceFull${CHAIN_ID}-*.gz`, sort by `time` desc, pick [0]
  // 6. If cache exists and !FORCE, skip. Log and exit 0.
  // 7. GET /file/d/<fname> → stream to CACHE_PATH
  // 8. Log filename + size
}
```

**Manual-verification protocol** (no unit tests — `fetch` not mocked per
codebase convention, see lesson 2026-04-18):

1. `rm -f tmp/tivtaam-raw.xml.gz` (clean slate)
2. `npm run download-tivtaam-feed -- --dry-run` — verify: auth succeeds, file
   list non-empty, newest `PriceFull` picked, prints filename + `time` + size.
   Must complete in < 10s.
3. `npm run download-tivtaam-feed` — verify: `tmp/tivtaam-raw.xml.gz` created,
   file size matches logged value (± a few bytes for compressed variability).
4. Re-run `npm run download-tivtaam-feed` without `--force` — verify: logs
   "using cached file", no HTTP requests made.
5. Re-run with `--force` — verify: re-downloads.

**Staleness guard:** if picked file's `time` is > 7 days old, log a warning
`[WARN] feed file is N days old — Tiv Taam may have stopped publishing`.
Exit code still 0.

**Edge cases handled:**

- Cookie jar preserved across all 4 HTTP calls (use `node-fetch` with
  cookie-parsing helpers, or a minimal custom cookie parser since it's just
  `connect.sid`-style session + csrftoken)
- Both CSRF tokens fetched fresh (login page + file-manager page — they
  differ)
- DataTables POST needs form-encoded `csrftoken` body param in addition to
  cookie
- HTTP timeout 10s per call, no retry (single-shot; failures are dev
  problem, not prod hot path)

**Acceptance:**

- `--dry-run` finishes in < 10s, prints a summary like:

  ```
  [Tiv Taam download] login OK
  [Tiv Taam download] 52 files listed
  [Tiv Taam download] newest: PriceFull7290873255550-000-002-20260421-004004.gz (1.02 MB, 2026-04-20T21:48:18Z)
  [Tiv Taam download] (dry run — not downloading)
  ```

- Full run produces `tmp/tivtaam-raw.xml.gz` of 500KB–2MB

- Re-run without `--force` prints "using cached file" and exits in < 1s

- `npm run lint && npm run typecheck` clean

---

### Task 5: Orchestrator + gap report (S)

**Files:**

- `scripts/build-tivtaam-catalog.ts` (create)
- `package.json` (modify: add `build-tivtaam-catalog` script)

**What:**
Glue script. No new logic — composes Tasks 2, 3, 4 with barcode-set dedup
against existing seeds. Produces `tmp/tivtaam-catalog.json` + printed
summary.

```ts
// scripts/build-tivtaam-catalog.ts

/**
 * Full pipeline:
 *   1. Ensure tmp/tivtaam-raw.xml.gz exists (call download-tivtaam-feed if not)
 *   2. parseTransparencyFeed → TransparencyItem[]
 *   3. filterFoodItems → food-only TransparencyItem[]
 *   4. Extract barcode sets from src/assets/{supermarket,rami-levy}-seed.json
 *   5. Tag each item with dedupStatus
 *   6. Write tmp/tivtaam-catalog.json
 *   7. Print summary with net-new + net-new-imported counts
 */

async function main() { … }
```

**Barcode-set extraction** (follow existing pattern in
`scripts/build-rami-levy-seed.ts`):

```ts
function extractBarcodes(seed: { foods: Array<{ id: string }> }, prefix: string): Set<string> {
  return new Set(
    seed.foods
      .map((f) => f.id)
      .filter((id) => id.startsWith(prefix))
      .map((id) => id.slice(prefix.length)),
  )
}

const shufersalBarcodes = extractBarcodes(require('../src/assets/supermarket-seed.json'), 'sh_')
const ramiLevyBarcodes = extractBarcodes(require('../src/assets/rami-levy-seed.json'), 'rl_')
```

**EAN validation** — valid EAN is 8–14 digits, all numeric:

```ts
function isValidEan(code: string): boolean {
  return /^\d{8,14}$/.test(code)
}
```

Items failing validation get `dedupStatus: 'no-ean'`.

**Imported-slice detection** — any item where `manufactureCountry` is
non-empty AND not in `{'ישראל', 'לא ידוע', ''}`:

```ts
function isImported(country: string): boolean {
  const trimmed = country.trim()
  return trimmed !== '' && trimmed !== 'ישראל' && trimmed !== 'לא ידוע'
}
```

**Summary print format:**

```
[Tiv Taam catalog gap]
──────────────────────
Feed file            : PriceFull7290873255550-000-002-20260421-004004.gz
Feed age             : 0 days
Total items parsed   : 4,287
Non-food filtered    : 423
Weighted / no-EAN    : 312
In Shufersal         : 1,892
In Rami Levy         : 987
Net-new              : 673   ← Phase 2 size signal
  of which imported  : 412
Output               : tmp/tivtaam-catalog.json
```

**Test first:** None — pure glue. The logic pieces are already tested via
Tasks 2 + 3. Manual acceptance via the summary output.

**Acceptance:**

- `npm run build-tivtaam-catalog` finishes in < 30s end-to-end
- `tmp/tivtaam-catalog.json` validates against the "Output Schema" shape in
  the spec
- Summary math: `totalItems === nonFoodFiltered + weightedNoEan + inShufersal
  - inRamiLevy + netNew`
- `netNew` is printed prominently
- Every `items[].itemCode` is non-empty; every `items[].nameHe` is non-empty

---

### Task 6: Run + record decision (S)

**Files:**

- `lessons.md` (modify: append findings)
- `TASKS.md` (modify: move the Tiv Taam line from "Next Up" to "Done" or
  replace with Phase 2 line, depending on outcome)

**What:**
Execute the full pipeline with real data, read the summary, record the
outcome.

**Decision matrix** (documented in the spec's "Why" section, repeated here
for clarity):

| `netNew` count | Action                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| ≥ 2,000        | Proceed to Phase 2 — spec + OFF enrichment PR                                  |
| 500–1,999      | Present data to user. If `netNewImported` ≥ 300, proceed. Otherwise defer.     |
| < 500          | Walk away. Update TASKS.md with findings. Tiv Taam is not the moat we thought. |

**Acceptance:**

- Summary captured as a comment block in `lessons.md` (under a new
  `## Tiv Taam Phase 1 Findings (2026-04-21)` heading) with raw numbers
- `TASKS.md` updated to reflect the decision (either "Tiv Taam Phase 1
  shipped, Phase 2 next" or "Tiv Taam deferred, numbers too thin")
- Phase 2 spec kicked off only if the decision is "proceed"

---

## Size + time estimate

- **Task 1:** 20 min (types + constants)
- **Task 2:** 60 min (TDD — 8 tests + impl + `npm install`)
- **Task 3:** 30 min (TDD — 10 tests + impl)
- **Task 4:** 90 min (auth flow debug + manual verify loop)
- **Task 5:** 40 min (glue + summary formatting)
- **Task 6:** 15 min (run + write up)

**Total ≈ 4.5 hours of focused work** spread over one or two sessions.
Could all fit in a single session with breaks, but splitting at Task 3/4
boundary (pure functions done, ready to wire network) is a natural
checkpoint.
