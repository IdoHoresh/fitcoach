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
