# Velocity

Calendar-vs-engineering ratio per Phase. Receipts only — no editorialising.

This file exists because the original 27-week launch budget (TASKS.md:521) cited a "Claude Code 2–3× productivity multiplier" with no measurement. Without a tracking artifact the multiplier is a wish; with one it is either confirmed or refuted as we go.

## Phase 1 — 2026-04-28 → 2026-05-10 (planned 2w)

| Field                                                           | Value                                                                                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar elapsed                                                | 13 days                                                                                                                                                                                                        |
| Engineering days                                                | ~3.5 (2026-04-30: PR #89 stub + PR #90 slider, stacked, both same day; then idle 2026-04-30 → 2026-05-10)                                                                                                      |
| Tasks shipped                                                   | A1 merged (PR #88, 2026-04-25). A2 unmerged: PR #89 (parent) + PR #90 (slider, stacked on #89), neither against `main` — `gh pr view 90 --json statusCheckRollup` returned `[]` on 2026-05-10. A3 not started. |
| Ratio (eng days / calendar days)                                | ~0.27                                                                                                                                                                                                          |
| Working-week-equivalent                                         | ≈0.5× of focused-week velocity (cited anecdotes were focused-weeks, not 15–20h/week — see TASKS.md:521 vs Preppr 2w / Claude Cowork 10d)                                                                       |
| TASKS.md:521 claim ("Claude Code 2–3× productivity multiplier") | Not supported by this row.                                                                                                                                                                                     |

## Phase 2 — was 2026-05-11 → 2026-06-07; revised earliest start 2026-05-18

| Field                  | Value                                                                                                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original start         | 2026-05-11 (TASKS.md:530)                                                                                                                                                                                                                                                                   |
| Pre-Phase-2 gates      | (1) PR #89 manual test plan walked with output, merged. (2) PR #90 rebased on `main`, CI run, manual test plan (11 items) walked, merged. (3) Invariant-cleanup PRs merged: see `docs/specs/2026-05-10-invariant-cleanup.md` for the three-PR scope.                                        |
| Revised earliest start | 2026-05-18                                                                                                                                                                                                                                                                                  |
| Calendar slip vs plan  | ≥1 week.                                                                                                                                                                                                                                                                                    |
| Sizing implication     | At ~0.5× working-week ratio, Phase 2 (B+C+G) in 4 calendar weeks is structurally underbudgeted (Track A bundle = 1 L + 2 M + 1 S took 2 calendar weeks of engineering; B+C+G = 4 L + 7 M + 3 S, ~3× the size). Either Track G moves to Phase 5 or the Nov 1 launch slips. Decision pending. |

## P0.1 — gold-list audit log

**Status: deferred without date commit.** No `docs/p0-gold-list.md` at HEAD as of 2026-05-10. Trajectory cited in TASKS.md:547 ("10–15 foods/week × ~25 weeks = 300 by beta") requires row 1 logged by week 1 of Phase 1; week 2 of 27 has zero rows.

**§4.3 risk acknowledged:** "Separate session" without a date is the same deferral pattern as TASKS.md:705 (Tiv Taam Phase 2 follow-up scheduled 2026-04-23 → 17 days unrun as of 2026-05-10). Naming it here, not hiding it.

**Kill condition (when committed):** cumulative audited foods at week N < 10×N → escalate to part-time dietitian OR shrink gold list to 100 items + composite-only and disclose curation in App Store description.

## Known coverage gaps (not blockers; tracked here to prevent §4.3 deferral)

### Retail-anchor regression coverage — `SERVING_TICKS` (PR #89 / Track A2)

**Status (2026-05-10):** 2 of 20 foods have retail-anchor regression tests:

- `greek_yogurt_0pct` — 150g גביע primary tick + negative anchor against the non-existent 200g cup (`src/data/serving-ticks.test.ts`, commit `f30f643`)
- `cottage_5pct` — 250g גביע primary tick (Tnuva גביע retail size)

**Remaining 18 foods** are verified at PR review by the code-reviewer agent only — NOT regression-protected. The 4 should-fixes the agent caught at PR #89 review (oats 90g, almonds count-labels, cottage 375g gap, chicken portion-qualifier alignment) would not have failed the existing test suite if the values had been wrong.

**Why it matters:** if a future PR edits `serving-ticks.ts` and reverts an Israeli-retail anchor by accident, the structural-integrity tests pass and the regression ships unless someone reads the diff carefully or the agent runs again.

**§4.3 risk acknowledged:** logging this gap here does NOT close it. Naming the gap in writing prevents the silent-deferral pattern but does not substitute for the work.

**Resolution path (when scheduled):** one follow-up PR adds retail-anchor tests for the remaining 18 foods (~1 hour, mostly mechanical: assert each entry's primary tick(s) match the source-of-truth comment in `serving-ticks.ts`). Schedule TBD — to avoid §4.3, this row gets a date commit before Phase 2 ends or it gets explicitly accepted as "not adding coverage; remaining 18 foods stay review-time-only forever," in writing.

## Discipline

- Update this file at the end of every Phase, not retrospectively at Phase 5.
- Row format: planned weeks, calendar elapsed, engineering days, tasks shipped, ratio.
- Ratio <0.5 for two consecutive Phases triggers re-baselining the launch date in writing — not "see how it goes."
