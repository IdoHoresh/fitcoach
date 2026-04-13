import { normalizeNameForDedup, PLURAL_MAP, ORPHAN_TRAILING_MODIFIERS } from './normalizeFoodName'

describe('normalizeNameForDedup', () => {
  describe('baseline', () => {
    it('returns empty string for empty input', () => {
      expect(normalizeNameForDedup('')).toBe('')
    })

    it('returns empty string for whitespace-only input', () => {
      expect(normalizeNameForDedup('   ')).toBe('')
    })

    it('is idempotent — normalizing twice yields same result', () => {
      const input = 'גבינת גאודה פרוסות 28% שומן'
      expect(normalizeNameForDedup(normalizeNameForDedup(input))).toBe(normalizeNameForDedup(input))
    })

    it('preserves a clean Hebrew name unchanged', () => {
      expect(normalizeNameForDedup('אורז לבן יבש')).toBe('אורז לבן יבש')
    })
  })

  describe('whitespace', () => {
    it('trims leading and trailing whitespace', () => {
      expect(normalizeNameForDedup('  חלב מלא  ')).toBe('חלב מלא')
    })

    it('collapses internal double whitespace', () => {
      expect(normalizeNameForDedup('חלב   מלא')).toBe('חלב מלא')
    })
  })

  describe('nikud', () => {
    it('strips nikud (Hebrew vowel marks)', () => {
      expect(normalizeNameForDedup('חָלָב')).toBe('חלב')
    })

    it('handles mixed nikud + plain', () => {
      expect(normalizeNameForDedup('חָלָב מלא')).toBe('חלב מלא')
    })
  })

  describe('size tokens', () => {
    it('strips "400 גר"', () => {
      expect(normalizeNameForDedup('גבינה 400 גר')).toBe('גבינה')
    })

    it('strips "400 ג\'"', () => {
      expect(normalizeNameForDedup("גבינה 400 ג'")).toBe('גבינה')
    })

    it('strips "1 ק\"ג"', () => {
      expect(normalizeNameForDedup('אורז 1 ק"ג')).toBe('אורז')
    })

    it('strips "500 מ\"ל"', () => {
      expect(normalizeNameForDedup('חלב 500 מ"ל')).toBe('חלב')
    })

    it('treats "400 גר" and "400 ג\'" as equivalent', () => {
      expect(normalizeNameForDedup('גבינה 400 גר')).toBe(normalizeNameForDedup("גבינה 400 ג'"))
    })
  })

  describe('percentage tokens (preserved — semantic, not packaging)', () => {
    it('preserves percentage tokens', () => {
      expect(normalizeNameForDedup('חלב 3%')).toBe('חלב 3%')
    })

    it('keeps חלב 3% and חלב 9% distinct', () => {
      expect(normalizeNameForDedup('חלב 3%')).not.toBe(normalizeNameForDedup('חלב 9%'))
    })

    it('keeps percentage through plural/orphan passes', () => {
      // "גבינת גאודה פרוסה 28% שומן" → drop שומן (trailing orphan) → "גבינת גאודה פרוסה 28%"
      expect(normalizeNameForDedup('גבינת גאודה פרוסה 28% שומן')).toBe('גבינת גאודה פרוסה 28%')
    })
  })

  describe('punctuation', () => {
    it('strips parentheses', () => {
      expect(normalizeNameForDedup('גבינה (פרוסה)')).toBe('גבינה פרוסה')
    })

    it('strips apostrophes and quotes', () => {
      expect(normalizeNameForDedup('גבינה\' "פרוסה"')).toBe('גבינה פרוסה')
    })

    it('strips commas and periods', () => {
      expect(normalizeNameForDedup('גבינה, פרוסה.')).toBe('גבינה פרוסה')
    })
  })

  describe('plural map (Hebrew morphology)', () => {
    it('collapses פרוסות → פרוסה', () => {
      expect(normalizeNameForDedup('גבינה פרוסות')).toBe(normalizeNameForDedup('גבינה פרוסה'))
    })

    it('collapses טחונות → טחונה', () => {
      expect(normalizeNameForDedup('שקדים טחונות')).toBe(normalizeNameForDedup('שקדים טחונה'))
    })

    it('collapses פרוסים → פרוס', () => {
      expect(normalizeNameForDedup('לחם פרוסים')).toBe(normalizeNameForDedup('לחם פרוס'))
    })

    it('exports PLURAL_MAP with expected keys', () => {
      expect(PLURAL_MAP['פרוסות']).toBe('פרוסה')
      expect(PLURAL_MAP['טחונות']).toBe('טחונה')
      expect(PLURAL_MAP['פרוסים']).toBe('פרוס')
    })
  })

  describe('orphan trailing modifiers', () => {
    it('drops trailing שומן', () => {
      expect(normalizeNameForDedup('גבינת גאודה 28% שומן')).toBe(
        normalizeNameForDedup('גבינת גאודה 28%'),
      )
    })

    it('does NOT drop שומן when not the last token', () => {
      // "חלב שומן מלא" — שומן is middle, preserved
      expect(normalizeNameForDedup('חלב שומן מלא')).toBe('חלב שומן מלא')
    })

    it('drops trailing ביתית when not the only token', () => {
      expect(normalizeNameForDedup('גבינה לבנה ביתית')).toBe('גבינה לבנה')
    })

    it('exports ORPHAN_TRAILING_MODIFIERS with expected entries', () => {
      expect(ORPHAN_TRAILING_MODIFIERS.has('שומן')).toBe(true)
      expect(ORPHAN_TRAILING_MODIFIERS.has('ביתית')).toBe(true)
      expect(ORPHAN_TRAILING_MODIFIERS.has('מצונן')).toBe(true)
    })
  })

  describe('combined real-world cases', () => {
    it('collapses "גבינת גאודה פרוסות 28%" to same as "גבינת גאודה פרוסה 28% שומן"', () => {
      expect(normalizeNameForDedup('גבינת גאודה פרוסות 28%')).toBe(
        normalizeNameForDedup('גבינת גאודה פרוסה 28% שומן'),
      )
    })

    it('keeps "גבינה לבנה" and "גבינה צהובה" distinct', () => {
      expect(normalizeNameForDedup('גבינה לבנה 5%')).not.toBe(
        normalizeNameForDedup('גבינה צהובה 5%'),
      )
    })

    it('keeps "אורז לבן" and "אורז מלא" distinct', () => {
      expect(normalizeNameForDedup('אורז לבן יבש')).not.toBe(normalizeNameForDedup('אורז מלא יבש'))
    })
  })
})
