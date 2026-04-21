import { filterFoodItems, isNonFood } from './filter-food-items'
import type { TransparencyItem } from './transparency-feed-types'

const makeItem = (overrides: Partial<TransparencyItem> = {}): TransparencyItem => ({
  itemCode: '7290000000000',
  nameHe: 'חלב',
  manufactureName: 'תנובה',
  manufactureCountry: 'ישראל',
  unitOfMeasure: 'ליטר',
  quantity: 1,
  isWeighted: false,
  itemType: 1,
  ...overrides,
})

describe('isNonFood', () => {
  it('returns false for a generic food name', () => {
    expect(isNonFood('חלב תנובה 3%')).toBe(false)
  })

  it('returns true for plastic wrap (ניילון)', () => {
    expect(isNonFood('ניילון נצמד דיימונד 30 מטר')).toBe(true)
  })

  it('returns true for bleach (אקונומיקה)', () => {
    expect(isNonFood('אקונומיקה סנו 4 ליטר')).toBe(true)
  })

  it('returns true when keyword is at start / middle / end of name', () => {
    expect(isNonFood('סיגריות מרלבורו')).toBe(true) // start
    expect(isNonFood('גליל נייר טואלט חברתי')).toBe(true) // middle (compound keyword)
    expect(isNonFood('מבצע על שמפו')).toBe(true) // end
  })

  it('does not match English strings not in the Hebrew blacklist', () => {
    // Sanity: the blacklist is Hebrew-only. English goes through untouched.
    expect(isNonFood('NYLON WRAP')).toBe(false)
  })

  it('does not false-positive on food names that only share Hebrew letters', () => {
    // `ניב גורמה` shares prefix letters with `ניילון` but does not contain the full keyword.
    expect(isNonFood('ניב גורמה')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isNonFood('')).toBe(false)
  })
})

describe('filterFoodItems', () => {
  it('drops non-food items, keeps food items', () => {
    const input = [
      makeItem({ nameHe: 'חלב תנובה' }),
      makeItem({ nameHe: 'ניילון נצמד' }),
      makeItem({ nameHe: 'יוגורט דנונה' }),
    ]
    const out = filterFoodItems(input)
    expect(out.map((i) => i.nameHe)).toEqual(['חלב תנובה', 'יוגורט דנונה'])
  })

  it('returns empty array for empty input', () => {
    expect(filterFoodItems([])).toEqual([])
  })

  it('keeps weighted deli items (itemType 0) when name is food', () => {
    const deli = makeItem({ nameHe: 'פסטרמה קוסטיצה להב', itemType: 0, isWeighted: true })
    expect(filterFoodItems([deli])).toHaveLength(1)
  })

  it('drops non-food items even when itemType is 1 (packaged)', () => {
    // Weighted-vs-packaged is orthogonal to food-vs-non-food.
    const input = [makeItem({ nameHe: 'אקונומיקה', itemType: 1, isWeighted: false })]
    expect(filterFoodItems(input)).toHaveLength(0)
  })

  it('preserves all other fields of kept items unchanged', () => {
    const input = [makeItem({ nameHe: 'חלב' })]
    const [out] = filterFoodItems(input)
    expect(out).toEqual(input[0])
  })
})
