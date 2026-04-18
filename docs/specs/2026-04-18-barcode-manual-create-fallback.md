# Feature: Barcode Scanner Unhappy-Path — Manual-Create Fallback + Network UX

**Date:** 2026-04-18
**Status:** Approved
**Branch:** `feat/barcode-manual-create-fallback`
**Base:** `origin/main` @ `a8b07b6` (PR #72 tip, post-PR #75)

## What

Real-device testing of PR #72's barcode scanner surfaced two unhappy-path gaps:

1. **Network UX is fragile.** The Open Food Facts (OFF) fetch has no retry and no timeout. First lookup after opening the scanner often fails cold with "no internet connection" and succeeds on retry — a DNS/cold-start artifact. The sheet's error state doesn't distinguish offline from OFF-404 from transient failure, so the user sees the same message for three different causes.
2. **OFF 404 dead-ends the flow.** When both the local DB and OFF don't know the barcode, the sheet shows "לא נמצא" and the user has no recovery path short of abandoning the scan.

This feature adds:

- One auto-retry (~2s backoff) on OFF network errors (NOT on 404s — those mean the product is genuinely absent).
- Distinct error states in the scanner UI — offline vs OFF-404 vs partial-data — each with appropriate recovery.
- A manual-create form reachable from the OFF-404 state, pre-filled with the scanned EAN. On submit the food is stored as `manual_<ean>` so future scans of the same code hit local DB.

## Why

Food logging is a daily habit. If the first-scan experience fails (network error shown as "no internet" when the user has internet, or dead-ending on products OFF doesn't know), users abandon the scanner and log via text search — losing the accuracy and speed benefit of barcodes. This is especially costly for Israeli users because the local supermarket seeds (Shufersal, Rami Levy) cover ~12k SKUs but OFF's Hebrew coverage is thin, so OFF-404 is a common path, not a rare one.

The fix is not about adding new features — PR #72 already shipped the happy path. It's about making the known-fragile fallbacks (network instability, OFF gaps) recoverable instead of terminal.

## Scope Decisions (locked via brainstorm)

1. **Entry point:** inline state transition inside `BarcodeScannerSheet` (new `scanState: 'creating'`) + extracted `ManualFoodForm.tsx` component. Form component is designed for reuse but this PR only wires the scanner caller.
2. **Required fields:** `nameHe` + 4 macros per 100g (calories, protein, fat, carbs). `fiberPer100g` optional, defaults to 0. `100 גרם` serving size is auto-prepended invisibly. ONE optional natural-unit row is rendered in the form (label + grams; both-blank skipped silently; one-filled-one-blank = form error).
3. **Name:** `nameHe` required (non-empty after `.trim()`; no character-set check). `nameEn` optional — if blank on submit, copy `nameHe` into it. Mirrors OFF's own fallback at `open-food-facts.ts:39-42`.
4. **Macro validation:**
   - **Hard block** when `protein + fat + carbs > 101`. 1g slack accommodates Israeli MoH whole-gram rounding (max overshoot ~1.5g above a physics cap of 100g).
   - **Soft warning** (non-blocking) when entered `calories` diverge from Atwater estimate (`4·protein + 9·fat + 4·carbs`) by >25%. Catches the kJ-as-kcal confusion that's common on Israeli labels (both units printed side-by-side).
   - Error messages are framed as likely-cause-and-fix in Hebrew, not form rejections.
5. **Duplicate EAN:** no UX this PR. `getByBarcode` at `BarcodeScannerSheet.tsx:80` already checks all four tiers (`raw_`, `manual_`, `sh_`, `rl_`) and routes duplicates to `onFound` before the form opens. Collision is unreachable in the scanner path. Add a one-line invariant comment in the submit handler; add a lessons.md entry so future entry points (text-search create, edit flow) know they MUST add a pre-submit `getById` collision check.
6. **"Add without barcode" reuse:** scoped OUT of this PR. Queued as follow-up task in TASKS.md. The `ManualFoodForm` extraction makes the follow-up small (~200 LoC: FoodSearchSheet no-results CTA + reuse form with no `ean` + `manual_<uuid>` id generation + collision check + tests).

## Requirements

- [ ] OFF fetch auto-retries ONCE on network errors with ~2s backoff
- [ ] OFF fetch does NOT retry on HTTP 404 or OFF `status: 0` (those mean product is absent, not transient)
- [ ] OFF fetch has a timeout (10s) so it fails deterministically instead of hanging
- [ ] Scanner error UI distinguishes three states: `offline` (retry button re-fires OFF lookup only), `not_found` (shows "צור מוצר חדש" CTA), partial-data (unchanged — amber badge in PortionPicker)
- [ ] `ManualFoodForm.tsx` extracted as its own component with a testable pure `validateManualFoodInput` helper
- [ ] Form fields: `nameHe` (required), `nameEn` (optional), 4 macros per 100g (required, clamped 0–900 kcal / 0–100g each), fiber (optional, default 0), one optional natural-unit serving (label + grams)
- [ ] Zod schema enforces all field constraints + the `p+f+c ≤ 101` refinement
- [ ] Atwater soft-warning renders inline below the calories field when delta > 25%, doesn't block submit
- [ ] On submit: construct `FoodItem` with id `manual_<ean>`, `isUserCreated: true`, `category: 'snacks'` (default — category picker is out of scope; matches OFF default), auto-prepended 100g serving + optional natural-unit serving if filled, `nameEn ||= nameHe`
- [ ] `foodRepository.insertFood(food)` persists → `onFound(food, false)` fires → scanner closes → PortionPicker opens
- [ ] All strings in Hebrew via `i18n`; no hardcoded UI strings in the component
- [ ] RTL layout works without component-level `isRTL()` conditionals (FitCoach forces `I18nManager.isRTL = true` globally)

## Design

### Architecture

```
BarcodeScannerSheet
  ├─ scanState: 'scanning' | 'searching' | 'not_found' | 'no_connection' | 'creating'
  ├─ lastEan: string | null  (preserved across retries; set on first scan)
  ├─ CameraView          (rendered when scanState === 'scanning')
  ├─ Status overlay      (searching / not_found / no_connection)
  │    └─ "נסה שוב" on no_connection → re-fires OFF lookup for lastEan (no re-scan)
  │    └─ "צור מוצר חדש" on not_found → sets scanState = 'creating'
  └─ ManualFoodForm      (rendered when scanState === 'creating'; receives lastEan)
       ├─ Field inputs (Hebrew-first, macros, optional natural-unit serving)
       ├─ validateManualFoodInput (pure helper, Zod-backed)
       ├─ Atwater soft-warning (inline, non-blocking)
       └─ onSubmit → foodRepository.insertFood → onFound(food, false)

src/services/open-food-facts.ts
  └─ fetchOffProduct(ean)
       ├─ abortable fetch with 10s timeout
       ├─ HTTP 404 or status:0  → return null (NO retry)
       ├─ network/abort/timeout → retry once after 2s → then throw NetworkError
       └─ success                → return OffResult
```

### Error taxonomy (scanner-internal)

```
ScanError =
  | { kind: 'network' }   // fetch failed + retry failed
  | { kind: 'not_found' } // OFF returned null (404 or status:0)
  | { kind: 'unknown' }   // anything else (bubbles up, shown as no_connection today — keep behavior)
```

`fetchOffProduct` continues to return `OffResult | null` for the success/known-absent distinction. Network errors throw a tagged error (`class OffNetworkError extends Error`) so the scanner can branch cleanly on `error instanceof OffNetworkError`.

### Data flow — happy path (unchanged from PR #72)

```
scan → getByBarcode(ean) hit → onFound(food, false) → PortionPicker
scan → getByBarcode miss → fetchOffProduct hit → insertFood → onFound(food, partial?) → PortionPicker
```

### Data flow — new network error path

```
scan → getByBarcode miss → fetchOffProduct:
  attempt 1 fails (network) → wait 2s → attempt 2:
    succeeds → insertFood → onFound → PortionPicker
    fails    → throw OffNetworkError
                ↓
  scanState = 'no_connection'
  UI: "אין חיבור לאינטרנט — נסה שוב"
  "נסה שוב" → re-call fetchOffProduct(lastEan) only (skip getByBarcode — we already know local is empty)
```

### Data flow — new OFF-404 path

```
scan → getByBarcode miss → fetchOffProduct returns null:
  scanState = 'not_found'
  UI: "המוצר לא נמצא" + "צור מוצר חדש" CTA
  CTA tap → scanState = 'creating'
            ↓
  ManualFoodForm (lastEan pre-filled as read-only display, not editable)
  User fills → validate → submit:
    insertFood(food) → onFound(food, false) → scanner closes → PortionPicker
```

### Files to Create/Modify

| File                                                    | Action | Description                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/open-food-facts.ts`                       | Modify | Add 10s timeout + 1-retry-on-network-error via AbortController. Add `OffNetworkError` tagged class. 404/status:0 path unchanged (returns null, no retry).                                                                                                                       |
| `src/services/open-food-facts.test.ts`                  | Modify | Add tests: timeout fires AbortError, retry on transient network error succeeds, retry-after-retry-fail throws OffNetworkError, 404 does NOT retry (single fetch call).                                                                                                          |
| `src/components/nutrition/BarcodeScannerSheet.tsx`      | Modify | Add `scanState: 'creating'`, `lastEan` ref, render `<ManualFoodForm />` when creating. "נסה שוב" on `no_connection` re-fires OFF only. "צור מוצר חדש" CTA on `not_found` → 'creating'. One-line invariant comment in submit path.                                               |
| `src/components/nutrition/BarcodeScannerSheet.test.tsx` | Modify | Add tests for new state transitions: scan→404→CTA→form, scan→network→retry-only-OFF, creating→submit→onFound.                                                                                                                                                                   |
| `src/components/nutrition/ManualFoodForm.tsx`           | Create | Extracted form component. Props: `{ ean: string; onSubmit(food: FoodItem); onCancel() }`. Hebrew-first inputs, macros, optional natural-unit row, Atwater inline warning.                                                                                                       |
| `src/components/nutrition/ManualFoodForm.test.tsx`      | Create | Tests: required-field blocks, `p+f+c > 101` blocks with Hebrew error, Atwater warning shows but doesn't block, natural-unit one-filled-one-blank = error, submit produces correct FoodItem shape with `isUserCreated: true`, `id: 'manual_<ean>'`, auto-prepended 100g serving. |
| `src/security/validation.ts`                            | Modify | Export `ManualFoodInputSchema` (Zod) + `validateManualFoodInput` helper. Follows existing validation module pattern.                                                                                                                                                            |
| `src/security/validation.test.ts`                       | Modify | Tests for schema: required fields, clamps, `p+f+c ≤ 101` refinement, whitespace trim, `nameEn` optional, fiber default 0.                                                                                                                                                       |
| `src/i18n/he.ts`                                        | Modify | Add keys: `barcode.notFoundCreate` ("צור מוצר חדש"), `barcode.retryOffOnly` ("נסה שוב"), `manualFood.*` (title, all field labels, placeholders, validation messages, Atwater warning).                                                                                          |
| `src/i18n/en.ts`                                        | Modify | Mirror all new keys in English.                                                                                                                                                                                                                                                 |
| `TASKS.md`                                              | Modify | Mark this feature's task done with today's date. Add follow-up task: "Text-search 'no results → create food' — reuse ManualFoodForm, add `manual_<uuid>` id generation, add pre-submit `getById` collision check with overwrite confirmation."                                  |
| `lessons.md`                                            | Modify | Add: "manual-create is safe via scanner because getByBarcode routes duplicates. Any future entry point that bypasses getByBarcode MUST add a pre-submit `getById` collision check before calling insertFood — `INSERT OR REPLACE` silently overwrites."                         |
| `REVIEW.md`                                             | Modify | Add after `/review`: any new patterns revealed (e.g. AbortController + timeout pattern, extracted-form-component reuse pattern).                                                                                                                                                |

## Acceptance Criteria

- [ ] Scanning an EAN that hits local DB: unchanged behavior — routes to PortionPicker (regression check)
- [ ] Scanning an EAN that hits OFF on first try: unchanged behavior — routes to PortionPicker
- [ ] Scanning an EAN where OFF first-try fails with network error, second-try succeeds (2s later): food is fetched, inserted, PortionPicker opens. No error UI flashes.
- [ ] Scanning an EAN where OFF fails both tries: shows "אין חיבור לאינטרנט" + "נסה שוב" button. Tapping "נסה שוב" re-fires only the OFF call (doesn't re-scan the camera).
- [ ] Scanning an EAN where OFF returns 404: no retry happens (verified via single fetch call). UI shows "המוצר לא נמצא" + "צור מוצר חדש" CTA.
- [ ] Tapping "צור מוצר חדש" opens the inline form with the scanned EAN shown as read-only context (e.g. "ברקוד: 7290012345678").
- [ ] Submitting the form with valid inputs persists `manual_<ean>`, closes scanner, opens PortionPicker with the created food (partial=false).
- [ ] Re-scanning the same EAN after creation hits local DB (no network round-trip, no form).
- [ ] Submitting with `p+f+c > 101` blocks with Hebrew error pointing at the likely fix (per-serving vs per-100g column).
- [ ] Submitting with kcal diverging from Atwater by >25% shows a non-blocking warning but does NOT prevent submit.
- [ ] Submitting with empty Hebrew name blocks with inline error.
- [ ] Submitting with one filled natural-unit field but not the other blocks with inline error.
- [ ] Submitting with both natural-unit fields blank stores only the 100g serving silently.
- [ ] Submitting with both natural-unit fields filled stores 100g + custom serving.
- [ ] `nameEn` empty on submit: stored FoodItem has `nameEn === nameHe`.
- [ ] All Hebrew strings come from `t().manualFood` / `t().barcode`, no hardcoded strings.
- [ ] `isUserCreated: true` on the stored food.
- [ ] No `isRTL()` conditionals in the form component.

## Task Breakdown (TDD)

Each task: RED (failing test) → GREEN (implement) → CLEAN (refactor) → verify `gtt`.

1. **Network retry + timeout in OFF service** (S) — `open-food-facts.ts` + tests. `OffNetworkError` class, AbortController+timeout, 1-retry-on-network, no-retry-on-404.
2. **Zod schema + `validateManualFoodInput` helper** (S) — `validation.ts` + tests. Pure, no UI. Covers all field constraints + `p+f+c ≤ 101` refinement.
3. **Pure `computeAtwaterDelta` helper** (XS) — small pure function: `(kcal, protein, fat, carbs) → { expected, deltaPct }`. Co-located with schema or form helper. Tested in isolation so form test can just assert component renders the warning.
4. **`ManualFoodForm` component** (M) — new file + tests. Renders fields, wires validation, renders Atwater warning inline, constructs FoodItem on submit, calls `onSubmit(food)`. Does NOT call `insertFood` itself — stays pure/testable.
5. **i18n keys** (XS) — add all new keys to `he.ts` and `en.ts`. No test beyond type-safety of `t()` shape.
6. **Wire `ManualFoodForm` into `BarcodeScannerSheet`** (M) — new `scanState: 'creating'`, `lastEan` ref, CTA on `not_found`, "נסה שוב" re-fires OFF only. Component tests updated for new state transitions. `insertFood` + `onFound` called from the sheet, not the form.
7. **Error-taxonomy branching in sheet** (S) — distinguish `OffNetworkError` (→ `no_connection`) from `null` return (→ `not_found`) from other errors (→ `no_connection` fallback, matches today).
8. **Manual device-test pass** — `dev`, scan real Israeli products, verify all three error paths + happy path on a real device. Document in PR test plan.
9. **Docs** (XS) — lessons.md entry, TASKS.md update (mark done + add follow-up), REVIEW.md additions.

Estimated net delta: ~600 LoC code + ~400 LoC tests. Single-day implementation.

## Testing strategy

- **Unit tests (pure):** schema, Atwater helper, OFF retry logic (mock fetch).
- **Component tests:** `ManualFoodForm` in isolation (validation, submit shape, Atwater warning rendering); `BarcodeScannerSheet` transitions (mocked repository + mocked `fetchOffProduct`).
- **Integration tests:** end-to-end through sheet — scan → OFF miss → form → insert → onFound. Covered by the sheet test file with mocked dependencies.
- **Manual device tests (PR test plan):** each acceptance criterion gets its own checkbox with explicit steps. Network conditions tested via airplane mode toggle + known-in-OFF / known-not-in-OFF EANs.

## Out of Scope (explicit non-goals)

- Text-search "no results → create food" entry point — follow-up PR
- Duplicate-EAN UX (confirmation sheet, overwrite-vs-edit) — follow-up PR (becomes reachable only when text-search is wired)
- Category picker — form uses `'snacks'` default to match OFF; category UI is a separate feature
- Edit-existing-food flow — follow-up
- Barcode-less manual foods (`manual_<uuid>`) — follow-up
- Calorie-unit picker (kcal ↔ kJ) — Atwater soft-warning is the interim nudge
- OFF retry beyond ONE auto-retry — more retries mask rather than surface persistent failures

## Lessons to capture post-ship

(Written after merge, based on what we actually learn during implementation.)

- **Invariant comment at scanner submit path:** `getByBarcode` guarantees no `manual_<ean>` collision reaches this form. Future entry points bypass this guarantee.
- **`INSERT OR REPLACE` is a footgun for generic manual writes.** OFF's partial-data refresh depends on overwrite semantics, so we can't flip `insertFood` to plain `INSERT`. Defensive check belongs at the caller site, not the repository.
- **AbortController + setTimeout pattern** for fetch timeout (if this is the first use in the codebase, worth a lesson entry on the pattern).
- **Extracted form-component reuse without wiring all callers in the same PR** — Q1+Q6 outcome pattern.

## Open Questions

None — all six brainstorm questions locked. Spec is implementation-ready.

## Implementation Plan

**Dependency graph (parallel groups):**

```
Group P1 (parallelizable, pure logic, no shared files):
  Task 1: retryOnNetworkError helper + OffNetworkError (open-food-facts.ts)
  Task 2: ManualFoodInputSchema (validation.ts)
  Task 3: computeAtwaterDelta helper (validation.ts)
  Task 4: resolveScan helper (new src/components/nutrition/scan-resolver.ts)

Group P2 (leaf, no code dependencies):
  Task 5: i18n keys (he.ts, en.ts)

Group P3 (consumes P1 + P2):
  Task 6: ManualFoodForm.tsx (uses Task 2 + 3 + 5)
  Task 7: fetchOffProduct wiring — consume retry helper + timeout (uses Task 1)

Group P4 (consumes P1 + P3):
  Task 8: BarcodeScannerSheet wiring — resolveScan + scanState: 'creating' + ManualFoodForm host (uses 4, 6, 7)

Group P5 (serial, end-of-PR):
  Task 9: Manual device test pass
  Task 10: Docs (lessons.md, TASKS.md entry, REVIEW.md)
```

Tasks 1–4 can run fully in parallel. Tasks 6 + 7 can run in parallel once P1 lands. Task 8 is the integration point. Tasks 9–10 are serial at commit time.

---

### Task 1: OFF network retry + timeout helper (S)

**Files:** `src/services/open-food-facts.ts`, `src/services/open-food-facts.test.ts`
**Depends on:** nothing
**Parallel group:** P1

**What:** Add a pure testable `retryOnNetworkError<T>(fn, { retries = 1, delayMs = 2000 }) → Promise<T>` helper and an `OffNetworkError extends Error` tagged class. The helper invokes `fn()`, catches errors, retries up to `retries` times with `delayMs` delay between attempts. Does NOT retry if `fn` returns successfully (even if result is `null`). Wraps the final failure in `OffNetworkError`.

**Test first (RED):**

```ts
// src/services/open-food-facts.test.ts — new describe block
describe('retryOnNetworkError()', () => {
  it('returns result on first-call success (zero retries fired)')
  it('does not retry when fn returns null (known-absent ≠ transient)')
  it('retries once on thrown error, returns success on second attempt')
  it('throws OffNetworkError after retries exhausted')
  it('waits delayMs between attempts (fake timers)')
  it('OffNetworkError.name === "OffNetworkError" and instanceof Error')
})
```

Use `jest.useFakeTimers()` + `jest.advanceTimersByTimeAsync(2000)` for the delay assertion. No `global.fetch` mocking — the helper is pure, takes `fn` as a param.

**Acceptance:**

- 6 new tests pass under `gtt`
- Helper has no side effects beyond calling `fn` and `setTimeout`
- `OffNetworkError` exported for use by consumers

**Verify:** `gtt` (pass count increases by 6), `npm run typecheck`

---

### Task 2: Zod `ManualFoodInputSchema` + `validateManualFoodInput` (M)

**Files:** `src/security/validation.ts`, `src/security/validation.test.ts`
**Depends on:** nothing
**Parallel group:** P1

**What:** New exported Zod schema for the manual-create input:

```ts
export const ManualFoodInputSchema = z
  .object({
    nameHe: z.string().trim().min(1),
    nameEn: z.string().trim().optional(),
    caloriesPer100g: z.number().min(0).max(900),
    proteinPer100g: z.number().min(0).max(100),
    fatPer100g: z.number().min(0).max(100),
    carbsPer100g: z.number().min(0).max(100),
    fiberPer100g: z.number().min(0).max(100).default(0),
    servingName: z.string().trim().optional(),
    servingGrams: z.number().min(0.1).max(5000).optional(),
  })
  .refine((d) => d.proteinPer100g + d.fatPer100g + d.carbsPer100g <= 101, {
    message: 'macroSumTooHigh',
    path: ['proteinPer100g'],
  })
  .refine(
    (d) =>
      (d.servingName == null && d.servingGrams == null) ||
      (d.servingName != null && d.servingGrams != null),
    { message: 'servingFieldsIncomplete', path: ['servingName'] },
  )
```

Messages are i18n-key tokens (resolved in UI), not Hebrew strings — keeps the schema locale-agnostic. Plus `validateManualFoodInput(input): { ok: true; data } | { ok: false; errors }` helper.

**Test first (RED):**

```ts
describe('ManualFoodInputSchema', () => {
  it('accepts minimal valid input (name + 4 macros)')
  it('rejects empty nameHe (whitespace-only after trim)')
  it('trims whitespace from nameHe and nameEn')
  it('defaults fiberPer100g to 0 when absent')
  it('clamps: rejects calories < 0 / > 900')
  it('clamps: rejects protein < 0 / > 100')
  it('clamps: rejects fat < 0 / > 100')
  it('clamps: rejects carbs < 0 / > 100')
  it('rejects p+f+c > 101 with macroSumTooHigh')
  it('accepts p+f+c === 101 (boundary)')
  it('accepts p+f+c === 100 (pure sugar / pure oil)')
  it('accepts both serving fields filled')
  it('accepts both serving fields blank')
  it('rejects serving name without grams (servingFieldsIncomplete)')
  it('rejects serving grams without name (servingFieldsIncomplete)')
  it('accepts nameEn blank (schema stays valid)')
})

describe('validateManualFoodInput()', () => {
  it('returns { ok: true, data } on valid input')
  it('returns { ok: false, errors } on invalid input with mapped messages')
})
```

**Acceptance:** 18 new tests pass; schema shape matches spec § Requirements.
**Verify:** `gtt`, `npm run typecheck`

---

### Task 3: `computeAtwaterDelta` helper (XS)

**Files:** `src/security/validation.ts` (co-located — small helper, not a new file), `src/security/validation.test.ts`
**Depends on:** nothing
**Parallel group:** P1

**What:** Pure function:

```ts
export function computeAtwaterDelta(
  kcal: number,
  protein: number,
  fat: number,
  carbs: number,
): { expected: number; deltaPct: number } {
  const expected = 4 * protein + 9 * fat + 4 * carbs
  if (expected === 0) return { expected: 0, deltaPct: 0 }
  return { expected, deltaPct: Math.abs(kcal - expected) / expected }
}
```

**Test first (RED):**

```ts
describe('computeAtwaterDelta()', () => {
  it('returns 0 delta when kcal matches Atwater estimate exactly')
  it('returns ~0.25 delta when kcal is 25% above expected')
  it('returns ~3 delta when kJ entered as kcal (kJ ≈ 4.184 × kcal)')
  it('returns { expected: 0, deltaPct: 0 } when all macros are 0')
  it('handles negative delta (kcal below expected) as absolute')
})
```

**Acceptance:** 5 new tests pass; helper is referentially transparent.
**Verify:** `gtt`, `npm run typecheck`

---

### Task 4: `resolveScan(ean, deps)` helper extraction (M)

**Files:** `src/components/nutrition/scan-resolver.ts` (NEW), `src/components/nutrition/scan-resolver.test.ts` (NEW)
**Depends on:** Task 1 (uses `OffNetworkError` in the error-branching path — but only the type; actual retry wiring is in Task 7)
**Parallel group:** P1 (the `OffNetworkError` import is a type-only coupling; this task can run in parallel with Task 1 as long as Task 1's class export lands first)

**What:** Pure helper extracting the current `handleBarcodeScanned` logic from `BarcodeScannerSheet.tsx:73-101` into a dependency-injected function:

```ts
export type ScanResolution =
  | { kind: 'local_hit'; food: FoodItem }
  | { kind: 'off_hit'; food: FoodItem; isPartial: boolean }
  | { kind: 'not_found' }
  | { kind: 'network_error' }

export interface ScanResolverDeps {
  getByBarcode: (ean: string) => Promise<FoodItem | null>
  fetchOffProduct: (ean: string) => Promise<OffResult | null>
  insertFood: (food: FoodItem) => Promise<void>
}

export async function resolveScan(ean: string, deps: ScanResolverDeps): Promise<ScanResolution>
```

Logic:

1. `local = await deps.getByBarcode(ean)` → if non-null, return `{ kind: 'local_hit', food: local }`
2. Try `result = await deps.fetchOffProduct(ean)`:
   - If non-null: `await deps.insertFood(result.food)`, return `{ kind: 'off_hit', food, isPartial }`
   - If null: return `{ kind: 'not_found' }`
3. Catch `OffNetworkError` → return `{ kind: 'network_error' }`
4. Catch anything else → return `{ kind: 'network_error' }` (preserves today's fallback behavior)

**Test first (RED):**

```ts
describe('resolveScan()', () => {
  it('returns local_hit when getByBarcode finds the food (fetchOffProduct not called)')
  it('returns off_hit + isPartial=false on full OFF response (insertFood called)')
  it('returns off_hit + isPartial=true on partial OFF response (insertFood called)')
  it('returns not_found when both local DB and OFF return null (no insert)')
  it('returns network_error when fetchOffProduct throws OffNetworkError')
  it('returns network_error on any unexpected error (no insert)')
  it('does not call fetchOffProduct when local hit')
  it('does not call insertFood when local hit (returns existing food)')
})
```

All deps are `jest.fn()` stubs. No component rendering, no DB, no network.

**Acceptance:** 8 new tests pass; helper is a pure orchestration layer testable without React/SQLite/fetch.
**Verify:** `gtt`, `npm run typecheck`

---

### Task 5: i18n keys for new scanner + form strings (XS)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`
**Depends on:** nothing
**Parallel group:** P2

**What:** Add:

```ts
// barcode namespace (existing — ADD one key)
barcode: {
  ...existing,
  notFoundCreate: 'צור מוצר חדש', // EN: 'Create new product'
}

// manualFood namespace (NEW — full shape)
manualFood: {
  title: 'יצירת מוצר ידני',
  barcodeLabel: 'ברקוד',
  nameHeLabel: 'שם בעברית',
  nameHePlaceholder: 'לדוגמה: פתיבר חלבון שוקולד',
  nameEnLabel: 'שם באנגלית (לא חובה)',
  nameEnPlaceholder: 'לדוגמה: Protein Bar Chocolate',
  per100gHeader: 'ערכים ל-100 גרם',
  caloriesLabel: 'קלוריות',
  proteinLabel: 'חלבון (גרם)',
  fatLabel: 'שומן (גרם)',
  carbsLabel: 'פחמימות (גרם)',
  fiberLabel: 'סיבים תזונתיים (גרם, לא חובה)',
  servingSectionLabel: 'גודל מנה נוסף (לא חובה)',
  servingNameLabel: 'שם המנה',
  servingNamePlaceholder: 'לדוגמה: יחידה / פרוסה / כוס',
  servingGramsLabel: 'משקל בגרמים',
  submitButton: 'שמור מוצר',
  cancelButton: 'ביטול',
  // Validation messages (keyed by token from schema)
  errors: {
    nameRequired: 'שם בעברית נדרש',
    macroSumTooHigh: 'סכום חלבון + שומן + פחמימות לא יכול לעבור 100 גרם. ייתכן שקראת את העמודה של "ליחידה" במקום "ל-100 גרם".',
    servingFieldsIncomplete: 'מלא שם ומשקל, או השאר את שני השדות ריקים',
    numberInvalid: 'הכנס מספר תקין',
    valueOutOfRange: 'הערך מחוץ לטווח המותר',
  },
  atwaterWarning: 'הקלוריות נראות גבוהות ביחס למאקרו — ייתכן שהכנסת kJ במקום kcal. בדוק את האריזה.',
}
```

Reuse existing `barcode.tryAgain` for the no-connection retry button.

**Test first:** Not required (i18n is static data). Type-safety check only via `npm run typecheck`.

**Acceptance:** Both locale files have identical key shape; `typecheck` passes.
**Verify:** `npm run typecheck`

---

### Task 6: `ManualFoodForm.tsx` component (L)

**Files:** `src/components/nutrition/ManualFoodForm.tsx` (NEW), `src/components/nutrition/ManualFoodForm.test.tsx` (NEW)
**Depends on:** Task 2 (schema), Task 3 (Atwater), Task 5 (i18n)
**Parallel group:** P3

**What:** New component with props:

```ts
interface ManualFoodFormProps {
  ean: string // shown as read-only context
  onSubmit: (food: FoodItem) => void | Promise<void>
  onCancel: () => void
}
```

Renders:

- Read-only EAN display (`"ברקוד: {ean}"`)
- `nameHe` TextInput (required) + `nameEn` TextInput (optional)
- Macro inputs (calories, protein, fat, carbs) + optional fiber
- Optional serving section (name + grams)
- Atwater warning renders inline below calories when `deltaPct > 0.25`
- Submit / Cancel buttons
- Inline error text per field (resolved from i18n via the token returned by `validateManualFoodInput`)

On submit:

1. Call `validateManualFoodInput(formState)`
2. On `ok: false` → set error state, don't submit
3. On `ok: true` → construct `FoodItem`:
   - `id: manual_${ean}`
   - `isUserCreated: true`
   - `category: 'snacks'`
   - `nameEn: data.nameEn?.trim() || data.nameHe` ← spec § Q3
   - `servingSizes`: `[{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }]` + optional custom serving if both fields filled
4. Call `onSubmit(food)`

**Test first (RED):**

```tsx
describe('ManualFoodForm', () => {
  it('renders the EAN as read-only context')
  it('blocks submit when nameHe is empty (Hebrew error visible)')
  it('blocks submit when p+f+c > 101 (cause-and-fix message visible)')
  it('shows Atwater warning when kcal diverges >25% from expected')
  it('does NOT block submit when Atwater warning shows')
  it('blocks submit when servingName filled but servingGrams empty')
  it('blocks submit when servingGrams filled but servingName empty')
  it('submits with only 100g serving when both serving fields blank')
  it('submits with 100g + custom serving when both serving fields filled')
  it('copies nameHe into nameEn when nameEn is blank on submit')
  it('preserves user-entered nameEn when provided')
  it('constructs FoodItem with id manual_<ean> + isUserCreated=true + category=snacks')
  it('calls onCancel when cancel button tapped')
})
```

Test via `render()` from `@testing-library/react-native` — no DB, no fetch, no expo-camera. The form is a leaf component consuming only validation helpers.

**Acceptance:** 13 new tests pass; form component is stateless-ish (local form state + validation).
**Verify:** `gtt`, `npm run lint`, `npm run typecheck`

---

### Task 7: Wire `fetchOffProduct` to use retry helper + timeout (S)

**Files:** `src/services/open-food-facts.ts`, `src/services/open-food-facts.test.ts`
**Depends on:** Task 1 (retry helper + `OffNetworkError`)
**Parallel group:** P3 (can run alongside Task 6)

**What:** Refactor the `fetchOffProduct` function to:

1. Use `AbortController` with a 10s timeout
2. Wrap the actual `fetch()` call in `retryOnNetworkError(() => doFetch(ean), { retries: 1, delayMs: 2000 })`
3. On HTTP 404 or `status: 0` → still returns `null` (unchanged, no retry because the helper only retries on THROWN errors)
4. Network/abort/timeout failures propagate as `OffNetworkError` via the retry helper

Key design point (enforced by the helper design in Task 1): **the helper only retries on thrown errors, NOT on null returns.** 404 paths return `null` → helper doesn't retry. This makes "no retry on 404" a structural property of the code, not a conditional branch.

**Test first (RED):** This task's verification is primarily **manual on device** (per codebase convention — [open-food-facts.test.ts:5](src/services/open-food-facts.test.ts:5)). Unit tests cover only what doesn't require `fetch()` mocking:

```ts
describe('fetchOffProduct() integration', () => {
  // Existing normalizer tests remain unchanged.
  // New: type-level assertions that the function signature hasn't changed.
  it('exports fetchOffProduct returning Promise<OffResult | null>')
  it('exports OffNetworkError class') // duplicated from Task 1 but asserts re-export
})
```

Real behavior is verified in Task 9 (manual device tests: airplane-mode retry, slow-network timeout, known-not-in-OFF EAN).

**Acceptance:** Code compiles; retry helper is called; 404 path unchanged; no test regressions.
**Verify:** `gtt`, `npm run typecheck`, manual on device (Task 9)

---

### Task 8: Wire `BarcodeScannerSheet` to `resolveScan` + manual-create state (L)

**Files:** `src/components/nutrition/BarcodeScannerSheet.tsx`
**Depends on:** Tasks 4 (resolveScan), 6 (ManualFoodForm), 7 (fetchOffProduct with retry)
**Parallel group:** P4

**What:** Refactor the sheet:

1. Replace `handleBarcodeScanned`'s inline logic with `resolveScan(data, { getByBarcode, fetchOffProduct, insertFood })`
2. Branch on `resolution.kind`:
   - `'local_hit'` → `onFound(food, false)` (unchanged)
   - `'off_hit'` → `onFound(food, isPartial)` (unchanged)
   - `'not_found'` → `setScanState('not_found')` (now shows "צור מוצר חדש" CTA)
   - `'network_error'` → `setScanState('no_connection')` (retry button re-fires OFF-only)
3. Add `scanState: 'creating'` to the union
4. Add `lastEan` ref to preserve the scanned code across retries (no re-scan needed)
5. Add `handleRetryOff()` — re-calls `resolveScan(lastEan, deps)` but skips the camera re-prompt
6. Add `handleCreateManual()` — sets `scanState = 'creating'`
7. Render `<ManualFoodForm ean={lastEan} onSubmit={handleManualSubmit} onCancel={handleCancelCreate} />` when `scanState === 'creating'`
8. `handleManualSubmit(food)` calls `foodRepository.insertFood(food)` + `onFound(food, false)`
9. One-line invariant comment in `handleManualSubmit`: `// getByBarcode in handleBarcodeScanned already ruled out a manual_<ean> collision`

**Test first:** No new component test file for the sheet (per codebase convention — see Risk Flag #3). Logic is in `resolveScan` (tested in Task 4) and `ManualFoodForm` (tested in Task 6). The sheet is a thin state-machine renderer. Manual device verification covers wiring (Task 9).

**Acceptance:** All three new transitions work on device; existing scanner happy-path still works; no existing tests break.
**Verify:** `gtt` (existing tests don't regress), `npm run lint`, `npm run typecheck`, manual on device.

---

### Task 9: Manual device test pass (M)

**Files:** none (PR test plan)
**Depends on:** Tasks 1–8
**Parallel group:** P5

**What:** Run `dev`, scan real Israeli products under various network conditions. One test per acceptance criterion in the spec (14 items). Document each in the PR test plan with the exact EAN used + observed result.

**Acceptance:** Every acceptance-criteria checkbox in the PR test plan gets ticked individually with evidence (not batch-checked). See PR Test Plan section below.

**Verify:** screenshots + manual confirmation per checkbox.

---

### Task 10: Docs — lessons.md, TASKS.md, REVIEW.md (XS)

**Files:** `lessons.md`, `TASKS.md`, `REVIEW.md`
**Depends on:** Tasks 1–9
**Parallel group:** P5

**What:**

- **lessons.md** — add section "Barcode Scanner Unhappy-Path (2026-04-18)" with: (1) the `getByBarcode` invariant note (reachable collision risk for future entry points), (2) first-use of `AbortController + setTimeout` for fetch timeout pattern, (3) extracted-helper-for-component-test pattern reconfirmation, (4) any implementation surprises discovered.
- **TASKS.md** — mark this feature done with today's date in the same commit (workflow rule #8). Add follow-up: "Text-search 'no results → create food' — reuse ManualFoodForm, add `manual_<uuid>` id generation, add pre-submit `getById` collision check with overwrite confirmation."
- **REVIEW.md** — add any new patterns revealed during `/review`.

**Acceptance:** All three docs updated; workflow checklist items 6–8 satisfied for the pre-commit block.

---

## Risk Flags

### R1 (HIGH) — First AbortController use in codebase

`Grep` for `AbortController|AbortSignal` across `src/` returns zero matches. Task 7 introduces the pattern.
**Mitigation:** Task 1's retry helper is pure (accepts `fn` param); AbortController lives only inside `fetchOffProduct` and is isolated. jest-expo + Node 20 support it natively — no polyfill needed. Verify in Task 9 that Hermes on iOS Simulator handles abort correctly (real-device sanity check).
**Escalation trigger:** if device test reveals AbortController doesn't abort fetch on iOS Simulator, fall back to Promise.race with a timer — wastes a test run but no scope change.

### R2 (HIGH) — Codebase convention: no fetch mocking

[open-food-facts.test.ts:5](src/services/open-food-facts.test.ts:5) explicitly states network I/O is manually verified, not mocked. This PR follows the convention — retry logic is tested via a pure helper (Task 1), and the network-integration path is manually verified (Task 9).
**Mitigation:** the plan enforces this. Don't break the convention mid-PR.
**Escalation trigger:** if reviewer (CI AI review) asks for fetch-mocked integration tests, counter with the existing convention + Task 1's helper tests.

### R3 (MEDIUM) — BarcodeScannerSheet.tsx has no test file today

Previous PR #72 shipped the scanner with zero component tests. Forcing one now means fighting jest-expo to mock `CameraView` + `useCameraPermissions`.
**Mitigation:** extract logic into `resolveScan` (Task 4) — matches precedent (`finishOnboarding`, `computeGaugeProgress`, `computeMealTargets`). Sheet becomes a thin state-machine renderer — manual verification in Task 9.
**Escalation trigger:** reviewer demands a sheet-level test → build one in a follow-up, not this PR.

### R4 (LOW) — Test LoC estimate was 400; actual plan is ~560

Breakdown: Task 1 +60, Task 2 +120, Task 3 +30, Task 4 +120, Task 6 +200, Task 7 +10 = 540 lines. Under PR line budget (~500 pre-warn, ~1000 soft cap).
**Mitigation:** not a risk to the PR, just a plan-accuracy flag. PR will tip ~1000+ LoC total (code + tests) — workflow step #14 (size check) will warn but not block.

### R5 (LOW) — ManualFoodForm renders many inputs, RTL-forced layout

Forced-RTL layout can look weird for mixed LTR numeric inputs (gram values, calorie values). Lessons precedent ("Hebrew displays numeric pair values in LTR") is about DISPLAY rows, not input fields — input fields themselves render RTL correctly.
**Mitigation:** test on device (Task 9), verify number keypads open correctly for numeric fields (`keyboardType="numeric"`).
**Escalation trigger:** if layout looks broken on device, budget 30 min for RTL-specific tweaks — don't redesign the form.

### R6 (LOW) — Atwater warning threshold may be noisy for legitimate products

Polyol-heavy products (maltitol, erythritol) legitimately have kcal below the 4p+9f+4c estimate because polyols aren't fully metabolized. A 25% threshold might warn on these.
**Mitigation:** the warning is non-blocking and explicitly advisory ("ייתכן שהכנסת kJ במקום kcal"). False positives cost the user 1 second of "nah, I'm sure." Non-blocking by design.
**Escalation trigger:** if device testing shows >50% false-positive rate on real Israeli supplements, widen threshold to 30% or 33% before ship.

---

## PR Test Plan Skeleton (populate in Task 9)

```
## Test plan

### Happy path regression
- [ ] Scan an EAN known to be in local DB (e.g. a sh_ or rl_ product) → PortionPicker opens directly with correct food
- [ ] Scan an EAN known to be in OFF but not local DB → food fetched, inserted, PortionPicker opens
- [ ] Scan an EAN with partial OFF data (missing fiber) → amber badge shows in PortionPicker (regression from PR #72)

### New network UX
- [ ] Airplane mode + scan → "אין חיבור לאינטרנט" + "נסה שוב" button
- [ ] Airplane mode + scan → tap "נסה שוב" → still fails → same error (verifies retry re-fires only OFF, no camera re-prompt)
- [ ] Airplane mode + scan → disable airplane mode → tap "נסה שוב" → success → PortionPicker opens
- [ ] Throttle network to very slow (simulator debug menu or OS-level) + scan → 10s timeout → "אין חיבור לאינטרנט"
- [ ] Brief network blip during scan (airplane-mode-toggle-mid-scan) → 2s auto-retry succeeds → no error UI visible to user

### OFF 404 path
- [ ] Scan an EAN known NOT to be in OFF (e.g. a no-name Israeli snack bought from makolet) → "המוצר לא נמצא" + "צור מוצר חדש" CTA
- [ ] Verify "צור מוצר חדש" is the only new button on this state; "נסה שוב" does NOT appear (404 ≠ transient)

### Manual-create form
- [ ] Tap "צור מוצר חדש" → form opens with EAN shown as read-only context
- [ ] Empty Hebrew name → submit → inline Hebrew error
- [ ] Enter name + kcal 500 / protein 40 / fat 50 / carbs 30 → submit blocked with "סכום ... לא יכול לעבור 100 גרם" + likely-cause hint
- [ ] Enter name + kcal 836 (kJ value) / protein 10 / fat 5 / carbs 20 → Atwater warning shows, submit STILL works
- [ ] Fill only servingName ("יחידה") without grams → inline error
- [ ] Fill only servingGrams (40) without name → inline error
- [ ] Submit with both serving fields blank → food stored with only 100g serving
- [ ] Submit with both serving fields filled → food stored with 100g + custom serving, verified in PortionPicker
- [ ] Submit with nameEn blank → food stored with nameEn === nameHe
- [ ] After successful submit → PortionPicker opens with the created food
- [ ] Re-scan the same EAN → goes straight to PortionPicker (confirms local DB hit, no form, no network)

### Pre-merge
- [ ] CI passed
- [ ] All checkboxes above individually verified with shown output or screenshot
```

---

## References

- PR #72 — barcode scanning base implementation
- [BarcodeScannerSheet.tsx:73-101](src/components/nutrition/BarcodeScannerSheet.tsx:73) — current scan handler
- [open-food-facts.ts:77-88](src/services/open-food-facts.ts:77) — current fetcher (single fetch, no timeout, no retry)
- [food-repository.ts:142-157](src/db/food-repository.ts:142) — `getByBarcode` tier ordering
- [food-repository.ts:163-187](src/db/food-repository.ts:163) — `insertFood` uses `INSERT OR REPLACE`
- lessons.md §"Raw Ingredients" — precedent for `p+f+c ≤ 100` as Zod refinement in seed schema
- lessons.md §"Nutrition Algorithm Patterns" — precedent for validation at algorithm entry points
