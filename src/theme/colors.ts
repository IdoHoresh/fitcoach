/**
 * Color palette — "Clinical Calm" design system.
 * Teal primary (health + trust), cool dark backgrounds, off-white text.
 * Based on Stitch design system for Gibor Fitness Science.
 *
 * Named semantically (what they DO, not what they LOOK LIKE).
 */

export const colors = {
  // ── Brand ──
  primary: '#2DD4BF', // Teal — main CTA, active states
  primaryLight: '#57F1DB', // Lighter teal — hover, highlights
  primaryDark: '#14B8A6', // Deeper teal — pressed states
  primaryTint: '#2DD4BF15', // Teal at ~8% opacity — selected card backgrounds
  primarySoft: 'rgba(45, 212, 191, 0.10)', // Teal at 10% — indicator halos, icon chips
  primaryMuted: 'rgba(45, 212, 191, 0.40)', // Teal at 40% — accent strips on callouts
  onPrimary: '#003731', // Darkest teal — text/icons on primary surfaces (WCAG AAA on #2DD4BF)

  // ── Semantic ──
  success: '#34D399', // Emerald — completed, on target
  warning: '#FBBF24', // Warm amber — approaching limit, attention
  error: '#FB7185', // Rose — over limit, errors (soft, not alarming)
  info: '#818CF8', // Soft indigo — informational

  // ── Neutral (tonal layering, no hard borders) ──
  background: '#10141A', // Deep dark with blue undertone — canvas
  surfaceContainerLow: '#181C22', // Subtle lift from canvas — selection cards, callouts
  surface: '#1C2026', // Slightly lighter — cards, panels
  surfaceElevated: '#262A31', // Elevated surfaces — modals, dropdowns
  surfaceBright: '#353940', // Interaction layer — hover/active overlays
  border: '#3C4A46', // Subtle teal-tinted border (outline_variant)

  // ── Text (off-white to prevent halation on dark backgrounds) ──
  textPrimary: '#E5E7EB', // Off-white — headings, important text
  textSecondary: '#9CA3AF', // Silver gray — labels, descriptions
  textMuted: '#6B7280', // Slate — timestamps, hints
  textInverse: '#10141A', // Dark text on light backgrounds

  // ── Macros (nutrition) ──
  protein: '#FB7185', // Rose — protein
  carbs: '#818CF8', // Indigo — carbohydrates
  fat: '#FBBF24', // Amber — fats

  // ── Workout ──
  restTimer: '#2DD4BF', // Teal — rest timer ring
  setComplete: '#34D399', // Emerald — completed set
  setActive: '#FBBF24', // Amber — current set
} as const

export type ColorKey = keyof typeof colors
