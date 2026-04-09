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

## Open Questions

- Navigation: stack-based onboarding → tab-based main app?
- Offline-first sync strategy when we add a backend later?
