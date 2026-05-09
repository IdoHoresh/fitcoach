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

/**
 * Israeli-retail anchor regression — spot checks, NOT full coverage.
 *
 * These guard the specific class of error caught at code review by the
 * code-reviewer agent (Greek yogurt 200g single-serve that doesn't exist
 * in IL retail; cottage tub size). The structural-integrity tests above
 * pass even when retail facts are wrong — these tests pin the retail
 * anchors that matter most.
 *
 * Coverage: 2 of 20 foods. The remaining 18 are verified at PR review
 * (code-reviewer agent) only and are NOT regression-protected. Full
 * retail-anchor coverage tracked as a follow-up; gap named in
 * docs/velocity.md.
 */
describe('SERVING_TICKS Israeli retail anchors (spot-check regression)', () => {
  it('greek_yogurt_0pct primary tick is 150g — Yotvata/Tara גביע (200g single-serve does not exist in IL retail)', () => {
    const ticks = SERVING_TICKS.greek_yogurt_0pct.ticks
    const cup = ticks.find((t) => t.nameHe === 'גביע')
    expect(cup).toBeDefined()
    expect(cup?.grams).toBe(150)
    expect(cup?.isPrimary).toBe(true)
    // Negative anchor: a 200g גביע must not exist — the failure mode this test guards against.
    const fakeCup = ticks.find((t) => t.grams === 200 && t.nameHe.includes('גביע'))
    expect(fakeCup).toBeUndefined()
  })

  it('cottage_5pct full tub tick is 250g — Tnuva גביע retail size', () => {
    const ticks = SERVING_TICKS.cottage_5pct.ticks
    const tub = ticks.find((t) => t.nameHe === 'גביע')
    expect(tub).toBeDefined()
    expect(tub?.grams).toBe(250)
    expect(tub?.isPrimary).toBe(true)
  })
})
