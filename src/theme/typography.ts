/**
 * Typography scale — consistent text sizing throughout the app.
 * All sizes are in logical pixels (React Native handles density).
 */

export const fontSize = {
  /** 11px — fine print, captions */
  xs: 11,
  /** 13px — secondary labels */
  sm: 13,
  /** 15px — body text (default) */
  md: 15,
  /** 17px — emphasized text, subheadings */
  lg: 17,
  /** 20px — section headings */
  xl: 20,
  /** 24px — page titles */
  xxl: 24,
  /** 32px — hero numbers (e.g., calorie count) */
  hero: 32,
} as const

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const
