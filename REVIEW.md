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

<!-- Add patterns from PR feedback and production bugs here -->
