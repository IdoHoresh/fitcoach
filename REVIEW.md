# FitCoach Code Review Rules

Review every change against these rules. Flag violations with confidence score (0-100).

## Security (block on violation)

- [ ] No hardcoded secrets, keys, tokens, or passwords in any file
- [ ] All SQL uses parameterized queries (never string concatenation)
- [ ] Zod validation on every data boundary (API input, DB read, user input)
- [ ] Sensitive user data (weight, body measurements) uses expo-secure-store
- [ ] Environment variables have no fallback values in code

## Fitness Algorithm Accuracy (block on violation)

- [ ] Every formula matches its cited research source
- [ ] Constants match values in `src/data/constants.ts` (no inline numbers)
- [ ] Calorie calculations use component-based TDEE, not single multiplier
- [ ] Protein recommendations use adjusted body weight (Helms formula)
- [ ] Volume stays within per-session cap (8-12 direct sets per muscle)
- [ ] Pull volume >= push volume in every split

## Code Quality

- [ ] No magic numbers — use named constants with research citations
- [ ] No duplicate code — extract to shared functions
- [ ] No dead code or commented-out code (git has history)
- [ ] Methods are short (< 20 lines ideally)
- [ ] Single responsibility — each function does one thing
- [ ] Meaningful names — no `temp`, `data`, `info` without context
- [ ] Path aliases used (`@/algorithms` not `../../algorithms`)

## TypeScript

- [ ] No `any` types — use proper typing or `unknown` with narrowing
- [ ] No type assertions (`as`) without justification
- [ ] Zod schemas match TypeScript types (single source of truth)
- [ ] Exported functions have explicit return types

## React Native / Expo

- [ ] No inline styles — use StyleSheet.create or theme tokens
- [ ] Accessibility labels on interactive elements
- [ ] i18n strings for all user-facing text (Hebrew + English)
- [ ] No blocking operations on the main thread

## Testing

- [ ] Business logic has unit tests (algorithms, calculations, state)
- [ ] Tests use descriptive names: `methodName_scenario_expectedResult`
- [ ] No testing implementation details — test behavior
- [ ] Edge cases covered (zero, negative, boundary values)

## Performance

- [ ] No expensive operations in render paths or loops
- [ ] Zustand selectors are granular (no selecting entire store)
- [ ] Lists use FlatList, not ScrollView with map
- [ ] Images are optimized and cached

## Patterns Learned (updated as we ship)

- **No unsafe `as` casts on partial data.** Don't cast `Partial<T>` to `T` — validate first with Zod or manual checks. SQLite NOT NULL constraints will throw at runtime. (2026-04-06)
- **Async store actions must handle errors.** `try/finally` resets loading state but swallows the error. Either re-throw or set an `error` state field so the UI can show a message. (2026-04-06)
- **No inline IIFEs.** `(({ id, ...rest }) => rest)(obj)` is hard to read. Extract to a named helper function. (2026-04-06)
- **Generated IDs must be globally unique.** When building objects inside nested loops (days × meals), include ALL loop indices in the ID — not just the inner one. `planned_0` repeats across days; `planned_d0_0` is unique. (2026-04-07)
- **i18n keys built from enums need exhaustive coverage.** If `getKey(action, severity)` produces `action.severity` keys, every valid `action × severity` combination must exist in both language files. TypeScript won't catch missing nested keys. (2026-04-07)
- **Run `/review` before committing, not after.** Review catches issues that should be fixed before they enter git history. (2026-04-06)
- **Repository must return domain types, not DB rows.** Exposing `SetLogRow` (snake_case) into the store layer creates tight coupling. Map inside the repository. (2026-04-07)
- **Track SQLite UUIDs in store state.** `planId` and `templateId` must be the actual DB UUIDs — passing day-type strings as foreign keys causes silent data corruption. (2026-04-07)
- **Wrap `JSON.parse` on DB columns.** Corrupted or null JSON columns crash the whole call chain. Add try/catch with descriptive error. (2026-04-07)
- **Resolve i18n keys before DB persistence.** Don't store raw i18n key paths in DB columns — resolve to actual language strings at write time. (2026-04-07)
- **Date windows must not overlap.** Rolling windows for weekly comparisons must be non-overlapping. Off-by-one in boundaries causes shared data points between "current" and "previous" week. (2026-04-07)
- **RTL-sensitive style properties must be dynamic.** Never hardcode `transformOrigin`, directional `textAlign`, or directional padding — use `isRTL()` to set them. Static `'left'` breaks Hebrew layout. (2026-04-08)
- **Timer components must clean up on unmount.** Any `setInterval`/`setTimeout` (long-press, polling) needs a `useEffect` cleanup return. Otherwise callbacks fire on unmounted components. (2026-04-08)
- **`forceRTL` must be called at module level.** Calling `I18nManager.forceRTL()` inside `useEffect` is too late — the layout is already rendered LTR. Call it at the top of the root layout file, outside any component. (2026-04-08)
- **Displayed values must match goal-adjusted calculations.** When algorithms produce multiple similar numbers (maintenance TDEE vs goal-adjusted calories), verify the UI displays the correct one. Write regression tests asserting `targetCalories !== tdeeBreakdown.total` for fat_loss/muscle_gain. (2026-04-08)
- **Schema must match repository INSERT columns.** Every column in a repository INSERT must exist in the CREATE TABLE. `CREATE TABLE IF NOT EXISTS` won't add missing columns to existing tables — schema drift is silent until the first INSERT crashes at runtime. (2026-04-09)
- **Migration system needs ALTER TABLE support.** `CREATE TABLE IF NOT EXISTS` is not a migration — it only runs on fresh databases. When adding columns to existing tables, add version-gated `ALTER TABLE ADD COLUMN` statements. (2026-04-09)
- **No raw string interpolation in SQL, even for column names.** `ORDER BY ${orderBy}` is SQL injection even if called with hardcoded strings today — validate with regex or use an allowlist. The "parameterized SQL only" rule includes non-value clauses. (2026-04-09)
- **One canonical `isRTL()` implementation.** Duplicate RTL checks (one checking `I18nManager.isRTL`, another checking `currentLanguage`) diverge silently. Keep a single source of truth and re-export. (2026-04-09)
- **`new Date('YYYY-MM-DD').getDay()` has timezone mismatch.** Date-only strings are parsed as UTC midnight, but `.getDay()` returns the local-timezone day. Use `new Date().getDay()` for "today" or pin timezone explicitly. (2026-04-09)
- **TODO comments are bugs waiting to happen.** `primaryMuscle: 'chest' // TODO: look up` shipped to all exercises. TODOs in logic paths should be treated as blockers, not notes. (2026-04-09)
- **Algorithm entry points need validation guards.** Zod validates at UI boundaries, but direct function calls can pass NaN/Infinity. Add `RangeError` guards at public algorithm entry points (`calculateBmr`, `calculateNutritionTargets`). (2026-04-09)
- **Don't log sensitive key names.** `console.error('Failed for key "${key}"')` in secure storage leaks what data exists. Log the operation, not the identifier. (2026-04-09)
- **No throwing lookups in render paths.** Helpers like `getExerciseById(id)` that `throw` on missing data will crash the whole screen if stale references hit them (removed/renamed exercises in saved plans). In components, prefer `Map.get(id)` with a graceful fallback; reserve throwing variants for algorithms where a missing ID is genuinely a dev error. (2026-04-09)
- **Mesocycle `currentWeek` is the _in-progress_ week, not a completed-streak counter.** Displaying `mesocycle.currentWeek` as a "streak" shows "1 week" on day 1 before the user has done anything. Subtract 1 (floored at 0) when surfacing as a streak, or add a dedicated selector. (2026-04-09)
- **Hebrew renders numeric pair values in LTR order.** `1,706 / 1,701`, `60g/150g`, ratios, prices, dates — stay in western left-to-right order even though the surrounding Hebrew text flows RTL. Do not apply `flexDirection: 'row-reverse'` to number rows; `I18nManager.forceRTL(true)` at app load already flips `'row'` correctly, and `row-reverse` double-flips back to the wrong order. (2026-04-10)
- **SVG geometry is not unit-testable.** Tests can verify props, text, and testIDs, but jest-expo does not render SVG path/circle/transform math. Extract numeric helpers (e.g. `computeGaugeProgress`) as pure functions and test those; accept that pixel verification requires device testing; always re-run on device between SVG edits, never "when the tests go green." (2026-04-10)
- **Guard async callbacks behind a ref when the triggering UI can dismiss.** A bottom sheet that fires an async request (`getProgressionAdvice`) can close before the promise resolves. Without a guard, `setState` fires on stale/hidden UI. Use a `useRef(boolean)` set true on open, false on close, and check before any setter in `.then`/`finally`. (2026-04-10)
- **Enum-like display values (muscle names, equipment) must go through i18n.** Raw type keys like `'chest'` or `'barbell'` are code identifiers, not translatable labels. Add a lookup map to the i18n files and a helper function. (2026-04-10)
- **Store actions that clear their input on success must be idempotent on retry.** `completeOnboarding` set `draft: {}` after saving; when a downstream step failed and the user tapped retry, the second `completeOnboarding` call hit `validateDraft({})` and errored. Always guard the top of such actions with a "did this already run?" check (e.g. `if (isOnboarded) return`). Applies to any action where success state implies "no re-run needed". (2026-04-17)
- **Multi-store orchestration lives outside the stores, as dependency-injected helpers.** `useUserStore` cannot import `useWorkoutStore` / `useNutritionStore` without creating a cycle. Orchestration that spans stores (post-onboarding plan gen, cold-start rehydrate) belongs in a standalone module (`src/stores/onboardingBootstrap.ts`) that takes store actions + error getters as parameters — unit-testable without SQLite, no cycles. (2026-04-17)
- **Extract orchestration into a pure DI helper when the host component mocks badly.** Components that render hard-to-mock children (CameraView, native modules, SVG geometry) should have their branching logic factored out into a pure `resolveX(input, deps)` helper. Test the helper exhaustively, render the shell manually on device. Precedent: `resolveScan` (barcode scanner, 2026-04-18), `finishOnboarding` (2026-04-17), `computeGaugeProgress` (2026-04-10). (2026-04-18)
- **Retry-on-throw + return-null-on-known-absent is the cleanest fetch retry shape.** A retry helper that retries ONLY on thrown exceptions — passing return values through untouched — lets "no retry on 404" become a structural property of the calling code (return null for 404, throw for network error) rather than a conditional branch inside the retry loop. Easier to read, easier to prove correct. (2026-04-18)
- **Zod error messages as i18n-key tokens keep schemas locale-agnostic.** Instead of `.min(1, 'שם בעברית נדרש')`, use `.min(1, 'nameRequired')` + map tokens to localized strings in the UI layer. Schema becomes reusable from non-UI callers (scripts, tests) without locale setup. (2026-04-18)
