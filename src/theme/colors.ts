/**
 * Color palette — single source of truth for all colors in the app.
 * Named semantically (what they DO, not what they LOOK LIKE).
 */

export const colors = {
  // ── Brand ──
  primary: '#4F46E5', // Indigo — main CTA, active states
  primaryLight: '#818CF8', // Lighter indigo — backgrounds, hover
  primaryDark: '#3730A3', // Darker indigo — pressed states
  primaryTint: '#4F46E526', // Indigo at 15% opacity — selected backgrounds

  // ── Semantic ──
  success: '#10B981', // Green — completed, on target
  warning: '#F59E0B', // Amber — approaching limit, attention
  error: '#EF4444', // Red — over limit, errors
  info: '#3B82F6', // Blue — informational

  // ── Neutral ──
  background: '#0F172A', // Dark navy — main background
  surface: '#1E293B', // Slightly lighter — cards, panels
  surfaceElevated: '#334155', // Elevated surfaces — modals, dropdowns
  border: '#475569', // Subtle borders

  // ── Text ──
  textPrimary: '#F8FAFC', // White — headings, important text
  textSecondary: '#94A3B8', // Gray — labels, descriptions
  textMuted: '#64748B', // Dimmer gray — timestamps, hints
  textInverse: '#0F172A', // Dark text on light backgrounds

  // ── Macros (nutrition) ──
  protein: '#EF4444', // Red — protein
  carbs: '#3B82F6', // Blue — carbohydrates
  fat: '#F59E0B', // Amber — fats

  // ── Workout ──
  restTimer: '#6366F1', // Indigo — rest timer ring
  setComplete: '#10B981', // Green — completed set
  setActive: '#F59E0B', // Amber — current set
} as const

export type ColorKey = keyof typeof colors
