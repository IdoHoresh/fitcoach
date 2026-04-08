/**
 * RTL detection — delegates to i18n (single source of truth).
 * Wrapped as a local function so tests can spy on it via jest.spyOn.
 */
import { isRTL as i18nIsRTL } from '../i18n'

export function isRTL(): boolean {
  return i18nIsRTL()
}
