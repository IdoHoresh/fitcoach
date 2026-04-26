# Feature: Settings — Meal Logging Mode Toggle

**Date:** 2026-04-27
**Status:** Approved (plan locked)
**Parent Spec:** [docs/specs/2026-04-24-two-mode-meal-logging.md](./2026-04-24-two-mode-meal-logging.md) — Track A1 (remaining)

## What

A row inside the Profile/Settings tab that lets the user switch their meal-logging mode between **Structured (מובנה)** and **Free (חופשי)** at any time after onboarding. Tapping the row opens a bottom sheet showing the same two `ModeCard`s used in the onboarding mode-choice screen. Tapping a card commits the change immediately and dismisses the sheet.

## Why

Parent spec invariants require the mode to be reversible at any time post-onboarding (line 43, 100, 142, 184). The mode-choice screen + persistence + components shipped in PR #85; this is the remaining surface that exposes the choice to existing users. Without it, a user who picks the wrong mode during onboarding has no path out short of resetting the app.

## Requirements

- [ ] Settings row labeled "מצב יומן ארוחות" lives in the Profile tab above the dev-tools section
- [ ] Row shows the currently selected mode as a subtitle ("מובנה" or "חופשי")
- [ ] Tapping the row opens a bottom sheet with the two `ModeCard`s side-by-side
- [ ] Tapping a card calls `updateProfile({ mealLoggingMode })` and dismisses the sheet
- [ ] No confirmation dialog — switch is non-destructive (existing logs persist)
- [ ] No analytics in this PR — A1-analytics task scaffolds the tracking infra
- [ ] In-progress wizard (Track B, future) reads mode at launch into local state — flip mid-wizard does not reach an active session
- [ ] Hebrew + English i18n keys
- [ ] No `isRTL()` conditionals — inherits framework-level RTL

## Design

### Architecture

```
profile.tsx (tab)
  └── SettingsSection (new, inline component or extracted)
        └── SettingsRow "מצב יומן ארוחות" → opens sheet
              └── ModeToggleSheet (new)
                    ├── ModeCard "structured"  ──┐
                    └── ModeCard "free"        ──┴─→ onPress → updateProfile() → onClose()
```

### Data Flow

```
Tap row → setSheetOpen(true)
  → user taps ModeCard
  → handleModeChange(next)
      → useUserStore.updateProfile({ mealLoggingMode: next })
      → setSheetOpen(false)
  → row subtitle re-renders from store
```

### Files to Create/Modify

| File                                               | Action | Description                                                                                 |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `src/components/settings/SettingsRow.tsx`          | Create | Generic row primitive (label + subtitle + chevron). Reusable for future settings.           |
| `src/components/settings/SettingsRow.test.tsx`     | Create | Renders label/subtitle, fires onPress.                                                      |
| `src/components/settings/ModeToggleSheet.tsx`      | Create | Bottom sheet wrapping two `ModeCard`s. Calls `onSelect(mode)`.                              |
| `src/components/settings/ModeToggleSheet.test.tsx` | Create | Renders both cards, tap card → onSelect fired with correct mode → onClose fired.            |
| `app/(tabs)/profile.tsx`                           | Modify | Add Settings section above dev tools. Wire row → sheet. Reads `mealLoggingMode` from store. |
| `src/i18n/he.ts`                                   | Modify | Add `settings.mealLoggingMode.{title,subtitleStructured,subtitleFree}` keys.                |
| `src/i18n/en.ts`                                   | Modify | Mirror Hebrew keys.                                                                         |

## Acceptance Criteria

- [ ] Settings row visible on Profile tab; subtitle reflects current mode from store
- [ ] Tapping row opens sheet; sheet shows both `ModeCard`s with correct selected state
- [ ] Tapping the non-selected card persists the new mode (verified by re-reading store) and dismisses the sheet
- [ ] Tapping the already-selected card is a no-op flip (still dismisses sheet — UX consistency)
- [ ] Row subtitle updates without manual reload after switch
- [ ] No regressions in existing mode-choice onboarding flow
- [ ] Hebrew + English copy renders correctly under RTL
- [ ] Lint, typecheck, tests all green

## Task Breakdown

1. [ ] **`SettingsRow` primitive + tests** (S) — Generic, reusable. Label, optional subtitle, optional chevron, `onPress`, `testID`.
2. [ ] **`ModeToggleSheet` + tests** (M) — Bottom sheet with two `ModeCard`s; `currentMode`, `onSelect`, `onClose` props. Integration test covers the full tap → onSelect → onClose flow.
3. [ ] **Wire into `profile.tsx`** (S) — Add Settings section above dev tools. Subscribe to `mealLoggingMode`. Open sheet on row tap; close on select; commit via `updateProfile`.
4. [ ] **i18n keys** (XS) — `settings.mealLoggingMode.title` + subtitle variants in `he.ts` and `en.ts`.

## Open Questions

None — all decisions resolved during brainstorm:

- Scope: just the mode row (no placeholder sections, no calorie floor — those ship with Track D)
- In-progress wizard protection: implicit (wizard owns its mode snapshot when Track B ships)
- Sheet UX: instant flip + dismiss (no Save CTA)
- Analytics: deferred to A1-analytics task
- Testing: handler + sheet integration test (RNTL-rendered sheet, asserting `updateProfile` + `onClose` fire)

## Out of Scope

- Analytics events (`mode_switched_in_settings`) — A1-analytics task
- Other settings rows (account, notifications, units, calorie floor) — future tracks
- Confirmation dialog on switch — switch is non-destructive
- Block-toggle-while-wizard-active guard — wizard owns its own mode snapshot

## Implementation Plan

Build order: i18n → SettingsRow primitive → ModeToggleSheet → wire into profile.tsx. Each task ships a test file alongside the implementation.

### Task 1: i18n keys (XS)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`
**What:** Add a `settings.mealLoggingMode` namespace with `title`, `subtitleStructured`, `subtitleFree`, `sheetTitle`. Reuse the existing `onboarding.modeChoice.{structured,free,sheet,infoAccessibilityLabel}` for the cards + info sheet — no duplication. Mirror the keys exactly between `he.ts` and `en.ts`.
**Test first:** Not applicable (data-only constants — TypeScript catches missing keys at compile time).
**Acceptance:** `npm run typecheck` passes after referencing `t().settings.mealLoggingMode.*` from new code.

### Task 2: SettingsRow primitive + tests (S)

**Files:** `src/components/settings/SettingsRow.tsx`, `src/components/settings/SettingsRow.test.tsx`
**What:** Generic, reusable row with `label`, optional `subtitle`, optional `chevron` icon, `onPress`, `testID`. Layout: label/subtitle on the right (RTL-aware via framework `I18nManager.isRTL`), chevron on the leading edge. Uses `Pressable` + `useAnimatedPress` for parity with `ModeCard`. Hebrew text uses `textAlign: 'right'` + `writingDirection: 'rtl'` per existing component pattern.
**Test first (RED → GREEN → CLEAN):**

1. `renders label and subtitle when both provided`
2. `omits subtitle when not provided`
3. `fires onPress when row is tapped`
4. `applies testID for navigation`

**Acceptance:** All 4 tests pass; component renders correctly under RTL in dev (manual sim check deferred to Task 4).

### Task 3: ModeToggleSheet + tests (M)

**Files:** `src/components/settings/ModeToggleSheet.tsx`, `src/components/settings/ModeToggleSheet.test.tsx`
**What:** Bottom-sheet `Modal` (same shape as `ModeInfoSheet`) wrapping two `ModeCard`s side-by-side (vertically stacked, matching the onboarding screen). Props: `visible`, `currentMode: MealLoggingMode`, `onSelect: (mode: MealLoggingMode) => void`, `onClose: () => void`, `testID`. Internally manages an info-sheet `useState<MealLoggingMode | null>(null)` so `ⓘ` taps still work — same `ModeInfoSheet` reuse pattern as the onboarding screen. Strings sourced from `t().settings.mealLoggingMode.*` + `t().onboarding.modeChoice.*`.

The component owns no async work (no DI helper extraction needed — selection is synchronous and the parent owns `updateProfile`). Tap card → `onSelect(mode)` then `onClose()` fired in that order.

**Test first (RED → GREEN → CLEAN):**

1. `renders both ModeCards with correct selected state from currentMode prop` (currentMode='structured' → structured selected, free not; flip and re-render)
2. `tapping the unselected card fires onSelect with that mode`
3. `tapping the unselected card fires onClose after onSelect` (assert call order via mock call timeline)
4. `tapping the already-selected card still fires onSelect + onClose` (consistent UX — no special case)
5. `does not render when visible={false}` (Modal visibility)
6. `tapping the backdrop fires onClose` (matches ModeInfoSheet pattern)
7. `ⓘ button on a card opens the info sheet without firing onSelect or onClose` (info ≠ commit, same separation as onboarding)

**Acceptance:** All 7 tests pass. Manual sim check deferred to Task 4 (full flow: row → sheet → card tap → store updated → sheet dismisses).

### Task 4: Wire into profile.tsx (S, manual verify)

**Files:** `app/(tabs)/profile.tsx`
**What:** Add a Settings section above the existing dev-tools section. Subscribes to `useUserStore((s) => s.profile?.mealLoggingMode)`. Renders one `SettingsRow` whose subtitle is `subtitleStructured` or `subtitleFree` based on current mode. Tap → `setSheetVisible(true)`. Sheet `onSelect` calls `updateProfile({ mealLoggingMode: next })`; `onClose` calls `setSheetVisible(false)`. Keep dev-tools section untouched.

UI-only wiring — no new logic, no test required. Manual verification:

1. `dev` to launch sim
2. Profile tab → see "מצב יומן ארוחות" row with current mode subtitle
3. Tap row → sheet opens with both cards, current mode selected
4. Tap the other card → sheet dismisses, row subtitle updates without reload
5. Tap row again → sheet shows new mode selected (persistence verified)
6. Force-close + reopen app → row still shows last-selected mode (DB v20 round-trip)
7. Tap ⓘ → info sheet opens, close → toggle sheet still visible (info ≠ commit)
8. RTL layout correct — chevron on leading edge, label right-aligned

**Acceptance:** All 8 manual checks pass; lint + typecheck + tests green; size check < 500 lines diff.

### TDD Loop Summary

- Tasks 2 + 3 follow strict RED → GREEN → CLEAN.
- Task 1 is data-only; TypeScript is the test.
- Task 4 is UI integration; manual verification only (matches the FitCoach convention for navigation/wiring tasks).
- All `useUserStore` interactions in Task 4 use existing `updateProfile` — no new store code.
