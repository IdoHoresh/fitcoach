# Feature: Two-Mode Meal Logging (Structured + Free)

**Date:** 2026-04-24
**Status:** Draft (research-informed revision 2026-04-24)
**Research:** [docs/research/2026-04-24-macro-app-competitive-research.md](../research/2026-04-24-macro-app-competitive-research.md)
**GitHub Issue:** TBD

## What

FitCoach ships two distinct meal-logging experiences the user picks between during onboarding (and can toggle anytime in settings):

1. **Structured mode (מובנה — "אני רוצה תוכנית")** — per-meal macro targets as guidance (not contracts), step-by-step guided flow (protein → carbs → fat) with multi-pick + slider portion adjustment. For users who want a plan.
2. **Free mode (חופשי — "אני רוצה מעקב")** — daily-only targets, flat log grouped visually by natural time windows (בוקר / צהריים / ערב / לילה), chip-based portion picker. For users who want a tracker.

Both modes share the same underlying engine (adaptive TDEE, Israeli food DB, weekly check-ins) but differ fundamentally in whether meal structure exists. **The split is intent, not experience level** — beginners can want a tracker; power users can want a plan.

## Why

Deep research across RP Diet Coach, MacroFactor, MyFitnessPal, and Carbon (2026-04-24) surfaced: RP's rigid prescription churns at first social event; MacroFactor's flexibility loses beginners; MFP has no adaptive algorithm; Carbon's adherence-gated algorithm is a mechanical flaw. **No competitor ships adherence-neutral + warm-coaching + Hebrew + Israeli food DB** — that is our wedge.

A post-brainstorm review flagged a philosophical conflict in an earlier design (auto-redistribute across meals contradicted adaptive TDEE). Research confirms: Structured uses per-meal targets as **guidance, not contracts** (no automatic redistribute); Free has no meals to redistribute across; the weekly algorithm does real correction.

## Invariants (non-negotiable — every PR must honor)

These rules span all tracks and all future PRs. `/review` must block any PR that violates one.

1. **No adherence gate.** Adaptive algorithm adjusts from intake + weight trend only — never from self-reported compliance. Carbon's gate is the flaw we reject.
2. **No shame colors.** No red/orange adherence coloring. Over-target gauge renders neutral, not alarming. RP's grading is the cycle we reject.
3. **Pattern ≠ grade.** Surface behavioral patterns as neutral facts (_"רשמת 5/7 ימים"_) never as judgments (_"רשום היטב"_). This rule is tonally fragile; every copy change near adherence needs explicit review.
4. **Logging verbs always free.** Barcode, search, voice, photo, recents, scan — never paywalled. MFP's barcode paywall destroyed its brand. Paywall goes on coaching depth, planning, and premium data.
5. **No daily-close prompt.** No "if every day were like today" projection, no EOD nag, no daily summary. Silent rollover. Weekly check-in does all reflection.
6. **No auto-redistribute across meals.** Per-meal targets are guidance. "Remaining today" gauges are passive display, not redistribution prompts.
7. **Copy variation as retention feature.** Every weekly-check-in scenario ships ≥10 copy variants so users don't sense determinism (Carbon's month-2 failure mode). Hard-coded single strings at copy-review time = reject.
8. **Partial-logging honesty.** Anomalously low days must trigger the "האם חסר לרשום?" prompt before contributing to adaptive calc. Never silently treat a forgotten day as a deficit.
9. **Calorie floor is visible and cited.** Floor value + research citation + opt-in low-floor flow present in Settings UI, not just in code.
10. **Hebrew-first, RTL framework-level.** No per-component `isRTL()` conditionals. All new strings in `i18n/he.ts` + `i18n/en.ts`.

## Requirements

### Shared across both modes

- [ ] Per-user mode preference stored in user profile; default based on onboarding choice
- [ ] Mode toggle in Settings (takes effect next meal, not mid-meal)
- [ ] Adaptive TDEE weekly adjustment (20-day EWMA trend-weight; two-step cadence — week 1 tentative, week 2 confirmed, week 3 full; dynamic maintenance near goal; user-settable calorie floor with research-cited copy)
- [ ] Adherence-neutral engine: algorithm adjusts from intake + weight trend only, never from self-reported compliance (Invariant #1)
- [ ] Weekly Hebrew conversational check-in (3 screens; ≥10 copy variants per scenario; neutral tone)
- [ ] **Partial-logging detection module** — anomalously low days (<50% of trend-average intake) trigger "האם חסר לרשום?" prompt; flagged days excluded from adaptive calc (MacroFactor pattern, Invariant #8)
- [ ] **Pause mode ("הפסקה")** — 3–14 day vacation/illness flag; preserves trend weight; freezes algorithm updates; gap across all 4 competitors
- [ ] **Menstrual cycle flag** (female users) surfaced in weekly check-in; algorithm smooths more aggressively during flagged week
- [ ] **Shabbat / holiday day flag** — optional; logs normally but excluded from adaptive calc
- [ ] **Restaurant meal handling** — "מסעדה" tag + confidence-slider estimate + brand search fallback
- [ ] Weekly trend mini-card on Home (secondary surface below daily gauge) — adaptive TDEE needs weekly context
- [ ] Israeli food DB (already seeded: `sh_`, `rl_`, `tt_`, `raw_`, `manual_`)
- [ ] Gold list of ~300 foods dietitian-verified (data accuracy gate for v1)
- [ ] **15–20 pre-built Israeli composite dishes** as first-class DB entries: סביח, שקשוקה, שווארמה, בורקס, מלאווח, חומוס בול, פלאפל צלחת, פסטה בולונז, פיצה משולש, ארוחת שבת, פיתה נקניק, טוסט גבינה, כריך, מוזלי, יוגורט גרנולה (final list per user-test in Open Questions)
- [ ] Cooked/raw toggle on meats + grains; data model already supports this
- [ ] Grams as source of truth; all macro math from float values, integer display
- [ ] User error-reporting link on every food entry
- [ ] Logging verbs (barcode/search/voice/photo/recents) always free — never behind paywall (Invariant #4)

### Structured mode

- [ ] Per-meal macro targets calculated from daily macros + training time + goal (`computeMealTargets` already shipped in PR #42)
- [ ] Training-time macro shaping (carbs concentrated pre/post-workout, fat away)
- [ ] Meal count 3–6, settable per day-type (training vs rest)
- [ ] Optional snack slots (0–2)
- [ ] User can reorder meals freely (no "largest meal last" lock)
- [ ] Guided flow per meal: 3 steps (protein → carbs → fat) with skip + escape hatches
- [ ] Each step: multi-pick screen → slider-adjust screen
- [ ] Multi-food slider auto-allocates portions to sum to step target
- [ ] Single-food default = food's natural serving size (not macro-math)
- [ ] Slider dual labels: `125 גר׳ · ½ גביע` on tick; `≈ 0.6 חזה עוף · 70 גר׳` between ticks
- [ ] Quick-tap portion pills above slider (`½ חזה`, `1 חזה`, `1½ חזה`)
- [ ] Hand-portion visual icon next to grams
- [ ] Haptic buzz at natural-unit snaps, medium buzz at macro cap
- [ ] Summary screen with bars + supplement suggestions if gap remains
- [ ] "מנה שלמה" escape hatch (jumps to direct search for mixed dishes — sabich, shakshuka)
- [ ] Kosher/dietary filters applied to food suggestions per step

### Free mode

- [ ] Daily calorie + macro target visible on Home gauge
- [ ] No meal cards, no per-meal targets, no "next meal" prompts
- [ ] Flat daily food log **grouped visually by natural time windows** (בוקר / צהריים / ערב / לילה) — soft grouping for the brain, not hard meal slots; entries still timestamped by add time
- [ ] Chip-based portion picker (natural-unit chips + custom gram entry)
- [ ] Each chip displays gram weight + macro contribution + calories
- [ ] Tap chip = logged instantly (single-tap commit)
- [ ] Custom amount via `✏ כמות מותאמת` keyboard input
- [ ] Cooked/raw toggle per food type
- [ ] Passive "remaining today" gauge — display only, never a redistribute prompt (Invariant #6)
- [ ] Training-time carbs soft tip surfaced as a Home notification, not a meal slot (Free-mode equivalent of Structured's peri-workout macro shaping)

### Onboarding

- [ ] 8–10 conversational Hebrew screens for profile inputs (sex, age, height, weight, body-fat via illustration picker, activity, goal, rate)
- [ ] Mode choice screen with side-by-side screenshot comparison (Structured vs Free)
- [ ] **Intent-framed copy** (not experience-framed): _"אני רוצה תוכנית"_ (Structured) vs. _"אני רוצה מעקב"_ (Free). Beginners can legitimately pick either.
- [ ] Practice meal after mode pick, in the chosen mode
- [ ] **14-day trial, paywall after first weekly check-in** — user experiences one full adaptive-TDEE cycle + Hebrew coach warmth before any pricing decision
- [ ] Mode can be changed anytime from settings

### Weekly check-in design

- [ ] Cadence: weekly, **Friday evening** (Shabbat = natural Israeli weekly reset); user can defer to Saturday/Sunday
- [ ] Inputs: trend weight (auto from HealthKit), menstrual flag (female users), 3-emoji reflection (hunger / energy / consistency — data, not grade)
- [ ] 3 screens: **Trend** (graph + Hebrew explanation) → **Recommendation** (action + reason) → **Decision** (accept / switch to maintenance / keep as-is)
- [ ] **Copy-variation system (v1 gate)**: data-driven copy table, not inline strings; ≥10 variants per scenario (on-track / plateau / fast-loss / slow-loss / over-target-week / under-target-week / first-check-in / post-pause / post-cycle-week / skipped-weigh-in)
- [ ] **No adherence gate**: algorithm adjusts on intake + weight trend regardless of self-reported consistency (Invariant #1)
- [ ] **Empathy branches**: bad week → warm acknowledgment, not shame; plateau → curiosity frame; fast loss → safety concern with floor reminder
- [ ] Pattern surfacing as neutral facts, never grades (Invariant #3): _"רשמת 5 מתוך 7 ימים. סופי שבוע נוטים לעלות 400 קל׳ — דפוס שלך."_
- [ ] Skip-weigh-in tolerance: use last trend; no algorithm break if user defers weigh-in

## Design

### Architecture

**Shared infrastructure (no change):**

- `src/algorithms/` — TDEE, macro distribution, `computeMealTargets`
- `src/db/` — food DB, `FoodRepository`, `MealAdherence`
- `src/stores/useNutritionStore` — daily log, plan state
- `src/services/open-food-facts.ts` — OFF enrichment
- `src/security/validation.ts` — Zod schemas
- `src/shared/normalizeFoodName.ts`, `normalizeEan.ts` — pure helpers

**New / modified:**

| Area                                                    | Change                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `useUserStore`                                          | Add `mealLoggingMode: 'structured' \| 'free'` field + migration   |
| `UserProfile` type                                      | Extend with mode preference                                       |
| `app/(onboarding)/mode-choice.tsx`                      | New onboarding screen (screenshot comparison)                     |
| `app/(onboarding)/practice-meal.tsx`                    | New onboarding screen (first-log tutorial)                        |
| `app/(tabs)/nutrition.tsx`                              | Mode-aware: renders `StructuredNutrition` or `FreeNutrition`      |
| `src/components/nutrition/structured/*`                 | New: guided step wizard, multi-pick, slider adjust                |
| `src/components/nutrition/free/*`                       | New: chip portion picker, flat log view                           |
| `src/components/nutrition/shared/Slider.tsx`            | Dual-label slider with ticks + haptics                            |
| `src/components/nutrition/shared/ChipPortionPicker.tsx` | Chip-based serving picker (Free mode)                             |
| `src/algorithms/meal-allocator.ts`                      | New: allocate portions across multi-food picks to hit step target |
| `src/data/handPortions.ts`                              | New: map food categories to hand-portion visual tokens            |
| `src/data/servingUnits/*`                               | New per-food serving-unit tables (starter ~300 gold list)         |
| Settings screen                                         | Add mode toggle                                                   |
| `src/algorithms/adaptive-tdee.ts`                       | New: 20-day EWMA trend-weight TDEE + two-step weekly-delta        |
| `src/algorithms/partial-logging-detect.ts`              | New: anomaly detection for incomplete logging days                |
| `src/components/nutrition/WeeklyCheckIn.tsx`            | New: 3-screen Hebrew conversational check-in                      |
| `src/data/checkInCopy.ts`                               | New: copy-variation table (≥10 variants × 10 scenarios)           |
| `src/data/compositeDishes.ts`                           | New: 15–20 Israeli mixed-dish DB entries                          |
| `src/stores/useUserStore`                               | Extend with `pauseMode`, `menstrualTracking`, `trialState` fields |

### Data Flow — Structured mode

```
User opens meal card
  → loads per-meal target from computeMealTargets
  → renders 3-step wizard
  → Step N: multi-pick → allocator assigns portions → sliders allow adjust
  → hoser accept → bar fills → advance
  → Summary: if gap, show supplement suggestions; else celebrate
  → Commit to daily log (MealAdherence + food_log rows)
  → Home gauge updates
```

### Data Flow — Free mode

```
User opens daily log
  → renders Home gauge (calories + macros) + flat food log
  → Tap "הוסף מאכל"
  → Search / recents
  → Chip portion picker
  → Tap chip → commit + sheet closes
  → Home gauge animates
```

### Files to Create/Modify

See Task Breakdown below — split across multiple PRs.

## Acceptance Criteria

### Functional

- [ ] Onboarding ends with a mode choice; both paths lead to a practice meal and then Home
- [ ] Settings mode toggle works; changes apply next meal
- [ ] Structured mode: guided 3-step flow completes a meal in 10 or fewer taps (typical case)
- [ ] Free mode: add a food in 3 or fewer taps (search → pick → chip)
- [ ] Slider (Structured): shows dual labels, ticks at whole units, haptics on snap, cooked/raw toggle functions
- [ ] Chip picker (Free): each chip shows grams + macros + calories, custom gram input works
- [ ] Multi-food slider auto-allocation: sliders sum to step target within ±2g for picks that physically can
- [ ] Summary screen supplement suggestions actually close the gap in the picks presented
- [ ] Kosher filter excludes non-kosher items; dairy-after-meat flags with ⚠
- [ ] Mixed dish escape hatch from Structured step logs all macros at once
- [ ] No automatic redistribute prompt at meal close — meal just commits
- [ ] Home gauge reflects running daily total in real time
- [ ] Adaptive TDEE uses 20-day EWMA trend weight + two-step adjustment cadence (not point weight, not 7-day)
- [ ] Weekly check-in uses neutral Hebrew tone, no red/orange adherence colors
- [ ] User-settable calorie floor respected by weekly adjustment, visible in Settings with research citation
- [ ] Partial-logging prompt fires on anomalously low days; flagged days excluded from adaptive calc
- [ ] Pause mode freezes algorithm for 3–14 days without breaking trend weight
- [ ] Fast-loss behavior: algorithm raises calories (MacroFactor pattern), not holds
- [ ] Composite dishes (סביח etc.) log as single entries with pre-verified macros
- [ ] Weekly check-in ships ≥10 copy variants per scenario; no single hard-coded copy string per branch
- [ ] Adherence patterns surface as neutral facts, never grades (Invariant #3)
- [ ] Trial ends after first weekly check-in (day ~7 of 14)

### Non-functional

- [ ] All macros stored as float, displayed as integers; no rounding-compound drift
- [ ] Gold list of 300 foods dietitian-verified before v1 ship
- [ ] Internal consistency scan (`4P + 4C + 9F ≈ kcal ± 8%`) passes on every DB ingest
- [ ] All new UI strings in `i18n/he.ts` + `i18n/en.ts`
- [ ] All new logic TDD'd (algorithms, allocator, slider behavior)
- [ ] RTL-correct throughout (framework-level, no per-component `isRTL()`)
- [ ] No secrets in env; all external API calls through existing OFF service

## Task Breakdown

Broken into shippable PRs. Estimated 8–12 weeks end-to-end. Parallel work streams marked ⚡.

### Track A — Foundation & shared infra

1. [ ] **Mode preference in user store + onboarding mode-choice screen** (M)
   - Add `mealLoggingMode` to `UserProfile`, SQLite migration (v20)
   - `app/(onboarding)/mode-choice.tsx` with screenshot comparison
   - Practice-meal screen stub (wires to chosen mode)
   - Settings toggle + i18n
2. [ ] **Shared slider primitive with dual labels + ticks + haptics** (L)
   - `src/components/nutrition/shared/Slider.tsx`
   - Serving-unit table type + starter DB seed (20 most-logged foods)
   - Cooked/raw toggle (stateless, data-driven)
   - Haptic integration
3. [ ] **Chip portion picker primitive** (M)
   - `src/components/nutrition/shared/ChipPortionPicker.tsx`
   - Custom gram input
   - Recents integration

### Track B — Structured mode

4. [ ] **Guided step wizard (container + per-step shell)** (L)
   - Step progress header + back button behavior
   - Skip + "מנה שלמה" escape hatches
5. [ ] **Multi-pick screen per step** (M)
   - Curated food list per macro + meal slot
   - Kosher/dietary filters
   - Search fallback + recents promotion
6. [ ] **Meal allocator algorithm** (L)
   - Pure function: given picks + target, return portion vector that sums to target
   - Handles single-food fallback (natural serving)
   - Handles structural infeasibility (honest shortfall + no fake allocation)
   - TDD'd with known-good vectors
7. [ ] **Slider-adjust screen with auto-allocate** (M)
   - Wires allocator output into sliders
   - Independent slider behavior (no cascading)
   - `↻ איזון מחדש` re-solve on manual adjust
   - Live per-step total + preview
8. [ ] **Summary screen with supplement suggestions** (M)
   - Gap-shape matching: single-macro short vs multi-macro short
   - Suggestion ranker (single-food coverage of gap)
   - Redistribute link moved to Home tools menu (not default prompt)
9. [ ] **Mixed-dish escape flow** (S)
   - Jumps into direct search, logs all macros, skips remaining steps

### Track C — Free mode

10. [ ] **Free mode meal-log view** (M)
    - Home gauge as primary
    - Flat log grouped by natural time windows (בוקר / צהריים / ערב / לילה) — soft grouping, not hard slots
    - Add button + search entry
11. [ ] **Free mode chip logging flow** (S) - Wire chip picker into add sheet - Single-tap commit behavior
        11a. [ ] **Training-time carbs soft tip** (S) - Home notification post-workout window, not a meal target

### Track D — Adaptive algorithm + weekly check-in

12. [ ] **Adaptive TDEE algorithm** (L) - **20-day EWMA on weight** (per MacroFactor principles, not 7-day) - Back-solve expenditure from intake + weight trend - **Two-step adjustment cadence** (week 1 tentative, week 2 confirmed, week 3 full) - Dynamic Maintenance mode (re-chase expenditure within 1.5 kg of goal) - Fast-loss branch raises calories, not holds - Weekly delta suggestion with calorie-floor respect - TDD'd with known-good vectors from SBS algorithm description
        12a. [ ] **Partial-logging detection module** (M, NEW) - Anomaly-detect days <50% of trend-average intake - "האם חסר לרשום?" prompt (2 copy variants, user-test to pick) - Exclude flagged days from adaptive calc - TDD'd on edge cases (fasting days, travel, illness)
        12b. [ ] **Pause mode ("הפסקה")** (M, NEW) - 3–14 day vacation/illness flag in user state - Algorithm freezes updates while active - Preserves trend weight on re-entry - Settings UI + Home tools menu entry point
13. [ ] **Weekly check-in UI** (L, upgraded from M) - 3-screen flow (trend → recommendation → decision) - Friday-evening default, defer to Sat/Sun supported - Hebrew conversational copy — neutral, empathetic, varied - 3-emoji reflection input (hunger / energy / consistency) - Menstrual flag input (female users) - Skip-weigh-in tolerance (use last trend) - Accept / switch-to-maintenance / keep-as-is actions
        13a. [ ] **Weekly check-in copy-variation table** (M, NEW) - `src/data/checkInCopy.ts` data-driven structure - ≥10 variants × 10 scenarios (on-track, plateau, fast-loss, slow-loss, over-target-week, under-target-week, first-check-in, post-pause, post-cycle-week, skipped-weigh-in) - Neutral-pattern-surfacing strings reviewed for covert-grading risk (Invariant #3) - Dietitian + native-Hebrew-speaker copy review before ship
14. [ ] **⚡ Daily weigh-in HealthKit integration** (M — parallel)
    - `expo-health` or similar; fallback manual entry

### Track E — Data accuracy ⚡ (parallel with engineering)

15. [ ] **⚡ Dietitian-verified gold list, ~300 foods** (L, external — needs dietitian contract)
        15a. [ ] **⚡ Pre-built Israeli composite dishes, 15–20 entries** (M, NEW — parallel track, equal weight to gold list) - Curate list via Israeli-user validation (Open Question #6) - Dietitian macro-verified per dish - Photography + hand-portion mapping per dish - Restaurant-meal variants where applicable (e.g., "פלאפל צלחת — דוכן" vs "ביתי")
16. [ ] **Internal consistency auto-scan on every DB ingest** (S)
17. [ ] **Serving-unit tables for all gold-list foods** (M)
18. [ ] **Hand-portion visual icons + mapping** (S, design + code)
19. [ ] **User error-reporting + review queue** (M)
        19a. [ ] **Restaurant meal entry flow** (M, NEW) - "מסעדה" tag option - Confidence-slider for estimated macros - Brand/chain search fallback (McDonald's IL, Aroma, etc.)

### Track F — Polish & v1 gate

20. [ ] **Kosher/Shabbat filter polish + miluim stub** (M)
21. [ ] **QA sweep over mode switching, mid-day mode change edge cases** (M)
22. [ ] **Full end-to-end manual test plan** (S)
23. [ ] **v1 launch gate** — data accuracy signed off, all tracks green

## Open Questions

### Carried forward

1. **Dietitian sourcing** — hire part-time, contract per-food, partner with an existing Israeli nutrition service? Cost + timeline driver.
2. **Mode-switch mid-day** — resolved tentatively: current day stays in old mode; next day onward switches. Validate with user-test.
3. **Achievement / streak gamification depth** — how much in v1? Suggested: minimal (just day-count "X ימים רצופים"). Research warns against streaks that punish breaks (MFP pattern).
4. **Subscription pricing** — Israeli market: ₪30? ₪40? Free tier limits? Constrained by Invariant #4 (logging verbs always free).
5. **Analytics** — what do we track on mode choice, step skip, escape usage, chip tap vs custom gram?

### Research-derived (need user-testing before commit)

6. **Time-window grouping in Free mode** — pure timeline vs. soft windows (בוקר/צהריים/ערב/לילה) vs. named meal slots. Test 2 beginner + 2 intermediate per variant.
7. **Weekly check-in day/time** — Friday evening (Shabbat reset) vs. Sunday morning. Cultural fit matters.
8. **"הפסקה" copy and trigger** — "הפסקה" vs "יום חופש" vs "חופשה". Does explicit pause feel like permission or guilt-relief?
9. **Partial-logging prompt wording** — "האם חסר לרשום?" vs "היום היה יום של מעט אוכל?" — framing affects honesty. Test 2 variants.
10. **Adherence display language** — "רשמת 5/7 ימים" vs "רשום היטב" vs no display. Pattern ≠ grade is tonally fragile.
11. **Mode-choice onboarding copy** — side-by-side screenshots need user-test before shipping. Intent framing: _"אני רוצה תוכנית"_ vs. _"אני רוצה מעקב"_.
12. **Pre-built mixed dishes — final list** — which 15–20 to ship? Starter candidates: סביח, שקשוקה, שווארמה, בורקס, מלאווח, חומוס בול, פלאפל צלחת, פסטה בולונז, פיצה משולש, ארוחת שבת, פיתה נקניק, טוסט גבינה, כריך, מוזלי, יוגורט גרנולה. Needs Israeli-user validation.
13. **Pause mode max duration** — 14 days vs 30. Longer = more permission, but risks trend-weight going stale. Algorithm-sim testing needed.
14. **Barcode-free rule vs. monetization reality** — if Israeli subscription ARPU is low, can we afford Invariant #4? Need finance sim before public commitment.
15. **Partial-logging anomaly threshold** — 50% of trend-average feels right but MF doesn't publish theirs. User-test on Israeli eating patterns (Yom Kippur, Pesach, Ramadan).

## Non-goals (v1) / Roadmap

### v1.5 (explicit roadmap, research-derived)

- **Reverse diet mode** (Carbon protocol: +50–100 kcal/wk from estimated maintenance, hold protein)
- **Voice-describe logging** (MacroFactor's AI Describe equivalent)
- **User-created recipe builder** (URL import optional)
- **Recipe URL import** (MF / MFP pattern)

### v2 (deliberately deferred)

- Photo-to-macros AI (moat idea — needs cost+accuracy analysis)
- AI recipe import (semantic parsing)
- Passover strict mode / milchig-fleishig deep pairing
- Miluim full automation (stub-only in v1)
- Apple Watch companion
- Social / sharing features
- Meal template library (explicitly rejected in brainstorm)

## Rationale notes

### From original brainstorm

- **Why two modes, not one hybrid:** a single hybrid design accumulated complexity (tappable bars as navigation, multi-pick + auto-allocate + gap suggestions). Two clean modes with distinct philosophies simplifies both.
- **Why no auto-redistribute:** post-brainstorm review flagged it as philosophically incompatible with adaptive TDEE ("macros are visible but not cognitive homework"). Daily gauge shows the gap honestly; weekly algorithm self-corrects.
- **Why search-as-scoreboard, not bars-as-navigation:** users think in foods, not macros. Watching bars fill as foods log is stronger passive teaching than forcing category selection up front.
- **Why natural-unit default portions:** eating 250g cottage to hit protein target is weird; eating ½ container is normal. Portion defaults honor real eating patterns.
- **Why Hebrew-first and Israeli-DB-first:** no competitor does this. Localization is the acquisition moat; adaptive algorithm is the retention moat.

### From 2026-04-24 competitive research

- **Why intent-framed, not experience-framed mode choice:** MacroFactor loses _beginners who want structure_, not "intermediates who want speed." The split is "want a plan vs. want a tracker" — orthogonal to experience. Copy must reflect this.
- **Why adherence-neutral + warm coach voice:** MacroFactor wins migrations on neutrality; Carbon loses on adherence gates; no one owns _warm + scientific_ in Hebrew. This synthesis is the retention wedge.
- **Why copy-variation as a v1 gate:** Carbon's deterministic check-in voice feels like coaching for 2 months then becomes noise. ≥10 variants per scenario avoids this decay.
- **Why partial-logging module:** MacroFactor's quiet superpower. Keeps adaptive algorithm honest without requiring perfect compliance. No competitor has copied it.
- **Why pre-built Israeli composite dishes are a dedicated track (not an escape hatch):** RP's forced decomposition is the specific failure to avoid. Israeli food = composite food (סביח, שקשוקה). Curation effort deserves a track equal to the gold-list nutrient track.
- **Why 14-day trial ending after first weekly check-in:** Carbon's no-trial stance is a documented funnel leak. MF's 7 days doesn't cover one full check-in cycle. Users must experience the warm Hebrew coach voice before deciding.
- **Why Friday-evening weekly check-in:** Shabbat = natural Israeli weekly reset. Cultural fit is a free retention lever against US-built competitors.
- **Why logging verbs stay free:** MFP's Oct 2022 barcode paywall destroyed the brand. Invariant #4 is a strategic moat, not a pricing accident.
