import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from './colors'

/**
 * Unified visual language for selected card/pill/chip states across the app.
 * Spread `base` on the container and conditionally merge `selected` or `unselected`.
 * Apply `labelSelected` to the label text when active.
 */
export const selectedCardStyle = {
  base: {
    borderWidth: 1,
  } satisfies ViewStyle,
  selected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  } satisfies ViewStyle,
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  } satisfies ViewStyle,
  labelSelected: {
    color: colors.primary,
  } satisfies TextStyle,
}
