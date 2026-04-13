/**
 * Canonical food-name normalization for deduplication.
 *
 * Single source of truth shared between seed builders (scripts/) and the
 * runtime v17 migration. Divergence here causes dedup drift — keep this module
 * pure and framework-free so both Node scripts and React Native can import it.
 */

export const PLURAL_MAP: Readonly<Record<string, string>> = {
  פרוסות: 'פרוסה',
  מגורדות: 'מגורדת',
  טחונות: 'טחונה',
  קצוצות: 'קצוצה',
  פרוסים: 'פרוס',
  חתוכים: 'חתוך',
  טריים: 'טרי',
}

export const ORPHAN_TRAILING_MODIFIERS: ReadonlySet<string> = new Set(['שומן', 'ביתית', 'מצונן'])

const NIKUD_RE = /[\u0591-\u05C7]/g
const SIZE_TOKEN_RE = /\d+(?:\.\d+)?\s*(?:גרם|גר|ג'|ק"ג|קג|מ"ל|מל|ליטר|ל')/g
const PUNCT_RE = /[()[\]"'״`,.\-/]/g
const WHITESPACE_RE = /\s+/g

export function normalizeNameForDedup(name: string): string {
  if (!name) return ''

  let s = name.trim().toLowerCase()
  if (!s) return ''

  s = s.replace(NIKUD_RE, '')
  s = s.replace(SIZE_TOKEN_RE, ' ')
  s = s.replace(PUNCT_RE, ' ')
  s = s.replace(WHITESPACE_RE, ' ').trim()
  if (!s) return ''

  const tokens = s.split(' ').map((t) => PLURAL_MAP[t] ?? t)

  // Keep at least one token — never normalize a name down to empty.
  while (tokens.length > 1 && ORPHAN_TRAILING_MODIFIERS.has(tokens[tokens.length - 1]!)) {
    tokens.pop()
  }

  return tokens.join(' ')
}
