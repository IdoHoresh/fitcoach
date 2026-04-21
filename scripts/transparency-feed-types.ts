/**
 * Shared types + constants for Israeli Price Transparency Law XML feeds.
 *
 * Feed source: https://url.publishedprices.co.il — chain-specific login
 * (username = chain slug, empty password). Same XML schema is used by all
 * participating chains (Tiv Taam, Yohananof, Victory, Am-Pm, Osher Ad,
 * Hatzi Hinam, King Store, …), so the parser + filter + types in this file
 * are intentionally chain-agnostic. Only the auth flow + chain ID are
 * chain-specific and live in `download-<chain>-feed.ts`.
 *
 * See docs/specs/2026-04-21-tiv-taam-phase1-catalog-gap.md for the full
 * pipeline.
 */

/**
 * Normalized item from a transparency-feed XML `<Item>` element.
 *
 * - `itemCode` — EAN (8–14 digits) for packaged goods, or an internal
 *   non-EAN code (typically 7 digits starting with `11…`, `12…`) for
 *   in-house weighted items (deli counter, butcher, produce).
 * - `isWeighted` — true for bulk/counter items with no fixed package.
 *   These typically have no EAN and cannot dedupe by barcode.
 * - `itemType` — raw value from `<ItemType>`: 0 for weighted/bulk,
 *   1 for packaged. Kept for diagnostics; downstream dedup uses
 *   `isWeighted` + EAN shape, not `itemType`.
 * - `manufactureCountry` — origin country. Empty string when tag is
 *   missing or empty. Non-empty values other than `ישראל` / `לא ידוע`
 *   indicate imported goods — the Tiv Taam moat signal.
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

/**
 * One row returned by `POST /file/json/dir` on url.publishedprices.co.il.
 * Only the fields we consume are typed.
 */
export interface FeedFileEntry {
  fname: string
  size: number
  time: string // ISO-8601 UTC, e.g. '2026-04-20T21:48:18Z'
}

/**
 * Hebrew keyword blacklist for non-food items in transparency feeds.
 * Substring match against `nameHe`, case-insensitive (trivial for Hebrew
 * but consistent with future bilingual additions).
 *
 * Policy: soft-keep. Accept noise, rely on barcode dedup + Phase 2 OFF
 * lookup to filter further. Add new entries when manual spot-check of the
 * summary output surfaces non-food items leaking through.
 */
export const NON_FOOD_KEYWORDS: readonly string[] = [
  'ניילון', // plastic wrap / cling film
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
