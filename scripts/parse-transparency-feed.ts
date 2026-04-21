/**
 * Parses a gzipped Israeli Price Transparency Law XML feed into normalized
 * `TransparencyItem[]`. Pure function — no I/O, no globals.
 *
 * Feed XML shape (abridged):
 *   <Root>
 *     <Items>
 *       <Item>
 *         <ItemCode>…</ItemCode>       (required)
 *         <ItemName>…</ItemName>       (required)
 *         <ItemType>0|1</ItemType>     (0=weighted/bulk, 1=packaged)
 *         <ManufactureName>…</…>
 *         <ManufactureCountry>…</…>
 *         <UnitOfMeasure>…</…>
 *         <Quantity>…</Quantity>
 *         <bIsWeighted>0|1</…>
 *         … (other price fields not consumed)
 *       </Item>
 *       …
 *     </Items>
 *   </Root>
 *
 * Items missing `ItemCode` or `ItemName` are silently dropped (invalid
 * rows, cannot be dedup'd or logged). All other tags are tolerant-optional
 * (default to empty string / 0 on absence).
 *
 * Number coercion: `parseTagValue: false` on the parser keeps everything
 * as strings, we coerce manually with explicit defaults — avoids
 * fast-xml-parser's heuristic auto-conversion, which can silently turn
 * leading-zero itemCodes into numbers and lose digits.
 */

import * as zlib from 'zlib'
import { XMLParser } from 'fast-xml-parser'
import type { TransparencyItem } from './transparency-feed-types'

// ── Raw shape from fast-xml-parser (post-normalization) ──
//
// All tag names are lowercased via `transformTagName` in the parser config
// so we can read a single canonical shape. Individual Tiv Taam store POS
// systems serialize with inconsistent casing (`<Root>` vs `<root>`) and
// field-name variants (`<ManufactureName>` vs `<ManufacturerName>`) — the
// transform + alias fallback handles both.

interface RawItem {
  itemcode?: string | number
  itemname?: string
  itemtype?: string
  manufacturername?: string // both schemas
  manufacturename?: string // older schema alias
  manufacturecountry?: string
  unitofmeasure?: string
  quantity?: string
  bisweighted?: string
  // Price fields etc. exist but we don't consume them.
}

interface RawRoot {
  root?: {
    items?: {
      item?: RawItem[] // forced-array via isArray config
    }
  }
}

// ── Helpers ──

/** Coerce a possibly-missing string to a finite number, defaulting to 0. */
function numberOr0(value: string | undefined): number {
  if (value === undefined || value === '') return 0
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

/** Coerce "0"/"1" (or anything truthy/falsy) to a boolean. */
function booleanOr0(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

/** Safe string extractor — returns '' for undefined/null/empty. */
function stringOr(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

/** Decompress gzip, re-throwing with a clearer message on failure. */
function gunzip(gz: Buffer): string {
  try {
    return zlib.gunzipSync(gz).toString('utf8')
  } catch (err) {
    throw new Error(
      `parseTransparencyFeed: gzip decompression failed — input is not valid gzipped data (${(err as Error).message})`,
    )
  }
}

// ── Main parser ──

export function parseTransparencyFeed(gz: Buffer): TransparencyItem[] {
  const xml = gunzip(gz)

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false, // keep everything as strings; we coerce manually
    trimValues: true,
    // Lowercase every tag name so we read a single canonical shape regardless
    // of which Tiv Taam POS serializer produced the file (<Root> vs <root>,
    // <ItemCode> vs <itemcode>).
    transformTagName: (name) => name.toLowerCase(),
    // Force array even for single <item>; also covers attribute-free tags.
    isArray: (name) => name === 'item',
  })

  const parsed = parser.parse(xml) as RawRoot
  const rawItems = parsed.root?.items?.item ?? []

  const out: TransparencyItem[] = []
  for (const raw of rawItems) {
    const itemCode = stringOr(raw.itemcode)
    const nameHe = stringOr(raw.itemname)

    // Skip rows missing either ID or display name — unusable downstream.
    if (itemCode === '' || nameHe === '') continue

    // Field-name alias: older schema uses `ManufactureName`, current schema
    // uses `ManufacturerName`. Prefer the current spelling, fall back.
    const manufactureName =
      stringOr(raw.manufacturername) !== ''
        ? stringOr(raw.manufacturername)
        : stringOr(raw.manufacturename)

    out.push({
      itemCode,
      nameHe,
      manufactureName,
      manufactureCountry: stringOr(raw.manufacturecountry),
      unitOfMeasure: stringOr(raw.unitofmeasure),
      quantity: numberOr0(raw.quantity),
      isWeighted: booleanOr0(raw.bisweighted),
      itemType: numberOr0(raw.itemtype),
    })
  }

  return out
}
