# Feature: Zustand State Management Stores

**Date:** 2026-04-06
**Status:** Approved
**GitHub Issue:** N/A

## What

Three Zustand stores that connect the algorithm layer to the UI: user profile, workout, and nutrition. The stores are the "brain" of the app — they hold state, call algorithms, and persist data to SQLite.

## Why

Right now the algorithms are pure functions with no way to reach the UI. The onboarding flow (next task) needs a user profile store to collect data and trigger TDEE/macro calculations. The workout and nutrition screens need their own stores to display plans and track progress.

## Requirements

- [ ] User profile store with draft-based onboarding flow
- [ ] Workout store that generates and caches plans
- [ ] Nutrition store with derived macro targets
- [ ] Stores call algorithms automatically when profile changes (vending machine pattern)
- [ ] TDEE/macros recalculated on app open (not cached in SQLite)
- [ ] Workout plan saved to SQLite (complex, user may customize)
- [ ] Onboarding saves all data at the end (not per-screen)

## Design

### Architecture

```
┌─────────────────────────────────────────────────┐
│                    UI Screens                    │
│  (Onboarding, Home, Workout, Nutrition, etc.)   │
└──────────┬──────────┬──────────┬────────────────┘
           │          │          │
     ┌─────▼───┐ ┌────▼────┐ ┌──▼──────────┐
     │  User   │ │ Workout │ │  Nutrition   │
     │  Store  │ │  Store  │ │   Store      │
     └──┬──┬───┘ └────┬────┘ └──┬───────────┘
        │  │          │         │
        │  │    ┌─────▼─────────▼──────┐
        │  └───►│     Algorithms       │
        │       │ (TDEE, macros, split,│
        │       │  volume, overload)   │
        │       └──────────────────────┘
        │
   ┌────▼────┐
   │ SQLite  │
   │  (DB)   │
   └─────────┘
```

### Store Interfaces

#### 1. User Profile Store (implement now)

```typescript
interface UserStore {
  // State
  profile: UserProfile | null
  tdeeBreakdown: TdeeBreakdown | null
  isOnboarded: boolean
  isLoading: boolean

  // Onboarding draft (temporary, not persisted)
  draft: Partial<UserProfile>
  updateDraft: (fields: Partial<UserProfile>) => void
  resetDraft: () => void

  // Actions
  completeOnboarding: () => Promise<void> // save draft → SQLite → run algorithms
  loadProfile: () => Promise<void> // app startup: load from SQLite → recalculate
  updateProfile: (fields: Partial<UserProfile>) => Promise<void> // settings changes
}
```

#### 2. Workout Store (implement later)

```typescript
interface WorkoutStore {
  // State
  currentPlan: GeneratedWorkoutPlan | null
  mesocycleWeek: number
  todaysWorkout: GeneratedWorkoutDay | null

  // Actions
  generatePlan: () => Promise<void> // called after onboarding or profile change
  advanceWeek: () => void // next mesocycle week
  logWorkout: (log: WorkoutLog) => Promise<void>
  getProgressionAdvice: (exerciseId: string) => ProgressionAdvice
}
```

#### 3. Nutrition Store (implement later)

```typescript
interface NutritionStore {
  // State (derived from user store, not cached in SQLite)
  nutritionTargets: NutritionTargets | null

  // State (persisted in SQLite)
  todaysLog: FoodLogEntry[]
  todaysSummary: DailyNutritionSummary | null

  // Actions
  recalculateTargets: () => void // called when profile changes
  logFood: (entry: FoodLogEntry) => Promise<void>
  removeFood: (entryId: string) => Promise<void>
}
```

### Data Flow

#### Onboarding flow:

```
Screen 1-8: user fills fields → updateDraft({ height: 189, ... })
Final screen: "Start!" button → completeOnboarding()
  → save draft to SQLite (userRepository.saveProfile)
  → calculate BMR (calculateBmr)
  → calculate TDEE breakdown (calculateTdeeBreakdown)
  → set tdeeBreakdown in store
  → set isOnboarded = true
  → navigate to Home screen
```

#### App startup flow:

```
App opens → loadProfile()
  → read profile from SQLite (userRepository.getProfile)
  → if no profile → isOnboarded = false → show onboarding
  → if profile exists → recalculate TDEE (fast, <1ms)
  → set profile + tdeeBreakdown in store
  → isOnboarded = true → show home screen
```

#### Profile update flow (from Settings):

```
User changes goal → updateProfile({ goal: 'fat_loss' })
  → update SQLite
  → recalculate TDEE + macros automatically
  → workout store regenerates plan (if goal affects volume)
```

### Files to Create/Modify

| File                              | Action         | Description                         |
| --------------------------------- | -------------- | ----------------------------------- |
| `src/stores/useUserStore.ts`      | Create         | User profile store with draft, TDEE |
| `src/stores/useWorkoutStore.ts`   | Create (later) | Workout plan store                  |
| `src/stores/useNutritionStore.ts` | Create (later) | Nutrition targets + food log store  |
| `src/stores/index.ts`             | Create         | Re-export all stores                |
| `package.json`                    | Modify         | Add zustand dependency              |
| `tsconfig.json`                   | Modify         | Add `@/stores` path alias           |

## Decisions Made

| Decision               | Choice                                         | Why                                       |
| ---------------------- | ---------------------------------------------- | ----------------------------------------- |
| Calculation trigger    | Store calls algorithms automatically           | UI stays simple, can't forget a step      |
| TDEE/macro caching     | Recalculate on app open, don't cache in SQLite | Fast (<1ms), avoids stale data            |
| Workout plan caching   | Save to SQLite                                 | Complex, user may customize exercises     |
| Onboarding persistence | Save all at end (draft pattern)                | Simpler code, 2-min flow = low crash risk |

## Acceptance Criteria

- [ ] `useUserStore` holds profile + TDEE breakdown
- [ ] `updateDraft()` accumulates onboarding answers without touching SQLite
- [ ] `completeOnboarding()` saves to SQLite and calculates TDEE in one action
- [ ] `loadProfile()` restores state from SQLite on app startup
- [ ] TDEE is recalculated (not loaded from cache) every time profile loads
- [ ] Lint, typecheck, and tests pass

## Task Breakdown

1. [ ] Install zustand, add `@/stores` path alias (S)
2. [ ] Implement `useUserStore` with draft + onboarding flow (M)
3. [ ] Wire `loadProfile` to app startup (S)
4. [ ] Implement `useWorkoutStore` — later, when workout screen is built (L)
5. [ ] Implement `useNutritionStore` — later, when nutrition screen is built (M)

## Open Questions

- None — all decisions resolved during brainstorm.

## Implementation Plan

### Task 1: Add `@/stores` path alias (S)

**Files:** `tsconfig.json`, `jest.config.js`
**What:** Add `@/stores` path alias so stores can be imported cleanly. No store code yet — just plumbing.
**Test first:** N/A — config only, verify with `npm run typecheck`
**Acceptance:** `@/stores` resolves in both TypeScript and Jest. Lint + typecheck pass.

### Task 2: Create `useUserStore` with draft management (M)

**Files:** `src/stores/useUserStore.ts`, `src/stores/useUserStore.test.ts`, `src/stores/index.ts`
**What:** Implement the user store with:

- `draft` state + `updateDraft()` + `resetDraft()` for onboarding
- `profile`, `tdeeBreakdown`, `isOnboarded`, `isLoading` state
- `completeOnboarding()` — validates draft, saves to SQLite, calculates BMR + TDEE, sets state
- `loadProfile()` — loads from SQLite, recalculates TDEE, sets state
- `updateProfile()` — updates SQLite + recalculates

**Test first (TDD):**

1. `updateDraft` accumulates partial fields into draft
2. `resetDraft` clears the draft back to empty
3. `completeOnboarding` sets `isOnboarded = true` and populates `profile` + `tdeeBreakdown`
4. `loadProfile` restores profile from DB and recalculates TDEE
5. `updateProfile` updates profile and recalculates TDEE

Note: SQLite calls need to be mocked in tests (pure store logic only). The algorithms are pure functions and can be called directly.

**Acceptance:**

- All store tests pass
- `updateDraft` builds up partial profile across multiple calls
- `completeOnboarding` produces valid `profile` and `tdeeBreakdown`
- `loadProfile` sets `isOnboarded: false` when no profile exists
- Lint + typecheck + tests green

### Task 3: Wire store to app startup (S)

**Files:** `app/_layout.tsx` (or equivalent root layout)
**What:** Call `useUserStore.getState().loadProfile()` on app mount. Route to onboarding if `isOnboarded === false`, home if `true`. Show loading spinner while `isLoading`.
**Test first:** N/A — UI wiring, verify manually
**Acceptance:** App opens → loads profile → shows correct screen. No flash of wrong screen.
