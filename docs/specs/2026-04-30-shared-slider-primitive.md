# Feature: A2 — Shared slider primitive (portion picker)

**Date:** 2026-04-30
**Status:** Draft
**Parent spec:** [2026-04-24-two-mode-meal-logging.md](./2026-04-24-two-mode-meal-logging.md) — Track A2
**TASKS.md:** line 560

## What

A shared, reusable portion-picker slider component. The user drags a thumb along a horizontal track to dial in how many grams of a food they ate. Tick marks at natural-portion anchors (e.g. `½ חזה = 125g`) snap with haptic feedback. Each tick label shows both the gram value and the natural-portion name (`125 גר׳ · ½ חזה`); between ticks, the label flips to a comparative form (`≈ 0.6 חזה · 70 גר׳`). Above the track, three quick-tap pills jump straight to the food's most-common portions. A hand-portion icon (✋ / 👌 / 👍 / ✊) anchors the value visually for users without a kitchen scale. A cooked/raw toggle below the track swaps which food variant is being logged when sibling foods exist (e.g. raw vs cooked chicken breast); the gram value is preserved across the toggle, but macros recompute against the new food.

The component is consumed by Track B's B4 (slider-adjust screen, Structured mode) and Track C's C2 (chip-flow portion picker, Free mode). It also defines the data type and starter content for serving-tick metadata covering the 20 most-logged Israeli foods.

## Why

The two meal-logging modes (Structured wizard, Free chip-tap) both terminate in the same micro-task: "the user has chosen a food; how much of it did they eat?" Building two portion pickers fragments the UX, doubles the test surface, and guarantees the two flows drift apart. A single shared primitive keeps the mental model consistent across modes and ensures any UX improvement (haptic tuning, RTL fix, accessibility pass) lands in one place.

The slider replaces the existing `PortionPicker` (chips + ±10g stepper) with a continuous, gestural input that matches how Israeli users think about portions in daily life. Most non-trained users do not weigh food. They estimate against natural anchors: "½ a chicken breast", "one cupped hand of rice", "a thumb of olive oil". The tick anchors + dual labels + hand-portion icons surface those anchors directly on the slider rather than forcing the user to convert mentally.

This is also the single largest building block in Phase 1 of the two-mode launch. Both downstream tracks (B and C) are blocked on it.

## Requirements

- [ ] `Slider` component exposes a controlled API: `food`, `grams`, `onChange`, `onChangeEnd?`, `variant?`, `onVariantChange?`.
- [ ] Slider renders a horizontal track with tick marks at the food's natural-portion grams (from `serving-ticks.ts` for curated foods; falls back to `food.servingSizes` for non-curated).
- [ ] Each tick label shows two values: gram amount + natural-portion name (`125 גר׳ · ½ חזה`).
- [ ] Between-tick label uses comparative form (`≈ 0.6 חזה · 70 גר׳`).
- [ ] Three quick-tap pills above the track represent the food's three primary portions; tapping one jumps the slider to that gram value.
- [ ] Hand-portion icon (`palm` / `cupped_hand` / `thumb` / `fist` / `unit`) renders next to the value when the food has a hand-portion mapping.
- [ ] When the thumb crosses a tick boundary, `Haptics.impactAsync(Light)` fires (one impact per tick crossed, even on big jumps).
- [ ] Cooked/raw toggle: when `variant` prop is provided, a two-pill segmented control renders below the track. Tapping switches the active food via `onVariantChange(variant.food)`. Gram value is preserved across the swap; macros recompute in the parent.
- [ ] Track is left-to-right in both locales (left = small, right = big), per FitCoach's number-row LTR convention.
- [ ] Drag is smooth (60fps on UI thread via reanimated shared value); JS-side `onChange` fires only at tick crossings, not every frame.
- [ ] `onChangeEnd` fires once on drag release with the final gram value (optional persist hook for consumers that don't need live updates).
- [ ] `serving-ticks.ts` ships entries for 20 starter foods covering protein / carbs / fats / dairy / fruit / veg.
- [ ] Cooked/raw pointer integrity: every food that points to a `cookedVariantId` has a matching reverse pointer back to itself (validated by test).
- [ ] Component tests cover render, prop changes, toggle, and quick-pill behavior — without simulating real gestures.
- [ ] Pure helpers (`detectTickCrossings`, `getServingTicks`, `getCookedVariant`) are fully unit-tested.

## Non-requirements (explicit)

- **Not** a SQLite migration. Serving-tick data lives as a TS const, not a database column. (E3 will fold it into the food row when the dietitian-verified gold list lands.)
- **Not** a cooked-yield gram conversion. The toggle preserves the gram value as-is. Users who weighed raw and want cooked-mass conversion will be served by E3+, not A2.
- **Not** a unit-system mode switch. The slider operates in grams under the hood at all times. Natural-unit names appear as labels on the gram dial, not as a separate input mode.
- **Not** a replacement for the existing `PortionPicker` in this PR. PortionPicker is the production picker until B4 and C2 land. This PR ships the shared primitive and its test coverage; integration into existing flows happens in B4 / C2.

## Design

### Architecture

```
src/components/nutrition/shared/
  Slider.tsx                        ← new — UI component (presentational)
  Slider.test.tsx                   ← new — render + prop tests, no gesture sim
  serving-ticks.helpers.ts          ← new — getServingTicks, getCookedVariant, detectTickCrossings
  serving-ticks.helpers.test.ts     ← new — pure-function tests

src/data/
  serving-ticks.ts                  ← new — const map, 20 entries (slug-keyed)
  serving-ticks.test.ts             ← new — data-integrity tests (slug coverage, pointer symmetry, tick monotonicity)
  foods.ts                          ← modify — add `slug` field to the 20 target foods

src/types/nutrition.ts              ← modify — add ServingTickEntry type, add `slug?: string` to FoodItem

src/i18n/he.ts + en.ts              ← modify — slider strings (cooked/raw labels, hand-portion alt text)
```

### Data flow

```
Parent (B4 or C2)
  ├─ holds: food, grams, cookedVariant
  ├─ on toggle press: setFood(cookedVariant.food)  ← swap happens here
  └─ renders:
       <Slider
         food={food}
         grams={grams}
         onChange={setGrams}
         onChangeEnd={persistDraft}
         variant={cookedVariant}
         onVariantChange={setFood}
       />
            │
            ▼
       Slider
         ├─ reads ticks via getServingTicks(food)
         ├─ shared value (UI thread) tracks thumb position
         ├─ on crossing: detectTickCrossings(prev, next, ticks) → runOnJS(haptic + onChange)
         └─ renders: track + ticks + pills + hand-icon + toggle
```

### Component API

```ts
export interface SliderProps {
  food: FoodItem
  grams: number
  onChange: (grams: number) => void
  onChangeEnd?: (grams: number) => void
  variant?: { food: FoodItem; label: string }
  onVariantChange?: (food: FoodItem) => void
  testID?: string
}
```

### Type additions (`src/types/nutrition.ts`)

```ts
export type HandPortion = 'palm' | 'cupped_hand' | 'thumb' | 'fist' | 'unit'

export interface ServingTick {
  readonly grams: number
  readonly nameHe: string // e.g. '½ חזה'
  readonly nameEn: string // e.g. 'half a breast'
  readonly isPrimary: boolean // top 3 → quick-pills above track
}

export interface ServingTickEntry {
  readonly ticks: readonly ServingTick[] // sorted ascending by grams
  readonly handPortion: HandPortion | null
  readonly cookedVariantSlug: string | null // null if no sibling
}

// FoodItem (existing) — add one optional field:
export interface FoodItem {
  // ... existing fields
  readonly slug?: string // stable identifier for serving-ticks map lookup
}
```

### Storage decision (Q2)

Serving-tick data lives in `src/data/serving-ticks.ts` as a `Record<slug, ServingTickEntry>` const map — **not** as new SQLite columns. The slider always reads via the helper `getServingTicks(food)`, which:

1. Looks up `SERVING_TICKS[food.slug]` when `food.slug` exists.
2. Falls back to deriving ticks from `food.servingSizes` (existing field) for non-curated foods.

This decouples the slider from the data layer (no SQLite mock chain in component tests, per `lessons.md:95`), and migrates cleanly to E3 when the dietitian-verified 300-food gold list folds these entries onto `FoodItem` rows.

### Cooked/raw toggle decision (Q1)

- **Data flow:** Parent owns the swap. Slider is stateless re-variant; it receives whichever `food` prop the parent passes. Parent uses `getCookedVariant(food)` to find the sibling and re-renders the slider with the new food.
- **Toggle behavior:** Gram value is preserved on swap; macros recompute against the new food's `caloriesPer100g` etc. This matches the assumption that users weigh food once on the plate, not before vs. after cooking.

### RTL behavior decision (Q3)

The slider track stays LTR (left = small, right = big) in both Hebrew and English locales, per `lessons.md:99` (number rows stay LTR even when surrounding text flows RTL). Surrounding RTL elements (food name header, cooked/raw pills with Hebrew text) keep their normal RTL behavior. No `flexDirection: 'row-reverse'` on tick rows, no `transform: scaleX(-1)` on the track parent.

### State model decision (Q4)

Hybrid: slider holds a reanimated `useSharedValue<number>` for thumb position (UI-thread, 60fps) but the source of truth for `grams` is the parent's React state. Slider fires `onChange` only when the thumb crosses a tick boundary (sparse, ~5–15 fires per drag), via `runOnJS(setter)(value)` per `lessons.md:21`. Optional `onChangeEnd` fires once on release for consumers that prefer to persist only on drag-end.

### Haptic test strategy decision (Q5)

The tick-crossing logic is extracted to a pure helper:

```ts
export function detectTickCrossings(
  prevGrams: number,
  newGrams: number,
  ticks: readonly number[],
): readonly number[]
```

Tested directly with no gesture simulation. The slider component test does not assert on haptic firing — that wiring is verified manually on device per PR test plan (same pattern as the SVG gauge, `lessons.md:101`).

### Starter food list (20 entries)

| #   | Food                    | Slug                    | Hand portion | Has cooked sibling          |
| --- | ----------------------- | ----------------------- | ------------ | --------------------------- |
| 1   | Chicken breast (raw)    | `chicken_breast_raw`    | palm         | ✓ → `chicken_breast_cooked` |
| 2   | Chicken breast (cooked) | `chicken_breast_cooked` | palm         | ✓ → `chicken_breast_raw`    |
| 3   | Egg                     | `egg`                   | unit         | —                           |
| 4   | Greek yogurt 2%         | `greek_yogurt_2pct`     | cupped_hand  | —                           |
| 5   | Cottage cheese 5%       | `cottage_5pct`          | cupped_hand  | —                           |
| 6   | Tuna in water           | `tuna_water`            | palm         | —                           |
| 7   | Rice (cooked)           | `rice_cooked`           | cupped_hand  | —                           |
| 8   | Bread (white slice)     | `bread_white`           | unit         | —                           |
| 9   | Pita                    | `pita`                  | unit         | —                           |
| 10  | Oatmeal (dry)           | `oatmeal_dry`           | cupped_hand  | —                           |
| 11  | Pasta (cooked)          | `pasta_cooked`          | cupped_hand  | —                           |
| 12  | Olive oil               | `olive_oil`             | thumb        | —                           |
| 13  | Avocado                 | `avocado`               | fist         | —                           |
| 14  | Tahini                  | `tahini`                | thumb        | —                           |
| 15  | Milk 3%                 | `milk_3pct`             | cupped_hand  | —                           |
| 16  | White cheese 5%         | `white_cheese_5pct`     | thumb        | —                           |
| 17  | Banana                  | `banana`                | unit         | —                           |
| 18  | Apple                   | `apple`                 | fist         | —                           |
| 19  | Tomato                  | `tomato`                | fist         | —                           |
| 20  | Almonds                 | `almonds`               | thumb        | —                           |

The list prioritizes Israeli daily-log frequency. One cooked/raw pair (chicken) is included so the toggle is exercised in the starter set; other pairs (beef, fish) defer to E3.

## Acceptance Criteria

- [ ] Dragging the slider updates the displayed gram value smoothly on a real iOS simulator (no stutter under macro recomputation in the parent).
- [ ] Each tick crossing fires exactly one haptic impact, even on a fast drag from one end of the track to the other.
- [ ] Tick labels display gram amount + natural-portion name (`125 גר׳ · ½ חזה`); between-tick labels use the comparative form.
- [ ] Quick-tap pills above the track jump the slider to the corresponding gram value with a haptic snap.
- [ ] Cooked/raw toggle (when variant is provided) preserves the gram value; macros displayed elsewhere on the sheet recompute correctly.
- [ ] Track direction is LTR on a Hebrew device — left edge = lowest gram value, right edge = highest. Thumb moves rightward to increase.
- [ ] Hand-portion icon renders for foods that have a `handPortion` mapping; absent for foods that don't.
- [ ] Foods without a serving-tick entry (the ~12k non-curated rows) fall back to ticks derived from `food.servingSizes`. Slider still functions; hand-portion icon is omitted.
- [ ] All 20 starter-food entries pass the data-integrity test (slug exists in `foods.ts`, ticks sorted ascending, cooked-pair pointers symmetric).
- [ ] Slider component tests pass without mocking `expo-sqlite` or `expo-haptics` beyond the existing global jest.setup mocks.
- [ ] `npm test`, `npm run lint`, `npm run typecheck` all green.

## Task Breakdown

1. [ ] **Type additions** (S) — Add `HandPortion`, `ServingTick`, `ServingTickEntry` to `src/types/nutrition.ts`. Add `slug?: string` to `FoodItem`. No tests needed (type-only).
2. [ ] **Slug field on foods** (S) — Add `slug: 'chicken_breast_raw'` etc. to the 20 target `createFood` calls in `src/data/foods.ts`. Update the helper to thread `slug` through.
3. [ ] **Pure helpers + tests (TDD, RED → GREEN)** (M) — Write `serving-ticks.helpers.test.ts` for `detectTickCrossings`, `getServingTicks`, `getCookedVariant` (RED). Implement helpers (GREEN). Cases: increase, decrease, multi-cross, no-cross, boundary-equal, empty-ticks, fallback to `servingSizes`, cooked-variant lookup.
4. [ ] **Serving-ticks data + integrity tests (TDD)** (M) — Write `serving-ticks.test.ts` asserting (a) every `slug` in the map exists in `foods.ts`, (b) every `cookedVariantSlug` resolves to another map entry whose `cookedVariantSlug` points back, (c) every food's `ticks` array is sorted strictly ascending by `grams`, (d) at least one tick per entry has `isPrimary: true` and at most three. Implement the 20 entries.
5. [ ] **Slider component skeleton + render tests** (L) — `Slider.tsx` with track, thumb, ticks, labels, pills, hand-icon, toggle. Use reanimated shared value for thumb position; pin track LTR; compute styles inside render (lessons.md:30). Test: renders food name; renders 3 primary pills as buttons; renders hand-icon when present; renders toggle when variant is provided; calls `onVariantChange` on toggle press; calls `onChange(tickGrams)` on quick-pill tap.
6. [ ] **Wire haptics + onChange to tick crossings** (M) — On gesture move, compute new gram value from thumb position; call `detectTickCrossings(prev, new, ticks)`; for each crossing, `runOnJS` to fire one haptic + one `onChange(grams)`. On release, fire `onChangeEnd(grams)`.
7. [ ] **i18n strings** (S) — Add `slider.cookedRaw.raw`, `slider.cookedRaw.cooked`, `slider.handPortion.palm` (etc., for VoiceOver). he.ts + en.ts in lockstep.
8. [ ] **Manual device test (PR test plan)** (S) — `dev` alias → simulator → search a curated food → drag slider → confirm haptic fires per tick / track stays LTR / cooked-raw toggle preserves grams / quick-pills jump correctly. Same for a non-curated food (fallback path).

## Risks

- **Reanimated v4 + Gesture Handler integration** — gesture-driven shared values are well-trodden in this codebase (e.g. `FloatingRestBubble`), but wiring tick-crossing detection inside the gesture worklet requires careful `runOnJS` boundaries. Mitigation: extract `detectTickCrossings` as a pure helper (already planned); keep worklet-side code minimal (`prevGrams.value = newGrams; runOnJS(handleTickCrossings)(prev, new)`).
- **Tick-crossing on fast drags** — if the user flings the thumb across multiple ticks, the worklet fires `runOnJS` once per frame; the JS handler must dedupe or accept multiple haptics in fast succession. Mitigation: the helper returns the array of all crossed ticks; the handler fires one haptic per element. iOS coalesces rapid impact calls cleanly.
- **Falsy `slug` field at runtime** — if a `FoodItem` is loaded from SQLite without a slug (because the column doesn't exist there), `getServingTicks` must fall back gracefully. Mitigation: `slug?: string` is optional; the helper checks `if (!food.slug) return fallback(food)`.
- **Toggle pill RTL placement** — the cooked/raw two-pill segmented control contains Hebrew text. Per `lessons.md:28`, plain `flexDirection: 'row'` with two children may auto-flip in RTL but is unreliable in Expo Go. Mitigation: use explicit `isRTL() ? 'row-reverse' : 'row'` for the pill row only (track row stays LTR).

## Open Questions

None — all five brainstorm questions resolved. Decisions logged in the Design section above.

## Telemetry / follow-ups

- A1-analytics already covers mode-choice + settings-toggle. No new analytics events for A2 itself.
- B4 and C2 will likely add `portion_logged` events with `slider_used` / `quick_pill_used` / `toggle_used` flags so we can measure which input modes users prefer. That instrumentation lives in those tickets, not A2.

## Implementation Plan

### PR split

This work splits cleanly into two PRs along a data-vs-component seam. PR-A is pure data + helpers (no UI, no gesture risk, all unit-testable). PR-B is the component itself + i18n + manual device verification. Each is independently reviewable, each ships its own CI gate, PR-B can iterate on UX without re-reviewing the data layer.

| PR       | Scope              | Tasks      | Est. lines | Risk                                             |
| -------- | ------------------ | ---------- | ---------- | ------------------------------------------------ |
| **PR-A** | Data foundation    | 1, 2, 3, 4 | ~700       | Low — pure TS, fully unit-tested                 |
| **PR-B** | Component + wiring | 5, 6, 7    | ~900       | Medium — gesture/haptic wiring needs device test |

PR-A merges first. PR-B branches off `main` after PR-A lands. PR-B imports from PR-A's helpers + data.

---

### PR-A — Data foundation

#### Task 1 — Type additions (S)

**Files:** `src/types/nutrition.ts`
**What:** Add `HandPortion`, `ServingTick`, `ServingTickEntry` types. Add optional `slug?: string` field to `FoodItem`. Type-only — no runtime code, no tests.
**Test first:** N/A (types only — typecheck is the gate).
**Acceptance:** `npm run typecheck` clean. No existing test breaks. `FoodItem.slug` is optional so existing food rows compile without change.

#### Task 2 — Slug field on the 20 starter foods (S)

**Files:** `src/data/foods.ts`
**What:** Update `createFood` helper signature to accept a `slug` parameter. Add slug strings to the 20 target foods (chicken_breast_raw, chicken_breast_cooked, egg, greek_yogurt_2pct, cottage_5pct, tuna_water, rice_cooked, bread_white, pita, oatmeal_dry, pasta_cooked, olive_oil, avocado, tahini, milk_3pct, white_cheese_5pct, banana, apple, tomato, almonds). Other foods get no slug (field is optional).
**Test first:** N/A (mechanical data tagging — Task 4's integrity tests cover the slug-coverage invariant).
**Acceptance:** `npm run typecheck` clean. `npm test` green (no existing test asserts on `slug`). `git diff --stat src/data/foods.ts` shows ~25 lines changed.

#### Task 3 — Pure helpers (TDD: RED → GREEN) (M)

**Files:** `src/components/nutrition/shared/serving-ticks.helpers.ts` (new), `src/components/nutrition/shared/serving-ticks.helpers.test.ts` (new)
**What:** Three pure functions:

- `detectTickCrossings(prevGrams: number, newGrams: number, ticks: readonly number[]): readonly number[]`
- `getServingTicks(food: FoodItem): readonly ServingTick[]` — looks up `SERVING_TICKS[food.slug]`, falls back to deriving from `food.servingSizes`
- `getCookedVariant(food: FoodItem, allFoods: readonly FoodItem[]): FoodItem | null` — resolves `cookedVariantSlug` to a `FoodItem` from the provided list

**Test first:**

```ts
// detectTickCrossings — 7 cases
it('detects single crossing on increase', () => {
  expect(detectTickCrossings(100, 130, [50, 125, 200])).toEqual([125])
})
it('detects single crossing on decrease', () => {
  expect(detectTickCrossings(150, 80, [50, 125, 200])).toEqual([125])
})
it('detects no crossings between ticks', () => {
  expect(detectTickCrossings(60, 100, [50, 125, 200])).toEqual([])
})
it('detects multiple crossings on big jump', () => {
  expect(detectTickCrossings(40, 250, [50, 125, 200])).toEqual([50, 125, 200])
})
it('handles boundary equality (landing exactly on tick)', () => {
  expect(detectTickCrossings(100, 125, [50, 125, 200])).toEqual([125])
})
it('handles empty tick array', () => {
  expect(detectTickCrossings(100, 200, [])).toEqual([])
})
it('handles same prev and next', () => {
  expect(detectTickCrossings(100, 100, [50, 125, 200])).toEqual([])
})

// getServingTicks — 4 cases
it('returns curated ticks when food has slug in SERVING_TICKS', ...)
it('falls back to deriving from servingSizes when slug missing', ...)
it('falls back when slug present but no map entry', ...)
it('returns empty array when food has no servingSizes either', ...)

// getCookedVariant — 3 cases
it('returns sibling food when cookedVariantSlug resolves', ...)
it('returns null when no cooked sibling configured', ...)
it('returns null when slug missing on input food', ...)
```

**Acceptance:** All 14 helper tests pass. `npm run lint` + `npm run typecheck` clean. Helper file <150 lines, test file <250 lines.

#### Task 4 — Serving-ticks data + integrity tests (TDD: RED → GREEN) (M)

**Files:** `src/data/serving-ticks.ts` (new), `src/data/serving-ticks.test.ts` (new)
**What:** Const map `SERVING_TICKS: Record<string, ServingTickEntry>` with 20 entries. Each entry has `ticks`, `handPortion`, `cookedVariantSlug`. Integrity tests assert structural invariants.

**Test first:**

```ts
// Write these BEFORE populating any data — they fail until 20 entries exist
it('contains exactly 20 entries', () => {
  expect(Object.keys(SERVING_TICKS).length).toBe(20)
})
it('every slug exists as a slug field on a food in foods.ts', () => {
  const foodSlugs = new Set(ALL_FOODS.map((f) => f.slug).filter((s): s is string => !!s))
  Object.keys(SERVING_TICKS).forEach((slug) => {
    expect(foodSlugs).toContain(slug)
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
  Object.values(SERVING_TICKS).forEach((entry) => {
    const grams = entry.ticks.map((t) => t.grams)
    const sorted = [...grams].sort((a, b) => a - b)
    expect(grams).toEqual(sorted)
    expect(new Set(grams).size).toBe(grams.length)
  })
})
it('every entry has between 1 and 3 primary ticks', () => {
  Object.values(SERVING_TICKS).forEach((entry) => {
    const n = entry.ticks.filter((t) => t.isPrimary).length
    expect(n).toBeGreaterThanOrEqual(1)
    expect(n).toBeLessThanOrEqual(3)
  })
})
it('chicken raw/cooked pair is included (toggle exercise food)', () => {
  expect(SERVING_TICKS.chicken_breast_raw).toBeDefined()
  expect(SERVING_TICKS.chicken_breast_cooked).toBeDefined()
})
```

**Acceptance:** All 6 integrity tests pass with 20 entries populated. Each entry has a research-citable basis for the gram values (Israeli MoH tables, USDA, or visual estimation noted in a comment). The chicken pair has the same primary tick gram values on both sides (so toggling preserves user intent). `npm test` green.

---

### PR-B — Component + wiring

#### Task 5 — Slider component skeleton + render tests (L)

**Files:** `src/components/nutrition/shared/Slider.tsx` (new), `src/components/nutrition/shared/Slider.test.tsx` (new)
**What:** The component itself, statically rendered. Track + tick marks + tick labels + 3 quick-tap pills + hand-portion icon + cooked/raw toggle. Reanimated shared value for thumb position. No gesture handling yet (Task 6). TDD-optional per CLAUDE.md (UI work) — use render-prop tests instead.

**Test first (render-prop, not gesture):**

```ts
it('renders food name in header')
it('renders 3 primary tick values as quick-pills')
it('renders all tick labels with dual format (gram · natural)')
it('renders hand-portion icon when food has handPortion mapping')
it('omits hand-portion icon when food has no handPortion')
it('renders cooked/raw toggle when variant prop is provided')
it('omits cooked/raw toggle when variant prop is undefined')
it('calls onChange with correct grams when a quick-pill is tapped')
it('calls onVariantChange with sibling food when toggle is tapped')
it('falls back to servingSizes ticks when food has no slug')
```

**Acceptance:** 10 component tests pass. Slider.tsx <450 lines (under the 500-line size warning). Renders correctly in Hebrew (track LTR, surrounding labels respect locale). No `expo-sqlite` mock needed (slider has no DB import). `lessons.md:30` followed — styles computed inside render where they depend on `isRTL()`.

#### Task 6 — Gesture + haptic wiring (M)

**Files:** `src/components/nutrition/shared/Slider.tsx` (modify)
**What:** Add `Gesture.Pan()` from react-native-gesture-handler. Worklet updates the thumb-position shared value on `onUpdate`. Computes new gram value from position. Calls `detectTickCrossings(prev, new, ticks)`. For each crossing → `runOnJS(handleCrossing)(grams)` which fires `Haptics.impactAsync(Light)` + `onChange(grams)`. On `onEnd` → `runOnJS(onChangeEnd)(grams)`.

**Test first:** N/A — gesture wiring is UI integration, not unit-testable per `lessons.md:101`. The tick-crossing logic is already covered by Task 3's pure-helper tests. Manual device test verifies the wiring (PR test plan).

**Acceptance:** Manual device test passes (see PR-B test plan). Slider drag fires haptic on each tick crossing. Fast drag across all ticks fires correct number of haptics (one per crossing). `onChangeEnd` fires once on release. `npm run lint` + `npm run typecheck` + `npm test` green. `git diff --stat Slider.tsx` shows ~120 added lines.

#### Task 7 — i18n strings (S)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`
**What:** Add slider strings under a new `slider` key:

```
slider:
  cookedRaw:
    raw: 'נא' / 'Raw'
    cooked: 'מבושל' / 'Cooked'
  handPortion:
    palm: 'כף יד' / 'Palm'         (VoiceOver alt text)
    cupped_hand: 'חופן' / 'Cupped hand'
    thumb: 'אגודל' / 'Thumb'
    fist: 'אגרוף' / 'Fist'
    unit: 'יחידה' / 'Unit'
  comparativeApprox: '≈' (shared symbol)
```

**Test first:** N/A (i18n strings — covered by render tests in Task 5 that assert visible text).
**Acceptance:** `he.ts` and `en.ts` have exact key parity (typecheck enforces this via the existing i18n type). `npm run typecheck` clean. Slider component tests pass (they pull strings via `t().slider`).

---

### Commit / push order

```
PR-A (branch: feat/a2-serving-ticks-data, off main):
  commit 1: Task 1 — types
  commit 2: Task 2 — slug field on 20 foods
  commit 3: Task 3 — pure helpers (RED then GREEN)
  commit 4: Task 4 — serving-ticks data + integrity tests (RED then GREEN)
  → push, open PR, wait CI, manual review, merge

PR-B (branch: feat/a2-slider-component, off main AFTER PR-A merges):
  commit 5: Task 5 — Slider component skeleton + render tests
  commit 6: Task 6 — gesture + haptic wiring
  commit 7: Task 7 — i18n strings
  → push, open PR, wait CI, run device test plan, merge
```

The current branch (`claude/exciting-heisenberg-08a205` from the worktree) becomes PR-A. PR-B starts from a fresh branch off `main` after PR-A merges.

### PR-A test plan (auto-verifiable)

- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test -- --silent 2>&1 | tail -5` shows 14 new helper tests + 6 new data-integrity tests = 2,402 total (was 2,382)
- [ ] `git diff --stat` confirms <500 lines per commit
- [ ] No SQLite migration added (verify no change to `src/db/schema.ts`)

### PR-B test plan (manual device + auto)

Auto:

- [ ] `npm run lint` / `typecheck` / `test` green
- [ ] 10 new Slider render tests passing
- [ ] Total tests: ~2,412

Manual (`dev` → iOS simulator, fresh install for clean state):

- [ ] **Curated food** — search `חזה עוף`, tap → slider sheet appears
- [ ] **Drag haptic** — drag thumb slowly across the track; haptic fires once per tick crossing (verify on device speaker, not simulator)
- [ ] **Fast drag** — fling thumb from one end to the other; correct number of haptics fire (one per tick)
- [ ] **Track LTR** — left edge = lowest gram value, right edge = highest. On Hebrew device, drag right → grams increase (not decrease)
- [ ] **Tick labels** — on a tick, label reads `125 גר׳ · ½ חזה`. Between ticks, reads `≈ 0.7 חזה · 145 גר׳`
- [ ] **Quick-pills** — three pills above the track; tapping each jumps thumb + haptic + macro recompute
- [ ] **Cooked/raw toggle** — tap toggle, food swaps (chicken raw → chicken cooked), grams stay (e.g. 125g), macros change (148 kcal → 206 kcal)
- [ ] **Hand-portion icon** — visible for chicken (palm), olive oil (thumb), avocado (fist). Absent for non-curated foods
- [ ] **Non-curated fallback** — search a Shufersal food (e.g. `יוגורט דנונה`), open slider; ticks derived from `servingSizes`, no hand-portion icon, no toggle. Drag still works
- [ ] **VoiceOver** — enable VoiceOver, navigate slider; thumb announces current gram value, hand-portion icon announces alt text from i18n

### Workflow checkpoints (CLAUDE.md mandatory pre-commit)

For EACH commit in this plan:

1. `git branch --show-current` — confirm on the right branch
2. `/review` after Task 3, 4, 5, 6 (skipped for Tasks 1, 2, 7 — mechanical, low risk)
3. Append to `lessons.md` if anything surprises us during implementation
4. `git diff --cached` secrets scan
5. `npm run lint` / `typecheck` / `test -- --silent 2>&1 | tail -5` all green
6. `git diff --cached --stat` — confirm <500 lines
7. Mark TASKS.md line 560 `[x]` with `2026-04-30` ONLY in the final PR-B commit (A2 is one TASKS.md line, marked done when the whole feature ships)
8. Commit with conventional-commit message

Status: **Plan ready for approval.**
