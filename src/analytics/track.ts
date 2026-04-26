import type { MealLoggingMode } from '@/types'

/**
 * Vendor-agnostic analytics events.
 *
 * Discriminated union — `type` field selects the variant. Adding a new event
 * means extending this union; call sites get compile-time prop checking.
 *
 * When a vendor is picked post-P0.4 pricing research, only `track()`'s
 * implementation changes. The union and call sites stay put.
 */
export type AnalyticsEvent =
  | {
      readonly type: 'mode_choice_picked'
      readonly mode: MealLoggingMode
      readonly time_to_pick_ms: number
      readonly changed_from_default: boolean
    }
  | {
      readonly type: 'mode_switched_in_settings'
      readonly from: MealLoggingMode
      readonly to: MealLoggingMode
      readonly days_since_onboarding: number
    }

/**
 * Fire-and-forget analytics dispatch.
 *
 * `__DEV__`: logs to console for local inspection.
 * Production: no-op until a vendor adapter lands.
 */
export function track(event: AnalyticsEvent): void {
  if (__DEV__) {
    console.log('[analytics]', event)
  }
}
