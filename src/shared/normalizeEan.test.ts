import { normalizeEan } from './normalizeEan'

describe('normalizeEan()', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeEan('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeEan('   ')).toBe('')
  })

  it('preserves a clean 13-digit EAN unchanged', () => {
    expect(normalizeEan('7290012345678')).toBe('7290012345678')
  })

  it('strips spaces from a printed-on-label EAN', () => {
    expect(normalizeEan('7290 0123 45678')).toBe('7290012345678')
  })

  it('strips non-digit characters and keeps only digits', () => {
    expect(normalizeEan('abc 123 def 456')).toBe('123456')
  })

  it('returns empty string when input has no digits at all', () => {
    expect(normalizeEan('abc')).toBe('')
  })
})
