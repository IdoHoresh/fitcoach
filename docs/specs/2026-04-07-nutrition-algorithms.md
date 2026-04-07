# Feature: Nutrition Algorithms

**Date:** 2026-04-07
**Status:** Draft
**Depends on:** PR #4 (nutrition foundation), PR #5 (nutrition repositories)

## What

Three pure algorithm modules that power FitCoach's nutrition system: distributing daily macros across meals, generating weekly meal plans from Israeli food templates, and recalibrating targets based on weekly weigh-in trends.

## Why

The macro calculator already computes daily targets (e.g., 2288 kcal, 198g P / 90g F / 172g C). But users need actionable meals, not raw numbers. These algorithms bridge the gap: "here's what to eat for lunch" instead of "eat 198g protein today." Weekly recalibration keeps targets accurate as the user's body adapts.

## Requirements

- [ ] Distribute daily macros across 3-6 meals with even protein distribution
- [ ] Shift carbs to pre/post-workout meals on training days (5-6 meal plans only)
- [ ] Generate 7-day meal plans using existing templates + food DB
- [ ] Scale template portions uniformly to hit per-meal macro targets (±5%)
- [ ] Recalibrate weekly: compare weight trend to expected change, adjust ±100-300 kcal
- [ ] Respect calorie floors (1500M / 1200F), minimum weeks, and logging adherence
- [ ] Return coach message keys (i18n) for all recalibration outcomes
- [ ] All functions are pure (no side effects, no DB calls, no state)

## Design

### Key Decisions

1. **Protein distribution:** Even split across meals (leucine threshold ~30-40g/meal for MPS). Calories/carbs/fat follow proportional distribution from `MEAL_CALORIE_DISTRIBUTION` constants.
2. **Template scaling:** Uniform scaling (all scalable items by same factor). If scaled result exceeds ±5% tolerance, pick a different template.
3. **Insufficient data:** Return `log_more` action with coach message, keep targets unchanged. No guessing from incomplete data.
4. **Training-day carb shift:** Only for 5-6 meal plans that have pre/post-workout slots. Take 15% of daily carbs from other meals, add to workout meals. 3-4 meal plans: no shifting.

### Architecture

```
macro-distributor.ts          ← splits daily targets into per-meal targets
        ↓
meal-plan-generator.ts        ← picks templates, scales portions, assembles 7-day plan
        ↓
weekly-recalibration.ts       ← analyzes weight trend, adjusts targets

All consume: constants.ts, types/nutrition.ts
Meal plan generator also consumes: foods.ts, meal-templates.ts
```

### Data Flow

**Meal plan generation:**

```
Daily macros (from macro-calculator)
  → macro-distributor: split into per-meal targets
  → meal-plan-generator: for each day, for each meal:
      1. Filter templates by meal type
      2. Score templates by macro proximity
      3. Pick best, scale portions uniformly
      4. If no template fits within tolerance → per-food assembly for snacks
  → Return MealPlan (7 days × N meals)
```

**Weekly recalibration:**

```
Weekly avg weight + previous avg weight + goal + current targets + sex
  → weekly-recalibration:
      1. Check minimum weeks and adherence threshold
      2. Calculate weight change vs expected range
      3. Determine action (stay_course / increase / decrease / log_more)
      4. Calculate calorie adjustment (±100-300 kcal in 100 kcal steps)
      5. Recalculate protein/fat/carbs from new calorie target
  → Return RecalibrationResult
```

### Files to Create/Modify

| File                                          | Action | Description                                               |
| --------------------------------------------- | ------ | --------------------------------------------------------- |
| `src/algorithms/macro-distributor.ts`         | Create | Per-meal macro distribution + training-day carb shift     |
| `src/algorithms/macro-distributor.test.ts`    | Create | Tests for all meal counts, training/rest days, edge cases |
| `src/algorithms/meal-plan-generator.ts`       | Create | Template matching, scaling, 7-day plan assembly           |
| `src/algorithms/meal-plan-generator.test.ts`  | Create | Tests for plan generation, scaling, fallback behavior     |
| `src/algorithms/weekly-recalibration.ts`      | Create | Weight analysis, calorie adjustment, coach messages       |
| `src/algorithms/weekly-recalibration.test.ts` | Create | Tests for all recalibration scenarios                     |
| `src/i18n/he.ts`                              | Modify | Add coach message strings (Hebrew)                        |
| `src/i18n/en.ts`                              | Modify | Add coach message strings (English)                       |

### Key Interfaces

```typescript
// macro-distributor.ts
interface MealMacroTarget {
  mealType: MealType
  calories: number
  protein: number
  fat: number
  carbs: number
}

function distributeMacros(
  dailyCalories: number,
  dailyProtein: number,
  dailyFat: number,
  dailyCarbs: number,
  mealsPerDay: MealsPerDay,
  isTrainingDay: boolean,
): MealMacroTarget[]

// meal-plan-generator.ts
function generateMealPlan(
  dailyTargets: { calories: number; protein: number; fat: number; carbs: number },
  trainingDays: number[], // 0=Sun..6=Sat
  mealsPerDay: MealsPerDay,
  foods: FoodItem[],
  templates: MealTemplate[],
): MealPlanDay[]

// weekly-recalibration.ts
function calculateRecalibration(
  currentAvgWeight: number,
  previousAvgWeight: number,
  weekNumber: number,
  adherenceRate: number, // 0-1 (days logged / 7)
  currentTargetCalories: number,
  goal: TrainingGoal,
  sex: BiologicalSex,
  currentWeight: number, // for macro recalculation
  currentHeight: number,
  bodyFatPercent?: number,
): RecalibrationResult
```

## Acceptance Criteria

- [ ] `distributeMacros` returns correct targets for 3, 4, 5, and 6 meals/day
- [ ] Protein is distributed evenly (±2g variance per meal)
- [ ] Training-day carb shift moves 15% carbs to pre/post-workout (5-6 meals only)
- [ ] `generateMealPlan` produces valid 7-day plans with real food items
- [ ] Template portions scale uniformly; total macros within ±5% of targets
- [ ] Plan uses variety (no identical meals every day where templates allow)
- [ ] `calculateRecalibration` returns `log_more` when adherence < 60% or week < 2
- [ ] Fat loss: too slow → decrease calories; too fast → increase calories
- [ ] Muscle gain: not gaining → increase calories; gaining too fast → decrease
- [ ] Calorie adjustments in 100 kcal steps, max 300 kcal, respect floor (1500M/1200F)
- [ ] All functions are pure — no side effects, deterministic given same inputs
- [ ] All coach message keys map to i18n strings in he.ts and en.ts

## Task Breakdown

1. [ ] Macro distributor + tests (S)
2. [ ] Meal plan generator + tests (L)
3. [ ] Weekly recalibration + tests (M)
4. [ ] i18n coach messages (S)

## Open Questions

None — all decisions resolved during brainstorm.
