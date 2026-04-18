/**
 * Normalizes a user-typed EAN/barcode string for use as a `manual_<ean>` id.
 *
 * Trims whitespace and strips every non-digit character. Returns the cleaned
 * digits — empty string if no digits remain. Pure, framework-free.
 *
 * Design: loose acceptance matches MyFitnessPal/Yazio/FatSecret conventions —
 * users sometimes type SKUs or copy printed-on-label EANs that include spaces,
 * dashes, or annotations. The cleaned result is just an identifier; an empty
 * string signals "no usable EAN, fall back to uuid" to the caller.
 */
export function normalizeEan(raw: string): string {
  return raw.trim().replace(/\D/g, '')
}
