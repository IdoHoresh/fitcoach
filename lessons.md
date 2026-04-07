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

<!-- Add RN-specific issues as we encounter them -->

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

## Open Questions

- Navigation: stack-based onboarding → tab-based main app?
- Offline-first sync strategy when we add a backend later?
