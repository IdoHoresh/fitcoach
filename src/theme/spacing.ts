/**
 * Spacing scale — consistent spacing throughout the app.
 * Based on a 4px base unit (standard in modern design systems).
 *
 * Usage: spacing.md → 16px (use for standard padding/margins)
 */

export const spacing = {
  /** 2px — hairline gaps */
  xxs: 2,
  /** 4px — tight spacing (between icon and text) */
  xs: 4,
  /** 8px — small gaps (between related elements) */
  sm: 8,
  /** 12px — medium-small */
  ms: 12,
  /** 16px — standard spacing (card padding, section gaps) */
  md: 16,
  /** 20px — medium-large */
  ml: 20,
  /** 24px — large spacing (between sections) */
  lg: 24,
  /** 32px — extra large (page margins, major sections) */
  xl: 32,
  /** 48px — hero spacing */
  xxl: 48,
} as const

/** Border radius values */
export const borderRadius = {
  /** 4px — subtle rounding */
  sm: 4,
  /** 8px — standard cards */
  md: 8,
  /** 12px — prominent cards */
  lg: 12,
  /** 16px — large elements */
  xl: 16,
  /** 9999px — fully round (pills, avatars) */
  full: 9999,
} as const
