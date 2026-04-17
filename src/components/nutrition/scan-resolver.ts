/**
 * Pure orchestration helper for barcode scan resolution.
 *
 * Extracted from BarcodeScannerSheet.handleBarcodeScanned so the branching
 * logic (local hit → OFF fallback → not-found vs network-error) is unit-testable
 * without mocking CameraView, camera permissions, or the SQLite repository.
 *
 * Consumers pass dependencies in; the helper returns a discriminated union
 * describing the resolution. The sheet renders state based on the `kind` field.
 */

import type { FoodItem } from '@/types'
import type { OffResult } from '@/services/open-food-facts'

// ── Types ─────────────────────────────────────────────────────────────

export type ScanResolution =
  | { kind: 'local_hit'; food: FoodItem }
  | { kind: 'off_hit'; food: FoodItem; isPartial: boolean }
  | { kind: 'not_found' }
  | { kind: 'network_error' }

export interface ScanResolverDeps {
  getByBarcode: (ean: string) => Promise<FoodItem | null>
  fetchOffProduct: (ean: string) => Promise<OffResult | null>
  insertFood: (food: FoodItem) => Promise<void>
}

// ── Resolver ──────────────────────────────────────────────────────────

export async function resolveScan(ean: string, deps: ScanResolverDeps): Promise<ScanResolution> {
  // 1. Local DB lookup first (instant, offline, covers all four tiers)
  const local = await deps.getByBarcode(ean)
  if (local) return { kind: 'local_hit', food: local }

  // 2. Open Food Facts fallback
  try {
    const result = await deps.fetchOffProduct(ean)
    if (result) {
      await deps.insertFood(result.food)
      return { kind: 'off_hit', food: result.food, isPartial: result.isPartial }
    }
    // OFF returned null — product is absent from OFF (not a transient error).
    return { kind: 'not_found' }
  } catch {
    // OffNetworkError = retries exhausted; any other error = unexpected.
    // Both surface to the user the same way (preserves pre-existing fallback UX).
    return { kind: 'network_error' }
  }
}
