# Feature: Post-Onboarding Plan Bootstrap

**Date:** 2026-04-17
**Status:** Approved
**Phase:** Bug fix / wiring

## What

After onboarding completes, automatically generate the workout plan + weekly meal plan and rehydrate them on every app launch so the Home, Workout, and Nutrition tabs have real data without the user having to press a dev-only button on the Profile screen.

## Why

Today's user flow:

1. Finish all 11 onboarding screens → tap "Let's start" on the Result screen.
2. `useUserStore.completeOnboarding()` runs — profile + TDEE saved.
3. Router redirects to `/(tabs)` → Home tab.
4. Home tab reads `activePlan`, `dailySummary`, `mesocycle`, `recentLogs` from Nutrition + Workout stores. All null.
5. Nutrition tab shows empty state. Workout tab shows "no plan yet".

The dev-only "Generate sample plans" button in `app/(tabs)/profile.tsx` (see comment at lines 31–35) already proves the gap: it calls `useWorkoutStore.generatePlan()` + `useNutritionStore.generateMealPlan(4)`. That orchestration needs to run as part of onboarding completion, not as a dev affordance.

On app restart there's a second gap: `app/_layout.tsx` calls `useUserStore.loadProfile()` only. Even if plans exist in SQLite (once task 1 lands), the workout + nutrition stores start empty and the tabs render empty again until the user triggers a reload somewhere.

## Requirements

- [ ] After `completeOnboarding()` succeeds in the Result screen, a workout plan and a weekly meal plan are generated and persisted before routing to `/(tabs)`.
- [ ] Meal plan defaults to 4 meals per day (matches the dev button and the nutrition algorithm defaults).
- [ ] Errors from plan generation surface through the existing `error` state on the Result screen and block navigation; the user sees a message and can retry. We do NOT silently route to an empty Home tab.
- [ ] On every app launch (in `_layout.tsx`), if the user is onboarded, the workout plan + active meal plan + today's food log + meal targets are loaded into their respective stores before the app renders tabs.
- [ ] Rest days on the Nutrition tab still show a meal plan (meals are day-of-week indexed; rest days exist in the meal plan but without a `post_workout` slot). No change needed there — verify behavior is unchanged.
- [ ] The dev-only "Generate sample plans" button in `profile.tsx` can stay for now (still useful for wiping and regenerating in dev), but its comment ("onboarding currently only stores the profile — it does NOT call generateMealPlan / generatePlan") is updated or removed, since the statement is no longer true.
- [ ] Tests:
  - Result screen — completing onboarding generates both plans in order (workout, then nutrition) and only routes if both succeed.
  - Result screen — if workout generation fails, nutrition generation is not attempted and an error is shown.
  - Result screen — if nutrition generation fails after workout succeeds, error is shown; we do NOT route (user is stranded on Result with retry).
  - Bootstrap helper / `_layout.tsx` — when `isOnboarded === true` after `loadProfile`, workout + nutrition stores are hydrated.

## Design

### Architecture

Two concerns, two touch points — keep both thin:

**1. Post-onboarding generation** — lives in `app/(onboarding)/result.tsx` inside the existing `handleStart` handler. The alternative (adding the orchestration inside `useUserStore.completeOnboarding`) would create a circular import (`useUserStore` → `useNutritionStore` → `useUserStore`). Keeping it at the call site avoids that and keeps store-to-store coupling unidirectional.

```ts
// app/(onboarding)/result.tsx (sketch)
const handleStart = useCallback(async () => {
  await completeOnboarding()
  if (useUserStore.getState().error) return

  try {
    await useWorkoutStore.getState().generatePlan()
    await useNutritionStore.getState().generateMealPlan(4)
  } catch (err) {
    // Display as result-screen error, do not route
    return
  }

  router.replace('/(tabs)')
}, [completeOnboarding, router])
```

Error handling: `generatePlan` / `generateMealPlan` already `set({ error })` internally instead of throwing. The Result screen can check each store's `error` field after awaiting and surface the first non-null one through its existing `error` display.

**2. App-launch rehydration** — lives in `app/_layout.tsx` inside the existing `init()`. After `loadProfile()` resolves, if `isOnboarded`, fire the three loaders in parallel:

```ts
await useUserStore.getState().loadProfile()
if (useUserStore.getState().isOnboarded) {
  await Promise.all([
    useWorkoutStore.getState().loadPlan(),
    useNutritionStore.getState().loadActivePlan(),
    useNutritionStore.getState().loadTodaysLog(),
  ])
  useNutritionStore.getState().refreshMealTargets()
}
```

`refreshMealTargets()` is synchronous (it reads profile from `useUserStore` and computes) and already guards against missing profile. Running it after `loadProfile` is enough.

We don't need a separate `bootstrap.ts` helper — the code is short enough and `_layout.tsx` already owns the cold-start init sequence. If this grows (e.g. also load recent check-ins, weight log), extract at that point.

### Files changed

- `app/(onboarding)/result.tsx` — extend `handleStart`.
- `app/_layout.tsx` — extend `init()`.
- `app/(tabs)/profile.tsx` — update stale comment on the dev button (optional; can be a follow-up).

### Files touched by tests

- `app/(onboarding)/result.test.tsx` — already exists; add cases for plan generation.
- `app/_layout.test.tsx` — may not exist; if creating, mock all three stores and assert call order.

### Risks / edge cases

- **generatePlan order matters.** Workout first, then nutrition — same order as the dev button — because failures are easier to diagnose one at a time and because a future user who lacks equipment data would hit the workout error first (stops at the right spot). Meal plan depends only on profile + TDEE, so technically either order works, but keep it stable.
- **Non-onboarded launch.** If `isOnboarded === false`, skip the load block. The redirect in `app/index.tsx` already sends those users to `/(onboarding)/welcome`.
- **Cold-start latency.** Three extra reads on app launch. `loadPlan` reads the active plan + mesocycle + last 20 logs. `loadActivePlan` reads the active meal plan. `loadTodaysLog` reads today's food entries + daily summary. All parallel, all against SQLite on-device — should add tens of ms, not seconds. The splash screen already stays visible until `appReady`, so perceived latency is unchanged as long as we stay on the "before hide splash" side of the `init()` function. Keep the new awaits inside `init()`, not in a detached effect.
- **Regenerate flow.** Today's "Generate sample plans" dev button calls `generatePlan()` which throws if a plan already exists? Re-check. If so, onboarding users who somehow complete twice would hit a duplicate-plan error — verify or add a guard. (In the onboarding flow, `completeOnboarding` can only fire once per session, so low risk, but worth a quick check.)

## Implementation Plan

### Task 1: Wire plan generation into onboarding completion (M)

**Files:** `app/(onboarding)/result.tsx`, `app/(onboarding)/result.test.tsx`
**What:** Extend `handleStart` to await `useWorkoutStore.generatePlan()` and `useNutritionStore.generateMealPlan(4)` after `completeOnboarding()` succeeds. Block router navigation on plan-generation errors and surface the first error through the screen's existing `error` rendering.

**Test first (RED):**

1. `generates_workout_and_meal_plan_after_complete_onboarding`
   - Mock all three store `getState()` calls (`useUserStore`, `useWorkoutStore`, `useNutritionStore`) with `completeOnboarding`, `generatePlan`, `generateMealPlan` as `jest.fn().mockResolvedValue(undefined)` and `error: null` reads.
   - Render Result screen, press the primary CTA.
   - Assert: all three were called, in order. Router's `replace('/(tabs)')` was called.
2. `does_not_generate_plans_if_complete_onboarding_sets_error`
   - Make `completeOnboarding` leave `error: 'missing data'`.
   - Press CTA.
   - Assert: `generatePlan` NOT called; `generateMealPlan` NOT called; `router.replace` NOT called.
3. `does_not_route_when_generate_plan_fails`
   - `generatePlan` rejects (or leaves `error: 'failed'` on the workout store).
   - Press CTA.
   - Assert: `generateMealPlan` NOT called; `router.replace` NOT called; error text visible.
4. `does_not_route_when_generate_meal_plan_fails`
   - `generatePlan` succeeds; `generateMealPlan` fails.
   - Press CTA.
   - Assert: `router.replace` NOT called; error text visible.

**Implementation:**

```ts
const handleStart = useCallback(async () => {
  await completeOnboarding()
  if (useUserStore.getState().error) return

  await useWorkoutStore.getState().generatePlan()
  const workoutErr = useWorkoutStore.getState().error
  if (workoutErr) {
    useUserStore.setState({ error: workoutErr })
    return
  }

  await useNutritionStore.getState().generateMealPlan(4)
  const nutritionErr = useNutritionStore.getState().error
  if (nutritionErr) {
    useUserStore.setState({ error: nutritionErr })
    return
  }

  router.replace('/(tabs)')
}, [completeOnboarding, router])
```

(Alternative: read each store's `error` directly into a local ref / via another `useUserStore((s) => s.error)` hook. The set-then-read pattern above mirrors the existing `completeOnboarding` flow and keeps the screen's `error` display unchanged.)

**Acceptance:**

- All 4 failing tests now pass.
- Manual: `npm run dev`, complete onboarding end-to-end, land on Home tab, see real calorie gauge + today's plan list populated without tapping Profile's dev button.
- Manual: Nutrition tab shows today's meals from the plan.
- Manual: Workout tab shows today's workout template (or a rest-day card on a rest day).

---

### Task 2: Rehydrate plans on app launch (S)

**Files:** `app/_layout.tsx`
**What:** Extend `init()` to load workout plan + active meal plan + today's log + meal targets after `loadProfile()`, gated on `isOnboarded`.

**Test first:** This task is UI-adjacent orchestration — if `app/_layout.test.tsx` doesn't already exist, creating one just to assert call order is low ROI (you'd be testing `Promise.all` wiring). **Manual verification plus an integration-style test** is more valuable:

- Manual: complete onboarding once, force-quit the app, reopen. Without pressing any dev buttons, confirm Home / Nutrition / Workout tabs render with real data.
- Manual: with a non-onboarded install (after `resetApp`), relaunch and confirm the new block is skipped (no errors, onboarding welcome screen appears as before).

If you prefer a test, add an integration-style one:

- Mock `initializeDatabase`, `useUserStore.loadProfile` to set `isOnboarded: true`.
- Mock `useWorkoutStore.loadPlan`, `useNutritionStore.loadActivePlan`, `useNutritionStore.loadTodaysLog`, `useNutritionStore.refreshMealTargets` as spies.
- Render `<RootLayout />`, wait for the init effect to resolve.
- Assert all four spies were called.
- Second case: `isOnboarded: false` → assert none of the four were called.

**Implementation:**

```ts
// inside init() in app/_layout.tsx, after loadProfile()
if (useUserStore.getState().isOnboarded) {
  await Promise.all([
    useWorkoutStore.getState().loadPlan(),
    useNutritionStore.getState().loadActivePlan(),
    useNutritionStore.getState().loadTodaysLog(),
  ])
  useNutritionStore.getState().refreshMealTargets()
}
```

Wrap in the same `try` block as `loadProfile` so a transient SQLite error doesn't block the app from showing at all — the existing `catch` already logs and lets the app proceed to onboarding/empty state.

**Acceptance:**

- After Task 1, restart the app — all three tabs still show real data (no regression on cold start).
- `resetApp` dev button still takes the user back to welcome cleanly (load block is gated on `isOnboarded`).
- `npm test -- --silent 2>&1 | tail -5` — all green.

---

### Task 3: Update stale dev-button comment (XS)

**Files:** `app/(tabs)/profile.tsx`
**What:** Update the block comment at lines 27–35 that says "onboarding currently only stores the profile — it does NOT call generateMealPlan / generatePlan". After Task 1 that's no longer true. Either:

- Shorten to: "Dev-only regenerate button. Useful for wiping and rebuilding plans during dev without going through onboarding again."
- Or delete the button entirely if `resetApp` covers the workflow.

**Test first:** n/a (comment-only change).

**Acceptance:** Comment is accurate, or button removed cleanly.

---

### Order of execution

1. Task 1 (RED → GREEN → CLEAN, full TDD loop)
2. Task 2 (small follow-up, piggyback on same PR or a quick follow-up)
3. Task 3 (in the same PR — the dev button comment will be actively misleading otherwise)

All three fit comfortably in a single PR ~150 lines of diff including tests.
