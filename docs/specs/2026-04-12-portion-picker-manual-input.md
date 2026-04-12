# Feature: PortionPicker Manual Gram Input

**Date:** 2026-04-12
**Status:** Approved
**PR:** —

## What

Replace the read-only gram display in `PortionPicker` with an editable `TextInput`. The user can tap the number and type any amount directly, instead of only tapping +/- to step ±10g at a time.

## Why

Typing "250" is faster than pressing + 15 times. Every major nutrition app (MyFitnessPal, Cronometer, MacroFactor, Lose It!) uses tap-to-edit for the portion value. The current stepper-only UX is slow and frustrating for non-round amounts.

## UX Decision

**Inline TextInput, always editable** — the gram number is a `TextInput` styled to look exactly like the current bold display. No mode switching, no modal. The +/- buttons stay for ±10g fine-tuning after typing.

Behaviour on blur / confirm:

- Parse input as integer
- Clamp to minimum 1
- If empty or invalid → restore previous value
- Clear serving chip selection (same as today when stepper is used)

## Scope

Single file change: `src/components/nutrition/PortionPicker.tsx` + its test file.

## Implementation Plan

### Task 1: Replace gram Text with TextInput (S)

**Files:**

- `src/components/nutrition/PortionPicker.tsx`
- `src/components/nutrition/PortionPicker.test.tsx`

**What:**

1. Add local `inputValue` string state (mirrors `grams` as string for controlled input)
2. Replace `<Text style={styles.gramValue}>` with `<TextInput>` — same styles, `keyboardType="numeric"`, `textAlign="center"`
3. `onChangeText` → update `inputValue` (raw string, no parse yet)
4. `onBlur` → parse int, clamp ≥ 1, set `grams` + `inputValue`, clear serving chip
5. Keep stepper handlers — they update both `grams` and `inputValue`
6. On serving chip select → update both `grams` and `inputValue`

**Test first (RED → GREEN):**

```
it('allows typing a custom gram value directly', () => {
  // fireEvent.changeText on gram input → value updates
  // fireEvent.blur → clamped value persisted
})

it('clamps to 1 when invalid or empty input on blur', () => {
  // fireEvent.changeText('') → fireEvent.blur → grams = 1
})

it('stepper still works after manual input', () => {
  // type 200, blur → increment → 210
})
```

**Acceptance:**

- User can type any number in the gram field
- Macros update in real time as user types (if valid) or on blur
- Invalid/empty input snaps to 1 on blur
- Stepper still works
- Serving chips still work (and reset the text input value)
- All existing tests pass + new tests pass
