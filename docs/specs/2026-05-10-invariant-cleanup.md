# Invariant Cleanup — #1, #6, #3 violations on `main`

**Date:** 2026-05-10
**Status:** Draft for review. Precedes 3 cleanup PRs (Phase 2 prerequisite per `docs/velocity.md`).
**Parent spec:** `docs/specs/2026-04-24-two-mode-meal-logging.md`
**Trigger:** External red-team review §3.3 (2026-05-10) found shipped code on `main` violates Invariants #1 + #6 declared binding by parent spec.

## §4.7 acknowledgment (process artifact, not blame)

The parent spec, dated 2026-04-24, declares ten invariants as binding, including:

- **Invariant #1** — "algorithm adjusts from intake + weight trend only — never from self-reported compliance"
- **Invariant #6** — "no auto-redistribute of a meal's deficit/surplus across remaining meals"
- **Invariant #3** — "pattern ≠ grade — strings describe what happened, never how well"

Code violating those invariants was committed on `main` on 2026-04-15 (9 days before the parent spec was written). At the time the parent spec was written, no rip-out plan was drafted, and no entry in the codebase or in `TASKS.md` named the divergence. Every `/review` since then has been measured against an aspirational baseline.

This is the §4.7 pattern of the meta-review: framing escalation between rounds without new evidence — the parent spec retconned existing code into "non-negotiable" without naming the cleanup work.

This spec is the missing artifact. It does not assign motive (forgot vs. knew); the fix is the same either way. The forward discipline rule (below, codified in `.claude/rules/workflow.md`) prevents recurrence.

## Evidence table (per-file verdicts with line citations)

All paths and line numbers verified at HEAD on `main` 2026-05-10. "Wired / dead" classifications were confirmed by grep on non-test consumers; output preserved in this branch's PR description for audit.

| File                                                  | Lines     | Actual function                                                                                                                                                                                               | Invariant touched                                                       | Wired?                                                                                                                                                                                                                                                                                  | Verdict             |
| ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `src/algorithms/redistribute-deficit.ts`              | 1–134     | Pure fn. Computes how to redistribute a meal's macro deficit/surplus across remaining unfilled meals after user marks adherence; emits toast when adjustment >5 g macro / >50 kcal.                           | #6 — direct violation. The file exists for the prohibited operation.    | Imported + invoked in `src/stores/useNutritionStore.ts:40,41,395` (inside `setMealAdherence`). `setMealAdherence` itself has zero non-test callers — chain is dead-code-by-transitivity but live in-source.                                                                             | **RIP**             |
| `src/algorithms/weekly-recalibration.ts` (gate)       | 181–184   | Refuses to recalibrate when `adherenceRate < MIN_ADHERENCE_FOR_RECALIBRATION`; returns `log_more` instead of adjusting calories.                                                                              | #1 — depends on what `adherenceRate` actually represents.               | Wired. Caller `src/stores/useNutritionStore.ts:611` computes `adherenceRate = dailySummaries.length / daysInWindow`. **That is logging-density, not user-reported compliance.**                                                                                                         | **RENAME, not rip** |
| `src/i18n/en.ts:529`, `src/i18n/he.ts:530`            | n/a       | Recalibration `log_more` user-facing copy. EN: "Not enough data this week. Try to weigh yourself and log food more consistently." HE: "אין מספיק נתונים השבוע. נסה לשקול את עצמך ולתעד אוכל באופן עקבי יותר." | #1 + #3 — "more consistently" / "באופן עקבי יותר" is a compliance verb. | Wired via `getCoachMessageKey` → user-visible weekly check-in.                                                                                                                                                                                                                          | **REWRITE COPY**    |
| `src/algorithms/streak.ts`                            | 1–96      | Pure fn. Counts completed **workout** sessions per Sunday-start week against a weekly goal.                                                                                                                   | None of the meal-logging invariants. Workout domain.                    | Wired (Home-screen workout streak).                                                                                                                                                                                                                                                     | **KEEP**            |
| `src/components/StreakCounter.tsx`                    | 1–119     | UI primitive — flame badge + dot row for workout-streak count.                                                                                                                                                | None — workout domain.                                                  | Wired.                                                                                                                                                                                                                                                                                  | **KEEP**            |
| `src/types/nutrition.ts:64–71` (`MealAdherence` type) | 64–71     | Stored record: `accurate` / `roughly` / `not_accurate`.                                                                                                                                                       | #1 — depends on consumers.                                              | Used by `src/security/validation.ts:246` schema, `src/db/nutrition-repository.ts:660–715`, `src/stores/useNutritionStore.ts` (`setMealAdherence` action, `dateAdherence` state, `getAdherenceForDate`). Zero non-test JSX consumers; zero history/journal screens read `dateAdherence`. | **RIP whole chain** |
| `src/components/nutrition/AdherencePicker.tsx`        | full file | UI prompt asking the user to rate adherence level.                                                                                                                                                            | #1 — active behavior-judgment input.                                    | Zero render sites anywhere in `src/` or `app/` (defined but never rendered).                                                                                                                                                                                                            | **RIP**             |

**Note on dead code:** Although `redistribute-deficit` and the `MealAdherence` chain are dead-code-by-transitivity (no UI calls them), removal is still required for two reasons. (a) The code on `main` creates the §3.3 contradiction the cleanup must resolve. (b) Per the §3.3 medium finding, negative invariants regress silently without explicit absence tests — leaving the source in place lets a future PR rewire it with no test failing. The CI grep tests below close that loop.

## Three cleanup PRs (ordered, independently reviewable)

Each PR has a distinct scope, distinct test plan, and independent risk profile. A single 200-line bundled PR would lose the audit trail.

### PR-Cleanup-1 — rip `redistribute-deficit` algorithm + store call

**Delete:**

- `src/algorithms/redistribute-deficit.ts`
- `src/algorithms/redistribute-deficit.test.ts`
- Re-export at `src/algorithms/index.ts:74,75`

**Edit:**

- `src/stores/useNutritionStore.ts:40,41,395` — remove imports + the `computeRedistribution` invocation; remove the toast wiring tied to its return values (`toastMacro`, `toastAmount`, `toastMealName`).

**Add:**

- A CI grep test (preferred location: `scripts/check-no-redistribute.sh` invoked from the test job, or a jest test that shells out): `grep -rE 'redistributeDeficit|computeRedistribution|redistribute-deficit' src/ app/` must return zero non-test matches.

**Out of scope:** `MealAdherence` chain (PR-Cleanup-2), `weekly-recalibration` rename (PR-Cleanup-3).

**Test plan:**

- [ ] `npm run lint`, `npm run typecheck`, `npm test` clean.
- [ ] CI grep test passes.
- [ ] CI green on `main` after rebase.
- [ ] Manual smoke on Simulator (`dev`): meal-log flow shows no redistribute toast and no crash on meal close.

### PR-Cleanup-2 — rip `MealAdherence` chain (type, schema, table, repository, store, picker, i18n)

**Delete:**

- `src/components/nutrition/AdherencePicker.tsx` and any test file beside it.
- `MealAdherence`, `AdherenceLevel` from `src/types/nutrition.ts:62–71`; remove the re-export at `src/types/index.ts:48`.
- `mealAdherenceSchema` from `src/security/validation.ts:246`.
- `MealAdherenceRow`, `rowToMealAdherence`, `MealAdherenceRepository`, `mealAdherenceRepository` export at `src/db/nutrition-repository.ts:660–715` and the re-export in `src/db/index.ts:11`.
- `setMealAdherence` action, `getAdherenceForDate` flow, `dateAdherence` state field in `src/stores/useNutritionStore.ts`.
- i18n strings under `t().nutrition.adherence` in `src/i18n/he.ts` + `src/i18n/en.ts`.

**Migration:**

- Drop the `meal_adherence` table (confirm exact name in `src/db/schema.ts` / migration files when authoring the PR).
- Existing user data: none in any prod path, since the chain has zero non-test callers — note this explicitly in the commit message and PR description so the migration's lack of data-preservation logic is not a hidden assumption.

**Add:**

- CI grep test: `grep -rE 'MealAdherence|mealAdherence|AdherencePicker|setMealAdherence|getAdherenceForDate' src/ app/` must return zero non-test matches.

**Out of scope:** PR-Cleanup-1 and PR-Cleanup-3 work.

**Test plan:**

- [ ] `npm run lint`, `npm run typecheck`, `npm test` clean.
- [ ] CI grep test passes.
- [ ] Migration runs cleanly on a fresh Simulator install (Simulator → Device → Erase All Content → relaunch).
- [ ] CI green on `main` after rebase.

### PR-Cleanup-3 — rename `adherenceRate` → `loggingDensity` + rewrite `log_more` copy

**Rename (logic unchanged):**

- `src/algorithms/weekly-recalibration.ts` — parameter `adherenceRate` and all internal references → `loggingDensity`. The formula in the caller (`dailySummaries.length / daysInWindow`) does not change.
- `src/data/constants.ts` — `MIN_ADHERENCE_FOR_RECALIBRATION` → `MIN_LOGGING_DENSITY_FOR_RECALIBRATION`. Citation in the constant's JSDoc unchanged; only the name moves.
- `src/stores/useNutritionStore.ts:611,616` — pass `loggingDensity` to `recalibrate`.
- All affected tests in `src/algorithms/weekly-recalibration.test.ts`.

**Add comment** near the gate in `weekly-recalibration.ts`:

> This is a data-quality gate (do we have enough log entries to trust the trend), not a compliance gate. Per Invariant #1, the recalibration must never refuse to adjust based on self-reported compliance level — only on whether the input data is statistically sufficient.

**Rewrite copy:**

- `src/i18n/en.ts:529` → `"Not enough data this week — need more weight and food entries to calibrate."`
- `src/i18n/he.ts:530` → `"אין מספיק נתונים השבוע — דרושים יותר רישומי משקל ומזון לכיול."`

**Verify:** no `recalibration.*` i18n string contains "consistently" / "consistent" / "compliance" / "עקבי" / "עקביות" / behavior verbs after this PR.

**Test plan:**

- [ ] `npm run lint`, `npm run typecheck`, `npm test` clean.
- [ ] Existing recalibration tests still green after rename (no logic change → no behavior change).
- [ ] CI green on `main` after rebase.
- [ ] Manual smoke (`dev`): trigger `log_more` path by seeding fewer than `MIN_LOGGING_DENSITY_FOR_RECALIBRATION` daily summaries; verify the new copy renders in the weekly check-in card and the old copy is gone.

## Discipline rule (forward — codified in `.claude/rules/workflow.md`)

> **No binding invariant language in any spec without a linked rip-out PR or a written exemption.**
>
> "Binding," "non-negotiable," "must," "always," and equivalent absolutes can appear in a spec **only if**:
> (a) the codebase already complies, OR
> (b) the spec links to an open-or-merged PR that brings the codebase into compliance, OR
> (c) the spec contains a written exemption naming the specific divergence and its scheduled fix.
>
> The parent spec violated condition (a) without (b) or (c). The rule is the structural fix; this cleanup is the immediate fix.

## Verification before each cleanup PR merges

For each of PR-Cleanup-1, -2, -3:

- [ ] `gh pr view N --json statusCheckRollup` returns SUCCESS against `main` (not a stacked branch).
- [ ] `npm run lint`, `npm run typecheck`, `npm test` pass locally **and** in CI.
- [ ] Manual test plan walked with output shown per `.claude/rules/workflow.md` step 18 — no batch-checking.
- [ ] CI grep test (PR-Cleanup-1 and -2) returns zero non-test matches.

When all three merge:

- [ ] `docs/velocity.md` Phase-2 row updated with actual cleanup-PR merge dates.
- [ ] `TASKS.md` notes invariant cleanup as Phase 2 prerequisite, completed.
- [ ] Phase 2 engineering may begin (B1 = "no adherence gate" can now be built against a compliant baseline).
