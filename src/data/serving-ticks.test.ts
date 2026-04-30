import { FOOD_DATABASE } from './foods'
import { SERVING_TICKS } from './serving-ticks'

/**
 * Structural-integrity tests for the serving-ticks starter set.
 *
 * These guard the invariants the slider component relies on:
 *   - every slug resolves to a real food (lookup never returns undefined)
 *   - cooked/raw siblings always point back at each other
 *   - ticks render in left-to-right order (ascending grams)
 *   - quick-pill row never has more than 3 entries
 *   - chicken pair is included so the toggle is exercised in the starter set
 */

describe('SERVING_TICKS data integrity', () => {
  it('contains exactly 20 entries (the A2 starter set)', () => {
    expect(Object.keys(SERVING_TICKS)).toHaveLength(20)
  })

  it('every slug exists as a slug field on a food in foods.ts', () => {
    const foodSlugs = new Set(
      FOOD_DATABASE.map((f) => f.slug).filter((s): s is string => typeof s === 'string'),
    )
    Object.keys(SERVING_TICKS).forEach((slug) => {
      expect(foodSlugs.has(slug)).toBe(true)
    })
  })

  it('cooked-pair pointers are symmetric (A→B implies B→A)', () => {
    Object.entries(SERVING_TICKS).forEach(([slug, entry]) => {
      if (entry.cookedVariantSlug) {
        const sibling = SERVING_TICKS[entry.cookedVariantSlug]
        expect(sibling).toBeDefined()
        expect(sibling.cookedVariantSlug).toBe(slug)
      }
    })
  })

  it('every entry has ticks sorted strictly ascending by grams', () => {
    Object.entries(SERVING_TICKS).forEach(([slug, entry]) => {
      const grams = entry.ticks.map((t) => t.grams)
      const sorted = [...grams].sort((a, b) => a - b)
      expect(grams).toEqual(sorted) // monotonic
      expect(new Set(grams).size).toBe(grams.length) // strict (no duplicates)
      // Surface which slug failed if the assertion blows up
      expect({ slug, grams }).toMatchObject({ slug, grams: sorted })
    })
  })

  it('every entry has between 1 and 3 primary ticks (quick-pill cap)', () => {
    Object.entries(SERVING_TICKS).forEach(([slug, entry]) => {
      const primaryCount = entry.ticks.filter((t) => t.isPrimary).length
      expect({ slug, primaryCount }).toEqual(
        expect.objectContaining({ slug, primaryCount: expect.any(Number) }),
      )
      expect(primaryCount).toBeGreaterThanOrEqual(1)
      expect(primaryCount).toBeLessThanOrEqual(3)
    })
  })

  it('chicken raw/cooked pair is included so the toggle path is exercised', () => {
    expect(SERVING_TICKS.chicken_breast_raw).toBeDefined()
    expect(SERVING_TICKS.chicken_breast_cooked).toBeDefined()
    expect(SERVING_TICKS.chicken_breast_raw.cookedVariantSlug).toBe('chicken_breast_cooked')
    expect(SERVING_TICKS.chicken_breast_cooked.cookedVariantSlug).toBe('chicken_breast_raw')
  })
})
