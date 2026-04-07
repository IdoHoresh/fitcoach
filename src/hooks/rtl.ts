import { I18nManager } from 'react-native'

/** Returns true if the system layout direction is RTL (e.g., Hebrew). */
export function isRTL(): boolean {
  return I18nManager.isRTL
}
