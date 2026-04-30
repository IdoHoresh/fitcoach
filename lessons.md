# FitCoach — Lessons Learned

Codebase-specific patterns, gotchas, and decisions. Claude reads this at session start.

## What Has Worked

- Component-based TDEE is more accurate than single activity multiplier
- Equipment as checklist (not tiers) handles all gym configurations cleanly
- Every constant with a research citation prevents "where did this number come from?" confusion
- Zod schemas as single source of truth for validation + types

## What Has Failed

- `SessionDuration` is `30 | 45 | 60 | 75 | 90` — don't pass `0` for "no exercise", use `30` (ignored when `exerciseDaysPerWeek: 0`). Caused CI #2 failure. (2026-04-06)
- `LifestyleProfile` requires `sleepHoursPerNight` — easy to forget in test fixtures. Caused CI #2 failure. (2026-04-06)
- Pushed code without running local checks (lint/typecheck/tests) — caused avoidable CI failure. Always run all three before committing. (2026-04-06)
- GitHub Actions `@v4` targets Node 20 internally — bumping `node-version` doesn't fix the deprecation warning. Use `@v5` for native Node 24 support. (2026-04-06)

## Expo / React Native Gotchas

- Always wrap `setState` calls inside `useAnimatedReaction` with `runOnJS(setter)(value)` — reanimated callbacks run on the UI thread. Direct `setState` works in Jest (mocked) but crashes on real devices. (2026-04-08)
- `textAlign`, directional padding/margin, and icon positions must be wired through `isRTL()` — never hardcoded. Default RN text alignment is unreliable across component types. (2026-04-08)
- Timer-based components (`setInterval`/`setTimeout` in long-press, polling, etc.) must clean up on unmount via `useEffect` return. Otherwise timers fire on unmounted components. (2026-04-08)
- `I18nManager.forceRTL()` must be called at **module level** (outside components/effects), not inside `useEffect`. On Android, `forceRTL` requires an app restart — calling it inside `useEffect` is too late, the layout is already rendered LTR. Guard with `if (isRTL() && !I18nManager.isRTL)`. (2026-04-08)
- **`DevSettings.reload()` breaks RTL layout on iOS.** A JS-only bundle reload does NOT reinitialize the native I18nManager or Yoga layout engine. The module-level `forceRTL` guard in `app/_layout.tsx` correctly skips re-forcing (because `I18nManager.isRTL === true` from the original native launch), but Yoga was never reset — so some views render LTR after the reload. Dev "reset app" buttons must wipe data and instruct the user to force-close the app manually; a full native relaunch is the only reliable way to restore RTL in dev. (2026-04-09)
- **RTL direction rules (learned the hard way — 2026-04-09):**
  - **Absolute positioning (`left` / `right`):** React Native auto-swaps these when `I18nManager.isRTL` is true. **Never** apply a manual `isRTL() ? 'right' : 'left'` — that double-flips. Always use `left: 0` and let RN handle RTL. **EXCEPTION (2026-04-09):** RN's auto-swap does **not** apply when the same view's style array includes a reanimated `useAnimatedStyle` output — the UI-thread setter bypasses the JS-side layout interpolator. For a progress-bar fill whose `width` is animated via reanimated, `left: 0` stays `left: 0` in RTL and the bar grows in the wrong direction. Fix: put `transform: isRTL() ? [{ scaleX: -1 }] : undefined` on the **parent track** — transforms aren't affected by RTL auto-swap and mirror the entire subtree visually. Only safe when the track has no text children.
  - **`flexDirection: 'row'` with `flexWrap`:** RN is supposed to auto-flip to `row-reverse` in RTL, but this is **unreliable in Expo Go on iOS**. Always use explicit `isRTL() ? 'row-reverse' : 'row'` for grid / wrap / directional rows. (Plain rows without wrap sometimes auto-flip, but belt-and-suspenders with explicit conditional is safer.)
  - **`transformOrigin` on `Animated.View`:** not honored consistently by RN + Reanimated. Don't use it for direction-sensitive animation — use width animation + absolute positioning instead (e.g., pin fill to `left: 0` and animate `width`).
  - **Module-level `StyleSheet.create`:** `isRTL()` resolves once at import time. For styles that need to react to language changes at runtime, compute them inside a render function instead of at module level.
  - **Margins:** prefer `marginStart` / `marginEnd` / `paddingStart` / `paddingEnd` over `marginLeft` / `marginRight` — the logical props flip correctly in RTL without needing a conditional.
- **`app.json` plugins array is for config plugins only.** Pure JS libraries like `expo-crypto`, `expo-haptics`, `expo-localization` do not ship config plugins and must NOT be listed. Listing them triggers a fallback import that loads the package's main export; on Node 24 this crashes because `expo-modules-core/src/index.ts` hits the `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` error. Verify with `test -f node_modules/<pkg>/app.plugin.js` before adding to plugins. (2026-04-09)
- `@expo/vector-icons` breaks Jest because it transitively loads `expo-modules-core`, which crashes with "Cannot read properties of undefined (reading 'EventEmitter')". Mock the whole module in `jest.setup.ts` with a factory that returns `React.createElement(View)` per icon family. Do NOT call `View(...)` directly — Babel's class transform requires `new`/`React.createElement` (calling a React Native class component as a function throws `_classCallCheck`). (2026-04-09)
- **`TextInput` value in RNTL tests: use `.props.value`, not `toHaveTextContent`.** `toHaveTextContent` works for `<Text>` but does not read the `value` prop of `<TextInput>`. Assert `expect(getByTestId('input').props.value).toBe('100')`. (2026-04-12)

## UI ↔ Algorithm Wiring

- **Always verify the displayed value matches the intended value.** When multiple similar numbers exist (TDEE maintenance vs goal-adjusted calories), the UI can wire the wrong one. Result screen showed `tdeeBreakdown.total` (maintenance) instead of `nutrition.targetCalories` (with deficit/surplus applied). Every user saw wrong calories. Write regression tests asserting `targetCalories !== total` for non-maintenance goals. (2026-04-08)

## Architecture Patterns

- Pure functions for all algorithms (no side effects, easy to test)
- Barrel exports (index.ts) in each module folder
- Path aliases (@/algorithms, @/types) for clean imports
- Parameterized SQL only — never concatenate user input

## Zustand Store Patterns

- One store per domain (user, workout, nutrition) — decided 2026-04-06
- Draft pattern for onboarding: accumulate in `Partial<T>`, save all at end
- TDEE/macros recalculated on app open (not cached in SQLite) — fast, avoids stale data
- Workout plan saved to SQLite (complex, user may customize)
- Store calls algorithms automatically — UI just calls actions, never triggers calculations directly
- Validate draft with Zod before casting `Partial<T>` to full `T` — SQLite will throw on NULL violations otherwise
- Handle async errors in store actions — `try/finally` resets loading but swallows errors; use error state or re-throw
- Don't use inline IIFEs for object stripping — extract to named helper for readability
- Repository methods must return domain types, never raw DB row types — leaking snake_case fields into stores creates coupling
- Track SQLite UUIDs (planId, templateId) in store state — foreign keys need real IDs, not day-type strings
- Wrap JSON.parse on DB columns in try/catch — corrupted data shouldn't crash the whole store

## Data Layer Patterns

- Use `COUNT(DISTINCT meal_type)` not `COUNT(*)` when counting meals — multiple food_log entries per meal inflate the count. Field name must match semantics. (2026-04-07)
- Reference food constants by name (`CHICKEN_BREAST.id`) not string IDs (`'food_005'`) — sequential counter IDs shift when items are reordered or inserted. Caused all 13 meal templates to reference wrong foods. (2026-04-07)
- Use content-filtered mock assertions (`mock.calls.filter(c => c[0].includes('INSERT'))`) not positional (`mock.calls[0]`) — positional breaks silently when implementation reorders SQL statements. (2026-04-07)
- `savePlan` transactions should archive old plans before inserting new — prevents two active plans existing simultaneously. (2026-04-07)

## Nutrition Algorithm Patterns

- Meal plan IDs must include day index (`planned_d0_1` not `planned_1`) — otherwise 7 days × 3 meals share only 3 distinct IDs, causing silent corruption when stored or used as React keys. (2026-04-07)
- When i18n keys are assembled from enum combinations (`action.severity`), ensure ALL valid combinations have entries — TypeScript won't catch missing nested keys at compile time. (2026-04-07)
- Remove unused function parameters instead of prefixing with `_` — dead params with misleading JSDoc are worse than no param. (2026-04-07)
- Always resolve i18n keys to actual strings before persisting to DB — storing raw keys like `'recalibration.stay_course'` instead of the Hebrew/English text means the DB contains untranslated data. (2026-04-07)
- Date window helpers for "current week" and "previous week" must not overlap — `today - 0..6` and `today - 7..13` share day `-7`. Use non-overlapping ranges like `today - 1..7` and `today - 8..14`. (2026-04-07)

## Derived Fields

- When a field is derived (not user-entered), ensure derivation happens in ALL code paths that read the draft — not just the final save. The result screen previews TDEE from the draft _before_ `completeOnboarding` runs, so deriving `exerciseDaysPerWeek` only in `completeOnboarding` caused NaN on the preview. (2026-04-08)
- Test files inside `app/` directory crash the app — expo-router treats them as routes and tries to execute `describe()` at runtime. Keep test files in `src/` or co-located outside the router. (2026-04-08)

## QA Review Patterns (2026-04-09)

- **Schema ↔ repository column drift is the #1 crash risk.** The `workout_plan` table was missing 5 columns the repository tried to INSERT. `CREATE TABLE IF NOT EXISTS` doesn't update existing tables — any schema change needs explicit ALTER TABLE migrations with version gates.
- **TODO comments in logic paths ship as bugs.** `primaryMuscle: 'chest' // TODO` meant ALL exercises used chest for progression. If a TODO affects runtime behavior, fix it before merging — it's not a note, it's a defect.
- **Duplicate utility functions diverge silently.** Two `isRTL()` functions existed — one checked the language setting, another checked `I18nManager.isRTL`. They could return different values. Single source of truth, re-export if needed for import convenience.
- **Date parsing timezone traps.** `new Date('2026-04-09')` is UTC midnight. `.getDay()` converts to local timezone. In Israel (UTC+2/3) it's fine, but the pattern is a landmine. For "today's day of week", use `new Date().getDay()` directly.
- **Test with fake timers when logic depends on "now".** Tests that hardcode a date for "today" break when run on different days. `jest.useFakeTimers({ now: fixedDate })` makes `new Date()` deterministic.
- **Validation at boundaries is not enough — add guards at algorithm entry points.** Zod catches bad input at the UI layer, but algorithms called directly (from stores, tests, or future code) can receive NaN. Lightweight `RangeError` guards at the entry function catch this.
- **Secure storage error messages should not include key names.** Logging which key failed exposes what sensitive data exists. Log the operation type only.

## Home Dashboard (2026-04-09)

- **No throwing lookups in render paths.** `getExerciseById(id)` throws on missing — fine in algorithms (dev error) but catastrophic in a React render tree: one stale exerciseId in a saved plan crashes the whole Home screen. In components, use `EXERCISE_MAP.get(id)` with a graceful fallback (raw id, placeholder label). Reserve throwing variants for data-layer code where a miss is genuinely unrecoverable.
- **`mesocycle.currentWeek` is the _in-progress_ week, not a completed-streak counter.** Surfacing it directly as a "streak" shows "1 week" on Day 1 of Week 1 before the user has finished anything. Subtract 1 (floored at 0), or add a dedicated `getCompletedStreakWeeks()` selector when stricter semantics are needed.
- **Component tests that import a Zustand store transitively pull in `expo-sqlite`.** Even if the component never calls a DB method, `@/stores/useWorkoutStore` → `@/db` → `expo-sqlite` runs at import time and explodes under jest. Mock `@/db` (and transitive deps like `@/stores/useUserStore`) at the top of each component test file. `jest.mock` calls are hoisted, so regular `import` statements can stay at the top of the file and `import/first` is happy.

## Home v2 — RTL + SVG (2026-04-10)

- **Hebrew displays numeric pair values in LTR, not RTL.** `1,706 / 1,701`, `60g/150g`, dates, prices, ratios — all stay in their natural western left-to-right order even when the surrounding sentence flows RTL. Do NOT apply `flexDirection: 'row-reverse'` to number rows. With `I18nManager.forceRTL(true)` already active at app load, plain `flexDirection: 'row'` produces the correct visual order for number pairs in both locales. Only mirror rows that contain Hebrew text + an icon (e.g. meal row header), not pure data rows.
- **SVG half-circle gauges are easier as `<Circle>` + `strokeDasharray` + `overflow: 'hidden'` than as `<Path d="M ... A ...">`.** I burned two attempts fighting sweep-flag semantics on arc paths, one of which rendered only the stroke linecaps with no arc body (same path string worked in browser SVG). Dropped to the proven `MacroRing` pattern: draw a full circle, use `strokeDasharray=[halfCircumference, fullCircumference]` to paint only half the perimeter, `transform="rotate(180 cx cy)"` to put the visible half on top, then clip the bottom half via a View wrapper. First try, works.
- **SVG geometry is not unit-testable in jest.** Props + text + testIDs render correctly under jest-expo's mocks, but the path/circle/transform math renders invisibly. Two attempts at the gauge passed all unit tests while being visually broken on device. Takeaways: (1) extract numeric helpers (like `computeGaugeProgress`) as pure functions and test those, (2) accept that pixel verification for SVG components requires device testing, and (3) when debugging SVG, always test on device between edits, not "after the tests go green."
- **`jest.useFakeTimers` is required whenever a component reads `new Date()` at render time.** HomeHeader, TodaysPlanList and the `buildTodaysPlan` pure function all depend on "today". Without frozen time, tests pass on one weekday and fail on another. Use `beforeEach(() => jest.useFakeTimers({ now: new Date('2026-04-09T12:00:00') }))` and `afterEach(() => jest.useRealTimers())`.

## Workout Screen (2026-04-10)

- **Guard async state updates behind a ref when the triggering UI can close.** Opening a bottom sheet fires `getProgressionAdvice()` (async). If the user closes the sheet before the promise resolves, `setSheetAdvice(advice)` sets stale state on a hidden modal. Use a `useRef(boolean)` tracking whether the sheet is still open, and check it before calling any setter in the `.then`/`finally` path.
- **Muscle names, equipment names, and other enum-like display strings must go through i18n.** Raw MuscleGroup keys (`'chest'`, `'triceps'`) are code identifiers, not user-facing labels. Add a `muscles` map to the i18n files and use a `translateMuscle()` helper. Same principle applies to equipment items when they reach the UI.

## Nutrition Algorithm Patterns (cont.)

- **`Math.ceil(cap) - 1` for strict integer thresholds.** When a constraint is `value < threshold` and values are integers after rounding, `Math.floor(threshold)` is wrong when `threshold` is exactly an integer (e.g. `600 × 0.15 / 9 = 10` — `Math.floor(10) = 10`, but `10 × 9 / 600 = 0.15` which fails a strict `< 0.15` test). Use `Math.ceil(threshold) - 1` instead — it gives the largest integer strictly less than the threshold in all cases. (2026-04-11)
- **Store implementation vs interface placement after formatter runs.** When adding a new action with `Edit`, the formatter can reflow the file in a way that drops implementation code inside the TypeScript interface block instead of the store object — a syntax error that only surfaces at runtime. After any store edit, grep for the action name to confirm it appears exactly twice: once as a type signature in the interface, and once as an implementation in the `create(...)` object. (2026-04-11)
- **`MealType` vs `MealName` when indexing a `Record<MealName, ...>`.** `MealType` is a superset (`'pre_workout' | 'post_workout'` extra values), so using a `MealType` variable to index `Record<MealName, T>` is a TypeScript error. Fix by declaring loop variables as `MealName[]` when you know the array only contains the 4 named meals, letting the type system narrow automatically. (2026-04-11)

## SQLite Seeding / Food Database (2026-04-11)

- **Jest hoisting + module-scoped mock variables.** `jest.mock()` is hoisted above all variable declarations by babel-jest. If you write `const mockFn = jest.fn()` before `jest.mock(...)`, `mockFn` is `undefined` inside the factory (the factory runs before your `const` line despite its position). Fix: create `jest.fn()` calls inside the factory, then access them via `import { thing } from '@/module'` + `const mockFn = thing as jest.Mock` after the factory. The import at the top of the file is fine — hoisted imports are resolved after all `jest.mock` factories run.
- **Run `npm install` after adding any entry to `package.json`.** CI uses `npm ci` which requires exact lock file sync. Adding a dep to `package.json` without running `npm install` first leaves the lock file stale and fails CI with `Missing: <pkg> from lock file`.
- **SQLite batch INSERT param limit.** SQLite's max bound parameters is 999. For multi-row inserts, calculate `rows × columns_per_row` and cap accordingly. Tzameret seed uses 50 rows × 11 columns = 550 params/batch — safely within the limit with headroom.
- **Serving sizes as JSON column avoids N+1.** Storing `serving_sizes_json TEXT` instead of a `servings` join table means every `SELECT * FROM foods` query returns complete data in one query. Trade-off: no relational queries on serving attributes, but food search never needs them.

## Supermarket Scraper / Multi-Source Seed (2026-04-11)

- **Schema migration guard: seed vs schema.** ALTER TABLE migrations (v5–v9) use `currentVersion > 0 && currentVersion < N` because fresh installs get the latest schema from `CREATE TABLE IF NOT EXISTS` and don't need column additions. Seed migrations (v10, v11) use bare `currentVersion < N` so they also run on fresh installs (currentVersion=0) — fresh installs need the seed data too. Never apply the `> 0` guard to seed-only migrations.
- **`unit: 'ml'` vs `unit: 'grams'` for liquid container servings.** The `ServingSize.unit` field drives UI rendering. Drinkable yoghurts and protein shakes stored in ml must use `unit: 'ml'` for the container serving — not `'grams'` even though the gram value is the same numerically. Reviewers will flag this as a data-correctness issue.
- **Scraper dry-run output should be printed at page level, not inside the product loop.** An early `return` inside the per-product fetch loop bypasses outer loop cleanup and makes the control flow hard to follow. Instead, accumulate into `allProducts` normally and print `allProducts[0]` after the product loop completes, before the `if (DRY_RUN) break`.
- **Parse error handling for pipeline input files.** If `tmp/shufersal-raw.json` is from an interrupted scrape it may be partial/corrupt. Wrap `JSON.parse(fs.readFileSync(...))` in try/catch with a clear message ("delete and re-run scrape-shufersal") so developers get an actionable error instead of a raw `SyntaxError` stack trace.
- **Rate-limit all network calls, not just successful ones.** In a scraper fetch loop, sleeping only after valid responses leaves 404s and null responses unthrottled — consecutive failures hit the API as fast as the event loop allows. Gate the sleep on whether a network call was made (`!isCached`), not on whether it returned data. Move `fetched++` and `await sleep(ms)` before the null check so every real HTTP request is rate-limited regardless of its outcome.
- **Elasticsearch single-char queries are API-limited.** Rami Levy's search endpoint (`/api/search?q=`) returns ≤100 results for single-char queries regardless of `size=`. Use 2+ char terms instead. Also, pagination must advance by actual page size (`response.data.length`), not the requested page size — some ES endpoints return variable page sizes. Stop condition: `from >= response.total`, not `data.length < SEARCH_PAGE_SIZE`.

## Seed Dedup (2026-04-13)

- **Barcode is not identity.** The same product ships under multiple EANs (relabels, package variants, factory runs, store-brand swaps). ID-based dedup on `sh_<barcode>` / `rl_<barcode>` leaves 100s of visual duplicates in the final seed. Always content-hash seed rows before shipping: `normalizedName + calories + protein + fat + carbs`.
- **Strict content hash is not enough for Hebrew product data.** Three more noise sources beat a strict hash: (1) singular/plural descriptor variation (`פרוסה` vs `פרוסות`), (2) trailing orphan modifiers after the `%` token (e.g. dangling `שומן`), (3) measurement drift of ~3% between SKUs. Fuzzy dedup needs a plural whitelist + trailing-modifier drop.
- **Macro-window clustering is too tight in practice.** A ±15 kcal / ±2g window looks safe on paper but misses the real cases. Shufersal shipped 3× `אורז פרסי` at 348/350/336 kcal with protein 6/8.7/0 — Δprotein ≥ 2.7 on every pair, so window-based fuzzy left all three rows. The fix: once the normalized name matches (with `%` preserved so `חלב 3%` stays distinct from `חלב 9%`), collapse the group aggressively using a non-garbage filter + richness score (count of non-null macros) with first-occurrence tie-break. Trust the name normalization; don't second-guess it with a drift tolerance that real data never respects.
- **Cross-seed dedup stays strict.** When merging Rami Levy into the Shufersal content-hash set, use strict content hashes, not fuzzy clustering. Fuzzy across stores risks collapsing genuinely different products with similar names in different supermarkets.
- **Defense in depth: build-time dedup + runtime tier cleanup.** Build-time dedup handles within-source collisions cheaply. Runtime cleanup (v17 migration) handles cross-source collisions after all seeds load, using a tier priority (`raw_%` > `manual_%` > `sh_%` > `rl_%`) to pick the winner. Runtime enforcement also protects against future regressions from new seed sources — build-time drift can't sneak past the invariant.
- **Share one `normalizeNameForDedup` between scripts and runtime migration.** Put the helper in `src/shared/` (framework-free) and import it from both the Node build scripts and the Expo/SQLite migration path. Two copies WILL drift — had that exact footgun once with percent-stripping logic in the shared module vs the scripts module.
- **Don't put `CREATE INDEX` on a new column in `CREATE_TABLE_STATEMENTS`.** `CREATE TABLE IF NOT EXISTS` is a no-op on upgrade installs, so the column won't exist yet when the index DDL runs. Put the index creation inside the version-gated migration that ALTERs the column in. Cost a device-level "no such column" crash to learn.
- **Fetch failures that don't cache loop badly on re-run.** The Rami Levy nutrition fetch writes only successful responses to `tmp/rl-nutrition-cache/`. A 1–2 hour run with ~35% transient network errors recovers almost all of them on a second pass because cache hits skip and only the originally-failed IDs are re-fetched. Probe a few "failures" with `curl` before assuming they're genuine 404s — they usually aren't.

## USDA Raw Ingredient Fetch (2026-04-13)

- **USDA `/foods/search` top-hit is untrustworthy for common foods.** Querying SR Legacy with a descriptive English name (`Chicken thigh, boneless, skinless, raw`) frequently returned the wrong food as the first result: chicken thigh → "chicken skin", beef sirloin → "veal sirloin", yogurt plain → "yogurt fruit flavored". The search engine matches tokens, not intent. For accuracy-critical pulls, pin `fdcIdHint` after verifying the specific fdcId once via the detail endpoint (`/food/{fdcId}`), rather than trusting search ranking. Log the returned description on every fetch so mismatches surface in run output instead of hiding in the cache.
- **USDA SR Legacy has gaps around regional cheese/dairy AND around common beef chuck cuts.** Several Israeli staples have no real equivalent in SR Legacy: labneh, Israeli white cheese 5%, Israeli cottage 5%/9% (USDA has 1%/2%/4%), Israeli milk 3% (USDA has 2%/whole), Emek-style yellow cheese (USDA has cheddar 402 kcal, much fattier than Emek ~340), denis. Surprisingly, beef chuck "shoulder clod separable lean only" is also absent — SR Legacy only carries it as _bison_ (game meat), not beef. Don't shoehorn these into closest-match USDA rows — the 5% accuracy threshold will be violated on almost every macro, and food names that ship labelled "bison" when the user asked for "beef" are a trust bug. Carve them out as a Tzameret-only list in the fetch config and populate directly from the Israeli MoH composition table during data entry.
- **Surgical re-fetch beats full re-fetch.** When correcting a handful of bad pulls in a cached pipeline, a `--slugs <csv>` flag that bypasses cache for specific slugs keeps the rest of the cache intact and avoids hammering the rate limiter. Combined with deleting the stale cache files for updated slugs, any fetch mode (`--force`, plain, `--slugs`) ends up consistent.
- **Schema validators encode physical reality, not data-quality heuristics.** `caloriesPer100g: z.number().positive()` was written to catch "author forgot to fill in calories", but it rejected water, salt, plain brewed coffee/tea — all legitimately 0 kcal. The correct floor is `.min(0)`: non-negative numbers ARE physically valid, and missing values still fail the outer `z.number()` check as `undefined`. Encode what's physically possible; catch "forgot to fill in" via the base type, not an over-tight bound.
- **Hebrew "נא" (raw) vs "נאה" (pretty) is a silent typo trap.** `בטטה נאה` passed lint, typecheck, and tests but means "pretty sweet potato". When adding a raw-state Hebrew name, prefer matching the existing raw-veg pattern (drop the state word entirely — `עגבנייה`, `בטטה`) rather than hand-writing `נא`, which is easy to fat-finger into `נאה`.

## Raw Ingredients End-to-End Verification (2026-04-13)

- **Fresh-install migration chain replays cleanly v0→v18.** Cold start on wiped device ran v10 supermarket seed → v12 Tzameret purge → v14 Shufersal full (4,964) → v15 Rami Levy (6,799) → v16 raw ingredients (191) → v17 `name_norm` backfill (11,954 rows) + cross-source dedup (152 deletes) → v18 FK indices, no errors. Confirms the v17 ALTER-then-backfill pattern works on fresh installs, not just upgrades. The index-inside-migration rule (not in `CREATE_TABLE_STATEMENTS`) held: no "no such column" crash.
- **Tier tiebreaker + cross-source cleanup both fire.** Device search for `חזה עוף`, `אורז לבן`, `תפוח`, `ביצה`, `שמן זית` all surfaced `raw_%` row first. Task 6's SQL `ORDER BY` tiebreaker (`raw > manual > sh > rl`) plus Task (v17) cross-source dup cleanup are redundant by design — defense in depth. Either alone would have been enough for these queries, but both together make the ranking robust against future seed sources drifting into overlap territory.

## Post-Onboarding Orchestration (2026-04-17)

- **Store actions that consume a draft must be idempotent.** `completeOnboarding` cleared `draft: {}` on success. When plan generation failed downstream and the user tapped retry, the second call hit `validateDraft({})` and surfaced "Missing required profile fields" — a misleading error for a user who had just entered all 11 screens. Fix: early-return when already onboarded so retry affects only the still-failing steps. Any action that mutates setup state should check whether that mutation already ran before doing it again.
- **Orchestrate cross-store flows from a dependency-injected helper, not from inside a store.** `useUserStore` cannot import `useWorkoutStore` / `useNutritionStore` (cycle — both already depend on it). A pure function like `finishOnboarding(deps)` that takes store actions + error getters as parameters lets the Result screen wire them in, keeps stores decoupled, and is trivially unit-testable without `expo-sqlite`. Same pattern for cold-start hydration (`rehydratePlans`).
- **Short-circuit multi-step flows on per-step `error` state, not per-step throws.** The existing store actions (`generatePlan`, `generateMealPlan`) `set({ error })` instead of throwing. The orchestrator reads each store's `error` after awaiting and stops on the first non-null one. Wrapping in try/catch around the async call would only catch thrown errors and miss the stored ones.

## Barcode Scanner Unhappy-Path (2026-04-18)

- **Manual-write invariant now lives in the API verb, not a lesson.** [food-repository.ts](src/db/food-repository.ts) exposes two methods: `upsertFood` (`INSERT OR REPLACE` — for legitimate overwrite paths like OFF refresh partial→full) and `insertFoodStrict` (pre-checks via `getById`, throws `FoodCollisionError(existing: FoodItem)`). Any manual-create entry point (scanner unhappy-path, text-search no-results) MUST use `insertFoodStrict`; the host catches the error and renders collision UX. The verb at the call site is the invariant — a future contributor can't accidentally pick the silent-overwrite method without typing `upsert` and noticing. Replaced the original "INSERT OR REPLACE is a footgun + defensive check belongs at caller" rule on 2026-04-18 (text-search PR).
- **Extracted-helper-with-DI is the right pattern when the host component mocks badly.** `BarcodeScannerSheet.tsx` renders `CameraView` + `useCameraPermissions` which jest-expo mocks poorly. Extracting the branching logic into `resolveScan(ean, deps): ScanResolution` (8 tests, zero UI) + keeping the sheet as a thin state-machine renderer let us test every resolution path (`local_hit` / `off_hit` / `not_found` / `network_error`) without touching the camera. Same precedent as `finishOnboarding(deps)` (2026-04-17) and `computeGaugeProgress` (2026-04-10). When a component is hard to unit-test, extract logic; don't fight the mocks.
- **"No retry on 404" is cleanest as a structural property of the code, not a conditional.** `retryOnNetworkError(fn, opts)` retries only on thrown errors. `fetchOffProduct`'s 404 path returns `null` (not a throw), so the helper passes it through untouched — no `if (status === 404) return null` branch inside the retry loop. This keeps the retry semantics readable (retry = on exception) and the 404-is-not-a-failure semantics implicit in the return-vs-throw distinction.
- **AbortController + `setTimeout` is the first-use fetch timeout pattern in this codebase.** Kick off the timer before `fetch`, `controller.abort()` on expiry, `clearTimeout` in `finally`. Works on Hermes (iOS + Android) and jest-expo natively — no polyfill. Pair with a retry wrapper so an aborted fetch is indistinguishable from any other thrown error, letting the retry logic reuse the same branch.
- **Codebase convention: don't mock `global.fetch` in tests.** `open-food-facts.test.ts` explicitly says "fetchOffProduct does network I/O — verified manually on device" and tests only the pure `normalizeOffProduct`. Following this convention meant: test the retry helper purely (`retryOnNetworkError(fn, opts)` takes `fn` as a param — 6 tests with `jest.fn()`), test the resolver purely (deps injected), and rely on manual device tests for the `fetch`-wired integration. Inventing a fetch mock mid-PR would have conflicted with the explicit comment at [open-food-facts.test.ts:5](src/services/open-food-facts.test.ts:5).
- **Israeli-label rounding budget is ~1.5g worst case.** Pure protein/fat/carbs cannot physically exceed 100g per 100g food (mass conservation). Israeli MoH-allowed rounding to whole grams can push the DISPLAYED sum to ~101.5g on a legitimate label. A hard-block threshold of `p+f+c > 101` captures all real data errors (kJ/kcal confusion, per-serving column misread, decimal slip) while still accepting the rounding-edge legitimate data. Anything the schema flags at >101 is always a human-entry error, never a valid product.
- **Zod error tokens let the schema stay locale-agnostic.** `z.string().min(1, 'nameRequired')` + `refine((d) => ..., { message: 'macroSumTooHigh' })` emits stable i18n-key tokens. The form maps `errors.<field>` → `strings.errors[token]` at render time, so the schema never imports `@/i18n` and can be reused from non-UI callers (scripts, tests) without locale setup.
- **Token-to-i18n key casing MUST match exactly — unit tests can't catch a mismatch.** PR #76 originally emitted `MACRO_SUM_TOO_HIGH` / `SERVING_FIELDS_INCOMPLETE` from the schema while the i18n keys were `macroSumTooHigh` / `servingFieldsIncomplete`. The unit tests asserted on the raw token (`includes('SERVING_FIELDS_INCOMPLETE')`) and passed; the form's `errs[token] ?? token` fallback silently rendered the raw English string to Hebrew users. Caught only on device-test pass. Convention: stick to camelCase for both, and consider a test that imports `strings.errors` and asserts every Zod-emitted token has a matching key.

## Text-Search Manual-Create + Repo Strict-Insert (2026-04-18)

- **Tagged errors can carry a payload to spare callers a re-query.** `FoodCollisionError extends Error` carries the existing `FoodItem` in a `readonly existing` field. The FoodSearchSheet host catches the error, reads `err.existing`, and routes "use existing" to PortionPicker without issuing a second `getById`. Generalizes to any "operation rejected because of state X" scenario where the caller will likely want to act on that state — tagged class + readonly payload field is lighter than a separate query + smaller than a result discriminated union, and it composes with try/catch instead of `if-chains`.
- **Sibling Modals under the same parent z-fight on iOS — nest, don't sibling.** Two `{cond && <Modal/>}` blocks as siblings inside a parent component may render in undefined z-order on iOS. The documented iOS-safe pattern is to nest the secondary Modal INSIDE the primary Modal's content tree. In FoodSearchSheet, the collision sheet is rendered as a child of the form Modal (inside the same `<Modal>` tag, after `<ManualFoodForm/>`) rather than a sibling. State machine still drives it via `collisionState`; only the JSX location changed.
- **Async-setState guards via `useRef` are mandatory when a bottom sheet can be dismissed.** `formAliveRef = useRef(false)` + `useEffect(() => { formAliveRef.current = manualFormVisible }, [manualFormVisible])` + `if (!formAliveRef.current) return` before every setter in `handleManualSubmit` / `handleReplace`. Same shape as the Workout Screen guarded-sheet pattern (2026-04-10). A guarded ref is cheaper than refactoring into a DI helper (`resolveManualSubmit(food, deps)`), and is what lessons already recommends. If the handler grows past ~3 setters, promote to a DI helper.
- **Loose-acceptance input normalization matches every other personal-log app.** MyFitnessPal, Yazio, FatSecret, LoseIt all accept any string in a manual-create "barcode" field — no format validation. Trim + strip non-digits (`normalizeEan` at [src/shared/normalizeEan.ts](src/shared/normalizeEan.ts)) handles the common "printed with spaces" case. Cost of accepting garbage is a dead dedup record (user-local, harmless); benefit is users aren't forced to skip logging when their Israeli local product has a weird internal code.
- **Three-action collision sheet beats binary confirm when intent is genuinely ambiguous.** "Use existing" / "Replace" / "Cancel" — default is use-existing (data-preserving, matches most-common intent), replace is styled destructively, cancel returns to the still-mounted form. A two-button confirm ("Replace?" / "Cancel") forces the user through the destructive path when they really just wanted the existing entry. Three buttons feels heavier but each corresponds to a real user intent.

## Tiv Taam Phase 1 — Transparency-Feed Catalog Gap (2026-04-21)

### Findings

- **Pipeline ran clean end-to-end.** The flagship store's feed
  (`PriceFull…-014-…gz`, 13,931 items) produced a conclusive gap signal:
  **10,024 net-new items** after deduping against Shufersal (4,918 IDs) +
  Rami Levy (6,799 IDs). 2,797 are imported (non-Israeli `ManufactureCountry`).
  Phase 2 is a clear go — decision threshold was ≥ 2,000 net-new and we're
  5× over it. The imported slice validates the original moat thesis (Beyond
  Meat, Joseph Drouhin wines, Milano cookies, Kraft mac & cheese — exactly
  the non-kosher/imported niche Tiv Taam is known for; neither Shufersal nor
  Rami Levy carry these).
- **Transparency feeds ship one file per store; pick the biggest-catalog one.**
  First run picked the newest file by time sort alone and landed on a
  near-empty test-store upload (6 items). The right heuristic: among the
  newest publish-date batch, pick the file with the largest `size`. Flagship
  stores ship the full assortment; small/new/test stores ship fractions of
  it. Catalog structure is identical across stores so picking the largest is
  equivalent to picking the most complete catalog. Applies to every chain
  on `publishedprices.co.il` — Yohananof, Victory, Am-Pm will all use the
  same selector.
- **The Israeli Price Transparency Law feed is a goldmine for future chains.**
  Yohananof, Victory, Am-Pm, Osher Ad, Hatzi Hinam all publish to the same
  `url.publishedprices.co.il` aggregator with the same XML schema. Login
  creds are `<ChainName>` / empty password (legally public). Everything
  except `download-<chain>-feed.ts` is directly reusable — promote the
  parser + filter + types to `scripts/transparency/` when chain #2 lands.

### Implementation lessons

- **`url.publishedprices.co.il` ships an incomplete TLS chain.** Server
  sends only the leaf cert (no intermediate) and relies on AIA-chasing. curl
  - browsers handle this; **Node's native `fetch` does not**. Fix: download
    the Sectigo intermediate once (public infra, safe to commit) from the AIA
    URL in the leaf cert, convert DER → PEM, commit to `scripts/certs/`, wire
    via `NODE_EXTRA_CA_CERTS` on the npm script. Do not reach for
    `rejectUnauthorized: false` — this is fixable the right way in 5 minutes.
- **Native `fetch` drops cookies across redirects.** The publishedprices
  login flow returns `302 Location: /file` with a rotated `cftpSID` cookie
  in the response; native fetch with `redirect: 'follow'` re-requests `/file`
  without the new cookie and lands back on the login page (200 OK, login
  page HTML — a silent auth failure that masquerades as success). Fix: set
  `redirect: 'manual'` and implement the redirect hop loop yourself, letting
  the cookie jar absorb `Set-Cookie` from every hop in order. 15 lines of
  code, saves hours of debugging.
- **Tiv Taam stores serialize the feed with inconsistent casing + field-
  name aliases.** Different POS systems across stores produce XML with
  `<Root>` vs `<root>`, `<ManufactureName>` vs `<ManufacturerName>`
  (extra 'r'). Fix at the parser level with `transformTagName: n => n.toLowerCase()`
  - alias fallback (`raw.manufacturername ?? raw.manufacturename`) so downstream
    code sees one canonical shape. Adding a regression test with the lowercase
    variant prevents the fixture-only "works on my store" illusion.
- **Dedup by `id.slice('sh_'.length)` is unreliable against Shufersal.**
  Only 71% of `sh_<code>` IDs are 13-digit EANs — the rest are 5–8 digit
  internal SKU codes. Rami Levy is 97% EAN so the dedup is more accurate
  there. The orchestrator's summary footnote makes this visible; without the
  footnote a reader would take the overlap counts at face value. Pattern
  worth repeating in any future cross-source dedup script: surface the
  known-under-reporting limitation in the same terminal block as the
  numbers.
- **`ManufactureCountry` is a multi-format field.** Same chain, same feed
  ships `'ישראל'` + `'IL'` + `'ISR'` + `'ISRAEL'` + `'לא ידוע'` + empty
  string for "don't count as imported". First implementation only excluded
  `'ישראל'` and `'לא ידוע'`, miscounting 561 IL-code Israeli items as
  imported (inflated 1,822 → actual 1,261). Use a `NOT_IMPORTED_TOKENS`
  set with normalized (trim + `.toUpperCase()`) keys. Hebrew strings pass
  through `.toUpperCase()` unchanged, so one set handles both scripts.

## Tiv Taam Phase 2 Task 0 — OFF Probe (2026-04-21)

- **OFF CDN rate-limits hard at 500ms gap.** First probe pass of 100 items
  at 500ms gap produced 42% `OffNetworkError` classifications. 1200ms gap
  cut errors to 13%. 2500ms gap converted every error to a clean hit/miss.
  Task 3's full 9,548-item fetcher uses 1500ms floor + automatic retry-
  errors pass at 2500ms to get zero-error measurement. Don't paper over the
  errors by lengthening fetchOffProduct's retry delay — OFF's rate limit is
  per-IP-per-window, so only a wider inter-call gap across the whole loop
  actually escapes it.
- **EAN variant probing is dead weight for OFF.** Tested 11-digit and
  12-digit misses with leading-zero padding (`0<code>`, `00<code>`): OFF
  normalizes all variants internally and returns identical
  `status:0 product not found`. OFF's search API returns 0 or overly-
  generic results for niche imports (tested 3 imported misses: Joseph
  Drouhin wine → 0, Dutch stroopwafel → 0, Cuervo tequila → 0). Don't
  waste time on barcode-variant fallbacks or name-based lookups — OFF's
  exact-EAN endpoint is the ceiling of coverage.
- **Non-food filter measurement requires an OFF feedback loop.** Eyeballing
  transparency-feed names for non-food keywords caught ~50% of
  contamination. Running the OFF probe on the `net-new` pool and hand-
  inspecting the miss list surfaced the next layer: cosmetics brands
  (Palmolive, Wella, Dove), cleaning (Persil, Finish, Ritzpaz, floor
  liquid), pet food markers (`לכלב`, `לחתול`, Fine Cat, dental sticks),
  kitchenware (stainless steel, mop heads, gloves), tobacco (Parliament),
  charcoal, toothpaste. Added 25 new keywords in one round. Overall hit
  rate rose 22% → 31% and imported hit rate rose 22% → 40% on the tighter
  pool. Each probe round catches progressively less — after 2–3 rounds the
  filter is "good enough"; the remaining miss tail is real OFF coverage
  gap, not filter leakage.
- **The moat metric is imported-shipped, not overall hit rate.** Overall
  31% on Tiv Taam's net-new is genuine OFF coverage floor — Israeli
  private labels + fresh meats + Russian/Ukrainian imports are legitimately
  sparse in OFF. But the imported slice hits 40% because European/US brand
  products are well-indexed. The right Phase-2-worth-it question is
  "imported × hit rate × net-new-imported" (~1,080 items exclusive to us)
  not "overall hit rate × net-new" (~2,960 items, half of which overlap
  Shufersal/RL on similar-name matches). Same framing should apply when
  evaluating future transparency-feed chains: segment the catalog by
  distinctiveness and measure hits against the distinctive slice.

## Planning Hygiene

- **Before planning a new feature, grep for existing data paths** — "Recent foods as default" (2026-04-23) was scoped as a new repo query, but `foodRepository.getRecent(limit = 15)` was already implemented AND already wired into `FoodSearchSheet` via an empty-query branch. The real gap was purely visibility (no section label, wrong count arg). Reduced scope from 6 files to 4, from "new query + new state + new render" to "drop one arg + flip one i18n string + add one conditional `<Text>`". Always read the call-site before writing the spec; a 2-minute grep can compress a 2-session plan to a 1-session plan.

## Undo / Transaction Semantics

- **Undo toasts use "undo-last" semantics, not "undo-all-pending".** When a second bulk action fires before the first's toast dismisses, REPLACE the toast (ids = new batch only), don't MERGE (old + new). Rationale matches iOS/Gmail/Slack: "undo" undoes the last thing I did, not everything since the last dismiss. Merging would undo actions the user implicitly accepted by not tapping undo the first time. The "orphaned" first batch is still in the DB as normal rows — the user can swipe-delete individually. Test the consecutive-action case (different meal slots, back-to-back re-logs) to codify the decision so future reviewers don't flag it. (2026-04-23)
- **Transactional symmetry: if the insert is transactional, the undo must be too.** `cloneEntriesToDate` wraps N INSERTs in `withTransactionAsync`. An undo implemented as a `for...of deleteById(id)` loop breaks that symmetry — a mid-loop crash leaves some rows deleted and others not, corrupting the meal. Add `deleteManyByIds(ids[])` with the matching `withTransactionAsync` wrapper. Rule: paired bulk operations (insert+undo, save+rollback) share transaction semantics. (2026-04-23)
- **Components must not call repositories directly when a store already mediates the same data.** A second path to the DB splits error handling, bypasses store-level caching, and forces components to re-derive things the store could hold once. If new data is needed from the repo, add a store action + state field; components subscribe. Enforced by grep for `foodLogRepository\.` / `foodRepository\.` / etc. outside `src/db/` and `src/stores/`. (2026-04-23)

## Testing — RNTL queries

- **`accessibilityViewIsModal` siblings hide from `screen.getByTestId`.** A bottom-sheet `Modal` whose content view sets `accessibilityViewIsModal` makes RNTL treat the modal subtree as the sole accessibility container — sibling elements (like a backdrop `Pressable` with its own `testID`) become unreachable via `screen.getByTestId`, even though the testID is clearly present in the render tree. Workaround: `screen.UNSAFE_root.findAll((n) => n.props?.testID === 'x')` to bypass the a11y filter. Same pattern would bite any sibling-of-modal that needs a testID query in tests. (2026-04-27)

## Portion Data — Hebrew & Israeli Retail Conventions (2026-04-30)

- **`חופן` (handful) implies a cupped-hand gesture, not a thumb-portion.** Mixing `handPortion: 'thumb'` with a tick labeled `חופן` puts a contradictory icon next to the value. For thumb-register foods (oils, tahini, nuts), label larger ticks by count (`~40 שקדים`) or weight, not by hand gesture. Discovered while reviewing serving-ticks data for almonds — 50g is genuinely handful-range, but the icon enum has no nut-friendly cupped-hand variant in scope.
- **`אונקיה` (ounce) is not natural Israeli kitchen language.** USDA's 28g/1-oz label convention reads as foreign in Hebrew UI. Use count (`~25 שקדים`) or grams. Trap when porting USDA-derived portion data.
- **Israeli Greek yogurt single-serve = 150g, not 200g.** Tara/Yotvata `עשיר` cups are 150g. Anchors based on multiples of 200g imply a container size that does not exist in IL retail. For yogurt portions, snap ticks to multiples of the actual cup grammage.
- **Rolled oats density: 1 IL כוס (240ml) ≈ 90g, not 80g.** USDA's 80g/cup figure assumes quick oats (denser). For fitness-app context where rolled oats dominate, use 90g. The 10g delta compounds at 1.5 cups.
- **Cooked-vs-raw label asymmetry across slider toggle.** When two foods share gram values across a raw/cooked toggle (Q1b: grams stay, macros swap), make the natural-portion labels parallel at shared gram marks (`½ חזה` on both, not `½ חזה קטן` on raw + `½ חזה` on cooked). Asymmetric qualifiers feel like the toggle did something it didn't.

## Review — Localized Data Files

- **`/review` on portion-data files needs a Hebrew + Israeli-context reviewer to be useful.** Structural integrity tests (slug coverage, tick monotonicity, primary count) catch shape errors but say nothing about whether `חופן` makes sense at 50g, or whether `אונקיה` reads as Hebrew. The code-reviewer agent caught 4 should-fixes and 2 nits on a file the integrity tests rated 100% green. Pattern: when shipping localized data, /review against the target locale even if the structure tests pass. (2026-04-30)

## React Native Gesture Handler — Jest Compatibility (2026-04-30)

- **`react-native-gesture-handler/jestSetup` is incompatible with the codebase's custom Reanimated mock.** RNGH's bundled jest setup expects real Reanimated bindings (specifically `Reanimated.useEvent`) which `src/test/reanimated-mock.ts` intentionally omits — the custom mock was hand-shaped for v4 API and doesn't include internal-only entry points. Loading RNGH's setup throws `TypeError: _reanimatedWrapper.Reanimated.useEvent is not a function` and fails every component test that transitively imports `react-native-gesture-handler`. Fix: write a minimal codebase-local jest mock for RNGH at `jest.setup.ts` that returns a `GestureDetector` that renders children, a `GestureHandlerRootView` that wraps in `View`, and a `Gesture.Pan()` chainable that captures `onUpdate` / `onEnd` without invoking the worklet runtime. Gesture wiring is verified manually on device per lessons.md:101 — the unit test gate is render-only.
- **`import 'react-native-gesture-handler'` (side-effect) AND `import { GestureHandlerRootView } from 'react-native-gesture-handler'` together trip ESLint's `import/no-duplicates`.** With modern RNGH (≥2.x) the named import triggers the same native-side-effect setup, so a single named import is sufficient. Drop the side-effect-only line.

## Open Questions

- Navigation: stack-based onboarding → tab-based main app?
- Offline-first sync strategy when we add a backend later?
