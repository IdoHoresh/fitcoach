# Feature: Onboarding-Critical Components (Tier 2)

**Date:** 2026-04-07
**Status:** Draft
**Phase:** 3, Tier 2

## What

Three reusable input components needed by the onboarding flow: NumberInput (numeric stepper for height/weight/age), OptionSelector (single-choice for goals/experience/sex), and CheckboxList (multi-choice for equipment). Plus i18n strings for all component-level text.

## Why

Phase 4 (Onboarding) requires these input patterns on nearly every screen. Building them as shared components ensures visual consistency, RTL support, haptics, and animations work correctly across all onboarding screens — and they'll be reused in Settings and other screens later.

## Decisions (from brainstorm)

1. **NumberInput: Hybrid + long-press** — +/- stepper buttons, tappable number for direct keyboard entry, long-press accelerates increment. Covers all ranges (age 18-80, weight 40-150, height 140-210).
2. **OptionSelector: Fill change** — selected option gets tinted background (primary at ~15% opacity) + colored border. No checkmark (reserved for multi-select).
3. **CheckboxList: List + select all** — toggleable rows with checkmarks, plus a "select all / clear all" toggle at the top for convenience (equipment list has 8-12 items).

## Requirements

- [ ] All three components use theme tokens only (no hardcoded values)
- [ ] All three components support RTL layout (Hebrew primary)
- [ ] All interactive elements have haptic feedback (light impact)
- [ ] All components have micro-animations (press, select, check)
- [ ] Accessibility labels on every interactive element
- [ ] i18n strings for all user-facing text (he + en)
- [ ] Co-located tests for every component
- [ ] No inline styles — StyleSheet.create only

## Design

### NumberInput

```
Props: {
  label: string
  value: number
  onChangeValue: (value: number) => void
  min: number
  max: number
  step: number
  unit?: string          // e.g., 'kg', 'cm' — from i18n
  error?: string
  testID?: string
}
```

**Layout (RTL-aware):**

```
[label]
[ - ]  [ value unit ]  [ + ]
[error message]
```

**Behavior:**

- Tap +/- to increment/decrement by `step`
- Long-press +/- accelerates (starts at `step`, increases after 500ms)
- Tap the value display to open keyboard for direct entry
- Clamps to min/max range
- Haptic feedback on each step change
- Value display animates between numbers (spring)
- +/- buttons use `useAnimatedPress` for press animation
- Disabled state when at min/max bounds

### OptionSelector

```
Props: {
  options: Array<{
    id: string
    label: string
    icon?: string         // emoji or icon name
    description?: string  // optional subtitle
  }>
  selected: string        // selected option id
  onSelect: (id: string) => void
  layout: 'grid' | 'list'
  testID?: string
}
```

**Layout:**

- `grid`: 2-3 columns of cards (for short labels + icons, e.g., goal picker)
- `list`: full-width rows (for labels + descriptions, e.g., experience level)

**Selected state:**

- Unselected: `surface` background, `border` border color
- Selected: `primary` at 15% opacity background, `primary` border color
- Transition: background color fades, border color changes
- Press animation via `useAnimatedPress`
- Haptic feedback on select

### CheckboxList

```
Props: {
  options: Array<{
    id: string
    label: string
    icon?: string         // emoji or icon name
  }>
  selected: string[]      // array of selected ids
  onToggle: (id: string) => void
  showSelectAll?: boolean // default true
  testID?: string
}
```

**Layout:**

- Full-width rows, each with: [icon?] [label] [checkmark]
- "Select all / Clear all" toggle at top (when `showSelectAll` is true)
- RTL: row direction flips via RTLWrapper

**Selected state:**

- Unselected: `surface` background, empty checkbox
- Selected: `surface` background, `primary` checkmark with spring pop-in animation
- Haptic feedback on toggle
- Press animation on each row

### Data Flow

```
User tap → useAnimatedPress (scale) → triggerHaptic (light) → onChangeValue/onSelect/onToggle → Parent state update → Re-render
```

### Files to Create/Modify

| File                                     | Action | Description                |
| ---------------------------------------- | ------ | -------------------------- |
| `src/components/NumberInput.tsx`         | Create | Numeric stepper component  |
| `src/components/NumberInput.test.tsx`    | Create | NumberInput tests          |
| `src/components/OptionSelector.tsx`      | Create | Single-choice selector     |
| `src/components/OptionSelector.test.tsx` | Create | OptionSelector tests       |
| `src/components/CheckboxList.tsx`        | Create | Multi-choice checkbox list |
| `src/components/CheckboxList.test.tsx`   | Create | CheckboxList tests         |
| `src/components/index.ts`                | Modify | Add new exports            |
| `src/i18n/he.ts`                         | Modify | Add component strings      |
| `src/i18n/en.ts`                         | Modify | Add component strings      |

## Acceptance Criteria

- [ ] NumberInput: tap +/- changes value by step, clamped to min/max
- [ ] NumberInput: long-press +/- accelerates increment
- [ ] NumberInput: tap value opens keyboard for direct entry
- [ ] NumberInput: value animates between changes
- [ ] OptionSelector: tap selects option, deselects previous
- [ ] OptionSelector: grid layout shows 2-3 columns
- [ ] OptionSelector: list layout shows full-width rows
- [ ] OptionSelector: selected state shows tinted fill + primary border
- [ ] CheckboxList: tap toggles individual items
- [ ] CheckboxList: "select all" toggles all items, switches to "clear all"
- [ ] CheckboxList: checkmark pops in with spring animation
- [ ] All components: RTL layout works correctly
- [ ] All components: haptic feedback on interaction
- [ ] All components: accessibility labels present
- [ ] All components: use only theme tokens
- [ ] All components: co-located tests passing
- [ ] i18n strings added for component text (he + en)
- [ ] Barrel export updated in index.ts

## Task Breakdown

1. [ ] NumberInput component + tests (M)
2. [ ] OptionSelector component + tests (M)
3. [ ] CheckboxList component + tests (M)
4. [ ] i18n strings + barrel export update (S)

## Open Questions

None — all resolved in brainstorm.
