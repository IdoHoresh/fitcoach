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

## Open Questions

- Navigation: stack-based onboarding → tab-based main app?
- Offline-first sync strategy when we add a backend later?
