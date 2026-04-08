# Feature: Calculating Animation Screen

**Date:** 2026-04-08
**Status:** Approved
**GitHub Issue:** N/A

## What

A "perceived effort" screen between Sleep (step 9) and Result that shows an animated step-by-step checklist of the algorithm stages. Each step appears, animates a spinner, then shows a checkmark. After ~10 seconds, auto-navigates to the Result screen.

## Why

When results appear instantly, users don't value them. A few seconds of visible "calculation" builds anticipation and makes the personalized plan feel worth the wait. Apps like Noom, Lemonade, and Google Flights use this pattern to increase perceived value and trust.

## Requirements

- [ ] New screen between Sleep and Result in the onboarding stack
- [ ] 5 animated steps shown sequentially (~2s each):
  1. "Calculating base metabolism..." (BMR)
  2. "Analyzing daily movement..." (NEAT)
  3. "Adding workout burn..." (EAT)
  4. "Factoring food digestion..." (TEF)
  5. "Building your plan..."
- [ ] Each step: appears → shows spinner/dot → checkmark animation
- [ ] Progress bar at bottom showing overall calculation progress
- [ ] Auto-navigates to Result after all steps complete
- [ ] No back gesture (user can't swipe back mid-calculation)
- [ ] Hebrew + English i18n strings
- [ ] Title at top: "Building Your Plan" / "בונים את התוכנית שלך"
- [ ] Uses OnboardingLayout (step 10 of 11)

## Design

### Architecture

Pure UI screen — no actual computation happens here. The real calculations happen on the Result screen (already implemented). This screen is purely animated delay for UX.

### Data Flow

```
Sleep → saves draft → Calculating (animated delay, 5s) → Result (runs computeResults)
```

### Screen Layout

```
┌─────────────────────────────┐
│  ═════════════════░░░  10/11│  ← ProgressBar
│                             │
│     🔬 Building Your Plan   │  ← Title (centered)
│                             │
│  ✓ Base metabolism          │  ← FadeIn + checkmark
│  ✓ Daily movement           │  ← FadeIn + checkmark
│  ● Adding workout burn...   │  ← Current step (animated dot)
│  ○ Food digestion           │  ← Pending (dimmed)
│  ○ Building your plan       │  ← Pending (dimmed)
│                             │
│     ━━━━━━━━━━━░░░░ 60%     │  ← Mini progress bar
│                             │
└─────────────────────────────┘
```

### Files to Create/Modify

| File                                  | Action | Description                               |
| ------------------------------------- | ------ | ----------------------------------------- |
| `app/(onboarding)/calculating.tsx`    | Create | New animated screen                       |
| `app/(onboarding)/_layout.tsx`        | Modify | Add calculating screen to stack           |
| `app/(onboarding)/sleep.tsx`          | Modify | Navigate to calculating instead of result |
| `src/components/OnboardingLayout.tsx` | Modify | TOTAL_STEPS 10 → 11                       |
| `src/i18n/he.ts`                      | Modify | Add calculating strings                   |
| `src/i18n/en.ts`                      | Modify | Add calculating strings                   |

## Acceptance Criteria

- [ ] Screen appears after Sleep, before Result
- [ ] 5 steps animate sequentially over ~10 seconds
- [ ] Each step shows pending → active → complete states
- [ ] Auto-navigates to Result after completion
- [ ] Back gesture disabled
- [ ] Hebrew and English strings work
- [ ] Progress bar shows step 10 of 11
- [ ] All existing tests still pass
- [ ] No flickering or janky animations

## Task Breakdown

1. [ ] Add i18n strings for calculating screen (S)
2. [ ] Create calculating.tsx with step animations (L)
3. [ ] Wire into navigation: layout, sleep redirect, TOTAL_STEPS (S)
4. [ ] Manual test on emulator (S)

## Implementation Plan

### Task 1: i18n strings + navigation wiring (S)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`, `app/(onboarding)/_layout.tsx`, `app/(onboarding)/sleep.tsx`, `src/components/OnboardingLayout.tsx`
**What:**

1. Add `calculating` section to both i18n files (under `onboarding`, before `result`):
   - `title`: "בונים את התוכנית שלך" / "Building Your Plan"
   - `step1`: "מחשב מטבוליזם בסיסי..." / "Calculating base metabolism..."
   - `step2`: "מנתח תנועה יומית..." / "Analyzing daily movement..."
   - `step3`: "מוסיף שריפת אימונים..." / "Adding workout burn..."
   - `step4`: "מחשב עיכול מזון..." / "Factoring food digestion..."
   - `step5`: "בונה את התוכנית שלך..." / "Building your plan..."
2. Add `<Stack.Screen name="calculating" options={{ gestureEnabled: false }} />` between sleep and result in `_layout.tsx`
3. Change `sleep.tsx` navigation from `router.push('/(onboarding)/result')` to `router.push('/(onboarding)/calculating')`
4. Update `TOTAL_STEPS` from `10` to `11` in `OnboardingLayout.tsx`
   **Test first:** TDD not required (navigation/i18n wiring, no business logic)
   **Acceptance:** App builds, sleep navigates to calculating route (404 is fine — screen not yet created)

### Task 2: Create calculating.tsx — animated step checklist (L)

**Files:** `app/(onboarding)/calculating.tsx`
**What:** Create the calculating screen with:

- Uses `OnboardingLayout` with `step={10}` (no next button — auto-advances)
- Title centered at top using `OnboardingTitle`
- 5 calculation steps shown as a list, each with 3 states:
  - **Pending** (dimmed circle `○`, muted text)
  - **Active** (pulsing dot `●` with primary color, normal text + "...")
  - **Complete** (checkmark `✓` with success color, normal text)
- Each step transitions: pending → active (fade in) → complete (after ~2s)
- Steps are staggered — step N+1 starts when step N completes
- A mini progress bar at the bottom that fills over the 10 seconds
- After all 5 steps complete, short 500ms pause, then `router.replace('/(onboarding)/result')` (replace, not push — so back gesture from result doesn't return here)
- Animation approach: `useEffect` with `setTimeout` chain, each step updates a `currentStep` state. Use Reanimated `FadeIn` for step entrance and spring animation for checkmark.
- Clean up all timers on unmount (lesson from NumberInput bug)

**Key patterns from codebase:**

- Import theme from `@/theme` (colors, spacing, fontSize, fontFamily)
- Import `t()` from `@/i18n`
- Use `OnboardingLayout`, `OnboardingTitle`, `OnboardingContent` from `@/components`
- Reanimated animations: `FadeIn`, `FadeInLeft` for step entrance
- Timer cleanup via `useEffect` return (lessons.md: "Timer-based components must clean up on unmount")

**Test first:** TDD not required (pure UI/animation, no business logic)
**Acceptance:**

- Screen shows 5 steps animating over 10 seconds
- Each step transitions pending → active → complete
- Auto-navigates to result after completion
- Back gesture disabled
- No timer warnings on unmount
- Manual test: run on Android emulator, verify smooth animations

### Task 3: Update result screen step number (S)

**Files:** `app/(onboarding)/result.tsx`
**What:** Update `step={10}` to `step={11}` since we added a screen before it
**Test first:** Not needed (single constant change)
**Acceptance:** Result screen progress bar shows 11/11 (full)

## Open Questions

None — design approved.
