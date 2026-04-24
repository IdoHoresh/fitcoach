# FitCoach — Claude Design Project Brief

Paste this at the start of any Claude Design project. Links below assume the repo is connected; if it isn't, upload the referenced files directly.

---

## Project identity

- **Name:** FitCoach (Hebrew brand: גיבור / Gibor)
- **Market:** Israeli App Store — Hebrew-first, RTL-first, monolingual Hebrew primary, English secondary
- **Category:** Science-based macro + workout coaching app
- **Audience:** Beginners who want a plan + intermediates who want a tracker (intent split, not experience split)
- **Stack:** Expo SDK 54, React Native 0.81, TypeScript strict, expo-router, expo-sqlite (local-first)

## Design system — "Clinical Calm"

Teal primary on deep-dark backgrounds. Off-white text. No hard borders — tonal layering instead. Rubik font family (excellent Hebrew + Latin support).

### Colors (from `src/theme/colors.ts`)

| Token                 | Hex                        | Role                             |
| --------------------- | -------------------------- | -------------------------------- |
| `primary`             | `#2DD4BF`                  | Teal — CTAs, active states       |
| `primaryLight`        | `#57F1DB`                  | Hover, highlights                |
| `primaryDark`         | `#14B8A6`                  | Pressed                          |
| `primarySoft`         | `rgba(45, 212, 191, 0.10)` | Indicator halos, chips           |
| `onPrimary`           | `#003731`                  | Text/icons on primary            |
| `success`             | `#34D399`                  | Emerald — on target, completed   |
| `warning`             | `#FBBF24`                  | Amber — attention (never "over") |
| `error`               | `#FB7185`                  | Rose — soft, not alarming        |
| `background`          | `#10141A`                  | Canvas                           |
| `surfaceContainerLow` | `#181C22`                  | Selection cards                  |
| `surface`             | `#1C2026`                  | Cards, panels                    |
| `surfaceElevated`     | `#262A31`                  | Modals, dropdowns                |
| `border`              | `#3C4A46`                  | Subtle teal-tinted outline       |
| `textPrimary`         | `#E5E7EB`                  | Off-white headings               |
| `textSecondary`       | `#9CA3AF`                  | Labels                           |
| `textMuted`           | `#6B7280`                  | Timestamps, hints                |
| `protein`             | `#FB7185`                  | Rose — protein macro             |
| `carbs`               | `#818CF8`                  | Indigo — carbs macro             |
| `fat`                 | `#FBBF24`                  | Amber — fat macro                |

### Typography (from `src/theme/typography.ts`)

- **Font family:** Rubik — `Rubik_400Regular` / `500Medium` / `600SemiBold` / `700Bold`
- **Scale:** 11 / 13 / 15 / 17 / 20 / 24 / 32 (hero) / 48 (display)
- **Line heights:** tight 1.2, normal 1.4, relaxed 1.6

### Spacing (from `src/theme/spacing.ts`)

4pt base scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64

## Hebrew / RTL rules (critical)

- **RTL is framework-level** — the app globally forces `I18nManager.isRTL = true`. Never add `isRTL()` conditionals in components.
- All text defaults to Hebrew. English is a user-settable fallback.
- Mirror layouts automatically via RN's built-in RTL support. Do NOT hand-mirror.
- Icons that are not direction-independent (e.g. back chevron) must use the logical variant, not physical left/right.
- Numbers stay LTR inside RTL text runs (e.g. `125 גר׳`).

## Existing screen inventory (for visual continuity)

### Onboarding (`app/(onboarding)/`)

`welcome` → `body-stats` → `body-fat` → `activity` → `goal` → `experience` → `equipment` → `exercise` → `sleep` → `training-days` → `workout-time` → `calculating` → `result`

### Tabs (`app/(tabs)/`)

`index` (Home), `nutrition`, `workout`, `profile`

## Existing shared components (reuse, don't redesign)

`src/components/` — `Button`, `TextInput`, `Card`, `NumberInput`, `OptionSelector`, `CheckboxList`, `SelectionCard`, `OnboardingLayout`, `StepProgressHeader`, `ProgressBar`, `Icon`, `InfoCallout`, `BottomButtonBar`, `AmbientOverlay`

`src/components/nutrition/` — `MacroGauge` (home), `NutritionCalorieArc`, `NutritionMacroPills`, `FoodSearchSheet`, `FoodItemRow`, `MealSection`, `PortionPicker`, `AdherencePicker`, `MacroTab`, `BarcodeScannerSheet`, `ManualFoodForm`, `DaySelector`, `PreviousMealPill`, `MealEmptyState`

`src/components/workout/` — `ExerciseCard`, `ActiveExerciseCard`, `WorkoutHeader`, `WorkoutDayStrip`, `SetRow`, `RestTimer`, `FloatingRestBubble`, `FinishWorkoutBar`

`src/components/home/` — `HomeHeader`, `TodaysPlanList`, `PlanRow`, `MacroLegend`, `WeekdayStreakStrip`

## Current design assignment: Two-mode meal logging

Full spec: `docs/specs/2026-04-24-two-mode-meal-logging.md`
Research: `docs/research/2026-04-24-macro-app-competitive-research.md`

Two distinct meal-logging experiences chosen at onboarding:

1. **Structured mode (מובנה — "אני רוצה תוכנית")** — per-meal macro targets as guidance (not contracts); guided protein → carbs → fat wizard with multi-pick + slider portion adjustment
2. **Free mode (חופשי — "אני רוצה מעקב")** — daily-only targets; flat log grouped visually by natural time windows (בוקר / צהריים / ערב / לילה); chip-based portion picker

## Invariants — every design decision must honor these 10 rules

1. **No adherence gate** — algorithm adjusts from intake + weight trend only
2. **No shame colors** — no red/orange adherence coloring; over-target renders neutral
3. **Pattern ≠ grade** — surface behavioral patterns as neutral facts, never judgments
4. **Logging verbs always free** — barcode, search, voice, photo never paywalled
5. **No daily-close prompt** — silent rollover; weekly check-in does all reflection
6. **No auto-redistribute across meals** — per-meal targets are guidance, not contracts
7. **Copy variation as retention feature** — ≥10 copy variants per weekly check-in scenario
8. **Partial-logging honesty** — anomalously low days trigger user prompt, not silent deficit
9. **Calorie floor visible + cited** — in Settings UI, not just code
10. **Hebrew-first, RTL framework-level** — no per-component `isRTL()`

## First screen to design (test case)

**Mode-choice onboarding screen** — `app/(onboarding)/mode-choice.tsx` (new, not yet built).

Requirements:

- Side-by-side comparison of Structured vs Free modes
- Intent-framed copy (not experience-framed):
  - Structured: _"אני רוצה תוכנית"_ — sub: _"הדרכה צעד-צעד + יעדים לארוחה"_
  - Free: _"אני רוצה מעקב"_ — sub: _"יעדים יומיים גמישים"_
- Each card shows: 3–4 bullet highlights + a miniature screenshot of the mode's primary surface
- RTL layout — right card is the "first" card
- User taps one; the chosen card animates selection; "המשך" button at bottom enables
- Reuse `SelectionCard` + `BottomButtonBar` patterns from existing onboarding
- Must fit one screen without scroll on iPhone SE 3 and above

## Design handoff rules

- Output React Native (not web React) with TypeScript strict
- Use `@/theme`, `@/components/*` path aliases
- Hebrew strings go in `src/i18n/he.ts`, English in `src/i18n/en.ts` — never inline
- All new logic TDD'd (business logic / algorithms); UI-only work exempt
- No hardcoded colors / font sizes — use theme tokens
- Test file co-located (`Foo.test.tsx` next to `Foo.tsx`)
