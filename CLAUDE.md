# FitCoach

Science-based fitness coaching app for the Israeli App Store.
Expo (React Native) + TypeScript, local-first architecture.

## Tech Stack

- **Framework:** Expo SDK 54, React Native 0.81, expo-router
- **Language:** TypeScript (strict mode)
- **State:** Zustand (planned)
- **Database:** expo-sqlite (parameterized queries only)
- **Security:** expo-secure-store, Zod validation on all boundaries
- **i18n:** Hebrew (primary) + English
- **Testing:** Jest + jest-expo, React Native Testing Library

## Project Structure

```
src/
  algorithms/    # Pure functions: TDEE, macros, splits, volume, overload, workout gen
  config/        # Environment validation
  data/          # Constants (cited research), exercises DB, split templates
  db/            # SQLite: schema, BaseRepository<T>, UserRepository
  i18n/          # he.ts, en.ts with conversational strings
  security/      # Secure storage wrapper, Zod validation schemas
  theme/         # Colors, spacing, typography (semantic tokens)
  types/         # user.ts, nutrition.ts, workout.ts
```

## Key Architecture Decisions

- Component-based TDEE (BMR + NEAT + EAT + TEF), not single multiplier
- Stretch-position exercises as defaults (Maeo 2023 research)
- Pull volume >= push volume in every split (shoulder health)
- Equipment is item-based checklist, not rigid tiers
- Every number in constants.ts has a research citation
- Per-session cap: 8-12 direct sets per muscle (no junk volume)

## Commands

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format all
npm run format:check  # Prettier check
npm run typecheck     # TypeScript check
npm test              # Run Jest tests
npm run test:watch    # Jest watch mode
npm run test:coverage # Jest with coverage report
```

## Conventions

- Path aliases: `@/algorithms`, `@/types`, `@/db`, `@/theme`, `@/i18n`, `@/security`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`
- Branch naming: `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`
- Test files: co-located (`foo.test.ts` next to `foo.ts`)
- No hardcoded secrets — env vars only, validated at startup
- No magic numbers — use constants with citations

## Development Flow

**NEVER commit directly to main.** Create a feature branch BEFORE the first commit.

```
git checkout -b feat/<name>          ← FIRST STEP, before any code
/brainstorm → Spec (docs/specs/) → /plan → Approve
  → For each task:
    1. Write failing test (RED)     ← test defines the spec
    2. Implement to pass (GREEN)    ← Claude makes it green
    3. Refactor (CLEAN)             ← improve without breaking
    4. Run tests to confirm
  → /review → commit → push → PR
  → Wait for CI + AI review → fix if needed
  → Complete ALL PR test plan items → Merge
```

TDD is MANDATORY for business logic (algorithms, state, data transforms).
TDD is optional for UI-only work (styling, layout, navigation).

## Security Rules (NEVER skip)

1. Never hardcode secrets (keys, tokens, passwords) in any file
2. Parameterized SQL only — never string concatenation
3. Zod validation on all data boundaries
4. expo-secure-store for sensitive user data
5. Input validation on every public function

## What's Next

1. Zustand stores (connect UI to algorithms)
2. Onboarding flow (7-8 conversational screens)
3. Tab navigation (Home, Workout, Nutrition, Progress, Settings)
