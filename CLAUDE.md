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

## Workflow Enforcement (HIGHEST PRIORITY — NEVER SKIP ANY STEP)

**Every step of the development flow must be genuinely completed. NEVER auto-check, rubber-stamp, or skip ANY step. This applies to the ENTIRE flow, not just the pre-commit checklist.**

Before every commit, Claude MUST show verification for each checklist item:

1. **Branch check** — run `git branch --show-current`, show output
2. **Review ran** — only after actually running `/review` and fixing ALL findings
3. **lessons.md** — state what was added, or explain why nothing applies
4. **REVIEW.md** — state what was added, or explain why nothing applies
5. **TASKS.md** — mark the item done with today's date in the same commit as the feature. No PR number needed — `git log --grep` recovers it. Avoids post-merge housekeeping PRs.
6. **Secrets scan** — run `git diff --cached`, actually scan for keys/tokens
7. **Lint** — run `npm run lint`, show clean output
8. **Typecheck** — run `npm run typecheck`, show clean output
9. **Tests** — run `npm test -- --silent 2>&1 | tail -5`, show pass count only
10. **Size check** — run `git diff --cached --stat`, show line count

After every PR merged:

1. Wait for CI to pass before starting next task
2. Update PR test plan checkbox once CI passes
3. Pull `main` to sync local

**If ANY step is skipped, the task is NOT complete. No exceptions.**

## Token Efficiency Rules

These rules reduce context usage without lowering quality:

### File reads — always targeted

- Use `Grep` to find the exact function/section first
- Then `Read` with `offset` + `limit` to pull only those lines
- Never read a full file (200+ lines) just to find a 10-line section
- Exception: first time reading a file you've never seen before

### Test output — summary only

- Always run: `npm test -- --silent 2>&1 | tail -5`
- Never paste full suite output into conversation
- Exception: when a specific test is failing and you need the error details

### /review — features only

- Run `/review` for: new features, algorithm changes, schema changes, security-sensitive code
- Skip `/review` for: bug fixes where the change is mechanical (e.g. adding a field + propagating it), test-only changes, comment/doc changes
- When skipping: state "Skipping /review — mechanical propagation change, no logic risk"

### TASKS.md — read only what's needed

- To update Done section: read only the last 60 lines (`offset: 430`)
- To check Next Up: read only the last 10 lines
- Never read the full file unless writing a session summary

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
