# Feature: Onboarding Flow (11 Screens)

**Date:** 2026-04-08
**Status:** Draft
**Phase:** 4

## What

A guided, animated onboarding flow that collects user data across 11 screens — one question per screen — then generates a personalized training + nutrition plan. Feels like a conversation with a coach, not a medical form.

## Why

This is the user's first impression of FitCoach. Top apps (Fitbod, Caliber, MyFitnessPal) all invest heavily in onboarding because:

- Personalization at onboarding = **50% higher retention** (industry data)
- Completion rate makes or breaks the app — if they don't finish onboarding, they never see the product
- Beginners (our target) need a guided, low-pressure experience

## Requirements

- [ ] 11 screens: Welcome → Goal → Body Stats → Body Fat → Experience → Equipment → Training Days → Occupation & Activity → Exercise Habits → Sleep → Review & Confirm
- [ ] One question per screen (except Body Stats which groups 4 related fields)
- [ ] Animated progress bar (spring) at top of every screen (except Welcome)
- [ ] Back navigation on every screen (except Welcome)
- [ ] All text from i18n (already written in he.ts / en.ts)
- [ ] RTL layout throughout (Hebrew primary)
- [ ] Health disclaimer in footer of Review screen
- [ ] Animations: screen transitions, content entrance, selection feedback, result reveal
- [ ] Draft pattern: each screen calls `updateDraft()`, final screen calls `completeOnboarding()`
- [ ] Zod validation before completing (userProfileSchema already exists)

## Screen Breakdown

### Screen 1: Welcome (exists — enhance)

- Hero title + subtitle from i18n
- Pulsing "Get Started" CTA button (scale 1.0 → 1.03, repeating)
- No progress bar, no back button
- **File:** `app/(onboarding)/welcome.tsx` (modify)

### Screen 2: Goal Picker

- Title: "מה המטרה שלך?"
- 3 options: muscle_gain, fat_loss, maintenance
- Component: `OptionSelector` (list layout, with descriptions)
- Draft: `updateDraft({ goal })`
- **File:** `app/(onboarding)/goal.tsx` (create)

### Screen 3: Body Stats

- Title: "נתוני גוף"
- 4 fields grouped: height (NumberInput, cm), weight (NumberInput, kg), age (NumberInput, years), sex (OptionSelector, 2 options)
- Validation: height 100-250, weight 30-300, age 14-100
- Draft: `updateDraft({ heightCm, weightKg, age, sex })`
- **File:** `app/(onboarding)/body-stats.tsx` (create)

### Screen 4: Body Fat (Optional)

- Title: "אחוז שומן (אופציונלי)"
- NumberInput + skip button
- Help text explaining when to skip
- Draft: `updateDraft({ bodyFatPercent })` or null
- **File:** `app/(onboarding)/body-fat.tsx` (create)

### Screen 5: Experience Level

- Title: "ניסיון באימונים"
- 2 options with descriptions: beginner, intermediate
- Component: `OptionSelector` (list layout)
- Draft: `updateDraft({ experience })`
- **File:** `app/(onboarding)/experience.tsx` (create)

### Screen 6: Equipment

- Two-step screen:
  1. Location picker: full_gym / home / bodyweight_only (OptionSelector)
  2. If `home`: show equipment CheckboxList (barbell, dumbbells, bench, etc.)
  3. If `full_gym`: auto-select all, show confirmation
  4. If `bodyweight_only`: auto-select 'none', skip checklist
- Draft: `updateDraft({ equipment: { location, availableEquipment } })`
- **File:** `app/(onboarding)/equipment.tsx` (create)

### Screen 7: Training Days

- Title: "באילו ימים אתה יכול להתאמן?"
- Subtitle: "בחר לפחות 2 ימים"
- CheckboxList with 7 days (Sun-Sat, Hebrew names)
- Validation: min 2, max 6 days
- Draft: `updateDraft({ trainingDays })`
- **File:** `app/(onboarding)/training-days.tsx` (create)

### Screen 8: Occupation & Activity

- Title: "מה סוג העבודה שלך?" → then "מה אתה עושה אחרי העבודה?"
- Two OptionSelectors stacked (occupation first, afterWorkActivity second)
- Optional: daily steps NumberInput with "don't know" skip
- Draft: `updateDraft({ lifestyle: { occupation, afterWorkActivity, dailySteps } })`
- **File:** `app/(onboarding)/activity.tsx` (create)

### Screen 9: Exercise Habits

- Title: "ספר לי על האימונים שלך"
- 4 OptionSelectors: exerciseDaysPerWeek, sessionDuration, exerciseType, exerciseIntensity
- All single-tap selections, no typing
- Draft: `updateDraft({ lifestyle: { exerciseDaysPerWeek, sessionDurationMinutes, exerciseType, exerciseIntensity } })`
- **File:** `app/(onboarding)/exercise.tsx` (create)

### Screen 10: Sleep

- Title: "כמה שעות שינה בלילה?"
- NumberInput (min 2, max 14, step 0.5)
- Warning banner if < 6 hours
- Draft: `updateDraft({ lifestyle: { sleepHoursPerNight } })`
- **File:** `app/(onboarding)/sleep.tsx` (create)

### Screen 11: Review & Confirm

- Title: "התוכנית שלך מוכנה!"
- Animated TDEE counter (rolls up to final number)
- Macro cards (protein, carbs, fat) fade in staggered
- TDEE breakdown bars (BMR, NEAT, EAT, TEF) grow from zero
- Split type + training days summary
- Health disclaimer footer
- CTA: "בוא נתחיל!" → calls `completeOnboarding()` → redirects to tabs
- **File:** `app/(onboarding)/result.tsx` (create)

## Animation Spec

### Screen Transitions

- Forward: `SlideInRight` (300ms, spring damping 20)
- Back: `SlideInLeft` (300ms, spring damping 20)
- Custom via expo-router `screenOptions.animation`

### Content Entrance (every screen)

- Staggered `FadeInDown`: title (0ms) → subtitle (80ms) → content (160ms) → button (240ms)
- Duration: 400ms each, spring damping 18

### Selection Feedback

- Existing: press scale (0.96) + haptic (from useAnimatedPress)
- Add: selected state border color transition (withSpring)

### Progress Bar

- Width animates with `withSpring` (damping 15, stiffness 100)
- Shows current/total (e.g., 3/11)
- Height: 4px, color: primary, background: surface

### Welcome CTA Pulse

- `withRepeat(withSequence(withTiming(1.03, 1500ms), withTiming(1.0, 1500ms)), -1)`
- Subtle breathing effect, not bouncy

### Result Screen Reveal (Screen 11)

- TDEE counter: `withTiming` rolls 0 → final value over 1500ms
- Macro cards: staggered `FadeInUp` (0ms, 200ms, 400ms)
- Breakdown bars: `withSpring` width from 0% → actual % (staggered 100ms apart)
- CTA button: `FadeInUp` after all reveals complete (~1200ms delay)

## Shared Components to Create

### `OnboardingLayout`

Wraps every onboarding screen with consistent structure:

- Progress bar (animated)
- ScrollView with consistent padding
- Bottom area for Next/Back buttons
- Staggered content entrance animation
- **File:** `src/components/OnboardingLayout.tsx`

### `ProgressBar`

Animated progress indicator:

- Props: `current: number`, `total: number`
- Spring-animated width
- **File:** `src/components/ProgressBar.tsx`

## Data Flow

```
Screen → updateDraft(fields) → Zustand draft accumulates
  ...repeat for each screen...
Result Screen → validateDraft() → completeOnboarding()
  → Zod validates full profile
  → userRepository.saveProfile()
  → calculateTdeeFromProfile()
  → set({ isOnboarded: true })
  → app/index.tsx redirects to /(tabs)
```

## Files to Create/Modify

| File                                  | Action | Description                              |
| ------------------------------------- | ------ | ---------------------------------------- |
| `app/(onboarding)/welcome.tsx`        | Modify | Add pulse animation to CTA               |
| `app/(onboarding)/goal.tsx`           | Create | Goal picker screen                       |
| `app/(onboarding)/body-stats.tsx`     | Create | Height, weight, age, sex                 |
| `app/(onboarding)/body-fat.tsx`       | Create | Optional body fat %                      |
| `app/(onboarding)/experience.tsx`     | Create | Experience level picker                  |
| `app/(onboarding)/equipment.tsx`      | Create | Location + equipment checklist           |
| `app/(onboarding)/training-days.tsx`  | Create | Day of week picker                       |
| `app/(onboarding)/activity.tsx`       | Create | Occupation + after-work + steps          |
| `app/(onboarding)/exercise.tsx`       | Create | Exercise habits (4 selectors)            |
| `app/(onboarding)/sleep.tsx`          | Create | Sleep hours + warning                    |
| `app/(onboarding)/result.tsx`         | Create | Animated review + confirm                |
| `app/(onboarding)/_layout.tsx`        | Modify | Custom screen transitions, header hidden |
| `src/components/OnboardingLayout.tsx` | Create | Shared layout with progress + animations |
| `src/components/ProgressBar.tsx`      | Create | Animated progress bar                    |
| `src/components/index.ts`             | Modify | Export new components                    |

## Acceptance Criteria

- [ ] All 11 screens render correctly in RTL (Hebrew)
- [ ] Progress bar advances smoothly with spring animation
- [ ] Content entrance animations play on every screen (staggered fade-up)
- [ ] Back navigation works on all screens (except Welcome)
- [ ] Screen transitions use custom slide + fade (not default)
- [ ] Goal/Experience/Equipment/Occupation selectors use OptionSelector
- [ ] Training days + home equipment use CheckboxList
- [ ] Body stats / body fat / sleep use NumberInput
- [ ] Body fat can be skipped
- [ ] Equipment checklist conditionally shown based on location
- [ ] Training days validated (min 2, max 6)
- [ ] Sleep warning shown when < 6 hours
- [ ] Result screen: TDEE counter rolls up, macros stagger in, bars grow
- [ ] Welcome CTA has subtle pulse animation
- [ ] `completeOnboarding()` saves profile, calculates TDEE, redirects to tabs
- [ ] Health disclaimer visible on result screen
- [ ] All existing tests still pass (no regressions)

## Open Questions

- Should we add "motivational pause" screens between sections (like Fastic)? → Decided: No for v1, can add later based on completion rate data
- Should daily steps be on its own screen or grouped with occupation? → Decided: Grouped with occupation (Screen 8), with "don't know" skip option

## Implementation Plan

> Each task is scoped to fit in one Claude session. Business logic tasks follow TDD.
> PR strategy: **2 PRs** — Task 1-3 (shared infra + first 5 screens) → Task 4-6 (remaining screens + result + polish).

---

### Task 1: Shared Onboarding Infrastructure (M)

**Files:**

- `src/components/ProgressBar.tsx` (create)
- `src/components/ProgressBar.test.tsx` (create)
- `src/components/OnboardingLayout.tsx` (create)
- `src/components/OnboardingLayout.test.tsx` (create)
- `src/components/index.ts` (modify — add exports)
- `app/(onboarding)/_layout.tsx` (modify — add all screen routes + custom transitions)

**What:**
Build the two shared components every onboarding screen depends on, and wire up the stack navigator with all 11 routes + custom slide transitions.

1. **ProgressBar** — `current` + `total` props, spring-animated width via `withSpring`, 4px height, primary color on surface background.
2. **OnboardingLayout** — Wraps every screen. Includes: ProgressBar at top, ScrollView with consistent padding (`spacing.xl`), bottom button area (Next + optional Back), staggered content entrance animation (`FadeInDown` with delays: title 0ms, subtitle 80ms, content 160ms, button 240ms). Props: `step`, `totalSteps`, `onNext`, `onBack?`, `nextDisabled?`, `nextLabel?`, `children`.
3. **Stack layout** — Add all 11 `<Stack.Screen>` entries to `_layout.tsx` with `headerShown: false` and custom `animation: 'slide_from_right'` (RTL-aware).

**Test first:**

- ProgressBar: renders with correct width ratio, updates when current changes
- OnboardingLayout: renders progress bar, renders children, shows/hides back button, disables next button

**Acceptance:**

- `npm test` passes with new component tests
- Opening any onboarding route shows ProgressBar + consistent layout
- Back button hidden on step 1, visible on step 2+

---

### Task 2: Welcome + Goal + Body Stats + Body Fat + Experience (L)

**Files:**

- `app/(onboarding)/welcome.tsx` (modify — add pulse animation)
- `app/(onboarding)/goal.tsx` (create)
- `app/(onboarding)/body-stats.tsx` (create)
- `app/(onboarding)/body-fat.tsx` (create)
- `app/(onboarding)/experience.tsx` (create)

**What:**
Build the first 5 screens. These are the simplest screens — single selectors and number inputs.

1. **Welcome** — Enhance existing screen: add breathing pulse to CTA button (`withRepeat` + `withSequence`, scale 1.0→1.03→1.0), keep existing layout but wrap with proper styling. Navigate to `/goal` on press.
2. **Goal** — OptionSelector (list layout) with 3 options from i18n. Auto-advance on select (haptic + 300ms delay before navigation). `updateDraft({ goal })`.
3. **Body Stats** — 3 NumberInputs (height 100-250 cm, weight 30-300 kg, age 14-100) + OptionSelector for sex (grid, 2 options). All 4 fields required to enable Next. `updateDraft({ heightCm, weightKg, age, sex })`.
4. **Body Fat** — NumberInput (3-60%) + skip button (secondary variant). Skip sets `bodyFatPercent: null`. Help text from i18n below input. `updateDraft({ bodyFatPercent })`.
5. **Experience** — OptionSelector (list layout) with 2 options + descriptions. Auto-advance on select. `updateDraft({ experience })`.

All screens wrapped in `OnboardingLayout`. All text from `t().onboarding.*`.

**Test first:** TDD is optional for UI-only screens. Manual verification:

- Each screen renders all i18n strings in Hebrew
- OptionSelectors highlight selected option
- NumberInputs clamp to min/max
- Navigation flows forward and back correctly
- Draft updates on each screen (verify via store state)

**Acceptance:**

- Can navigate Welcome → Goal → Body Stats → Body Fat → Experience → (next screen placeholder)
- All text in Hebrew, RTL layout correct
- Body fat skip works (sets null)
- Back navigation returns to previous screen with state preserved
- Pulse animation visible on Welcome CTA
- `npm test` still passes (no regressions)

---

### Task 3: Equipment + Training Days (M)

**Files:**

- `app/(onboarding)/equipment.tsx` (create)
- `app/(onboarding)/training-days.tsx` (create)

**What:**
These two screens have the most complex interaction logic in the onboarding.

1. **Equipment** — Two-step conditional screen:
   - Step 1: OptionSelector for location (full_gym / home / bodyweight_only) with descriptions from i18n
   - Step 2 (conditional):
     - `full_gym` → auto-select all equipment items, show confirmation text
     - `home` → show CheckboxList with equipment items (barbell, dumbbells, bench, pull_up_bar, cable_machine, leg_machines, resistance_bands)
     - `bodyweight_only` → auto-select `['none']`, show confirmation text
   - Next enabled when: location selected AND equipment array has ≥1 item
   - `updateDraft({ equipment: { location, availableEquipment } })`

2. **Training Days** — CheckboxList with 7 days (Hebrew names from `t().onboarding.schedule.days`). Next enabled when 2-6 days selected. Show subtitle "בחר לפחות 2 ימים". `updateDraft({ trainingDays })`.

**Test first:** TDD optional for UI. Manual verification:

- Equipment: switching location resets equipment selection
- Equipment: full_gym auto-selects all items
- Equipment: bodyweight_only auto-selects 'none'
- Equipment: home shows checklist, must pick ≥1
- Training Days: can't proceed with <2 or >6 days

**Acceptance:**

- Equipment conditional logic works for all 3 locations
- Training Days validates min 2, max 6
- Both screens use OnboardingLayout with correct step numbers
- Back preserves selections
- `npm test` still passes

---

### Task 4: Activity + Exercise Habits + Sleep (M)

**Files:**

- `app/(onboarding)/activity.tsx` (create)
- `app/(onboarding)/exercise.tsx` (create)
- `app/(onboarding)/sleep.tsx` (create)

**What:**
The lifestyle data collection screens. These build the `lifestyle` object incrementally.

1. **Activity (Screen 8)** — Three sections stacked vertically:
   - Occupation: OptionSelector (list, 4 options with descriptions from i18n)
   - After-work activity: OptionSelector (list, 3 options with descriptions)
   - Daily steps: NumberInput (0-100,000, step 1000) + "Don't know" button that sets null
   - Next enabled when occupation AND afterWorkActivity selected (steps optional)
   - `updateDraft({ lifestyle: { occupation, afterWorkActivity, dailySteps } })`

2. **Exercise Habits (Screen 9)** — Four selectors stacked:
   - Days per week: OptionSelector (grid, options 1-7)
   - Session length: OptionSelector (grid, options 30/45/60/75/90 with "דקות" suffix)
   - Exercise type: OptionSelector (list, 3 options: strength/cardio/both)
   - Intensity: OptionSelector (list, 3 options with conversational descriptions)
   - All 4 required to enable Next
   - `updateDraft({ lifestyle: { exerciseDaysPerWeek, sessionDurationMinutes, exerciseType, exerciseIntensity } })`

3. **Sleep (Screen 10)** — NumberInput (2-14 hours, step 0.5, unit "שעות"). Warning banner (amber background, warning icon) appears when value < 6. `updateDraft({ lifestyle: { sleepHoursPerNight } })`.

**Test first:** TDD optional for UI. Manual verification:

- Activity: "Don't know" button for steps sets null and doesn't block Next
- Exercise: all 4 fields required
- Sleep: warning appears/disappears at threshold of 6

**Acceptance:**

- All 3 screens render correctly in RTL
- Lifestyle object accumulates correctly across screens 8-10
- Sleep warning shows for <6 hours
- Back navigation preserves all selections
- `npm test` still passes

---

### Task 5: Result Screen with Animations (L)

**Files:**

- `app/(onboarding)/result.tsx` (create)

**What:**
The "wow" moment. Shows the personalized plan with animated reveals.

1. **Data computation** — On mount, call `validateDraft()` to verify all fields present. Calculate preview TDEE + macros using existing algorithm functions (`calculateBmr`, `calculateTdeeBreakdown`, `calculateMacros`, `selectSplit`). Display results without saving yet.

2. **Animated elements:**
   - TDEE calorie counter: `withTiming` rolls from 0 → final value over 1500ms (display as integer, updating every frame)
   - Split type + training days: `FadeInUp` with 200ms delay
   - Macro cards (protein/carbs/fat): staggered `FadeInUp` at 400ms, 600ms, 800ms — each shows grams + percentage, colored with macro theme colors
   - TDEE breakdown bars (BMR/NEAT/EAT/TEF): `withSpring` width from 0% → actual % of total, staggered 100ms apart, labeled from i18n
   - CTA button: `FadeInUp` at ~1200ms delay

3. **Health disclaimer** — Static text at bottom: "המידע מבוסס על מחקרים ומותאם אישית. אין לראות בכך ייעוץ רפואי."

4. **CTA action** — On press: call `completeOnboarding()` → on success, router replaces to `/(tabs)`.

**Test first:** TDD optional for UI-heavy screen. Manual verification:

- Counter rolls up smoothly
- Macro cards appear one by one
- Breakdown bars grow from left
- CTA triggers `completeOnboarding()` and redirects
- Health disclaimer visible

**Acceptance:**

- All animations play in sequence on screen mount
- TDEE number matches algorithm output
- Macros and split match the draft data
- `completeOnboarding()` saves to DB and redirects to tabs
- Health disclaimer visible at bottom
- `npm test` still passes

---

### Task 6: Polish + Integration Test (M)

**Files:**

- `app/(onboarding)/welcome.tsx` (minor tweaks if needed)
- Any screen files (bug fixes from full-flow testing)
- `src/components/OnboardingLayout.tsx` (animation tuning if needed)

**What:**
End-to-end flow polish. Run through the entire 11-screen flow manually multiple times and fix issues.

1. **Full flow test** — Complete onboarding start to finish, verify:
   - All 11 screens navigate correctly (forward + back)
   - Progress bar shows correct step on every screen
   - Draft accumulates all fields correctly
   - `completeOnboarding()` succeeds and redirects
   - Profile loads correctly on next app open (no re-onboarding)

2. **Animation polish** — Tune spring configs if any feel off:
   - Content entrance timing/stagger
   - Progress bar spring response
   - Result screen reveal sequence
   - Screen transition smoothness

3. **Edge cases:**
   - Tap Next rapidly (debounce?)
   - Rotate device during onboarding
   - Kill app mid-flow, reopen (draft is in-memory, should restart)
   - Very large/small values at boundaries

4. **Run all checks** — lint, typecheck, tests, review

**Acceptance:**

- Full flow completes without errors
- Animations feel smooth and intentional
- No regressions in existing tests
- Ready for PR
