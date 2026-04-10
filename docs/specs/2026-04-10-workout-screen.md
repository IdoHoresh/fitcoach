# Feature: Workout Screen — Daily Workout Display

**Date:** 2026-04-10
**Status:** Approved

## What

The Workout tab shows today's workout plan: a list of exercises with sets, reps, and rest times. Users can tap any exercise to see details in a bottom sheet (muscles, instructions, equipment, progression advice). A week-day strip lets users browse other days' workouts. On rest days, a rest card with tomorrow's preview keeps the screen useful.

## Why

Users need a clear, glanceable view of what to do in the gym today. The algorithms, store, and data layer are all complete — this is the UI layer that makes them usable. Beginners especially need a simple "here's your workout" screen without jargon or clutter.

## Requirements

- [ ] Show today's workout exercises with sets × reps, rest time per exercise
- [ ] Week-day strip (7 days) at top — today highlighted, tappable to browse other days
- [ ] Tap exercise → bottom sheet with: name, primary/secondary muscles, instructions, equipment, progression advice
- [ ] Rest day: rest card with motivational message + tomorrow's workout preview
- [ ] "Start Workout" button at bottom — present but disabled (active session UI is next task)
- [ ] RTL support (Hebrew primary, English secondary)
- [ ] Accessibility: screen reader labels on all interactive elements
- [ ] Dark theme using existing theme tokens

## Design

### Architecture

Read-only display screen. Pulls data from `useWorkoutStore` (already complete with 102 tests).

```
useWorkoutStore.getTodaysWorkout() → Exercise list
useWorkoutStore.getProgressionAdvice(exerciseId) → Weight suggestion
exercises.ts lookup → Exercise details (muscles, instructions, equipment)
```

### Data Flow

```
Screen mounts → store.getTodaysWorkout() → render exercise list
User taps day strip → store.dayMapping.get(day) → render that day's workout
User taps exercise → lookup exercise details + progression → open bottom sheet
Rest day detected → show rest card + store.dayMapping.get(tomorrow) → preview
```

### Screen Layout

```
┌─────────────────────────────┐
│  Header: "Today's Workout"  │
│  Badge: "Upper A" / "Rest"  │
├─────────────────────────────┤
│  [Su][Mo][Tu][We][Th][Fr][Sa]│  ← Week day strip (today = primary)
├─────────────────────────────┤
│                             │
│  Exercise 1                 │
│  3 × 8-12  ·  90s rest     │
│                             │
│  Exercise 2                 │
│  3 × 8-12  ·  90s rest     │
│                             │
│  Exercise 3                 │
│  4 × 6-10  ·  120s rest    │
│                             │
│  ...                        │
│                             │
├─────────────────────────────┤
│  [ Start Workout (Soon) ]   │  ← Disabled button
└─────────────────────────────┘
```

Rest day variant:

```
┌─────────────────────────────┐
│  Header: "Rest Day"         │
├─────────────────────────────┤
│  [Su][Mo][Tu][We][Th][Fr][Sa]│
├─────────────────────────────┤
│                             │
│  🌿 Rest Day Card           │
│  "Your muscles are growing" │
│  Recovery tip               │
│                             │
├─────────────────────────────┤
│  Tomorrow's Preview         │
│  "Push A · 6 exercises"     │
│  Exercise 1, Exercise 2...  │
│                             │
└─────────────────────────────┘
```

Bottom sheet (on exercise tap):

```
┌─────────────────────────────┐
│  Exercise Name              │
│  Primary: Chest             │
│  Secondary: Triceps, Delts  │
├─────────────────────────────┤
│  Instructions               │
│  "Lower the bar to chest..."│
├─────────────────────────────┤
│  Equipment: Barbell, Bench  │
├─────────────────────────────┤
│  Progression Advice         │
│  "Last: 40kg × 8            │
│   Aim: 40kg × 10"          │
└─────────────────────────────┘
```

### Files to Create/Modify

| File                                             | Action | Description                                  |
| ------------------------------------------------ | ------ | -------------------------------------------- |
| `app/(tabs)/workout.tsx`                         | Modify | Replace placeholder with full workout screen |
| `src/components/workout/WorkoutDayStrip.tsx`     | Create | Week day selector strip                      |
| `src/components/workout/ExerciseCard.tsx`        | Create | Single exercise row (name, sets, reps, rest) |
| `src/components/workout/ExerciseDetailSheet.tsx` | Create | Bottom sheet with exercise details           |
| `src/components/workout/RestDayCard.tsx`         | Create | Rest day message + recovery tip              |
| `src/components/workout/TomorrowPreview.tsx`     | Create | Tomorrow's workout summary                   |
| `src/components/workout/WorkoutHeader.tsx`       | Create | Title + workout type badge                   |
| `src/i18n/he.ts`                                 | Modify | Add workout screen Hebrew strings            |
| `src/i18n/en.ts`                                 | Modify | Add workout screen English strings           |

### Existing Code to Reuse

| What              | Where                           | How                                                          |
| ----------------- | ------------------------------- | ------------------------------------------------------------ |
| Workout store     | `src/stores/useWorkoutStore.ts` | `getTodaysWorkout()`, `dayMapping`, `getProgressionAdvice()` |
| Exercise database | `src/data/exercises.ts`         | Lookup by ID for details, muscles, instructions              |
| Card component    | `src/components/Card.tsx`       | Wrap exercise rows and rest card                             |
| Button component  | `src/components/Button.tsx`     | Disabled "Start Workout" button                              |
| Theme tokens      | `src/theme/`                    | colors, spacing, typography, borderRadius                    |
| i18n helper       | `src/i18n/`                     | `t()` function, `isRTL()`                                    |
| RTLWrapper        | `src/components/RTLWrapper.tsx` | Row layouts that need explicit RTL                           |
| Animated entrance | Reanimated `FadeInDown`         | Staggered list entrance (match onboarding pattern)           |

## Acceptance Criteria

- [ ] Workout tab shows today's exercises with sets × reps and rest time
- [ ] Tapping a day in the strip shows that day's workout
- [ ] Tapping an exercise opens bottom sheet with full details
- [ ] Rest days show rest card + tomorrow's workout preview
- [ ] Start Workout button is visible but disabled
- [ ] Screen works in Hebrew (RTL) and English (LTR)
- [ ] Accessible with screen reader (VoiceOver/TalkBack)
- [ ] Matches existing dark theme and design patterns

## Task Breakdown

1. [ ] i18n strings — Add all workout screen strings to he.ts + en.ts (S)
2. [ ] WorkoutDayStrip — Tappable 7-day strip with today highlight (M)
3. [ ] ExerciseCard — Exercise row component (name, sets, reps, rest) (S)
4. [ ] ExerciseDetailSheet — Bottom sheet with exercise details + progression (M)
5. [ ] RestDayCard + TomorrowPreview — Rest day variant components (M)
6. [ ] WorkoutHeader — Title + workout type badge (S)
7. [ ] Workout screen assembly — Wire all components in workout.tsx (M)
8. [ ] Tests — Unit tests for pure helpers, component tests for key interactions (M)

## Open Questions

None — all decisions made during brainstorm.

---

## Implementation Plan

### Task 1: i18n Strings + Pure Helpers (S)

**Files:** `src/i18n/he.ts`, `src/i18n/en.ts`, `src/components/workout/helpers.ts`
**What:** Add all workout screen strings to both language files. Create pure helper functions that the UI components will consume:

- `formatSetsReps(sets, minReps, maxReps)` → `"3 × 8-12"` or `"3 × 10"` when min===max
- `formatRestTime(seconds)` → `"90s"` or `"2:00"`
- `getNextDay(dayOfWeek)` → next DayOfWeek (for tomorrow preview)
- `isRestDay(day: GeneratedWorkoutDay | undefined)` → boolean (template is null)

New i18n keys needed under `workout`:

- `todaysWorkout`, `restDay`, `restDayMessage`, `restDayTip`, `tomorrowPreview`, `exercises` (count), `comingSoon`, `primaryMuscle`, `secondaryMuscles`, `equipment`, `instructions`, `progressionAdvice`, `noWorkoutPlan` (when no plan generated yet), `deloadBadge`

**Test first:** Unit tests for all 4 pure helpers — edge cases like rest day detection, midnight rollover for getNextDay, single-rep range formatting.
**Acceptance:** All helper tests green. Both language files have matching keys (TypeScript enforces via `TranslationKeys` type).

---

### Task 2: WorkoutDayStrip Component (M)

**Files:** `src/components/workout/WorkoutDayStrip.tsx`, `src/components/workout/WorkoutDayStrip.test.tsx`
**What:** Tappable 7-day strip showing the week. Similar pattern to `WeekdayStreakStrip` from Home but interactive:

- Today highlighted with `colors.primary` border
- Rest days shown with muted style
- Workout days show workout type initial (e.g., "U" for Upper, "P" for Push)
- Selected day has filled `colors.primary` background
- Tapping a day calls `onDaySelect(dayOfWeek)`
- RTL: explicit `isRTL() ? 'row-reverse' : 'row'` (lesson from WeekdayStreakStrip)

**Props:** `dayMapping`, `selectedDay`, `todayDayOfWeek`, `onDaySelect`, `testID`

**Test first:** Component renders 7 day cells, today is highlighted, tapping a day calls onDaySelect with correct DayOfWeek, rest days have distinct style.
**Acceptance:** Tests green. Visual RTL check on device.

---

### Task 3: ExerciseCard Component (S)

**Files:** `src/components/workout/ExerciseCard.tsx`, `src/components/workout/ExerciseCard.test.tsx`
**What:** Single exercise row inside a Card. Displays:

- Exercise name (Hebrew or English via `isRTL()` → `nameHe` / `nameEn`)
- Sets × reps (using `formatSetsReps` from Task 1)
- Rest time (using `formatRestTime` from Task 1)
- Primary muscle as a subtle badge/tag
- Order number
- `onPress` to open detail sheet

Uses existing `Card` component (`variant="default"`). Uses `RTLWrapper` for row layout.

**Props:** `prescription: ExercisePrescription`, `exercise: Exercise`, `order: number`, `onPress`, `testID`

**Test first:** Renders exercise name, formatted sets/reps, rest time. Pressing calls onPress.
**Acceptance:** Tests green. Exercises render in correct order.

---

### Task 4: ExerciseDetailSheet Component (M)

**Files:** `src/components/workout/ExerciseDetailSheet.tsx`, `src/components/workout/ExerciseDetailSheet.test.tsx`
**What:** Bottom sheet using React Native `Modal` (no new dependency). Shows:

- Exercise name (large)
- Primary + secondary muscle groups (tagged badges)
- Instructions text
- Equipment list
- Progression advice (from `getProgressionAdvice()`) — async, show loading state
- Close button / swipe to dismiss

Uses `Modal` with `animationType="slide"` and `transparent={true}`. Dark overlay + content card at bottom.

**Props:** `visible: boolean`, `exercise: Exercise | null`, `prescription: ExercisePrescription | null`, `progressionAdvice: ProgressionAdvice | null`, `isLoadingAdvice: boolean`, `onClose`

**Test first:** Modal visible/hidden toggling, exercise details render correctly, progression advice displays when available, loading state shows spinner, close button calls onClose.
**Acceptance:** Tests green. Sheet slides up smoothly on device.

---

### Task 5: RestDayCard + TomorrowPreview Components (M)

**Files:** `src/components/workout/RestDayCard.tsx`, `src/components/workout/TomorrowPreview.tsx`, `src/components/workout/RestDayCard.test.tsx`, `src/components/workout/TomorrowPreview.test.tsx`
**What:**

**RestDayCard:** Motivational rest day message using `Card variant="elevated"`.

- Icon (leaf or moon)
- Title: "Rest Day"
- Message: rotating tip from i18n array (stretch, hydrate, sleep, etc.)

**TomorrowPreview:** Shows tomorrow's workout summary.

- Uses `getNextDay()` helper + `dayMapping.get(nextDay)` to find tomorrow
- Shows: workout type badge + exercise count + first 3 exercise names
- If tomorrow is also rest: shows "Rest day tomorrow too"
- Uses existing `Card` component

**Test first:** RestDayCard renders message. TomorrowPreview shows correct exercise count, handles tomorrow-is-rest-day, handles no-plan state.
**Acceptance:** Tests green for both components.

---

### Task 6: WorkoutHeader + Screen Assembly (M)

**Files:** `src/components/workout/WorkoutHeader.tsx`, `app/(tabs)/workout.tsx`
**What:**

**WorkoutHeader:** Title + workout type badge.

- "Today's Workout" / "Rest Day" title
- Badge showing day type (e.g., "Upper A", "Push B") or "Deload" during deload weeks
- Uses mesocycle state for week number display

**Screen Assembly (workout.tsx):** Wire everything together:

1. Read from `useWorkoutStore`: `plan`, `dayMapping`, `mesocycle`, `getTodaysWorkout`, `getProgressionAdvice`
2. `useState` for `selectedDay` (defaults to today)
3. `useState` for `selectedExercise` (for bottom sheet)
4. Layout: WorkoutHeader → WorkoutDayStrip → ScrollView of ExerciseCards → Fixed Button at bottom
5. Rest day: WorkoutHeader → WorkoutDayStrip → RestDayCard → TomorrowPreview
6. No plan state: message + "Generate plan" hint (onboarding must be complete first)
7. "Start Workout" button: `<Button disabled label={t().workout.comingSoon} />`

**Test first:** Screen renders exercise list when plan exists, shows rest day card on rest days, day strip selection changes displayed workout, bottom sheet opens on exercise tap, no-plan state renders correctly.
**Acceptance:** All tests green. Full screen works on device in Hebrew RTL + English LTR.

---

### Task Order & Dependencies

```
Task 1 (i18n + helpers)
  ↓
Task 2 (DayStrip) ──────┐
Task 3 (ExerciseCard) ───┤─→ Task 6 (Header + Assembly)
Task 4 (DetailSheet) ────┤
Task 5 (RestDay + Preview)┘
```

Tasks 2-5 can be built in parallel (independent components), but all depend on Task 1 (strings + helpers). Task 6 wires everything together.

### Estimated Total: ~6 tasks, M overall

### Bottom Sheet Decision: React Native Modal

No `@gorhom/bottom-sheet` installed. Using RN's built-in `Modal` with `animationType="slide"` + dark overlay avoids adding a dependency. If we need gesture-dismiss or snap points later (active session UI), we can add the library then.
