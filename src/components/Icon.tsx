import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'

/**
 * Icon wrapper mapping Material Symbols names (used in Stitch mocks)
 * to the closest @expo/vector-icons MaterialIcons glyphs.
 *
 * Maps hyphen-delimited names only — callers that already use valid
 * MaterialIcons names (e.g. "arrow-back") pass through unchanged.
 */

export type IconName =
  | 'fitness-center'
  | 'arrow-back'
  | 'arrow-forward'
  | 'menu'
  | 'check-circle'
  | 'radio-button-unchecked'
  | 'info-outline'
  | 'person'
  | 'restaurant'
  | 'home'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  testID?: string
  filled?: boolean
}

export function Icon({ name, size = 24, color, testID, filled = false }: IconProps) {
  // For the filled check-circle variant in selection cards, MaterialIcons
  // already provides a filled glyph by default. `filled={false}` maps to
  // the outline variant where one exists.
  const glyph = filled && name === 'radio-button-unchecked' ? 'radio-button-checked' : name
  return <MaterialIcons name={glyph} size={size} color={color} testID={testID} />
}
