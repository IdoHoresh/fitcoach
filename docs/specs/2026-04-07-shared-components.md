# Feature: Shared Components Library

**Date:** 2026-04-07
**Status:** Draft
**Phase:** 3

## What

A set of 10 reusable UI components that every screen in FitCoach will use. Built on top of the existing theme tokens (colors, spacing, typography), with RTL support, haptic feedback, and micro-animations. Variant-based API ensures visual consistency across the entire app.

## Why

Every screen (onboarding, workout, nutrition, progress, settings) needs buttons, inputs, cards, and selectors. Without shared components, each screen would re-implement these patterns — leading to visual inconsistency, duplicate code, and painful updates. Building them once, correctly, means every future screen is faster to build and guaranteed to look right.

## Decisions (from brainstorm)

1. **Priority order:** Onboarding-first (Tier 1 → 2 → 3)
2. **Component granularity:** Specialized components, shared style (not mega-components)
3. **Haptics:** expo-haptics on interactive elements
4. **Animations:** react-native-reanimated for micro-animations (60fps, UI thread)
5. **API style:** Variant-based props mapped to theme tokens

## Requirements

- [ ] All components use theme tokens (no hardcoded colors/spacing/fonts)
- [ ] All components support RTL layout (Hebrew primary)
- [ ] All interactive components have haptic feedback
- [ ] All components have micro-animations (press, select, transition)
- [ ] Variant-based API — fixed set of variants per component
- [ ] Accessibility labels on every interactive element
- [ ] i18n strings for all user-facing text
- [ ] Co-located tests for every component
- [ ] No inline styles — StyleSheet.create or theme tokens only

## Components

### Tier 1 — Foundation

#### 1. RTLWrapper

Layout wrapper that flips `flexDirection` based on `I18nManager.isRTL`.

- Used inside other components (not standalone screens)
- Props: `style`, `children`

#### 2. Button

Primary CTA and actions.

- **Variants:** `primary`, `secondary`, `outline`, `ghost`
- **Sizes:** `sm`, `md`, `lg`
- **States:** default, pressed (scale animation), disabled, loading
- **Props:** `variant`, `size`, `label`, `onPress`, `disabled`, `loading`, `icon?`
- **Haptics:** light impact on press
- **Animation:** scale to 0.96 on press-in, spring back on release

#### 3. TextInput

Free text entry with validation.

- **Props:** `label`, `value`, `onChangeText`, `error?`, `placeholder?`, `keyboardType?`, `secureTextEntry?`
- **States:** default, focused (border color change), error (red border + message)
- **Animation:** smooth border color transition on focus
- **RTL:** text alignment flips automatically

### Tier 2 — Onboarding-critical

#### 4. NumberInput

Numeric entry with +/- stepper buttons.

- **Props:** `label`, `value`, `onChangeValue`, `min`, `max`, `step`, `unit?`, `error?`
- **Haptics:** light impact on stepper tap
- **Animation:** value counter animates between numbers

#### 5. OptionSelector

Single-choice from visual cards/chips.

- **Props:** `options: {id, label, icon?, description?}[]`, `selected`, `onSelect`, `layout: 'grid' | 'list'`
- **Haptics:** light impact on select
- **Animation:** selected option scales up slightly, background color transitions

#### 6. CheckboxList

Multi-choice with checkmarks.

- **Props:** `options: {id, label, icon?}[]`, `selected: string[]`, `onToggle`
- **Haptics:** light impact on toggle
- **Animation:** checkmark pops in with spring animation

#### 7. Card

Container for content sections.

- **Variants:** `default`, `elevated`, `outlined`
- **Props:** `variant`, `children`, `onPress?`
- **Uses:** surface/surfaceElevated colors from theme

### Tier 3 — Post-onboarding

#### 8. ProgressBar

Linear progress indicator + macro ring chart.

- **Props (bar):** `progress` (0-1), `color`, `label?`
- **Props (ring):** `segments: {value, color, label}[]`, `size`
- **Animation:** fills/draws with smooth animation
- **RTL:** bar direction flips, ring stays clockwise

#### 9. StreakCounter

Displays workout streak (week/month view).

- **Props:** `count`, `period: 'week' | 'month'`, `target?`
- **Animation:** count number animates on change

#### 10. WorkoutTimer

Rest countdown between sets.

- **Props:** `duration`, `onComplete`, `isRunning`
- **Animation:** circular progress ring countdown
- **Haptics:** medium impact when timer completes
- **Uses:** restTimer color from theme

## Design

### Architecture

```
src/components/
  shared/
    RTLWrapper.tsx          — layout primitive
    RTLWrapper.test.tsx
  Button.tsx                — primary CTA
  Button.test.tsx
  TextInput.tsx             — free text entry
  TextInput.test.tsx
  NumberInput.tsx           — numeric stepper
  NumberInput.test.tsx
  OptionSelector.tsx        — single-choice
  OptionSelector.test.tsx
  CheckboxList.tsx          — multi-choice
  CheckboxList.test.tsx
  Card.tsx                  — content container
  Card.test.tsx
  ProgressBar.tsx           — linear bar + macro ring
  ProgressBar.test.tsx
  StreakCounter.tsx          — workout streak display
  StreakCounter.test.tsx
  WorkoutTimer.tsx           — rest countdown
  WorkoutTimer.test.tsx
  index.ts                   — barrel export
```

### Data Flow

```
User tap → Animated press handler → Haptic trigger → onPress callback → Parent state update → Re-render with new props
```

### Dependencies to Install

| Package                   | Purpose                             |
| ------------------------- | ----------------------------------- |
| `react-native-reanimated` | 60fps micro-animations on UI thread |
| `expo-haptics`            | Tactile feedback on interactions    |

### Files to Create/Modify

| File                                   | Action | Description                |
| -------------------------------------- | ------ | -------------------------- |
| `src/components/shared/RTLWrapper.tsx` | Create | RTL-aware layout wrapper   |
| `src/components/Button.tsx`            | Create | Button with variants       |
| `src/components/TextInput.tsx`         | Create | Text input with validation |
| `src/components/NumberInput.tsx`       | Create | Numeric stepper input      |
| `src/components/OptionSelector.tsx`    | Create | Single-choice selector     |
| `src/components/CheckboxList.tsx`      | Create | Multi-choice checkboxes    |
| `src/components/Card.tsx`              | Create | Content card container     |
| `src/components/ProgressBar.tsx`       | Create | Linear bar + ring chart    |
| `src/components/StreakCounter.tsx`     | Create | Streak display             |
| `src/components/WorkoutTimer.tsx`      | Create | Rest countdown timer       |
| `src/components/index.ts`              | Create | Barrel exports             |
| `src/i18n/he.ts`                       | Modify | Add component strings      |
| `src/i18n/en.ts`                       | Modify | Add component strings      |
| `babel.config.js`                      | Modify | Add reanimated plugin      |
| `package.json`                         | Modify | Add dependencies           |

## Acceptance Criteria

- [ ] All 10 components render correctly in LTR and RTL modes
- [ ] All interactive components trigger haptic feedback
- [ ] All components have press/transition animations at 60fps
- [ ] All components use only theme tokens (no hardcoded values)
- [ ] All components have accessibility labels
- [ ] All user-facing strings are in i18n (he + en)
- [ ] All components have co-located tests passing
- [ ] Barrel export from src/components/index.ts

## Task Breakdown

1. [ ] Install dependencies (reanimated, haptics), configure babel (S)
2. [ ] RTLWrapper component + tests (S)
3. [ ] Button component + tests (M)
4. [ ] TextInput component + tests (M)
5. [ ] NumberInput component + tests (M)
6. [ ] OptionSelector component + tests (M)
7. [ ] CheckboxList component + tests (M)
8. [ ] Card component + tests (S)
9. [ ] ProgressBar component + tests (M)
10. [ ] StreakCounter component + tests (S)
11. [ ] WorkoutTimer component + tests (M)
12. [ ] Barrel export + i18n strings (S)

## Open Questions

None — all resolved in brainstorm.
