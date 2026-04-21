/**
 * Open Food Facts integration.
 *
 * normalizeOffProduct — pure function, maps raw OFF JSON to FoodItem.
 * fetchOffProduct     — network call, returns null on 404 / no product.
 *
 * SECURITY: No user data sent to OFF. EAN barcode only (non-PII).
 */

import type { FoodItem } from '../types'

// ── Types ─────────────────────────────────────────────────────────────

export interface OffResult {
  food: FoodItem
  /** True when any of protein / fat / carbs was absent in the OFF response. */
  isPartial: boolean
}

export interface NormalizeOptions {
  /**
   * Prefix for the generated `FoodItem.id` — emits `${idPrefix}_${ean}`.
   * Defaults to `'manual'` for the runtime barcode-scan flow. Pass
   * `'tt'` from the Tiv Taam Phase 2 seed builder so tt_<ean> rows
   * land in `foods` under the Tiv Taam source tier.
   */
  idPrefix?: string
}

// ── Pure normalizer ───────────────────────────────────────────────────

/**
 * Maps a raw Open Food Facts API response to a FoodItem.
 *
 * Name priority: product_name_he → product_name_en → product_name → EAN.
 * Missing macros default to 0; isPartial is set to true so the UI can warn.
 */
export function normalizeOffProduct(
  raw: unknown,
  ean: string,
  options: NormalizeOptions = {},
): OffResult {
  const idPrefix = options.idPrefix ?? 'manual'
  const response = raw as Record<string, unknown>
  const product = (response.product ?? {}) as Record<string, unknown>
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>

  const nameHe =
    (product.product_name_he as string | undefined) ||
    (product.product_name_en as string | undefined) ||
    (product.product_name as string | undefined) ||
    ean

  const nameEn =
    (product.product_name_en as string | undefined) ||
    (product.product_name as string | undefined) ||
    ean

  const protein = nutriments['proteins_100g'] as number | undefined
  const fat = nutriments['fat_100g'] as number | undefined
  const carbs = nutriments['carbohydrates_100g'] as number | undefined

  const isPartial = protein == null || fat == null || carbs == null

  const food: FoodItem = {
    id: `${idPrefix}_${ean}`,
    nameHe,
    nameEn,
    category: 'snacks',
    caloriesPer100g: (nutriments['energy-kcal_100g'] as number | undefined) ?? 0,
    proteinPer100g: protein ?? 0,
    fatPer100g: fat ?? 0,
    carbsPer100g: carbs ?? 0,
    fiberPer100g: (nutriments['fiber_100g'] as number | undefined) ?? 0,
    isUserCreated: false,
    servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
  }

  return { food, isPartial }
}

// ── Network error taxonomy ────────────────────────────────────────────

/**
 * Thrown by retryOnNetworkError when all retry attempts fail.
 * Consumers branch on `instanceof OffNetworkError` to distinguish
 * transient network failures from genuine "product not found" (null) responses.
 */
export class OffNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'OffNetworkError'
    // Preserve prototype chain across TS transpilation targets so
    // `instanceof OffNetworkError` works reliably in tests + runtime.
    Object.setPrototypeOf(this, OffNetworkError.prototype)
  }
}

// ── Retry helper ──────────────────────────────────────────────────────

interface RetryOptions {
  retries: number
  delayMs: number
}

/**
 * Retries `fn` up to `retries` times when it THROWS, waiting `delayMs`
 * between attempts. A resolved null is NOT a failure — the helper only
 * retries on thrown errors, preserving the "null = product absent" semantics
 * used by fetchOffProduct. After all retries exhaust, throws OffNetworkError.
 */
export async function retryOnNetworkError<T>(
  fn: () => Promise<T>,
  { retries, delayMs }: RetryOptions,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  throw new OffNetworkError('Open Food Facts network request failed after retries', {
    cause: lastError,
  })
}

// ── Network fetcher ───────────────────────────────────────────────────

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_TIMEOUT_MS = 10_000
const OFF_RETRY_DELAY_MS = 2_000

/**
 * Fetches a product from Open Food Facts by EAN barcode.
 *
 * Returns null when the product is not found (status=404 or OFF status:0) —
 * "not found" is not a failure, so no retry is fired.
 *
 * On transient network errors (DNS hiccup, timeout, connection reset) the
 * helper retries once after 2s. If the retry also fails, throws OffNetworkError.
 * The timeout is enforced per attempt via AbortController so a hanging request
 * cannot stall the UI indefinitely.
 */
export async function fetchOffProduct(ean: string): Promise<OffResult | null> {
  return retryOnNetworkError(() => doFetchOffProduct(ean), {
    retries: 1,
    delayMs: OFF_RETRY_DELAY_MS,
  })
}

async function doFetchOffProduct(ean: string): Promise<OffResult | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OFF_TIMEOUT_MS)

  try {
    const response = await fetch(`${OFF_BASE}/${ean}.json`, { signal: controller.signal })

    if (response.status === 404) return null

    const json = (await response.json()) as Record<string, unknown>

    // OFF returns status=0 when barcode is unknown
    if (!json || json.status === 0) return null

    return normalizeOffProduct(json, ean)
  } finally {
    clearTimeout(timeoutId)
  }
}
