# Feature: Text-Search Manual-Create + Repository Strict-Insert Invariant

**Date:** 2026-04-18
**Status:** Approved
**Branch:** `feat/text-search-manual-create`
**Base:** `origin/main` after PR #76 merge

## What

Two coupled changes:

1. **New entry point: text-search "no results" → manual-create.** Wire the existing-but-dead "הוסף מאכל אישי" button at the bottom of `FoodSearchSheet` to open `ManualFoodForm` (extracted in PR #76). Always visible — not gated on no-results. Prefill `nameHe` from the current search query.
2. **Repository invariant moved from lessons.md into executable code.** Rename `foodRepository.insertFood` → `upsertFood` (the existing `INSERT OR REPLACE` semantic, used by OFF refresh). Add `insertFoodStrict` that throws a tagged `FoodCollisionError` on PK collision. Manual-create paths use `insertFoodStrict`; OFF refresh paths use `upsertFood`. The verb at each call site IS the invariant.

The form is extended for an optional-EAN mode:

- Scanner path (PR #76): unchanged — `ean` prop given, rendered read-only.
- Text-search path (this PR): `ean` prop omitted — form renders an optional EAN TextInput at top, prefills `nameHe` via new `initialNameHe` prop.
- Submit with typed EAN → host calls `insertFoodStrict("manual_<typed-ean>")`. Collision → three-button sheet ("השתמש במוצר הקיים" / "החלף בנתונים החדשים" / "ביטול").
- Submit with no EAN → id becomes `manual_<uuid>` via `expo-crypto.randomUUID()`. No collision possible.

## Why

PR #76 shipped the form for the scanner unhappy path but explicitly scoped the text-search caller out (would have ballooned the PR). The follow-up was queued in TASKS.md with the collision-UX decision (Q5) pre-locked. Real-device usage of PR #76 confirmed the form's UX works; this PR is about reaching it from the second entry point and closing the strict-vs-upsert invariant gap that lessons.md flagged.

User value: any product OFF doesn't know AND that the user has no barcode for (homemade, restaurant, no-barcode bulk items, niche imports) becomes loggable without leaving the search sheet. Today such products are uncloggable via the app — users have to invent a near-match or skip logging entirely, both of which corrupt the dataset feeding TDEE/macro recalibration.

The repository rename is risk-reduction: the lessons.md-only invariant from PR #76 was an honor-system rule. Moving it into the API names means a future contributor can't accidentally reach for `insertFood` without seeing "Strict" or "upsert" in the verb and consciously picking.

## Scope Decisions (locked via brainstorm)

1. **CTA placement:** wire the always-visible "הוסף מאכל אישי" button at the bottom of `FoodSearchSheet` (currently rendered with no `onPress` from PR #40). Not conditional on no-results. Prefill `nameHe` from the current `query` if any.
2. **Form contract:** make `ean` optional on `ManualFoodForm`. When present (scanner path), render read-only EAN row exactly as today. When absent (text-search path), render an optional `TextInput` for EAN at the top + prefill `nameHe` from new `initialNameHe?: string` prop.
3. **EAN format validation:** loose acceptance + digit-strip normalization. Trim whitespace, strip non-digit characters, no length check, no error UI on the field. Matches MyFitnessPal / Yazio / FatSecret / LoseIt convention. A typed EAN is a "convenience identifier," not a true product key — strict validation creates friction without proportional benefit.
4. **Collision UX (Q5 from PR #76):** three-button bottom sheet on `insertFoodStrict` collision: "השתמש במוצר הקיים" (close form, route to PortionPicker with existing food — same as if user had searched and tapped a result), "החלף בנתונים החדשים" (overwrite via `upsertFood`, then route to PortionPicker with new food), "ביטול" (close sheet, form stays open with all values preserved).
5. **Repository API:** rename `insertFood` → `upsertFood`; add `insertFoodStrict` throwing tagged `FoodCollisionError` (carries the existing `FoodItem` so the host's "use existing" path doesn't re-query). All four current call sites updated (`BarcodeScannerSheet`, `scan-resolver`, scan-resolver tests, food-repository tests).
6. **UUID source:** `expo-crypto.randomUUID()` (already a dep — referenced in [lessons.md:32](lessons.md:32) as a pure JS module). Sync, RFC4122 v4. Generated in the form's submit handler when EAN field is blank.

## Requirements

- [ ] "הוסף מאכל אישי" button in `FoodSearchSheet` opens `ManualFoodForm` in no-EAN mode
- [ ] `nameHe` prefilled from current search query (trimmed, ignored if empty)
- [ ] Form renders an optional EAN `TextInput` at top when `ean` prop is undefined
- [ ] EAN input strips non-digit characters + trims whitespace before constructing the id
- [ ] No format validation on the EAN field (no length check, no error UI)
- [ ] Submit with blank EAN → id = `manual_${randomUUID()}`
- [ ] Submit with typed EAN → id = `manual_<digits-only>`
- [ ] `foodRepository.insertFood` renamed to `upsertFood` (semantics unchanged: `INSERT OR REPLACE`)
- [ ] `foodRepository.insertFoodStrict(food)` added; uses bare `INSERT INTO`; on PK collision throws `FoodCollisionError` carrying the existing `FoodItem`
- [ ] `FoodCollisionError extends Error`, `name === 'FoodCollisionError'`, exported from food-repository module
- [ ] `BarcodeScannerSheet.handleManualSubmit` calls `insertFoodStrict` (was `insertFood`); the existing scanner-path `getByBarcode` pre-check guarantees no collision in practice but the strict call is defense-in-depth
- [ ] OFF refresh path inside scan-resolver continues to use `upsertFood` (legitimate overwrite — partial→full OFF data)
- [ ] FoodSearchSheet host catches `FoodCollisionError` from manual-create submit and shows the three-button collision sheet
- [ ] "השתמש במוצר הקיים" → close form + sheet, set `selectedFood = error.existing`, opens PortionPicker
- [ ] "החלף בנתונים החדשים" → call `upsertFood(newFood)` + close form + sheet, set `selectedFood = newFood`, opens PortionPicker
- [ ] "ביטול" → close sheet only, form stays open with all values preserved
- [ ] All new strings via `t()`, no hardcoded UI strings
- [ ] All RTL via the existing forced-RTL framework (no `isRTL()` conditionals)

## Design

### Architecture

```
FoodSearchSheet
  ├─ existing recent / search / barcode-scan flow (unchanged)
  ├─ "הוסף מאכל אישי" Pressable (existing button, now wired)
  │    └─ onPress → setManualFormVisible(true)
  ├─ ManualFoodForm  (new — rendered when manualFormVisible === true)
  │    ├─ Props: { initialNameHe: query.trim() || undefined; onSubmit; onCancel }
  │    ├─ NO ean prop → renders EAN TextInput at top + prefills nameHe
  │    └─ onSubmit(food) → host runs collision flow:
  │         try insertFoodStrict(food)
  │         catch FoodCollisionError → setCollisionState({ existing, attempted: food })
  │         success → setSelectedFood(food) → opens PortionPicker
  └─ ManualFoodCollisionSheet  (new — rendered when collisionState !== null)
       ├─ Title: "מוצר עם הברקוד הזה כבר קיים: {existing.nameHe}"
       ├─ Action 1 ("השתמש במוצר הקיים") → setSelectedFood(existing) + close all
       ├─ Action 2 ("החלף בנתונים החדשים") → upsertFood(attempted) + setSelectedFood(attempted) + close all
       └─ Action 3 ("ביטול") → setCollisionState(null), form stays
```

### Form contract change (ManualFoodForm)

```ts
// PR #76:
interface ManualFoodFormProps {
  ean: string // required
  onSubmit: (food: FoodItem) => void | Promise<void>
  onCancel: () => void
  testID?: string
}

// This PR:
interface ManualFoodFormProps {
  ean?: string // optional; absent → manual mode
  initialNameHe?: string // prefill (text-search query)
  onSubmit: (food: FoodItem) => void | Promise<void>
  onCancel: () => void
  testID?: string
}
```

Internal change in submit handler:

```ts
// Determine id BEFORE building the FoodItem
let foodId: string
if (ean != null) {
  foodId = `manual_${ean}` // scanner path — ean already validated upstream
} else {
  const typed = stripToDigits(typedEan.trim())
  foodId = typed.length > 0 ? `manual_${typed}` : `manual_${randomUUID()}`
}
```

### Repository API change (foodRepository)

```ts
// PR #76:
async insertFood(food: FoodItem): Promise<void>   // INSERT OR REPLACE

// This PR:
async upsertFood(food: FoodItem): Promise<void>          // RENAMED — same body
async insertFoodStrict(food: FoodItem): Promise<void>    // NEW — bare INSERT, throws on PK collision

export class FoodCollisionError extends Error {
  readonly existing: FoodItem
  constructor(existing: FoodItem) {
    super(`Food with id "${existing.id}" already exists`)
    this.name = 'FoodCollisionError'
    this.existing = existing
  }
}
```

`insertFoodStrict` implementation:

1. `const existing = await getById(food.id)` — explicit pre-check (avoid relying on SQLite's SQLITE_CONSTRAINT raw-error string parsing for branching logic)
2. If `existing != null` → throw `new FoodCollisionError(existing)`
3. Else → `INSERT INTO foods (...) VALUES (?)`

### Data flow — text-search manual-create (no EAN)

```
user types "פתיבר ביתי" → 0 results
user taps "הוסף מאכל אישי"
  → ManualFoodForm opens with initialNameHe="פתיבר ביתי", no ean prop
user fills macros, leaves EAN blank, taps שמור
  → form generates id = manual_<uuid-v4>
  → onSubmit(food)
  → host calls insertFoodStrict(food) — no collision possible (uuid)
  → host setSelectedFood(food) → PortionPicker opens
```

### Data flow — text-search manual-create (typed EAN, no collision)

```
user taps "הוסף מאכל אישי" (no query, or any query)
  → form opens, user types EAN "7290 0123 45678" + macros
  → on submit: typed → "7290012345678" (digit-strip)
  → id = manual_7290012345678
  → onSubmit(food)
  → insertFoodStrict succeeds
  → PortionPicker opens
later: user scans the same EAN with the camera
  → getByBarcode("7290012345678") matches the manual_ entry
  → routes to PortionPicker directly (existing PR #76 happy path)
```

### Data flow — text-search manual-create (typed EAN, collision)

```
user taps "הוסף מאכל אישי", types EAN "7290012345678" (already exists as manual_)
  → on submit: id = manual_7290012345678
  → insertFoodStrict throws FoodCollisionError(existing)
  → host catches → setCollisionState({ existing, attempted: food })
  → form stays mounted (values preserved)
  → ManualFoodCollisionSheet renders over the form
  → user picks one of three actions:
    "השתמש במוצר הקיים" → setSelectedFood(existing), close form+sheet → PortionPicker(existing)
    "החלף בנתונים החדשים" → upsertFood(attempted) → setSelectedFood(attempted), close → PortionPicker(attempted)
    "ביטול" → setCollisionState(null), form stays mounted with all values preserved
```

### Files to Create/Modify

| File                                                         | Action | Description                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/food-repository.ts`                                  | Modify | Rename `insertFood` → `upsertFood`. Add `insertFoodStrict` (pre-checks via `getById`, throws `FoodCollisionError`). Add and export `FoodCollisionError` class.                                                                                                                                                 |
| `src/db/food-repository.test.ts`                             | Modify | Rename existing `insertFood` tests to `upsertFood`. Add tests: `insertFoodStrict` succeeds when id is fresh; `insertFoodStrict` throws `FoodCollisionError` on existing id; thrown error carries the existing `FoodItem`; `upsertFood` overwrites unchanged.                                                   |
| `src/components/nutrition/ManualFoodForm.tsx`                | Modify | Make `ean?` optional. Add `initialNameHe?` prop (used as `useState` initializer). Render EAN TextInput when `ean` undefined. Add `stripToDigits` helper (or use shared). Submit handler picks id from prop / typed / uuid. Import `randomUUID` from `expo-crypto`.                                             |
| `src/components/nutrition/ManualFoodForm.test.tsx`           | Modify | Existing 14 tests stay green (all pass `ean="..."`). Add tests: prefills `nameHe` from `initialNameHe`; renders EAN input when `ean` undefined; submitting without EAN produces `manual_<uuid-format>`; submitting with typed-EAN strips non-digits; submitting "7290 0123 45678" → id `manual_7290012345678`. |
| `src/components/nutrition/ManualFoodCollisionSheet.tsx`      | Create | Bottom sheet (Modal) with title + three Pressables. Props: `{ existing: FoodItem; onUseExisting; onReplace; onCancel; testID? }`. Hebrew strings via `t().manualFood.collision.*`.                                                                                                                             |
| `src/components/nutrition/ManualFoodCollisionSheet.test.tsx` | Create | Tests: renders existing food name; each button fires the corresponding callback; testIDs scoped.                                                                                                                                                                                                               |
| `src/components/nutrition/FoodSearchSheet.tsx`               | Modify | Wire the existing "הוסף מאכל אישי" button (`onPress` was missing). Add state: `manualFormVisible`, `collisionState`. Render `ManualFoodForm` (Modal) when visible. Implement collision flow: try `insertFoodStrict` → catch `FoodCollisionError` → render `ManualFoodCollisionSheet`.                          |
| `src/components/nutrition/FoodSearchSheet.test.tsx`          | Modify | Add tests: "הוסף מאכל אישי" tap opens manual form; query is prefilled into `initialNameHe`; collision shows sheet; "use existing" routes to PortionPicker with existing food; "replace" calls `upsertFood` + routes to PortionPicker with new food; "cancel" keeps form open.                                  |
| `src/components/nutrition/scan-resolver.ts`                  | Modify | Rename `insertFood` dep field → `upsertFood`. Update body call site.                                                                                                                                                                                                                                           |
| `src/components/nutrition/scan-resolver.test.ts`             | Modify | Rename mock `insertFood` → `upsertFood` across all 8 tests.                                                                                                                                                                                                                                                    |
| `src/components/nutrition/BarcodeScannerSheet.tsx`           | Modify | (1) Rename `foodRepository.insertFood` → `upsertFood` in scan-resolver deps wiring. (2) `handleManualSubmit` uses `insertFoodStrict` (was `insertFood`) — defense in depth even though `getByBarcode` already rules out collisions on this path.                                                               |
| `src/i18n/he.ts`                                             | Modify | Add: `nutrition.addCustomFood` already exists — no rename needed. Add `manualFood.collision.{title, useExisting, replace, cancel}`. Add `manualFood.eanInputLabel`, `manualFood.eanInputPlaceholder` (for the no-EAN-mode input).                                                                              |
| `src/i18n/en.ts`                                             | Modify | Mirror new keys in English.                                                                                                                                                                                                                                                                                    |
| `src/shared/normalizeEan.ts`                                 | Create | Pure helper: `normalizeEan(raw: string): string` — trims, strips non-digit characters. Co-located shared module (used by form). 100% test coverage trivially.                                                                                                                                                  |
| `src/shared/normalizeEan.test.ts`                            | Create | Tests: empty → empty; "7290012345678" unchanged; "7290 0123 45678" → "7290012345678"; " abc 123 def 456 " → "123456"; only-letters → empty string; only-whitespace → empty string.                                                                                                                             |
| `lessons.md`                                                 | Modify | Add new lesson: "Repository invariant moved into the API verb." Replace the old lessons.md "INSERT OR REPLACE is a footgun" entry with a pointer to the new strict/upsert split. Add lesson about three-button collision sheet pattern.                                                                        |
| `TASKS.md`                                                   | Modify | Mark this task done with today's date in the same commit (workflow rule #8).                                                                                                                                                                                                                                   |
| `REVIEW.md`                                                  | Modify | Add post-`/review`: any new patterns revealed (e.g. tagged-error-with-payload pattern, three-action sheet pattern).                                                                                                                                                                                            |

## Acceptance Criteria

- [ ] Tap "הוסף מאכל אישי" with no search query → form opens, `nameHe` field is empty, EAN input visible at top
- [ ] Tap "הוסף מאכל אישי" with query "פתיבר ביתי" → form opens with `nameHe` prefilled to "פתיבר ביתי"
- [ ] Submit form with valid macros + blank EAN → food persisted with `manual_<uuid>` id (verify via DB query in test, format: `manual_` + 36-char uuid)
- [ ] Submit form with valid macros + typed EAN "7290012345678" (no existing collision) → food persisted with id `manual_7290012345678`, PortionPicker opens
- [ ] Submit form with EAN typed as "7290 0123 45678" (with spaces) → food persisted with id `manual_7290012345678` (digit-strip + trim)
- [ ] Submit form with EAN "abc123def456" → food persisted with id `manual_123456` (digit-strip removes letters)
- [ ] Submit form with only-non-digit EAN ("abc") → behaves as blank EAN → id `manual_<uuid>` (digit-strip yields empty string)
- [ ] Submit with typed EAN that already exists in DB as `manual_<ean>` → collision sheet shows
- [ ] Collision sheet "השתמש במוצר הקיים" → form + sheet close; PortionPicker opens with the EXISTING food
- [ ] Collision sheet "החלף בנתונים החדשים" → `upsertFood` called with new food; form + sheet close; PortionPicker opens with the NEW food (DB now has the new values)
- [ ] Collision sheet "ביטול" → sheet closes, form remains open, all field values preserved (user can edit EAN and re-submit)
- [ ] Re-scanning the same EAN after manual-create with typed EAN → goes straight to PortionPicker via `getByBarcode` (regression check; PR #76 happy path still works)
- [ ] Existing scanner path (scan EAN → OFF miss → "צור מוצר חדש" CTA → form → submit) still works unchanged (regression: PR #76 acceptance criteria all green)
- [ ] OFF refresh path (scan EAN → OFF returns partial → later scan → OFF returns full) still uses `upsertFood` and overwrites correctly (regression)
- [ ] All new strings come from `t().manualFood` namespace, no hardcoded Hebrew

## Task Breakdown (TDD)

Each task: RED (failing test) → GREEN (implement) → CLEAN (refactor) → verify `gtt`.

1. **`normalizeEan` shared helper** (XS) — `src/shared/normalizeEan.ts` + tests. Pure: trim + replace `/\D/g` with empty string. 6 tests.
2. **`foodRepository.upsertFood` rename + `insertFoodStrict` + `FoodCollisionError`** (S) — repository tests RED first (rename existing, add 4 new). Implement. Verify `gtt` shows +4 net (rename is 1:1, additions are 4).
3. **Update scan-resolver + BarcodeScannerSheet for repository rename** (S) — pure mechanical: `insertFood` → `upsertFood` in deps + tests. Then change `handleManualSubmit` to `insertFoodStrict`. All existing scanner tests must stay green.
4. **`ManualFoodForm` extension: optional `ean`, `initialNameHe`, EAN input, uuid generation** (M) — RED tests first (5 new), then implement. Existing 14 tests must stay green.
5. **`ManualFoodCollisionSheet` component** (S) — new file + tests (4: renders, three callbacks fire correctly).
6. **i18n keys** (XS) — add `manualFood.collision.*` + `manualFood.eanInput*` to he.ts + en.ts. Type-safety only.
7. **Wire `FoodSearchSheet`: button onPress + form state + collision flow** (M) — RED tests first (5 new), then implement. Existing FoodSearchSheet tests must stay green.
8. **Manual device-test pass** — `dev`, run all 12 acceptance criteria on real Simulator. Document each in PR test plan.
9. **Docs** (XS) — lessons.md (new patterns), TASKS.md (mark done), REVIEW.md (post-review additions).

Estimated net delta: ~400 LoC code + ~350 LoC tests. Single-day implementation, smaller than PR #76.

## Testing Strategy

- **Unit tests (pure):** `normalizeEan` helper.
- **Repository tests:** `upsertFood` (rename, behavior unchanged), `insertFoodStrict` (success path, collision path, error payload).
- **Component tests:** `ManualFoodForm` extension (5 new tests), `ManualFoodCollisionSheet` (4 tests), `FoodSearchSheet` wiring (5 new tests).
- **Integration tests:** end-to-end through `FoodSearchSheet` — tap CTA → form → submit → collision flow. Covered by the FoodSearchSheet test file with mocked repository.
- **Manual device tests (PR test plan):** every acceptance criterion gets its own checkbox with explicit steps and observed results.

## Out of Scope (explicit non-goals)

- Edit-existing-food flow — separate follow-up. The collision-sheet "use existing" path opens PortionPicker, NOT an edit form.
- Category picker — manual-create still uses `'snacks'` default (matches PR #76, matches OFF). Category UI is a separate feature regardless of entry point.
- Multi-EAN merge ("this product has two barcodes printed on it") — single-EAN-per-food remains the model.
- Sync to OFF community — out of scope for the local-first architecture.
- Photo capture for the manual-create form — separate feature.
- Search within the user's own `manual_` foods (separate filter tab) — search already returns `manual_` entries via existing tier ordering; a dedicated filter is YAGNI.

## Lessons to capture post-ship

(Written after merge, based on what we actually learn during implementation.)

- **Repository invariant via API verb name.** The strict-vs-upsert split — and the `FoodCollisionError` payload pattern — moves a previously honor-system rule from lessons.md into a structural property of the code. New `manual_` writers can't accidentally pick the silent-overwrite method without typing `upsert` and noticing.
- **Three-button collision sheet pattern.** When the user's intent on a collision is genuinely ambiguous (use the existing one? overwrite with new data? back out?), splitting into three explicit actions is cheaper than guessing. Default action is "use existing" because it preserves data; "replace" is destructive but explicit; "cancel" is escape.
- **Pure shared helpers for input normalization.** `normalizeEan` (digit-strip + trim) joins `normalizeFoodName` in `src/shared/`. These helpers are framework-free, trivially testable, and reusable across scripts (build pipelines) and runtime (form input cleanup).
- **`expo-crypto.randomUUID()` first use in app code.** PR #76 didn't generate ids (scanner always had an EAN). This PR introduces uuid-based ids for barcode-less manual entries. Hermes-native, no polyfill, sync.
- **Form-host responsibility split.** The form constructs the `FoodItem` and emits via `onSubmit`. The host (FoodSearchSheet) decides which repository method to call (`insertFoodStrict` for manual-create, `upsertFood` for OFF refresh). This keeps the form locale-/persistence-agnostic and lets each entry point pick its own collision policy.

## Open Questions

None — all five brainstorm questions locked. Spec is implementation-ready.

## Implementation Plan

**Dependency graph (parallel groups):**

```
Group P1 (parallelizable, pure, no shared files):
  Task 1: normalizeEan helper
  Task 2: foodRepository upsertFood rename + insertFoodStrict + FoodCollisionError

Group P2 (consumes P1):
  Task 3: scan-resolver + BarcodeScannerSheet rename propagation (consumes Task 2)
  Task 4: ManualFoodForm extension (consumes Task 1, 6)
  Task 5: ManualFoodCollisionSheet (no deps beyond i18n)
  Task 6: i18n keys (no deps)

Group P3 (consumes P2):
  Task 7: FoodSearchSheet wiring (consumes Tasks 2, 4, 5, 6)

Group P4 (serial, end-of-PR):
  Task 8: Manual device test pass
  Task 9: Docs
```

Tasks 1, 2, 5, 6 can run fully in parallel. Task 3 depends on Task 2's API. Task 4 can start once Task 6's i18n keys land. Task 7 is the integration point. Tasks 8–9 are serial at commit time.

---

### Task 1: `normalizeEan` shared helper (XS)

**Files:** `src/shared/normalizeEan.ts`, `src/shared/normalizeEan.test.ts`
**Depends on:** nothing
**Parallel group:** P1

**What:**

```ts
export function normalizeEan(raw: string): string {
  return raw.trim().replace(/\D/g, '')
}
```

**Test first (RED):**

```ts
describe('normalizeEan()', () => {
  it('returns empty string for empty input')
  it('returns empty string for whitespace-only input')
  it('preserves a clean 13-digit EAN unchanged')
  it('strips spaces from "7290 0123 45678"')
  it('strips non-digit characters ("abc 123 def 456" → "123456")')
  it('returns empty string when input has no digits at all')
})
```

**Acceptance:** 6 new tests pass; helper is referentially transparent.
**Verify:** `gtt`, `npm run typecheck`

---

### Task 2: `foodRepository` rename + `insertFoodStrict` + `FoodCollisionError` (S)

**Files:** `src/db/food-repository.ts`, `src/db/food-repository.test.ts`
**Depends on:** nothing
**Parallel group:** P1

**What:**

1. Rename `insertFood` → `upsertFood` (body unchanged: `INSERT OR REPLACE`).
2. Add `FoodCollisionError extends Error` class with `existing: FoodItem` payload.
3. Add `insertFoodStrict(food)`:
   ```ts
   const existing = await this.getById(food.id)
   if (existing != null) throw new FoodCollisionError(existing)
   await db.runAsync(`INSERT INTO foods (...) VALUES (?)`, [...same params as upsertFood])
   ```
4. Export `FoodCollisionError` from the module.

**Test first (RED):**

Existing `insertFood` tests in food-repository.test.ts → renamed mechanically to `upsertFood` (no behavior change). Add:

```ts
describe('insertFoodStrict()', () => {
  it('persists a fresh food and is readable via getById')
  it('throws FoodCollisionError when id already exists')
  it('FoodCollisionError carries the existing FoodItem')
  it(
    'does NOT overwrite the existing food when collision occurs (verified via getById after throw)',
  )
})

describe('upsertFood()', () => {
  it('overwrites an existing food with the same id (regression: same as old insertFood)')
})
```

**Acceptance:** 4 new tests pass + rename of any existing `insertFood` test (1:1, no count change). Net +4.
**Verify:** `gtt`, `npm run typecheck`

---

### Task 3: scan-resolver + BarcodeScannerSheet rename propagation (S)

**Files:** `src/components/nutrition/scan-resolver.ts`, `src/components/nutrition/scan-resolver.test.ts`, `src/components/nutrition/BarcodeScannerSheet.tsx`
**Depends on:** Task 2
**Parallel group:** P2

**What:**

1. `scan-resolver.ts`: rename `insertFood` field in `ScanResolverDeps` → `upsertFood`. Update body call site (`await deps.upsertFood(result.food)`).
2. `scan-resolver.test.ts`: rename mock variable `insertFood` → `upsertFood` across all 8 tests.
3. `BarcodeScannerSheet.tsx`:
   - In the `resolveScan` deps wiring: `upsertFood: foodRepository.upsertFood.bind(foodRepository)` (was `insertFood`).
   - In `handleManualSubmit`: replace `await foodRepository.insertFood(food)` with `await foodRepository.insertFoodStrict(food)`. Add a try/catch that rethrows non-collision errors and (if collision somehow does occur — defense-in-depth, should be unreachable on this path because `getByBarcode` ran first) logs and falls back to `upsertFood` to preserve existing UX.

**Test first:** No new tests for this task — it's mechanical propagation. The 8 scan-resolver tests must stay green after the rename. Existing scanner-path behavior must not change.

**Acceptance:** Test count unchanged (still 8 + scan-resolver tests + scanner regression suite all green); `npm run lint` + `npm run typecheck` clean.
**Verify:** `gtt`, `npm run typecheck`

---

### Task 4: `ManualFoodForm` extension (M)

**Files:** `src/components/nutrition/ManualFoodForm.tsx`, `src/components/nutrition/ManualFoodForm.test.tsx`
**Depends on:** Task 1 (`normalizeEan`), Task 6 (i18n keys)
**Parallel group:** P2

**What:**

1. Make `ean?: string` (optional). Add `initialNameHe?: string` prop.
2. Initialize `nameHe` state to `initialNameHe ?? ''`.
3. Add `typedEan` state, initialized to `''`. Render a `TextInput` for EAN at the top of the form when `ean` prop is undefined. Use `t().manualFood.eanInputLabel` and `t().manualFood.eanInputPlaceholder`. Loose acceptance — no `error` prop, no validation.
4. In `handleSubmit`, replace the existing `id: \`manual\_${ean}\`` with:
   ```ts
   let foodId: string
   if (ean != null) {
     foodId = `manual_${ean}`
   } else {
     const cleaned = normalizeEan(typedEan)
     foodId = cleaned.length > 0 ? `manual_${cleaned}` : `manual_${randomUUID()}`
   }
   ```
5. Import `randomUUID` from `expo-crypto`.

**Test first (RED):**

Existing 14 tests stay green (all pass `ean="..."`). Add:

```tsx
describe('ManualFoodForm — no-EAN mode', () => {
  it('renders an EAN input field when ean prop is undefined')
  it('does NOT render the read-only EAN row when ean prop is undefined')
  it('prefills nameHe from initialNameHe prop')
  it('submits with id manual_<uuid> when EAN field is blank (id matches /^manual_[0-9a-f-]{36}$/)')
  it(
    'submits with id manual_<digits> when EAN field has typed digits (id matches input digits exactly)',
  )
  it(
    'strips non-digit characters from typed EAN before constructing id ("7290 0123 45678" → manual_7290012345678)',
  )
  it('falls through to uuid when typed EAN has no digits ("abc" → manual_<uuid>)')
})
```

Mock `expo-crypto.randomUUID` to return a deterministic value in tests:

```ts
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000000'),
}))
```

**Acceptance:** 7 new tests pass; existing 14 tests unchanged; total 21 tests in the form file.
**Verify:** `gtt`, `npm run lint`, `npm run typecheck`

---

### Task 5: `ManualFoodCollisionSheet` component (S)

**Files:** `src/components/nutrition/ManualFoodCollisionSheet.tsx` (NEW), `src/components/nutrition/ManualFoodCollisionSheet.test.tsx` (NEW)
**Depends on:** Task 6 (i18n keys)
**Parallel group:** P2

**What:**

```ts
interface ManualFoodCollisionSheetProps {
  visible: boolean
  existing: FoodItem
  onUseExisting: () => void
  onReplace: () => void
  onCancel: () => void
  testID?: string
}
```

Render a Modal (presentationStyle: pageSheet, animationType: slide-up) with:

- Title: `t().manualFood.collision.title` interpolated with `{name: existing.nameHe}`
- Three Pressables stacked vertically:
  - "השתמש במוצר הקיים" (primary action — visually emphasized)
  - "החלף בנתונים החדשים" (secondary, with destructive-tone styling)
  - "ביטול" (tertiary)

**Test first (RED):**

```tsx
describe('ManualFoodCollisionSheet', () => {
  it('renders the existing food name in the title')
  it('calls onUseExisting when "use existing" button is tapped')
  it('calls onReplace when "replace" button is tapped')
  it('calls onCancel when "cancel" button is tapped')
})
```

**Acceptance:** 4 new tests pass.
**Verify:** `gtt`, `npm run lint`, `npm run typecheck`

---

### Task 6: i18n keys (XS)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`
**Depends on:** nothing
**Parallel group:** P2

**What:** Extend `manualFood` namespace:

```ts
manualFood: {
  ...existing PR #76 keys,
  // No-EAN mode (text-search entry point)
  eanInputLabel: 'ברקוד (לא חובה)',
  eanInputPlaceholder: 'לדוגמה: 7290012345678',
  // Collision sheet
  collision: {
    title: 'מוצר עם הברקוד הזה כבר קיים: {name}',
    useExisting: 'השתמש במוצר הקיים',
    replace: 'החלף בנתונים החדשים',
    cancel: 'ביטול',
  },
}
```

Mirror in en.ts. Reuse existing `nutrition.addCustomFood` for the FoodSearchSheet button label — it already says "הוסף מאכל אישי".

**Acceptance:** Both locale files have identical key shape; `typecheck` passes.
**Verify:** `npm run typecheck`

---

### Task 7: `FoodSearchSheet` wiring (M)

**Files:** `src/components/nutrition/FoodSearchSheet.tsx`, `src/components/nutrition/FoodSearchSheet.test.tsx`
**Depends on:** Tasks 2, 4, 5, 6
**Parallel group:** P3

**What:**

1. Add state:
   ```ts
   const [manualFormVisible, setManualFormVisible] = useState(false)
   const [collisionState, setCollisionState] = useState<{
     existing: FoodItem
     attempted: FoodItem
   } | null>(null)
   ```
2. Wire the existing button:
   ```tsx
   <Pressable style={styles.customFoodButton} onPress={() => setManualFormVisible(true)} testID={`${id}-custom-food`}>
   ```
3. Render the form (Modal):
   ```tsx
   {
     manualFormVisible && (
       <Modal
         visible
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={() => setManualFormVisible(false)}
       >
         <ManualFoodForm
           initialNameHe={query.trim() || undefined}
           onSubmit={handleManualSubmit}
           onCancel={() => setManualFormVisible(false)}
         />
       </Modal>
     )
   }
   ```
4. Implement `handleManualSubmit`:
   ```ts
   async function handleManualSubmit(food: FoodItem) {
     try {
       await foodRepository.insertFoodStrict(food)
       setManualFormVisible(false)
       setSelectedFood(food)
     } catch (err) {
       if (err instanceof FoodCollisionError) {
         setCollisionState({ existing: err.existing, attempted: food })
       } else {
         throw err
       }
     }
   }
   ```
5. Render the collision sheet:
   ```tsx
   {
     collisionState && (
       <ManualFoodCollisionSheet
         visible
         existing={collisionState.existing}
         onUseExisting={() => {
           const existing = collisionState.existing
           setCollisionState(null)
           setManualFormVisible(false)
           setSelectedFood(existing)
         }}
         onReplace={async () => {
           const attempted = collisionState.attempted
           await foodRepository.upsertFood(attempted)
           setCollisionState(null)
           setManualFormVisible(false)
           setSelectedFood(attempted)
         }}
         onCancel={() => setCollisionState(null)}
       />
     )
   }
   ```

**Test first (RED):**

```tsx
describe('FoodSearchSheet — manual create', () => {
  it('opens ManualFoodForm when "הוסף מאכל אישי" button is tapped')
  it('prefills the form with the current search query as initialNameHe')
  it('routes to PortionPicker on successful manual-create submit')
  it('shows the collision sheet when insertFoodStrict throws FoodCollisionError')
  it('routes to PortionPicker with EXISTING food on "use existing" tap')
  it('calls upsertFood + routes to PortionPicker with NEW food on "replace" tap')
  it('returns to the form (sheet closed, form still mounted) on "cancel" tap')
})
```

Mock `foodRepository.insertFoodStrict` and `foodRepository.upsertFood` (the mock for `foodRepository` already exists in this file; just extend).

**Acceptance:** 7 new tests pass; existing FoodSearchSheet tests stay green.
**Verify:** `gtt`, `npm run lint`, `npm run typecheck`

---

### Task 8: Manual device test pass (M)

**Files:** none (PR test plan)
**Depends on:** Tasks 1–7
**Parallel group:** P4

Run `dev`, walk through every acceptance criterion checkbox individually, document each in the PR test plan with the EAN/query used + observed result. See PR Test Plan section below.

---

### Task 9: Docs (XS)

**Files:** `lessons.md`, `TASKS.md`, `REVIEW.md`
**Depends on:** Tasks 1–8

- **lessons.md** — add section "Repository invariant via API verb (2026-04-18)". Replace the PR #76 "INSERT OR REPLACE is a footgun" entry with a pointer to the strict/upsert split. Add three-button collision sheet pattern.
- **TASKS.md** — mark this feature done with today's date in the same commit (workflow rule #8).
- **REVIEW.md** — add patterns revealed by `/review`.

---

## Risk Flags

### R1 (HIGH) — Repository rename touches every existing manual-write call site

`Grep` for `foodRepository.insertFood` + `insertFood` (as a method name) reveals at minimum: `BarcodeScannerSheet.tsx`, `scan-resolver.ts`, `scan-resolver.test.ts`, `food-repository.test.ts`. A missed rename will be a TypeScript error (good — caught at compile time) but every test mock that uses `insertFood` as a property name will silently keep working until the type-check.
**Mitigation:** run `npm run typecheck` after Task 2 to surface every call site. Update each to `upsertFood` or `insertFoodStrict` based on context. Keep the diff in one commit per task so the rename is reviewable.
**Escalation trigger:** if the rename surfaces an unexpected call site in non-nutrition code, pause and revisit scope (likely fine — `foodRepository` is nutrition-only).

### R2 (MEDIUM) — Modal-over-Modal stacking on iOS

`FoodSearchSheet` is already a Modal. The manual form is inside another Modal. The collision sheet is a third Modal. iOS sometimes glitches with three stacked Modals (animations stutter, dismiss cascades).
**Mitigation:** test all three modals stacked on real iOS Simulator (Task 8). If glitchy, downgrade `ManualFoodCollisionSheet` from a Modal to an absolutely-positioned overlay inside the form's Modal. Doesn't change the API.
**Escalation trigger:** if stacking glitches on device, swap collision sheet to overlay-in-modal pattern (1-hour change).

### R3 (LOW) — `expo-crypto.randomUUID` first use in app code

PR #76 did not use uuids — every form id was `manual_<ean>`. This PR introduces uuid-based ids. expo-crypto is already in deps but never called from app code.
**Mitigation:** verify on device that `randomUUID()` returns a valid v4 uuid (Hermes-native, should be fine). The mock in tests guarantees deterministic behavior.
**Escalation trigger:** if `randomUUID` throws on device (extremely unlikely — Hermes supports it natively), fall back to `expo-crypto.getRandomBytesAsync(16)` + custom hex formatter.

### R4 (LOW) — Three-button sheet UX may be ambiguous in Hebrew

The three actions ("השתמש במוצר הקיים" / "החלף בנתונים החדשים" / "ביטול") are visually similar in Hebrew. A user under cognitive load may tap the wrong one.
**Mitigation:** visually emphasize the safe default ("use existing" — primary button styling). Style the destructive option ("replace") with a warning tone (warning color or warning icon). "Cancel" stays muted/tertiary.
**Escalation trigger:** if device testing reveals confusion, add a one-line subtitle to each button explaining the consequence.

### R5 (LOW) — Bypassing PR #76's scanner-path defense

PR #76 lessons.md notes that `getByBarcode` is the only guard against `manual_<ean>` collision in the scanner path. This PR's `insertFoodStrict` adds a second guard (defense in depth) at the repository layer. Worth confirming this doesn't change scanner UX (e.g. doesn't introduce a spurious collision error on the scanner happy path).
**Mitigation:** PR #76's `getByBarcode` pre-check still runs; if it finds a hit, the form never opens. So `insertFoodStrict` in `handleManualSubmit` is unreachable in practice on the scanner path. Add a try/catch in scanner's `handleManualSubmit` that logs + falls back to `upsertFood` if the collision error somehow does occur (truly defensive — the path is provably unreachable but the fallback costs nothing).
**Escalation trigger:** if scanner tests fail post-rename, debug the unreachable-collision path.

---

## PR Test Plan Skeleton (populate in Task 8)

```
## Test plan

### CTA wiring
- [ ] Open FoodSearchSheet (any meal) → "הוסף מאכל אישי" button visible at bottom
- [ ] Tap "הוסף מאכל אישי" with empty query → ManualFoodForm opens with empty nameHe + EAN input visible at top
- [ ] Type "פתיבר ביתי" in search → 0 results → tap "הוסף מאכל אישי" → form opens with nameHe prefilled to "פתיבר ביתי"

### Manual create — no EAN
- [ ] Submit with valid macros + blank EAN → PortionPicker opens with the new food
- [ ] Inspect DB or re-search by name → food has id matching `manual_<uuid-v4-format>` (8-4-4-4-12 hex)

### Manual create — typed EAN
- [ ] Submit with valid macros + EAN "7290012345678" → PortionPicker opens, food persisted with id `manual_7290012345678`
- [ ] Submit with EAN typed as "7290 0123 45678" (with spaces) → id strips to `manual_7290012345678`
- [ ] Submit with EAN "abc123def456" → id is `manual_123456` (digits only)
- [ ] Submit with only-letter EAN ("abc") → id falls through to uuid (no digits)
- [ ] After successful manual-create with typed EAN, scan that same EAN with the camera → goes straight to PortionPicker with the manual_ entry (regression: PR #76 happy path)

### Collision flow
- [ ] Re-submit a typed EAN that already exists as `manual_<ean>` → collision sheet shows with the existing food's name in the title
- [ ] Tap "השתמש במוצר הקיים" → form + sheet close, PortionPicker opens with the EXISTING food (verify name + macros match the original entry)
- [ ] Re-trigger collision, tap "החלף בנתונים החדשים" → form + sheet close, PortionPicker opens with the NEW food (verify name + macros are the new values; re-search by EAN to confirm overwrite)
- [ ] Re-trigger collision, tap "ביטול" → sheet closes, form remains open with all field values still filled in

### Regressions (PR #76 + earlier)
- [ ] Scan an EAN known to be in local DB → PortionPicker (PR #72)
- [ ] Scan an EAN known to be in OFF → food fetched via upsertFood, PortionPicker
- [ ] Scan an EAN with partial OFF data, later scan again with full OFF data → upsertFood overwrites correctly
- [ ] Scan an EAN not in local nor OFF → "המוצר לא נמצא" + "צור מוצר חדש" CTA → form opens with read-only EAN row (NOT the new EAN input field — `ean` prop given, scanner mode)
- [ ] Submit form from scanner path → food persisted, PortionPicker opens (regression: PR #76 happy path uses insertFoodStrict now, must still work)

### Pre-merge
- [ ] CI passed
- [ ] All checkboxes above individually verified with shown output or screenshot
```

---

## References

- PR #72 — barcode scanning base implementation
- PR #76 — `ManualFoodForm` extraction, OFF retry, scanner unhappy-path
- [docs/specs/2026-04-18-barcode-manual-create-fallback.md](docs/specs/2026-04-18-barcode-manual-create-fallback.md) — PR #76 spec; this spec is its Q1+Q5+Q6 follow-up
- [src/components/nutrition/ManualFoodForm.tsx](src/components/nutrition/ManualFoodForm.tsx) — form to extend
- [src/components/nutrition/FoodSearchSheet.tsx:286-289](src/components/nutrition/FoodSearchSheet.tsx:286) — the placeholder button this PR wires
- [src/db/food-repository.ts:163-187](src/db/food-repository.ts:163) — current `insertFood` to rename
- [lessons.md:163](lessons.md:163) — PR #76's "INSERT OR REPLACE is a footgun" entry that this PR encodes into the API
- [src/shared/normalizeFoodName.ts](src/shared/normalizeFoodName.ts) — precedent for shared pure helpers used across runtime + scripts

---

## Refined Implementation Plan (post-verification)

This section supersedes the original Implementation Plan above with **verified call sites**, **commit boundaries**, and **expected test-count checkpoints** at each step. The original Implementation Plan section is preserved as the design rationale; this is the executable order.

### Pre-flight (once, before Task 1)

```bash
git checkout main
git pull
git checkout -b feat/text-search-manual-create
gtt                          # baseline test count = 2,239 (locks the regression baseline)
```

Expected: 2,239 tests passing on baseline. Every checkpoint below references the delta from this number.

### Verified call-site inventory

Grep confirmed the rename `insertFood` → `upsertFood` touches exactly these locations (no surprises):

- [src/db/food-repository.ts:163](src/db/food-repository.ts:163) — method definition
- [src/db/food-repository.test.ts:327,329,347,362,372,381](src/db/food-repository.test.ts:327) — 1 describe + 4 call sites in tests
- [src/components/nutrition/scan-resolver.ts:26,40](src/components/nutrition/scan-resolver.ts:26) — type field + body call
- [src/components/nutrition/scan-resolver.test.ts:42,71,81,91,100,111,122](src/components/nutrition/scan-resolver.test.ts:42) — 1 mock + 6 assertions
- [src/components/nutrition/BarcodeScannerSheet.tsx:62,140,141](src/components/nutrition/BarcodeScannerSheet.tsx:62) — deps wiring + `handleManualSubmit` + invariant comment

`ManualFoodForm.tsx` does NOT call `insertFood` directly (form emits via `onSubmit`; host handles persistence). Confirms the form is repository-agnostic.

### Risk Flag corrections

- **R3 downgraded to NONE.** `expo-crypto.randomUUID` is already in use: [src/db/base-repository.ts:12](src/db/base-repository.ts:12) imports it; [src/db/workout-repository.test.ts:21-22](src/db/workout-repository.test.ts:21) already mocks it with the exact pattern the spec needs. Reuse that mock pattern for `ManualFoodForm.test.tsx`.
- R1, R2, R4, R5 stand as written.

### Test-count checkpoints (cumulative)

| After task | Expected `gtt` count | Delta   | Notes                                                                                                                      |
| ---------- | -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Baseline   | 2,239                | —       | Pre-flight `gtt`                                                                                                           |
| Task 1     | 2,245                | +6      | normalizeEan helper                                                                                                        |
| Task 2     | 2,249                | +4      | insertFoodStrict (3) + upsertFood overwrite regression (1); existing `insertFood` tests renamed in-place (no count change) |
| Task 3     | 2,249                | 0       | Mechanical rename; scan-resolver mock + assertions all pass with new name                                                  |
| Task 4     | 2,256                | +7      | ManualFoodForm no-EAN tests; existing 14 tests stay green                                                                  |
| Task 5     | 2,260                | +4      | ManualFoodCollisionSheet                                                                                                   |
| Task 6     | 2,260                | 0       | i18n is data-only                                                                                                          |
| Task 7     | 2,267                | +7      | FoodSearchSheet wiring tests; existing FoodSearchSheet tests stay green                                                    |
| **Total**  | **2,267**            | **+28** | If actual count diverges, stop and reconcile before next task                                                              |

### Commit boundaries

One commit per task — but bundle Tasks 5+6 (collision sheet + i18n) into a single commit since they're tightly coupled and Task 5's tests depend on Task 6's keys. Final order:

1. **Commit 1:** Task 1 — `feat(food): add normalizeEan shared helper`
2. **Commit 2:** Task 2 — `refactor(food-repo): rename insertFood→upsertFood, add insertFoodStrict + FoodCollisionError`
3. **Commit 3:** Task 3 — `refactor(scanner): propagate insertFood→upsertFood rename, switch manual submit to strict`
4. **Commit 4:** Task 4 — `feat(manual-food): support no-EAN mode + initialNameHe prefill`
5. **Commit 5:** Tasks 5+6 — `feat(manual-food): collision sheet + i18n keys`
6. **Commit 6:** Task 7 — `feat(food-search): wire manual-create CTA + collision flow`
7. **Commit 7:** Task 9 — `docs: lessons.md + TASKS.md + REVIEW.md`

Task 8 (manual device test) does not commit — it gates the PR test plan checkboxes only.

### Per-commit verification gate (workflow steps 5-15)

After EACH commit, run the full pre-commit checklist from `.claude/rules/workflow.md`:

```bash
git branch --show-current        # confirm feat/text-search-manual-create
git diff --cached                # secrets scan (visual)
npm run lint                     # must be clean
npm run typecheck                # must be clean
gtt                              # must hit the expected count for that task (table above)
git diff --cached --stat         # size sanity
```

**Hard rule:** if `gtt` count diverges from the table by more than ±2, STOP and reconcile before committing. A divergence usually means a test was deleted by accident or a snapshot was created silently.

### `/review` schedule

- **After Commit 2** (`insertFoodStrict` + `FoodCollisionError`): `/review` — repository invariant change, security-adjacent (collision behavior).
- **After Commit 6** (FoodSearchSheet wiring): `/review` — full feature wiring, integration risk.
- Skip `/review` for: Commits 1, 3, 4, 5, 7 (mechanical rename, helper, UI components individually, docs).

State at skip points: "Skipping /review — [reason from workflow.md]".

### Parallelization notes

The original spec's parallel groups (P1–P4) describe what COULD run in parallel if multiple agents were working in parallel. For a single-context implementation session, **execute in strict commit order** above. The dependency graph holds:

- Task 1 has no deps
- Task 2 has no deps
- Task 3 needs Task 2 (uses new method names)
- Task 4 needs Task 6 (uses new i18n keys) — execute Task 6 inside Commit 5 BEFORE Task 4's tests reference any new keys; OR write Task 4 tests against literal Hebrew strings if i18n keys aren't ready (pattern from PR #76 ManualFoodForm tests)
- Task 5 needs Task 6 (same) — bundled together in Commit 5
- Task 7 needs Tasks 2, 4, 5, 6 (all)

**Detected ordering issue:** Task 4 (Commit 4) is BEFORE Tasks 5+6 (Commit 5). This is fine because Task 4's test assertions can use the existing PR #76 i18n keys plus literal expected behavior; the new `eanInputLabel` / `eanInputPlaceholder` keys are USED by the form code but not asserted on in tests (tests fetch by testID, not label text). Confirmed pattern from current ManualFoodForm test file — labels are not tested for content, only existence.

### PR creation (after Commit 7)

Push branch, open PR with the full test plan from "PR Test Plan Skeleton" section above (populated with actual EANs / queries / observed results from Task 8 device pass). Wait for CI; do not check any test plan box without showing the verification command output. Per workflow rule, batch-checking is FORBIDDEN.

### Plan ready for execution

All decisions locked, all call sites verified, all test counts predicted, commit order set. No remaining unknowns. Estimated wall-clock: 4–6 hours for code + 1 hour for device pass + 0.5 hour for docs = **single working day**.
