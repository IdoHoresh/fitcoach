# Feature: One-Tap Re-Log Previous Meal

**Date:** 2026-04-23
**Status:** Approved
**GitHub Issue:** —

## What

When a `MealSection` is empty (no foods logged for that `mealType` on the selected date), show a pill button above the "+" add button labelled **"אותה ארוחת בוקר כמו אתמול →"** (or the actual day name that was found — "כמו ביום ראשון", etc.). One tap clones every food entry from that previous day/meal into today at the exact same gram amounts. A toast appears — **"הוספו N פריטים · בטל"** — giving the user ~5s to undo, which deletes the N rows just inserted.

## Why

80% of meals are repeats of previous meals — same breakfast on weekdays, same post-workout shake, same dinner rotation. PR #80 ("Recent foods as default") removed typing from single-food re-log. This feature removes the N-food sequence from whole-meal re-log. Combined, the power user's daily log drops from "tap + type + pick + confirm" × N to "tap once." That's the MacroFactor/MFP playbook for killing dropout.

Habit anchoring is day-of-week, not calendar date — Monday breakfast is the meal you eat on Mondays. Walking back up to 7 days and surfacing the day name ("כמו ביום ראשון") makes the feature work through skipped meals, travel days, and weekend routines, not just yesterday-specifically.

## Requirements

- [ ] Empty `MealSection` (foods.length === 0) renders an inline pill button above the existing "+" button
- [ ] Pill label is `"אותה <meal-name> כמו <day-word>"` — `<meal-name>` localized per mealType (ארוחת בוקר / צהריים / ערב / ביניים / לפני אימון / אחרי אימון), `<day-word>` is `"אתמול"` if the found meal was yesterday, else the Hebrew weekday of the found date (`"ראשון"` / `"שני"` / ... / `"שבת"`)
- [ ] Lookup walks back up to 7 calendar days from the selected date. Picks the most recent prior date with `foods.length > 0` for the same `mealType`. If none within 7 days → pill is hidden; `MealSection` renders its current empty state (just "+")
- [ ] One tap clones every entry from that meal into today: new `id`, today's `date`, same `foodId` / `nameHe` / `mealType` / `servingAmount` / `servingUnit` / `gramsConsumed` / `calories` / `protein` / `fat` / `carbs`
- [ ] After clone, a toast appears with the text `"הוספו N פריטים · בטל"` (N = number of inserted rows). Reuses the existing toast pattern from `NutritionDashboard.tsx` (Animated.View opacity + store state + auto-dismiss)
- [ ] The toast's "בטל" text is a tappable action. Tapping it deletes the N rows just inserted (by id), reverts `selectedDateLog`, and dismisses the toast immediately
- [ ] Auto-dismiss after 5s (longer than the 3s info toast, since undo is a decision not a notification). After dismiss, the clone is permanent
- [ ] English translation added: `nutrition.sameMealAs`, `nutrition.daysOfWeek.*`, `nutrition.itemsAddedWithUndo`, `nutrition.undo`
- [ ] No per-food PortionPicker. No confirmation sheet. One tap = N rows inserted.

## Design

### Architecture

Three layers:

1. **Repository — `foodLogRepository.getPreviousMealEntries(mealType, beforeDate, maxLookback)`**
   Returns `{ entries: FoodLogEntry[]; sourceDate: string } | null`. Walks back day-by-day from `beforeDate - 1` for up to `maxLookback` days (default 7). Returns the first day with a non-empty set for that `mealType`. One parameterized SQL query — `WHERE meal_type = ? AND date < ? AND date >= ? ORDER BY date DESC, created_at ASC` — then JS-side pick-the-first-date-that-has-rows. (SQL alternative: nested SELECT for MAX(date) — either works, keep it readable.)

2. **Repository — `foodLogRepository.cloneEntriesToDate(entries, targetDate)`**
   Transactional bulk insert. Takes an array of `FoodLogEntry`, returns an array of newly-created `FoodLogEntry` (with fresh `id`s, `date = targetDate`). Wraps in `db.withTransactionAsync` so partial failures roll back — we never want "3 of 4 foods logged."

3. **Store — `useNutritionStore.relogPreviousMeal(mealType, targetDate)`**
   Orchestrates: calls `getPreviousMealEntries`, bulk-inserts via `cloneEntriesToDate`, reloads `selectedDateLog`, sets a new toast state `relogToast: { insertedIds: string[]; count: number } | null`. Also `undoRelog()` — deletes by id, reloads, clears toast.

4. **UI — `MealSection` + new `PreviousMealPill` component**
   `MealSection` gains prop `previousMealLabel?: { dayWord: string } | null` and `onRelog?: () => void`. When `isEmpty && previousMealLabel`, renders `<PreviousMealPill>` above the bottom row. `NutritionDashboard` owns the data — on mount / date change, for each empty meal slot it calls `foodLogRepository.getPreviousMealEntries` to determine whether to show the pill and what day-word to display. (The actual re-log call doesn't re-run this query — it re-runs inside the store action to stay fresh.)

5. **UI — extend existing toast in `NutritionDashboard`**
   Add a second conditional toast render for `relogToast`, styled the same as `redistributionToast` but with a tappable "בטל" at the end that calls `undoRelog()`. Auto-dismiss extended to 5s for this variant. (Cleanest: parameterize the existing toast-effect `useEffect` to handle both, OR duplicate the pattern once — the current block is 30 LoC, duplicating is probably clearer than making it generic.)

### Data Flow

```
Mount NutritionDashboard / change selectedDate
  → for each mealType with 0 foods on selectedDate:
      foodLogRepository.getPreviousMealEntries(mealType, selectedDate, 7)
        → returns { entries, sourceDate } or null
      dashboard stores per-meal lookup result in local state

User taps "אותה ארוחת בוקר כמו ביום ראשון →"
  → onRelog() → useNutritionStore.relogPreviousMeal('breakfast', today)
    → repository.getPreviousMealEntries('breakfast', today, 7)    (re-query, freshness)
    → repository.cloneEntriesToDate(entries, today)               (transactional bulk insert)
    → set relogToast = { insertedIds: [...], count: N }
    → loadLogForDate(today)                                       (refresh MealSection)

Toast "הוספו 4 פריטים · בטל" appears
  Tap "בטל" within 5s
    → undoRelog()
      → delete WHERE id IN (insertedIds)   (by id, not by mealType — safe if user added others)
      → loadLogForDate(today)
      → clearRelogToast()
  Auto-dismiss after 5s → clearRelogToast() (rows stay, clone is permanent)
```

### Files to Create/Modify

| File                                                 | Action | Description                                                                                                                                                                                                                |
| ---------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/nutrition-repository.ts`                     | Modify | Add `getPreviousMealEntries(mealType, beforeDate, maxLookback = 7)` and `cloneEntriesToDate(entries, targetDate)` to `FoodLogRepository`. Parameterized SQL. Transactional clone.                                          |
| `src/db/nutrition-repository.test.ts`                | Modify | Unit tests for both new methods — 7-day cap, skip-days-with-no-meal, same-day exclusion, empty-input safety, transaction rollback on insert failure                                                                        |
| `src/stores/useNutritionStore.ts`                    | Modify | Add `relogToast` state, `relogPreviousMeal(mealType, date)`, `undoRelog()`, `clearRelogToast()`                                                                                                                            |
| `src/stores/useNutritionStore.test.ts`               | Modify | Store tests: happy path, undo, consecutive re-logs don't leak ids between toasts                                                                                                                                           |
| `src/components/nutrition/PreviousMealPill.tsx`      | Create | New small component: full-width pill, RTL arrow, single tap target, testID                                                                                                                                                 |
| `src/components/nutrition/PreviousMealPill.test.tsx` | Create | Renders label, fires onPress                                                                                                                                                                                               |
| `src/components/nutrition/MealSection.tsx`           | Modify | New optional props `previousMealLabel` + `onRelog`. Render `<PreviousMealPill>` above bottom row when `isEmpty && previousMealLabel`.                                                                                      |
| `src/components/nutrition/MealSection.test.tsx`      | Modify | Tests: pill renders when empty+label, hidden when foods present, hidden when no label, onRelog fires                                                                                                                       |
| `src/components/nutrition/NutritionDashboard.tsx`    | Modify | Per-meal previous-meal lookup on mount/date-change, wire `onRelog` to store, render relog-toast with undo action                                                                                                           |
| `src/i18n/he.ts`                                     | Modify | `nutrition.sameMealAs` (template string with {meal}/{day}), `nutrition.daysOfWeek.{sunday..saturday}`, `nutrition.yesterdayWord: 'אתמול'`, `nutrition.itemsAddedWithUndo: 'הוספו {count} פריטים'`, `nutrition.undo: 'בטל'` |
| `src/i18n/en.ts`                                     | Modify | Same keys, English values (dev-tools + future EN UI)                                                                                                                                                                       |

Total: 2 new files, 9 modified. Net ~300 LoC including tests.

## Acceptance Criteria

- [ ] Device test: log a full breakfast (3+ foods) on Monday. On Tuesday morning, empty breakfast MealSection shows pill "אותה ארוחת בוקר כמו אתמול →". Tap. Toast appears "הוספו 3 פריטים · בטל". MealSection fills with the same 3 foods at same grams. Toast auto-dismisses after 5s.
- [ ] Device test: log a full lunch on Wednesday. Sleep through Thursday lunch. On Friday, empty lunch section pill reads "אותה ארוחת צהריים כמו ביום רביעי" (not "כמו אתמול" — yesterday had no lunch). Tap. Wednesday's lunch clones to Friday.
- [ ] Device test: fresh install, no logs anywhere. Empty MealSection does NOT render the pill — renders only the current empty state + "+".
- [ ] Device test: log a meal 10 days ago, nothing since. Pill does NOT render (7-day cap enforced).
- [ ] Device test: tap pill → toast appears → tap "בטל" within 5s → all N cloned rows removed, MealSection back to empty, pill re-appears pointing at the same source day.
- [ ] Device test: tap pill → toast appears → wait 6s → toast gone, clone is permanent, `selectedDateLog` has the rows.
- [ ] Device test: tap pill, then immediately manually add a different food via "+". The manual add is NOT deleted by a later "בטל" tap (undo is id-scoped to the clone).
- [ ] Device test: re-log twice in a row (tap pill → don't undo → log another meal → tap its pill → undo). The second undo removes only the second clone's rows.
- [ ] Unit tests: all new repository + store tests pass
- [ ] Lint, typecheck, full test suite pass (2,332 baseline + new tests)
- [ ] RTL: pill arrow points left (→ in LTR = "next", in RTL layout arrow is on the left of the text, indicating forward action)

## Task Breakdown

1. [ ] **Repo:** `getPreviousMealEntries` + `cloneEntriesToDate` in `FoodLogRepository` + tests (M)
2. [ ] **Store:** `relogPreviousMeal` / `undoRelog` / `relogToast` state + tests (M)
3. [ ] **i18n:** `sameMealAs` template, day-of-week map, yesterday, toast strings — he + en (S)
4. [ ] **UI:** `PreviousMealPill` component + co-located test (S)
5. [ ] **UI:** `MealSection` integration — new props + conditional render + tests (S)
6. [ ] **UI:** `NutritionDashboard` — per-meal lookup on date change, wire onRelog + undo toast render (M)
7. [ ] **Device verify:** 8 scenarios above on iOS Simulator (S, manual)

Estimate: 1-2 sittings, ~4-6 hours including device verification.

## Open Questions

- **Hebrew day-of-week rendering.** Hebrew weekdays are `יום ראשון / יום שני / יום שלישי / יום רביעי / יום חמישי / יום שישי / שבת`. Pill label would become long — `"אותה ארוחת בוקר כמו יום רביעי →"` is ~30 chars. May need to drop the leading "יום" word in the pill for brevity: `"אותה ארוחת בוקר כמו רביעי →"` is not grammatical Hebrew but is shorter. Recommend full form in the spec; revisit if pill wraps to two lines on small devices during device verify.
- **Meal-name genitive form.** Hebrew is "ארוחת בוקר" (breakfast), "ארוחת צהריים" (lunch), "ארוחת ערב" (dinner), "ארוחת ביניים" (snack), "ארוחה לפני אימון" / "ארוחה אחרי אימון" (pre/post-workout). The template `"אותה {meal} כמו {day}"` where `{meal}` includes the full noun phrase handles all six — confirm i18n keys already have these exact forms (existing `nutrition.meals.*` likely does; if not, extend).
- **What if the same pill is tapped twice in rapid succession (double-tap)?** Should the second tap be a no-op (meal is no longer empty) or should it show a fresh pill pointing at a yet-older source? Current plan: after first tap the meal has foods, so the empty-state pill unmounts — double-tap naturally becomes a no-op. Verify in device test.

## Non-Goals

- **Not** re-logging the entire day at once — only per-meal slot. "Copy yesterday's entire day" is a future feature with different UX considerations (risks).
- **Not** surfacing any meal-origin metadata ("this was logged on March 10" detail labels, provenance icons, etc). Per user feedback memory: keep food UI simple, don't add metadata decoration.
- **Not** supporting portion scaling (e.g. "half of yesterday's breakfast"). Per-food edit via existing row delete+re-add is the escape hatch. One-tap means one tap.
- **Not** showing the pill when the user is looking at a past date that already has foods for a different meal slot. Scope is: empty meal, find prior non-empty instance of the SAME meal type within 7 days of the SELECTED date. (The selected date can be in the past — e.g. user is filling in yesterday's missed meal today — and the walkback goes back from there.)

## Implementation Plan

### Plan-time findings (from codebase investigation)

1. **i18n interpolation** is `.replace('{token}', String(val))` — no sprintf helper. Pattern used across `StepProgressHeader`, `WorkoutHeader`, `WeekdayStreakStrip`. Apply at render time in the component. No new utility.
2. **Toast pattern** ([NutritionDashboard.tsx:37-59](src/components/nutrition/NutritionDashboard.tsx:37)) is reusable — store state `{ ... } | null` + `useEffect` with `Animated.Value` opacity + `setTimeout` auto-dismiss + `clearXxxToast()` on animate-out. Duplicate the block for `relogToast` with 5s dwell and a pressable "בטל" action. Do NOT refactor the existing redistributionToast block into a generic in the same PR — that's scope creep; leave as two parallel blocks. If/when we add a 3rd toast variant, extract.
3. **Close-cousin `logSavedMeal`** ([useNutritionStore.ts:437](src/stores/useNutritionStore.ts:437)) is the closest existing flow. Two lessons from it: (a) it does N sequential `addEntry`s with no transaction — our re-log MUST use `db.withTransactionAsync` to avoid partial inserts, (b) it refreshes `todaysLog` but not `selectedDateLog` — our re-log MUST call `loadLogForDate(targetDate)` (the user may be re-logging on a past date they're filling in).
4. **Repo test pattern** ([nutrition-repository.test.ts:10-23](src/db/nutrition-repository.test.ts:10)) mocks `getDatabase` with jest fns including `withTransactionAsync: jest.fn((fn) => fn())`. Our new tests slot in directly — no new test infra.
5. **Icon direction** — `arrow-back` / `chevron-back` render as-is in forced-RTL without conditionals (see [PortionPicker.tsx:108](src/components/nutrition/PortionPicker.tsx:108)). Use `chevron-back` in the pill. DO NOT add `isRTL()` conditional (per user memory: RTL is framework-level).
6. **MealType quirk** — storage uses snake_case (`pre_workout` / `post_workout`) but i18n keys in `nutrition.meals.*` use camelCase (`preWorkout` / `postWorkout`). When mapping `MealType` to meal name, use the same `mealNameMap` pattern from `MealSection.tsx:33-40`. `MEAL_TYPES` in `NutritionDashboard` renders only 4 (breakfast/lunch/dinner/snack) — pre/post_workout are NOT in the 4-meal dashboard. Scope the feature to those 4.
7. **Pill label templating** — single i18n key `nutrition.sameMealAs: 'אותה {meal} כמו {day}'` + a day-word that's either `nutrition.yesterdayWord: 'אתמול'` or `nutrition.daysOfWeek.*: 'יום ראשון' | 'יום שני' | ...`. Component builds the final string via two `.replace` calls. Tests assert the final string, not the template.
8. **Pill width concern** — `"אותה ארוחת בוקר כמו יום רביעי"` is ~28 chars. At default font size on iPhone SE (320pt width, ~16pt spacing padding on each side), should fit one line. Device verify will confirm. If wraps, drop the leading "יום" (make day-word just `'רביעי'`). Handle if seen.
9. **Same-day exclusion in walkback** — spec says `date < selectedDate`. Critical: SQL `WHERE date < ?` using selectedDate, NOT `<=`. A user looking at an empty meal TODAY does not want to re-log from a DIFFERENT empty meal on today.
10. **Order preservation** — food log rows inside a meal should stay in original insertion order after clone. Use `for...of` loop inside `withTransactionAsync` (sequential), NOT `Promise.all` (parallel, non-deterministic order with SQLite's serialized driver).

### Task 1: Repo — `getPreviousMealEntries` + `cloneEntriesToDate` (M)

**Files:** `src/db/nutrition-repository.ts`, `src/db/nutrition-repository.test.ts`

**What:**

Add two methods to `FoodLogRepository`:

```ts
async getPreviousMealEntries(
  mealType: MealType,
  beforeDate: string,       // ISO YYYY-MM-DD, exclusive upper bound
  maxLookback = 7,          // days
): Promise<{ entries: FoodLogEntry[]; sourceDate: string } | null>
```

Impl: single SQL query fetching all rows with `meal_type = ? AND date < ? AND date >= ?` ordered `date DESC, id ASC` (id ASC preserves insertion order within a date). Compute `minDate = beforeDate - maxLookback days`. In JS, group rows by date and pick the first (most recent). Return `null` if empty.

```ts
async cloneEntriesToDate(
  entries: FoodLogEntry[],
  targetDate: string,
): Promise<FoodLogEntry[]>
```

Impl: wrap in `db.withTransactionAsync`. For each entry, `INSERT` a new row with fresh `generateId()`, `date = targetDate`, all other fields copied. Sequential `for...of` loop for deterministic ordering. Return array of new `FoodLogEntry`s in the same order as input. Empty input → return `[]` without opening a transaction.

**Test first (RED — 6 tests in nutrition-repository.test.ts):**

```ts
describe('FoodLogRepository.getPreviousMealEntries', () => {
  it('returns the most recent prior day with entries for the given meal type', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      {
        /* row: breakfast 2026-04-22 */
      },
      {
        /* row: breakfast 2026-04-22 */
      },
      {
        /* row: breakfast 2026-04-20 */
      },
    ])
    const result = await foodLogRepository.getPreviousMealEntries('breakfast', '2026-04-23', 7)
    expect(result).not.toBeNull()
    expect(result!.sourceDate).toBe('2026-04-22')
    expect(result!.entries).toHaveLength(2)
  })

  it('returns null when no prior entries exist in the 7-day window', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])
    expect(await foodLogRepository.getPreviousMealEntries('breakfast', '2026-04-23', 7)).toBeNull()
  })

  it('excludes the selectedDate itself (strict <, not <=)', async () => {
    await foodLogRepository.getPreviousMealEntries('lunch', '2026-04-23', 7)
    const [[sql, params]] = mockGetAllAsync.mock.calls
    expect(sql).toMatch(/date < \?/)
    expect(params).toContain('2026-04-23')
    expect(params).not.toContain('2026-04-23 00:00:00')
  })

  it('bounds the window at exactly maxLookback days (7 by default)', async () => {
    await foodLogRepository.getPreviousMealEntries('breakfast', '2026-04-23', 7)
    const [[, params]] = mockGetAllAsync.mock.calls
    expect(params).toContain('2026-04-16') // 7 days before 04-23
  })
})

describe('FoodLogRepository.cloneEntriesToDate', () => {
  it('inserts N rows in a transaction with fresh ids and targetDate', async () => {
    const entries = [{ id: 'old-1', foodId: 'f1', /* ... */ date: '2026-04-22' } as FoodLogEntry]
    const cloned = await foodLogRepository.cloneEntriesToDate(entries, '2026-04-23')
    expect(mockWithTransactionAsync).toHaveBeenCalledTimes(1)
    expect(mockRunAsync).toHaveBeenCalledTimes(1)
    expect(cloned[0].id).not.toBe('old-1')
    expect(cloned[0].date).toBe('2026-04-23')
    expect(cloned[0].foodId).toBe('f1')
  })

  it('returns empty array and skips transaction for empty input', async () => {
    expect(await foodLogRepository.cloneEntriesToDate([], '2026-04-23')).toEqual([])
    expect(mockWithTransactionAsync).not.toHaveBeenCalled()
  })
})
```

**Acceptance:**

- All 6 tests pass (after GREEN impl).
- SQL is parameterized (no concatenation) — assert the SQL string contains `?` placeholders, not values.
- `npm test -- --silent 2>&1 | tail -5` clean.
- `npm run lint` + `npm run typecheck` clean.

### Task 2: Store — `relogPreviousMeal` / `undoRelog` / `relogToast` (M)

**Files:** `src/stores/useNutritionStore.ts`, `src/stores/useNutritionStore.test.ts`

**What:**

Add to `NutritionStore` interface + state + actions:

```ts
relogToast: { insertedIds: string[]; count: number } | null

relogPreviousMeal: (mealType: MealType, targetDate: string) => Promise<void>
undoRelog: () => Promise<void>
clearRelogToast: () => void
```

`relogPreviousMeal` flow: `getPreviousMealEntries(mealType, targetDate, 7)` → if null, no-op (silent). Otherwise `cloneEntriesToDate(entries, targetDate)` → set `relogToast = { insertedIds, count }` → `loadLogForDate(targetDate)` to refresh `selectedDateLog`. Wrap in try/catch, surface error via existing `error` state on failure (pattern from `logSavedMeal`).

`undoRelog`: read `insertedIds` from current `relogToast`, no-op if null. Delete via `foodLogRepository.delete(id)` (check BaseRepository for bulk-delete; if not present, sequential `delete(id)` calls are fine — under a transaction to roll back on failure). `loadLogForDate(current selectedDate)`. `clearRelogToast()`. Must capture `insertedIds` BEFORE calling `clearRelogToast` (closure safety).

`clearRelogToast`: `set({ relogToast: null })`.

**Test first (RED — 5 tests in useNutritionStore.test.ts):**

```ts
describe('relogPreviousMeal', () => {
  it('clones previous-day entries to the target date and sets relogToast', async () => {
    mockGetPreviousMealEntries.mockResolvedValueOnce({
      entries: [MOCK_ENTRY, MOCK_ENTRY],
      sourceDate: '2026-04-22',
    })
    mockCloneEntriesToDate.mockResolvedValueOnce([
      { ...MOCK_ENTRY, id: 'new-1' },
      { ...MOCK_ENTRY, id: 'new-2' },
    ])
    await useNutritionStore.getState().relogPreviousMeal('breakfast', '2026-04-23')
    const { relogToast } = useNutritionStore.getState()
    expect(relogToast?.count).toBe(2)
    expect(relogToast?.insertedIds).toEqual(['new-1', 'new-2'])
    expect(mockLoadLogForDate).toHaveBeenCalledWith('2026-04-23')
  })

  it('is a no-op when no prior meal found (silent)', async () => {
    mockGetPreviousMealEntries.mockResolvedValueOnce(null)
    await useNutritionStore.getState().relogPreviousMeal('breakfast', '2026-04-23')
    expect(mockCloneEntriesToDate).not.toHaveBeenCalled()
    expect(useNutritionStore.getState().relogToast).toBeNull()
  })
})

describe('undoRelog', () => {
  it('deletes the N inserted rows and clears the toast', async () => {
    useNutritionStore.setState({ relogToast: { insertedIds: ['a', 'b'], count: 2 } })
    await useNutritionStore.getState().undoRelog()
    expect(mockDelete).toHaveBeenCalledWith('a')
    expect(mockDelete).toHaveBeenCalledWith('b')
    expect(useNutritionStore.getState().relogToast).toBeNull()
  })

  it('is a no-op when relogToast is null', async () => {
    useNutritionStore.setState({ relogToast: null })
    await useNutritionStore.getState().undoRelog()
    expect(mockDelete).not.toHaveBeenCalled()
  })
})

describe('consecutive re-logs', () => {
  it('a second relog replaces the toast — undo deletes only the second batch', async () => {
    // ... first relog sets toast {ids: a,b}
    // ... second relog sets toast {ids: c,d}
    // ... undo deletes c,d (NOT a,b)
  })
})
```

**Acceptance:**

- All 5 tests pass.
- Error path: if `cloneEntriesToDate` throws, `relogToast` stays `null`, `error` state is set. Add a 6th test if it reveals a bug.

### Task 3: i18n keys (S)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`

**What:** add to `nutrition`:

```ts
// he.ts
sameMealAs: 'אותה {meal} כמו {day}',
yesterdayWord: 'אתמול',
daysOfWeek: {
  sunday: 'יום ראשון',
  monday: 'יום שני',
  tuesday: 'יום שלישי',
  wednesday: 'יום רביעי',
  thursday: 'יום חמישי',
  friday: 'יום שישי',
  saturday: 'שבת',
},
itemsAddedWithUndo: 'הוספו {count} פריטים',
undo: 'בטל',
```

English mirror:

```ts
sameMealAs: 'Same {meal} as {day}',
yesterdayWord: 'yesterday',
daysOfWeek: { sunday: 'Sunday', monday: 'Monday', /* ... */ saturday: 'Saturday' },
itemsAddedWithUndo: '{count} items added',
undo: 'Undo',
```

**Test first:** N/A (pure strings, covered by UI tests in Tasks 4-6).

**Acceptance:**

- Grep confirms all keys present in both locales.
- Lint + typecheck clean (TypeScript's structural check enforces `en.ts` matches `he.ts` via `TranslationKeys` export — verified by existing pattern).

### Task 4: Component — `PreviousMealPill` (S)

**Files:** `src/components/nutrition/PreviousMealPill.tsx`, `src/components/nutrition/PreviousMealPill.test.tsx`

**What:** new component. Full-width pill with chevron-back icon + localized label. Pattern to follow visually: existing button styles from `MealSection.tsx:192` (addButton — colors/borderRadius).

```tsx
interface PreviousMealPillProps {
  mealTypeLabel: string // already-localized meal name, e.g. "ארוחת בוקר"
  dayWord: string // already-localized day word, e.g. "אתמול" or "יום ראשון"
  onPress: () => void
  testID?: string
}
```

Compose label inline via `.replace('{meal}', ...).replace('{day}', ...)` on `strings.sameMealAs`. Label + chevron-back icon on the left (in forced-RTL layout, `flexDirection: 'row'` naturally puts icon at the "end" of reading direction). Tap target: full pill width, min 44pt height.

**Test first (RED — component tests):**

```tsx
it('renders the composed label with meal + day interpolation', () => {
  const { getByText } = render(
    <PreviousMealPill
      mealTypeLabel="ארוחת בוקר"
      dayWord="אתמול"
      onPress={jest.fn()}
      testID="pill"
    />,
  )
  expect(getByText('אותה ארוחת בוקר כמו אתמול')).toBeTruthy()
})

it('fires onPress when tapped', () => {
  const onPress = jest.fn()
  const { getByTestId } = render(
    <PreviousMealPill mealTypeLabel="ארוחת בוקר" dayWord="אתמול" onPress={onPress} testID="pill" />,
  )
  fireEvent.press(getByTestId('pill'))
  expect(onPress).toHaveBeenCalledTimes(1)
})
```

**Acceptance:**

- Both tests pass.
- RNTL `render()` works (no native-dep issues).
- Lint + typecheck clean.

### Task 5: `MealSection` integration (S)

**Files:** `src/components/nutrition/MealSection.tsx`, `src/components/nutrition/MealSection.test.tsx`

**What:** add optional props `previousMealDayWord?: string | null` and `onRelog?: () => void`. When `isEmpty && previousMealDayWord && onRelog`, render `<PreviousMealPill mealTypeLabel={mealName} dayWord={previousMealDayWord} onPress={onRelog}>` above the bottom "+" row. When either is missing, render nothing extra (existing empty-state behavior preserved).

**Test first (RED — 3 new tests in MealSection.test.tsx):**

```tsx
it('renders PreviousMealPill when empty and previousMealDayWord is provided', () => {
  const { getByTestId } = render(
    <MealSection
      mealType="breakfast"
      date="2026-04-23"
      foods={[]}
      previousMealDayWord="אתמול"
      onRelog={jest.fn()}
      onAddFood={jest.fn()}
      onRemoveFood={jest.fn()}
    />,
  )
  expect(getByTestId('meal-section-breakfast-relog-pill')).toBeTruthy()
})

it('does not render PreviousMealPill when meal has foods', () => {
  const { queryByTestId } = render(
    <MealSection
      mealType="breakfast"
      date="2026-04-23"
      foods={[MOCK_ENTRY]}
      previousMealDayWord="אתמול"
      onRelog={jest.fn()}
      onAddFood={jest.fn()}
      onRemoveFood={jest.fn()}
    />,
  )
  expect(queryByTestId('meal-section-breakfast-relog-pill')).toBeNull()
})

it('does not render PreviousMealPill when previousMealDayWord is null', () => {
  const { queryByTestId } = render(
    <MealSection
      mealType="breakfast"
      date="2026-04-23"
      foods={[]}
      previousMealDayWord={null}
      onRelog={jest.fn()}
      onAddFood={jest.fn()}
      onRemoveFood={jest.fn()}
    />,
  )
  expect(queryByTestId('meal-section-breakfast-relog-pill')).toBeNull()
})
```

**Acceptance:**

- All 3 new tests pass; all prior MealSection tests still pass.

### Task 6: `NutritionDashboard` — per-meal lookup + toast (M)

**Files:** `src/components/nutrition/NutritionDashboard.tsx`

**What:** Three changes:

1. **Per-meal previous-meal lookup.** Add a `useEffect` that, on `selectedDate` change (or `selectedDateLog` change reflecting a clone/undo), re-queries `foodLogRepository.getPreviousMealEntries(mealType, selectedDate, 7)` for each of the 4 `MEAL_TYPES` where the meal is currently empty. Store result in local state `previousMealLookup: Partial<Record<MealName, { dayWord: string } | null>>`. Day-word derivation:
   - If `sourceDate === yesterdayOf(selectedDate)` → `strings.yesterdayWord`.
   - Else → `strings.daysOfWeek[weekdayOf(sourceDate)]`.
   - Compute in a helper `deriveDayWord(sourceDate, selectedDate, strings)` co-located at the bottom of the file (pattern from `buildToastText`).

2. **Wire `MealSection` props.** Pass `previousMealDayWord={previousMealLookup[mealType]?.dayWord ?? null}` and `onRelog={() => useNutritionStore.getState().relogPreviousMeal(mealType, selectedDate)}`.

3. **Render relog-toast with undo.** Duplicate the existing `redistributionToast` block: new `relogToast` subscribe, new `Animated.Value` ref, new 5s timer, new toast view. Toast body: `<Text>{strings.itemsAddedWithUndo.replace('{count}', String(relogToast.count))}</Text>` + `<Pressable onPress={() => { undoRelog(); clearRelogToast(); }}><Text>{strings.undo}</Text></Pressable>`. testID `relog-toast`. testID on undo button `relog-toast-undo`.

**Test first:** SKIP automated — this is UI composition over already-tested units. Device verify in Task 7 covers it. (Per project workflow: UI-only tasks have TDD optional.) If we want a safety net, add one integration test that spies on `relogPreviousMeal` being called when the pill is tapped — but prefer manual verify to keep the task small.

**Acceptance:**

- `npm run lint` + `npm run typecheck` clean.
- `npm test -- --silent 2>&1 | tail -5` — all prior tests still pass (no regressions in Dashboard-dependent tests).

### Task 7: Device verify — all 8 acceptance scenarios (S, manual)

**Files:** none.

**What:** run `dev` alias. Walk through each of the 8 scenarios from the spec's Acceptance Criteria in sequence, checking each box individually per workflow step 18 (never batch-check, never rubber-stamp). Specifically: (1) yesterday breakfast, (2) walkback 2 days, (3) fresh install shows nothing, (4) 10-day gap shows nothing, (5) undo within 5s, (6) no undo → permanent after 5s, (7) mix with manual add → undo scoped correctly, (8) consecutive re-logs isolated.

**Acceptance:**

- 8/8 scenarios verified with screenshots or brief description of observed behavior.
- No RTL regressions (pill layout, icon direction, toast positioning).
- No crashes, no console errors.

### Ordering rationale

- Task 1 (repo) first — pure data layer, no UI deps, fast TDD cycle.
- Task 2 (store) depends on Task 1 methods existing (test mocks the repo methods).
- Task 3 (i18n) can run parallel to 1-2 but listed here so Task 4 can use real strings.
- Task 4 (pill component) depends on Task 3 strings.
- Task 5 (MealSection) depends on Task 4 component.
- Task 6 (Dashboard wiring) depends on Tasks 1, 2, 3, 5 — touches the most surface, lowest-risk to land last because everything it calls is already tested.
- Task 7 can only run after all code lands.

### Risk / gotcha notes

- **Animated `Value` cleanup on unmount** — both toast useEffects hold timer refs. The existing redistributionToast block already has the cleanup pattern (`return () => clearTimeout(...)`). Copy it to the relog-toast block. Missed cleanup = timer fires on unmounted component = dev warning.
- **Per-meal SQL fan-out** — Task 6's per-meal lookup runs 4 queries on every date change. For a 7-day window this is trivial (SQLite local, indexed on `date` likely exists; if not, consider adding `CREATE INDEX idx_food_log_meal_date ON food_log (meal_type, date DESC)` — out of scope for this PR unless profiling shows a problem).
- **Stale pill after clone** — after `relogPreviousMeal` fills the meal, `selectedDateLog` updates, `mealGroups.get(mealType)` becomes non-empty, `isEmpty=false`, pill unmounts automatically. No explicit cleanup needed. Confirmed by Task 5 test #2.
- **Stale pill after undo** — after `undoRelog`, `selectedDateLog` updates back to empty, pill re-mounts. But the previous-meal lookup's local state was computed on the prior `selectedDateLog` — it should still point at the same source day (the source day didn't change). Safe, but device verify Scenario 5 covers this explicitly.
- **Transaction lock contention** — `cloneEntriesToDate` holds a transaction while doing N `INSERT`s. N is at most 10-ish foods per meal — fast on SQLite. Not a concern.
- **Bulk delete in undoRelog** — check whether `BaseRepository<T>` has a `deleteWhere(idIn: string[])` or similar. If not, `for...of` inside a transaction is the equivalent and matches Task 1's cloning pattern. Implementation note, not a blocker.
