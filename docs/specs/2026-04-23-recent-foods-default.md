# Feature: Recent Foods as Default (FoodSearchSheet)

**Date:** 2026-04-23
**Status:** Implementing
**GitHub Issue:** —

## What

When the user opens `FoodSearchSheet` to log a meal, show their 15 most recently logged foods immediately — labeled "לאחרונה" — before they type anything. If they have no log history yet, silently fall through to a tier-ranked fallback (raw ingredients first) with no label.

## Why

80% of food logs are repeats. Forcing the user to type "חזה עוף" every meal when they logged it yesterday is the biggest friction point in the current log flow. Showing recents first removes typing for the common case.

Most tracking apps (MyFitnessPal, Lifesum, Cronometer, Yazio) do this with a visible "Recent" section. FitCoach already has the data path wired (`foodRepository.getRecent(30)` is called on empty-query open) but there is no section label, so users don't realize these are their own recents vs. a generic catalog slice. The "feature" is invisible.

Also: currently the count is 30 (too long to scan) and the zero-history fallback is `search('', 50)` which returns an arbitrary catalog slice — not helpful to a brand-new user.

## Requirements

- [ ] Opening `FoodSearchSheet` with an empty query shows the 15 most-recently-logged foods
- [ ] A Hebrew section label "לאחרונה" is visible above the list when there ARE recent foods
- [ ] When the user has zero log history, fall through to `search('', 15)` with NO section label (tier-ranker surfaces `raw_` items first — chicken breast, eggs, rice, olive oil, apple — so the empty state is still useful)
- [ ] Dedup is by `food_id` (global across all meals) — the meal sheet is not meal-scoped
- [ ] As soon as the user types even one character, the recent label disappears and results become search results (existing behavior, unchanged)
- [ ] Clearing the search box restores the recent list + label
- [ ] English translation `nutrition.recentFoods` added for dev-tools + future EN-UI

## Design

### Architecture

Two source-of-truth changes:

1. **`foodRepository.getRecent`** — change default limit from 30 to 15. SQL is unchanged (already deduped by `food_id`, already ordered by `MAX(date) DESC`).
2. **`FoodSearchSheet.loadResults`** — track whether the current result set came from `getRecent` (label-worthy) or `search` (no label). A single piece of state — `resultSource: 'recent' | 'search' | null` — is enough. `null` means no query + no history → fallback, no label.

Render the label above the `FlatList` when `resultSource === 'recent' && results.length > 0` AND `query.trim() === ''`. (The second clause guards against showing a stale "recent" label for ~1 frame after the user starts typing — the results array may briefly still hold recents until the search async resolves.)

### Data Flow

```
Sheet opens (query='')
  → loadResults('')
    → getRecent(15)
      → found.length > 0 → resultSource='recent', results=found         → label "לאחרונה" shown
      → found.length === 0 → search('', 15) → resultSource='search', results=found → no label
  → user types 'ע'
    → loadResults('ע')
      → search('ע', 50) → resultSource='search', results=found          → no label
  → user clears input
    → loadResults('')
    → (same as initial open)
```

### Files to Create/Modify

| File                                                | Action | Description                                                                                                                                                    |
| --------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/food-repository.ts`                         | Modify | Change `getRecent` default limit 30 → 15. One-line change.                                                                                                     |
| `src/db/food-repository.test.ts`                    | Modify | Update the existing `getRecent` test if it asserts on the default.                                                                                             |
| `src/components/nutrition/FoodSearchSheet.tsx`      | Modify | Add `resultSource` state, render section label conditionally above `<FlatList>`. Drop the `getRecent(30)` → `getRecent(15)` arg (or leave, default is 15 now). |
| `src/components/nutrition/FoodSearchSheet.test.tsx` | Modify | New tests: (a) label shown when recents exist, (b) label hidden when user types, (c) label hidden when fallback (no history).                                  |
| `src/i18n/he.ts`                                    | Modify | Add `nutrition.recentFoods: 'לאחרונה'`.                                                                                                                        |
| `src/i18n/en.ts`                                    | Modify | Add `nutrition.recentFoods: 'Recent'`.                                                                                                                         |

Total: 6 files, 1 new string per locale, ~40 LoC net. No schema change. No new component.

## Acceptance Criteria

- [ ] Device test (fresh install, onboarding complete, 0 logged foods): opening Breakfast sheet shows 15 items (chicken breast / eggs / rice / olive oil / etc. — tier-ranker output), **no** "לאחרונה" label
- [ ] Device test (after logging 3 foods): re-opening Breakfast sheet shows those 3 foods at top with "לאחרונה" label above them
- [ ] Device test (user types 'ע'): label disappears instantly, search results replace the list
- [ ] Device test (user clears input): label returns, recent foods return
- [ ] Same food logged twice (once breakfast, once dinner) appears ONCE in the recent list (food_id dedup)
- [ ] Lint, typecheck, all tests pass; new tests cover the three label states

## Task Breakdown

1. [ ] **Repo:** `foodRepository.getRecent` default 30 → 15 (S)
2. [ ] **UI:** Add `resultSource` state + conditional section label in `FoodSearchSheet` (S)
3. [ ] **i18n:** `nutrition.recentFoods` he + en (S)
4. [ ] **Tests:** 3 new FoodSearchSheet tests for label visibility (S)
5. [ ] **Device verify:** fresh install + post-log flow (S)

Estimate: one sitting, ~1-2 hours.

## Open Questions

- None. All UX decisions locked in brainstorm (global dedup, count 15, no label on fallback, instant replace on typing).

## Implementation Plan

### Plan-time corrections to the spec

Two findings during plan investigation that simplify the file list:

1. **`foodRepository.getRecent(limit = 15)` default is already 15** (food-repository.ts:120). No repo change needed; Task 1 from the spec's Task Breakdown is deleted. The change is entirely at the call site — `FoodSearchSheet` passes `getRecent(30)` today, drop the explicit arg.
2. **`nutrition.recentlyUsed` already exists** in both `he.ts` (`'נפוצים לאחרונה'`) and `en.ts` (`'Recently Used'`) but is never rendered — dead string from an earlier design pass. Reuse the key. Change the Hebrew value to `'לאחרונה'` per the brainstorm decision (shorter, cleaner). English stays `'Recently Used'`.

Revised file list: **4 files** (no `food-repository.ts`, no `food-repository.test.ts`, no new i18n key).

| File                                                | Action    | Description                                                                              |
| --------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `src/i18n/he.ts`                                    | Modify    | `nutrition.recentlyUsed` value `'נפוצים לאחרונה'` → `'לאחרונה'`                          |
| `src/components/nutrition/FoodSearchSheet.tsx`      | Modify    | `resultSource` state + conditional section label + drop explicit `getRecent(30)` arg     |
| `src/components/nutrition/FoodSearchSheet.test.tsx` | Modify    | Update existing `getRecent(30)` assertion to `getRecent()`; add 3 label-visibility tests |
| `src/i18n/en.ts`                                    | Read only | Value `'Recently Used'` stays as-is; listed for completeness                             |

### Task 1: i18n — Hebrew value update (S)

**Files:** `src/i18n/he.ts`
**What:** Change `nutrition.recentlyUsed` Hebrew value from `'נפוצים לאחרונה'` to `'לאחרונה'`. English stays `'Recently Used'` — matches the brainstorm's "short, trust-inducing" framing.
**Test first:** N/A — pure string change, covered by the UI tests in Task 2 that assert the label text.
**Acceptance:**

- Grep confirms `recentlyUsed: 'לאחרונה'` in he.ts.
- Lint + typecheck pass.

### Task 2: FoodSearchSheet — conditional "לאחרונה" label (M)

**Files:** `src/components/nutrition/FoodSearchSheet.tsx`, `src/components/nutrition/FoodSearchSheet.test.tsx`
**What:**

1. Add `resultSource: 'recent' | 'search' | null` state.
2. In `loadResults`, set `resultSource = 'recent'` when `getRecent()` returned non-empty rows and query is empty; `'search'` otherwise (fallback `search('', 15)` path AND typed-query path); `null` initial.
3. Drop explicit `getRecent(30)` → `getRecent()` (uses the 15 default). Also change the zero-history fallback from `search('', 50)` to `search('', 15)` to match the requirement of "15 items on first launch" — current 50 is inherited from the typed-query path and too long for a starter list.
4. Render `<Text testID={`${id}-recent-label`} style={styles.sectionLabel}>{strings.recentlyUsed}</Text>` above the `FlatList` only when `resultSource === 'recent' && query.trim() === '' && results.length > 0`. (The `query.trim() === ''` guard kills the stale-label flicker when the user starts typing before the search promise resolves.)

**Test first (TDD — 3 new failing tests in FoodSearchSheet.test.tsx):**

```tsx
it('shows the "לאחרונה" label when getRecent returns foods', async () => {
  mockGetRecent.mockResolvedValue([MOCK_CHICKEN])
  const { findByTestId } = render(<FoodSearchSheet {...defaultProps} />)
  expect(await findByTestId('search-sheet-recent-label')).toBeTruthy()
})

it('hides the "לאחרונה" label when user has no log history (fallback path)', async () => {
  mockGetRecent.mockResolvedValue([])
  mockSearch.mockResolvedValue([MOCK_CHICKEN]) // fallback returns 15 tier-ranked foods
  const { queryByTestId, findAllByTestId } = render(<FoodSearchSheet {...defaultProps} />)
  await findAllByTestId(/^search-sheet-result-/)
  expect(queryByTestId('search-sheet-recent-label')).toBeNull()
})

it('hides the "לאחרונה" label as soon as the user types a query', async () => {
  mockGetRecent.mockResolvedValue([MOCK_CHICKEN])
  mockSearch.mockResolvedValue([MOCK_CHICKEN])
  const { getByTestId, queryByTestId, findByTestId } = render(<FoodSearchSheet {...defaultProps} />)
  await findByTestId('search-sheet-recent-label') // present initially
  fireEvent.changeText(getByTestId('search-sheet-input'), 'ע')
  await new Promise((r) => setTimeout(r, 0))
  expect(queryByTestId('search-sheet-recent-label')).toBeNull()
})
```

Also update the existing line-138 test: `expect(mockGetRecent).toHaveBeenCalledWith(30)` → `expect(mockGetRecent).toHaveBeenCalledWith()` (or just `toHaveBeenCalled()`). And update the fallback search to assert the new `15` limit: the existing beforeEach should have `mockSearch` calls verified against `('', 15)` on the no-history path.

**Acceptance:**

- All 3 new tests pass (RED → GREEN).
- Updated `getRecent` assertion passes.
- All 14 prior tests still pass.
- `npm test -- --silent 2>&1 | tail -5` clean.

### Task 3: Device verify (S)

**Files:** none (manual testing only)
**What:** Run `dev` alias. Two flows:

1. **Fresh install** (Simulator → Device → Erase All Content → re-onboard → don't log anything yet) → open Breakfast meal sheet → expect 15 tier-ranked items (חזה עוף / ביצה / אורז / שמן זית / תפוח visible near top), NO "לאחרונה" label.
2. **Post-log** (log 3 foods across 2 meals using the same food twice) → open any meal sheet → expect those 3 foods at top, "לאחרונה" label visible, logged-twice-food appears ONCE.

**Acceptance:**

- Both scenarios render as described on iOS Simulator.
- RTL layout correct (label right-aligned).
- Checking acceptance criteria boxes in the spec individually (not batched) per the workflow rule.

### Ordering rationale

- i18n first so Task 2's tests can render real string and not placeholder.
- Task 2 is a single TDD cycle — tests drive state-machine (`resultSource`) correctness.
- Device verify last (can't verify label without the string change AND the conditional render both in place).

### Risk / gotcha notes

- **Stale-label flicker** — `loadResults` is async. When user types 'ע', the search promise races with the already-rendered recent list. Guarded by the `query.trim() === ''` predicate in the render condition, not just by `resultSource`. Test 3 covers this.
- **Cancelled promise setState** — `loadResults` already has the `cancelled` guard (existing pattern). Setting `resultSource` goes through the same guard automatically since it's set in the same `run()` async.
- **No meal-scoping** — confirmed in brainstorm. Dedup is `food_id` only (already the SQL behavior). No change to the `GROUP BY food_id` in `getRecent`.
