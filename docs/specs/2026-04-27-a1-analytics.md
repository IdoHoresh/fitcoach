# Feature: A1-analytics — Default-select safety-net analytics

**Date:** 2026-04-27
**Status:** Approved
**Parent spec:** [2026-04-24-two-mode-meal-logging.md](./2026-04-24-two-mode-meal-logging.md) — Track A1
**TASKS.md:** line 559

## What

Vendor-agnostic analytics stub (`src/analytics/track.ts`) plus two wired events that detect whether users are rubber-stamping the default `structured` meal-logging mode at onboarding, or quietly switching to `free` afterward in settings.

The stub `console.log`s in `__DEV__` and is a no-op in production. When a vendor is picked post-P0.4 pricing research, only the helper's implementation swaps — call sites remain untouched.

## Why

Structured is the default-selected mode at the mode-choice screen (PR #85) because it reduces beginner paralysis. The trade-off: users may rubber-stamp the default without engaging with the choice. If Structured adoption climbs above 90% of onboarding completions, the default is being rubber-stamped and the alternative isn't discoverable.

We need:

1. A signal at the moment of choice (`mode_choice_picked`) — was the default actively chosen, or just continued past?
2. A signal of post-onboarding regret (`mode_switched_in_settings`) — how often, and how soon after onboarding, do users flip?

Without instrumentation, the >90% alert threshold from the parent spec cannot fire.

## Requirements

- [ ] `src/analytics/track.ts` exports a single `track()` function with a discriminated-union event type.
- [ ] In `__DEV__`: logs event + props to console.
- [ ] In production: no-op (no AsyncStorage, no buffer, no network).
- [ ] `mode_choice_picked` fires once per onboarding completion, on the mode-choice continue press.
- [ ] `mode_switched_in_settings` fires once per actual mode change in settings (skipped on no-op writes).
- [ ] Both call sites use fire-and-forget — `track()` never throws, never blocks UI, never returns a value the caller awaits.
- [ ] Test coverage for the helper (DEV vs prod behavior) and both call sites (event fired with correct shape).

## Design

### Architecture

```
src/analytics/
  track.ts          ← new — discriminated union + track() helper
  track.test.ts     ← new — DEV logs, prod no-ops, shape

app/(onboarding)/
  mode-choice.tsx   ← modify — start mount timer, fire on onContinue

app/(tabs)/
  profile.tsx       ← modify — fire after updateProfile commits
```

### Event shape (discriminated union)

```ts
export type AnalyticsEvent =
  | {
      type: 'mode_choice_picked'
      mode: MealLoggingMode
      time_to_pick_ms: number
      changed_from_default: boolean
    }
  | {
      type: 'mode_switched_in_settings'
      from: MealLoggingMode
      to: MealLoggingMode
      days_since_onboarding: number
    }

export function track(event: AnalyticsEvent): void
```

Discriminated union over `Record<string, unknown>` for compile-time safety on prop names — typo at a call site fails typecheck, not silently in production.

### Helper semantics

```ts
export function track(event: AnalyticsEvent): void {
  if (__DEV__) {
    console.log('[analytics]', event.type, event)
  }
  // Production: no-op until vendor wired post-P0.4.
}
```

No try/catch — `console.log` cannot throw on serializable input. Discriminated union guarantees serializable payloads.

### Data flow

**mode_choice_picked**

```
mount → useRef(Date.now()) clock start
  → user taps card(s), opens info sheets (no event)
  → user taps continue
    → updateDraft({ mealLoggingMode: selected })
    → track({ type: 'mode_choice_picked', mode: selected,
              time_to_pick_ms: Date.now() - mountedAt.current,
              changed_from_default: selected !== 'structured' })
    → router.push('/(onboarding)/calculating')
```

**mode_switched_in_settings**

```
user opens ModeToggleSheet → taps card with next !== currentMode
  → handler in profile.tsx:
    → void updateProfile({ mealLoggingMode: next })
    → track({ type: 'mode_switched_in_settings',
              from: currentMode, to: next,
              days_since_onboarding: floor((Date.now() - new Date(profile.createdAt)) / 86_400_000) })
  No-op writes (next === currentMode) already short-circuit before this point — no event fires.
```

### `days_since_onboarding` derivation

`UserProfile.createdAt` is set when `completeOnboarding()` runs in [useUserStore.ts:122](../../src/stores/useUserStore.ts:122). That moment is the end of onboarding — exactly the anchor we want. No schema migration. No new column. ISO string parsed once per fire.

### Decisions locked in brainstorm

| #   | Decision                                                             | Rationale                                                                                                                                        |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Lean stub — no AsyncStorage buffer                                   | Vendor not picked. Designing buffer/flush contract without vendor API shape is premature. Beta has no users yet.                                 |
| 2   | Discriminated union                                                  | Compile-time prop safety. ~15 lines of types. Vendor swap maps union → SDK call.                                                                 |
| 3   | `jest.mock('@/analytics/track')` at module level for call-site tests | Standard, fast, no console noise. Helper itself tested directly.                                                                                 |
| 4   | Mount-time clock start for `time_to_pick_ms`                         | Strongest rubber-stamp signal: mount → fast continue with no card taps still produces a small ms value. Interaction-gated start hides this case. |
| 5   | Final-state `changed_from_default` (not "ever-touched")              | Matches alert threshold semantics ("Structured >90% of completions" is a final-state metric). Scope-creep to add `interacted_with_cards`.        |

### Files to Create/Modify

| File                                    | Action             | Description                                                                    |
| --------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `src/analytics/track.ts`                | Create             | Discriminated-union `AnalyticsEvent` + `track()` helper. ~30 LOC.              |
| `src/analytics/track.test.ts`           | Create             | DEV logs, prod no-op, both event variants typecheck.                           |
| `app/(onboarding)/mode-choice.tsx`      | Modify             | `useRef` mount clock; fire `mode_choice_picked` in `onContinue`.               |
| `app/(onboarding)/mode-choice.test.tsx` | Modify (or create) | Mock `track`, assert fired with correct shape on continue.                     |
| `app/(tabs)/profile.tsx`                | Modify             | Fire `mode_switched_in_settings` after `updateProfile` in mode-toggle handler. |
| `app/(tabs)/profile.test.tsx`           | Modify (or create) | Mock `track`, assert fired with correct shape on switch; not fired on no-op.   |

## Acceptance Criteria

- [ ] `track.ts` helper logs in `__DEV__` only — verified by `jest.replaceProperty(global, '__DEV__', false)` test.
- [ ] `track()` accepts only the two declared event shapes — typecheck fails on a misspelled `type` or missing prop.
- [ ] In `mode-choice.tsx`, completing onboarding fires exactly one `mode_choice_picked` event with: `mode` matching `selected`, `time_to_pick_ms >= 0`, `changed_from_default = (selected !== 'structured')`.
- [ ] In `profile.tsx`, switching modes fires exactly one `mode_switched_in_settings` with `from`/`to`/`days_since_onboarding`. No-op writes (same mode) fire zero events.
- [ ] `days_since_onboarding` is an integer ≥ 0, derived from `profile.createdAt`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` all green.
- [ ] No new runtime dependencies (no AsyncStorage import, no vendor SDK).

## Task Breakdown

1. [ ] **Helper + types** (S) — `src/analytics/track.ts` + `track.test.ts`. RED: shape + DEV/prod behavior tests fail. GREEN: implement helper. CLEAN: confirm 0 lint/type warnings.
2. [ ] **Mode-choice wiring** (S) — add `useRef(Date.now())` mount clock + fire in `onContinue`. RED: existing test asserts `track` not called yet. GREEN: wire. Tests assert exact event payload.
3. [ ] **Settings-toggle wiring** (S) — fire in profile.tsx mode-switch handler after `updateProfile`. RED: test asserts `track` not called. GREEN: wire. Test that no-op switch fires nothing.

Estimated total: S (≤200 LOC including tests).

## Open Questions

None — all 5 brainstorm questions resolved.

## Out of Scope

- Production transport (vendor SDK, network, AsyncStorage buffer) — deferred until P0.4 vendor pricing research lands.
- Additional events (step-skip, escape usage, chip-vs-custom-gram, weekly-check-in distribution) — listed in TASKS.md line 670 but tracked separately.
- Alert/dashboard wiring for the >90% rubber-stamp threshold — depends on vendor choice.
- Replay of beta events fired before vendor wiring — accepted loss; no real users yet.
