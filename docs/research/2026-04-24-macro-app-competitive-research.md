# Macro-Tracker Competitive Research → FitCoach Flow v2

**Date:** 2026-04-24
**Scope:** RP Diet Coach · MacroFactor · MyFitnessPal · Carbon Diet Coach
**Outcome:** Inputs to `docs/specs/2026-04-24-two-mode-meal-logging.md`

Four parallel research agents ran deep app-store / Reddit / YouTube / first-party-docs sweeps on each app (full per-app reports in session transcript). This document synthesizes findings into actionable FitCoach guidance.

---

## 1. Four-app compressed scoreboard

| Dimension                                          | RP Diet                              | MacroFactor                                     | MyFitnessPal                        | Carbon                                      |
| -------------------------------------------------- | ------------------------------------ | ----------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| **Model**                                          | Prescriptive per-meal plan           | Adaptive TDEE, no meals                         | Static goal + "eat back" exercise   | Weekly coach, meal slots                    |
| **Meal structure**                                 | Rigid, timed to training             | None (timeline)                                 | 4 fixed slots + rename              | 4 fixed slots                               |
| **Adherence philosophy**                           | **Graded (red/orange/green)**        | **Adherence-neutral**                           | Red/green kcal ring                 | **Adherence-gated** (hold if non-compliant) |
| **Weekly adjustment**                              | Weekly macro reset, **point weight** | Adaptive, **20-day trend EWMA**, 2-step cadence | None                                | Weekly coach check-in, deterministic rules  |
| **Redistribute mid-day**                           | Added in v1.5 ("Day Balance")        | No                                              | No                                  | No (manual planner only)                    |
| **Food DB**                                        | 750k, weak internationally           | Verified-only, narrow (~80% foods missing)      | 14M entries, rotting quality        | Spotty, reviewers split                     |
| **Mixed dishes**                                   | **Forced decomposition**             | Recipe builder + URL + AI import                | Recipe builder + URL                | Recipe builder, clunky edit                 |
| **Calorie floor**                                  | Documented low, anecdotally very low | Named "floor" (1200 default, low floor opt-in)  | Hard 1200/1500                      | Soft, protein-anchored                      |
| **Price**                                          | $19.99/mo                            | $11.99/mo, 7-day trial                          | Free tier + $19.99/mo Premium       | $9.99/mo, no trial until late 2025          |
| **Onboarding paywall**                             | Hard, ~90s in                        | Hard at end                                     | Free log, paywall on features       | **Subscription before app**                 |
| **App Store rating**                               | ~4.3                                 | 4.7–4.8                                         | 4.7 (legacy)                        | 4.8                                         |
| **Primary migration destination when users leave** | → MacroFactor                        | → (low churn)                                   | → MacroFactor / Cronometer / LoseIt | → MacroFactor                               |

**Single biggest insight:** MacroFactor is the gravitational center of the 2024–2026 migration flow. Every other app's ex-users cite MF by name. Their two moats — adaptive algorithm + adherence-neutral tone — are the 2026 table stakes.

---

## 2. RP Diet Coach — compressed findings

_(Full report in transcript. Key cites: [App Store](https://apps.apple.com/us/app/rp-diet-coach-planner/id1330041267), [Google Play](https://play.google.com/store/apps/details?id=com.rp.rpdiet), [FeastGood review](https://feastgood.com/rp-diet-app-reviews/), [Sisyphus Strength](https://sisyphusstrength.com/blog/2021/6/28/rp-diet-app-a-full-review), [RP 1.5 update](https://rpstrength.com/blogs/articles/rp-diet-coach-app-update-1-5), [FeastGood MF vs RP](https://feastgood.com/macrofactor-vs-rp-diet/))_

**Love:** results ("most weight lost in 2 years"), zero decision fatigue, nutrient timing around training, raw/cooked toggle, auto-shopping-list.

**Hate:** rigid meal timing ("wants me to eat 45 min before bedtime"), dominant-nutrient logging (bread = carbs only), forced decomposition of mixed dishes, point weigh-ins, **drastic macro cuts at plateaus** ("200g carbs to 50g"), adherence grading, $19.99/mo, hard paywall before experiencing the app.

**Strategic signal:** RP's 1.5 update (2024) — "Day Balance" auto-redistribute, visible daily calories, flexible eating windows — is an **explicit admission** that rigid prescription was a retention hole. They bolted flexibility onto a prescriptive architecture; we get to build it native.

**Churn trigger:** first wedding / vacation / work dinner. Rigid plans fail any real social week.

---

## 3. MacroFactor — compressed findings

_(Full report in transcript. Key cites: [MF Algorithm Accuracy](https://macrofactorapp.com/algorithm-accuracy/), [Adherence Neutral](https://macrofactorapp.com/adherence-neutral/), [SBS: Algorithms & Philosophy](https://www.strongerbyscience.com/macrofactor-algorithms-philosophy/), [MF help: Partial logging](https://help.macrofactorapp.com/en/articles/248-coaching-module-partial-logging), [MF: Timeline food logger](https://macrofactor.com/timeline-based-food-logger/), [FeastGood review](https://feastgood.com/macrofactor-review/), [outlift 2026](https://outlift.com/macrofactor-review/))_

**Algorithm core:** weight trend = exponentially-weighted average over 20 days; expenditure back-solved from trend-weight rate + logged intake; **two-step cadence** (week 1 tentative, week 2 confirmed, week 3 full adjustment). Fast loss → raises calories. Plateau → lowers. Dynamic Maintenance re-chases expenditure when trend within 1.5 lb of target.

**Love:** "trend weight keeps users sane" (quoted repeatedly), adherence-neutral tone, AI Describe voice logging, educational copy explaining _why_, widgets, stable pricing.

**Hate:** verified-only food DB means **~80% of foods missing at first use** (huge week-1 churn), steep learning curve, cold/no celebration, $11.99/mo no free tier, conservative adjustment frustrates power users, missing meal-bucket option frustrates beginners.

**Strategic signal:** MF's architecture explicitly bets on **algorithm trust > UX warmth**. They refuse to grade adherence, refuse to show streaks, refuse to offer meal slots. This wins retention among science-literate intermediates but **loses beginners**. That gap is our opportunity.

**Partial-logging module** (underappreciated): when day's intake is anomalously low, MF asks _"did you actually eat this little, or is this day incomplete?"_ and excludes incomplete days from the expenditure calc. Smart. Copy.

---

## 4. MyFitnessPal — compressed findings

_(Full report in transcript. Key cites: [MFP calorie calc](https://blog.myfitnesspal.com/how-to-calculate-caloric-needs/), [Weekly Digest](https://support.myfitnesspal.com/hc/en-us/articles/360032622591-Weekly-Digest), [Pocket-lint paywall](https://www.pocket-lint.com/apps/news/162386-wow-myfitnesspal-put-its-popular-barcode-scanner-feature-behind-a-paywall/), [Punished Backlog](https://punishedbacklog.com/hey-myfitnesspal-were-not-paying-for-a-damn-barcode-scanner/), [Hoot: why users switch](https://www.hootfitness.com/blog/why-users-are-switching-from-myfitnesspal-and-what-they-re-choosing-instead), [MFP community: adaptive TDEE request](https://community.myfitnesspal.com/en/discussion/10815613/more-accurate-calorie-goal-using-adaptive-tdee-calculations))_

**Love (nostalgic only):** database breadth, recipe builder with URL import, **Recents + Frequents auto-populated** (the single underrated retention feature in macro apps), Weekly Digest as passive non-judgmental summary.

**Hate:** barcode-behind-paywall (primary emotional wound, Oct 2022), full-screen auto-playing video ads during meal logging, no adaptive algorithm, "if every day were like today you'd weigh X in 5 weeks" projection (widely mocked), DB full of duplicates and raw/cooked errors, 1200 kcal hard floor even on Premium, slow/buggy, 2018 breach overhang.

**Strategic signal:** MFP's paywall strategy destroyed the brand. **Never paywall the logging verbs** — barcode, search, voice, photo. Monetize insight and coaching, not the act of logging.

**What MFP got right (copy):**

1. **4 fixed meal slots with rename** — universally understood, zero cognitive load
2. **Recipe Builder with URL import** — still free, still good
3. **Recents + Frequents auto-populate** — 2-tap re-log for repeat meals (you already shipped "re-log previous meal" — extend this)
4. **Weekly Digest** — passive, non-nag, correct emotional register

---

## 5. Carbon Diet Coach — compressed findings

_(Full report in transcript. Key cites: [FeastGood Carbon](https://feastgood.com/carbon-diet-coach-review/), [MF vs Carbon](https://feastgood.com/macrofactor-vs-carbon-diet-coach/), [Carbon How it Works](https://www.joincarbon.com/how-it-works), [Weekly Check-in help](https://help.joincarbon.com/en/articles/6004812-weekly-check-in), [Compliance importance](https://help.joincarbon.com/en/articles/6004813-the-importance-of-compliance), [Reverse diet protocol](https://help.joincarbon.com/en/articles/6029884-how-to-change-to-a-reverse-dieting-goal))_

**Coach voice mechanics:** weekly, user-triggered. Inputs: weight (required), BF% (optional), menstrual flag, self-reported hunger/energy/adherence. Outputs: new targets + natural-language explanation + trend graph. Four deterministic branches: on-track → hold; too slow → cut kcal; too fast → raise kcal; **non-adherent → hold**.

**Love:** results, science credibility (Layne Norton brand), explainability (never left wondering why), simplicity, four diet modes (fat loss / maintain / mass / **reverse diet** — distinct protocol, scientifically differentiated), menstrual-cycle input (something MF lacks).

**Hate:** adherence-gated algorithm ("marked non-compliant → held macros for 7 more days"), no mid-week dynamic redistribution, food DB spotty/barcode wrong ~50% for some users, rigid 4 meal slots, no push notification reminders, historically no free trial, clunky recipe editing, coach voice feels deterministic after 2 months.

**Strategic signal:** Carbon's weekly check-in is the **best idea in the market**, wrapped in the **worst mechanical decision** (adherence gate). The coach voice works; the gate is a flaw. We can ship Carbon's explanation + warmth, wired to MacroFactor's adherence-neutral engine. That specific hybrid doesn't exist today.

**Reverse diet** is a genuine Carbon moat worth studying — increase 50–100 kcal/week from estimated maintenance (not from cut intake), hold protein, monitor weight trend. Mechanically distinct from "maintenance" in a way neither MF nor MFP expresses cleanly.

---

## 6. Moment-by-moment synthesis

For each flow moment: what the four apps do, which is best under which conditions, what FitCoach should do.

### 6.1 Onboarding

| App         | Approach                                      |
| ----------- | --------------------------------------------- |
| MFP         | ~5 questions, low friction, paywall later     |
| MacroFactor | 10–12 questions, hard paywall at end          |
| Carbon      | **Paywall first** — pay before any experience |
| RP          | Quiz + hard paywall 90s in                    |

**Best:** MacroFactor's question depth (TDEE accuracy matters) + MFP's delayed paywall (let users feel value).

**FitCoach v2:** 8–10 conversational Hebrew screens → mode choice (Structured vs Free) → practice meal → **one week free to first weekly check-in** → paywall (so user experiences the warmth of the check-in before deciding). 14-day trial total.

### 6.2 Home screen

| App         | Approach                                        |
| ----------- | ----------------------------------------------- |
| RP          | Meal cards stacked; daily totals hidden pre-1.5 |
| MacroFactor | Week widgets + daily remaining + timeline log   |
| MFP         | Calorie ring + 4 meal slots + ads               |
| Carbon      | Ring + meal slots, deliberately minimal         |

**Best:** MacroFactor's dual surface (week widget + day gauge) because adaptive TDEE needs weekly context.

**FitCoach v2:** Home shows **daily macro gauge** (primary) + **weekly trend mini-card** (secondary) + mode-specific body (meal cards in Structured / flat log in Free). Keep existing; add the weekly mini-card.

### 6.3 Adding a single food

| App         | Speed                                            |
| ----------- | ------------------------------------------------ |
| MacroFactor | AI Describe voice, 1–3 taps, widgets             |
| MFP         | Recents/Frequents 2-tap, barcode paywalled       |
| Carbon      | Search + scan, mixed DB quality                  |
| RP          | Search → slider, serving prescribed by algorithm |

**Best:** MacroFactor's voice + MFP's Recents/Frequents auto-populate. FitCoach already ships re-log-previous and "לאחרונה" labeling — extend.

**FitCoach v2:** Keep Free-mode chip picker (fastest for known foods). Keep Structured slider (best for beginners). Add **voice-describe** as stretch goal v1.5 — MF's AI Describe is beloved and under-copied.

### 6.4 Mixed dishes (sabich, shakshuka, sandwich)

| App         | Approach                            |
| ----------- | ----------------------------------- |
| RP          | Forced decomposition (catastrophic) |
| MacroFactor | Recipe builder + URL + AI import    |
| MFP         | Recipe builder + URL                |
| Carbon      | Recipe builder, clunky editing      |

**Best:** MacroFactor's AI-import pattern + MFP's URL import. **For Israeli market specifically:** pre-built composite dishes beat recipe builders because Israeli eating is composite-heavy and users don't want to build סביח from 8 ingredients.

**FitCoach v2:** Ship v1 with 15–20 pre-built Israeli mixed dishes (סביח, שקשוקה, שווארמה, בורקס, מלאווח, חומוס בול, פלאפל צלחת, פסטה בולונז, פיצה משולש, ארוחת שבת, פיתה נקניק, טוסט גבינה, כריך, מוזלי, יוגורט גרנולה). Recipe builder in v1.1. URL import v1.2. AI import v2.

### 6.5 Logging above / below daily target

| App         | Above                                 | Below                        |
| ----------- | ------------------------------------- | ---------------------------- |
| RP          | Pre-1.5 blocked; post-1.5 Day Balance | Day Balance                  |
| MacroFactor | Silent, next week recomputes          | Silent, next week recomputes |
| MFP         | Red ring, nothing                     | Green ring, nothing          |
| Carbon      | Passive                               | Passive                      |

**Best:** MacroFactor's silence + letting weekly algorithm self-correct. Don't redistribute mid-day, don't shame, don't nag.

**FitCoach v2:** Gauge crosses target → neutral display (not red). Weekly algorithm does real correction. **No auto-redistribute.** Reviewer's original philosophical point confirmed by research.

### 6.6 Forgot to log

| App         | Approach                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------- |
| MFP         | Breaks streak, no algorithmic effect                                                         |
| MacroFactor | **Partial-logging module** — asks user if day was incomplete, excludes from expenditure calc |
| Carbon      | Algorithmic hold on self-reported non-adherence                                              |
| RP          | Assumes skipped; smart reminders prevent                                                     |

**Best:** MacroFactor's partial-logging module. Clever, respectful, algorithmically honest.

**FitCoach v2:** Detect anomalously low days (< 50% of trend-average intake). Gently ask: _"האם באמת אכלת מעט היום, או שחסר לרשום?"_ Exclude "חסר לרשום" days from adaptive calc. This is a new addition to the spec.

### 6.7 Weekly check-in

| App         | Cadence                | Input                                  | Output                           | Tone                     |
| ----------- | ---------------------- | -------------------------------------- | -------------------------------- | ------------------------ |
| RP          | Weekly, Fri            | Point weight + adherence               | New macros                       | Grading                  |
| MacroFactor | Weekly                 | Trend weight + intake                  | New macros + explanation         | Neutral                  |
| MFP         | Weekly Digest          | Passive summary                        | None                             | None                     |
| Carbon      | Weekly, user-triggered | Weight + BF% + period flag + adherence | New macros + explanation + graph | Informational (not warm) |

**Best synthesis:** Carbon's explainability + MacroFactor's adherence-neutral engine + warm Hebrew coach voice.

**FitCoach v2 check-in design:**

- **Cadence:** weekly, Friday evening (Shabbat = natural Israeli weekly reset). User can defer to Saturday/Sunday.
- **Inputs:** trend weight (auto from HealthKit), menstrual flag (female users), 3-emoji reflection (hunger / energy / consistency — **data, not grade**).
- **Outputs:** 3 screens
  1. **Trend screen** — graph + explanation (_"השבוע הורדת 300 גרם. המגמה יציבה בקצב שרצית."_)
  2. **Recommendation** — action + reason (_"נוריד 50 קלוריות ביום. המגמה עצרה שבועיים, זה הצעד הסטנדרטי."_)
  3. **Decision** — accept / switch to maintenance / keep as-is
- **Critical:** copy variation matrix — **10+ variants per scenario** so users don't sense determinism (Carbon's failure mode at month 2).
- **NO adherence gate:** algorithm adjusts on intake + weight trend regardless of self-reported consistency. This is the MacroFactor insight; Carbon's gate is the flaw.
- **Empathy branches:** bad week → warm acknowledgment, not shame (_"שבוע לא פשוט. זה קורה. הנתונים עדיין מראים מגמה, אפשר להמשיך."_). Plateau → curiosity frame. Fast loss → safety concern.

### 6.8 Adherence scoring

**Verdict: DO NOT grade the user.**

- RP's colored grades = shame cycle → churn.
- Carbon's gate = algorithmic flaw.
- MacroFactor's neutrality = wins retention.

**FitCoach v2:** Track patterns passively, surface as neutral facts in the weekly check-in (_"רשמת 5 מתוך 7 ימים. סופי שבוע נוטים לעלות 400 קל׳ — דפוס שלך."_). Pattern detection for education, never for evaluation.

### 6.9 Daily close

All four apps are silent or near-silent. MFP's "if every day were like today..." 5-week projection is the one salient exception and is **widely mocked**.

**FitCoach v2:** Silent rollover. No EOD prompt, no projection, no summary. Weekly check-in does all reflection work.

### 6.10 Diet phase transitions

| App         | Modes                                                             |
| ----------- | ----------------------------------------------------------------- |
| MFP         | Manual only                                                       |
| MacroFactor | User-triggered Cut / Maintain / Bulk; Dynamic Maintenance mode    |
| RP          | Cut / Maintain / Mass, weekly algorithm drives                    |
| Carbon      | Fat loss / Maintain / Mass / **Reverse diet** (distinct protocol) |

**Best:** MacroFactor's Dynamic Maintenance mechanic is excellent (re-chases expenditure near goal). Carbon's Reverse Diet protocol is a genuine differentiator.

**FitCoach v2:** v1 ships Cut / Maintain / Mass (user-triggered). v1.5 adds Reverse Diet with Carbon-style protocol (50–100 kcal/week increase from estimated maintenance, hold protein). Flag this as v1.5, not v1 blocker — too niche for beginners.

### 6.11 Calorie floor

**Best:** MacroFactor's named-and-visible "calorie floor" with research-citation copy + user-settable opt-in low floor.

**FitCoach v2:** Keep current spec. Make the floor visible in Settings with a Hebrew-citation-backed explanation. Floor is a trust signal in an Israeli market wary of diet-culture apps.

---

## 7. Edge cases — comprehensive matrix

| Scenario                                | Current spec behavior              | Research-informed behavior                                                      | Source                           |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| Logs exactly on target                  | Neutral                            | Neutral ✓                                                                       | MF                               |
| Over by <10%                            | Neutral display                    | Neutral ✓                                                                       | MF, MFP                          |
| Over by >25%                            | Neutral display                    | Neutral, but flag in weekly as "high day" (neutral, not shame)                  | MF partial-logging               |
| Under by <10%                           | Neutral                            | Neutral ✓                                                                       | MF                               |
| Under by >25% (one day)                 | Neutral                            | Gentle pattern surface in weekly check-in                                       | MF                               |
| Under by >50% (multiple days)           | —                                  | **Partial-logging prompt**: "האם חסר לרשום?" — exclude from adaptive calc       | MF module (new in spec)          |
| Forgot meal entirely                    | Current: no logic                  | Same as "under by >50%"                                                         | MF                               |
| Mixed dish (sabich)                     | "מנה שלמה" escape hatch (spec'd)   | ✓ + ship with 15–20 pre-built Israeli composite entries                         | RP failure pattern               |
| Restaurant meal                         | Not addressed                      | Default: search brand / "restaurant meal" tag / estimate-with-confidence slider | Gap across all 4 apps            |
| Shabbat / weekend off                   | Not addressed                      | Optional "יום חופש" flag — logs, doesn't affect adaptive calc                   | MF partial-logging extension     |
| Ramadan / fasting                       | Not addressed                      | Optional fasting-day flag — pre-logged breakfast/iftar windows                  | Market-specific, all 4 apps fail |
| Skips weekly weigh-in                   | Current: check-in triggers anyway? | Check-in uses last trend; asks for weight; can skip without breaking algorithm  | MF                               |
| Plateau (3+ weeks flat)                 | Adaptive TDEE handles              | Also surface in weekly: "המגמה עצרה 3 שבועות — הנה מה שנשנה" + **varied copy**  | Carbon pattern, varied           |
| Loses too fast (>goal rate)             | Adaptive + floor                   | **Raise calories** (MF behavior), not maintain                                  | MF algorithm                     |
| Hits calorie floor                      | Respects floor                     | Surface floor explanation + offer maintenance switch                            | MF                               |
| Pauses tracking (vacation)              | Not addressed                      | "הפסקה" mode — 3–14 days, preserves trend weight, no algorithm updates          | Gap in all 4 apps                |
| Illness week                            | Not addressed                      | Same as pause mode                                                              | Gap                              |
| Menstrual cycle                         | Not addressed                      | Optional flag in check-in; algorithm smooths more during cycle week             | Carbon (MF lacks)                |
| Mid-day mode switch (Structured → Free) | Open question #2 in spec           | Current day stays in old mode; next day onward in new mode                      | Per spec                         |

---

## 8. Ranked recommendations

Ranked by impact on retention + evidence strength.

### 1. Adaptive TDEE with trend-weight EWMA [HIGH IMPACT, STRONG EVIDENCE]

MacroFactor's core moat; MFP's #1 missing feature; RP's algorithm flaw (point weight). Ship MacroFactor-style 20-day EWMA + two-step adjustment cadence + 2–3 week patience. Already in spec — keep.

### 2. Adherence-neutral engine + warm Hebrew coach voice [HIGH IMPACT, STRONG EVIDENCE]

MacroFactor wins migrations on neutrality; Carbon loses on adherence gates; no one owns _warm + scientific_ in Hebrew. This is the synthesis play. Already in spec direction — strengthen with explicit "no adherence gate" rule and copy-variation matrix.

### 3. Curated Israeli food DB with verified gold list + barcode coverage [HIGH IMPACT, STRONG EVIDENCE]

Every competitor fails here. MFP's DB is rotting; MF's is too narrow; RP/Carbon are weak internationally. Gold list of 300 + Tiv Taam/Shufersal/OFF crawl + user error reporting + consistency auto-scan. Already in spec — keep, accelerate.

### 4. Never paywall the logging verbs [HIGH IMPACT, STRONG EVIDENCE]

MFP's barcode paywall destroyed the brand. Barcode, search, voice, photo = always free. Paywall goes on coaching/insight/planning. **Add to spec.**

### 5. Two-mode architecture (Structured + Free) [HIGH IMPACT, DIFFERENTIATED]

RP loses intermediates; MF loses beginners; no one serves both. Strongest acquisition differentiator. Already in spec — keep.

### 6. Pre-built Israeli mixed dishes [MEDIUM-HIGH IMPACT, MARKET-SPECIFIC]

Israeli eating is composite-heavy. RP's forced decomposition is the specific failure to avoid. Ship 15–20 curated entries v1; recipe builder v1.1. Already in spec (as "מנה שלמה" escape) — expand scope to explicit entry list.

### 7. Weekly check-in with explanation + varied copy [MEDIUM-HIGH IMPACT, STRONG EVIDENCE]

Carbon's coach voice is praised but deterministic. MacroFactor explains well but feels cold. Hebrew warmth + 10+ copy variants per scenario = wedge. **Add copy-variation infrastructure to spec as a v1 gate.**

### 8. Partial-logging detection module [MEDIUM IMPACT, UNDERCOPIED]

MacroFactor's quiet superpower. Keeps adaptive algorithm honest. Detect anomalously low days, ask user, exclude if incomplete. **New addition to spec.**

### 9. Named calorie floor with research citation [MEDIUM IMPACT, TRUST SIGNAL]

Research-cited, visible in Settings, user-adjustable with explicit warning. Israeli market wary of diet-culture shaming — floor = trust. Already in spec — make visible in UI.

### 10. 14-day trial ending AFTER first weekly check-in [MEDIUM IMPACT, FUNNEL]

Carbon's no-trial stance is a documented funnel leak. MacroFactor's 7 days doesn't cover one full check-in cycle. 14 days ensures users experience the warmth of the Hebrew coach before deciding. **Add to spec.**

### 11. Timeline grouping in Free mode (hybrid, not pure) [MEDIUM IMPACT, NEW]

MF's pure timeline alienates meal-slot thinkers. Pure slots are rigid. Group Free-mode flat log by natural windows (בוקר / צהריים / ערב / לילה) without hard slots. **Update spec.**

### 12. Reverse diet mode [LOWER IMPACT, V1.5]

Carbon's genuine moat but niche for beginners. Ship v1 without; revisit v1.5.

---

## 9. FitCoach Flow v2 — one-page summary

_(This replaces/updates sections of [`docs/specs/2026-04-24-two-mode-meal-logging.md`](../specs/2026-04-24-two-mode-meal-logging.md) — see §10 for delta.)_

**Two modes, onboarding choice, toggleable in settings:**

- **Structured (מובנה):** per-meal macro targets as guidance (not contracts). Guided protein → carbs → fat wizard with multi-pick + slider. For beginners + coaching-oriented users. Meal slots flexible (3–6), timing anchored to training.
- **Free (חופשי):** daily-only targets, flat log grouped visually by natural windows (בוקר / צהריים / ערב / לילה), chip-based portion picker. For intermediates.

**Shared engine (both modes):**

- **Adaptive TDEE**: 20-day EWMA trend-weight, two-step cadence (week 1 tentative, week 2 confirmed, week 3 full). Dynamic maintenance near goal. User-settable calorie floor with Hebrew research-cited copy.
- **Adherence-neutral**: no grading, no gates, no shame colors. Detect patterns, surface neutrally.
- **Partial-logging module**: detect anomalously low days, ask user, exclude if incomplete.
- **Weekly check-in (Friday)**: 3 screens — trend / recommendation / decision. Inputs: trend weight + menstrual flag + 3-emoji reflection. Outputs: new targets + Hebrew explanation + trend graph. **10+ copy variants per scenario.** No adherence gate.
- **Pause mode** ("הפסקה"): 3–14 days vacation/illness, preserves trend weight, freezes algorithm.
- **Israeli food DB**: gold list of 300 dietitian-verified + Tiv Taam/Shufersal/OFF crawl + 15–20 pre-built composite dishes (סביח, שקשוקה, etc.) + user error reporting + auto-consistency scan.
- **Onboarding**: 8–10 Hebrew screens → mode choice → practice meal → first week free including first weekly check-in → 14-day trial → paywall. **Barcode/search/voice/photo always free.**

**Monetization**: paywall goes on coaching (weekly check-in depth, pattern insights), planning (future: meal planner), and premium data (verified brand nutrition). **Never on logging.**

---

## 10. Delta from current spec

### Keep (research validates)

- [x] Two-mode architecture
- [x] No auto-redistribute (reviewer was right — all 4 apps confirm via different failure modes)
- [x] Adaptive TDEE with user-settable floor
- [x] Hebrew conversational weekly check-in
- [x] Israeli food DB + gold list of 300
- [x] Slider primitive with dual labels / hand-portion icons
- [x] Chip picker in Free mode
- [x] Mode-switch rule (current day stays; next day onward switches)

### Change

1. **Free mode flat log → grouped by natural time windows** (בוקר/צהריים/ערב/לילה) — not hard slots, just visual grouping. Neither pure timeline (MF, alienates slot-thinkers) nor fixed slots (MFP, rigid).
2. **"מנה שלמה" escape → expand to 15–20 pre-built Israeli dishes** shipped as first-class DB entries (not just a deep-link to search).
3. **Weekly check-in → add copy-variation matrix requirement (10+ variants per scenario)** as a v1 gate. Carbon's determinism-fatigue is the lesson.
4. **Weekly check-in → add 3-emoji reflection** (hunger / energy / consistency) as data, not grade. No adherence gate.
5. **Adherence handling → explicit "no adherence gate" rule**. Algorithm adjusts regardless of self-reported consistency.
6. **Onboarding → paywall AFTER first weekly check-in** (end of week 1, within 14-day trial). Users feel coach warmth before deciding.
7. **Free-mode "remaining today" display** — passive gauge only, not a redistribute prompt. Keep but clarify behavior.

### Add

8. **Partial-logging detection module** (MacroFactor pattern) — anomalously low days trigger gentle prompt, excluded from adaptive calc if incomplete.
9. **Pause mode** ("הפסקה") — 3–14 days vacation/illness, preserves trend weight, freezes algorithm updates. Gap across all 4 competitors.
10. **Menstrual cycle flag** in weekly check-in (female users) — smooths algorithm during cycle week. Carbon has, MF lacks.
11. **Restaurant meal handling** — "מסעדה" tag + confidence-slider estimate + brand search fallback. Under-solved in all 4 apps.
12. **Shabbat / holiday day flag** — optional, logs but doesn't affect adaptive calc. Market-specific.
13. **Logging-verbs-always-free rule** — written into pricing doc. Barcode/search/voice/photo never behind paywall.
14. **Voice-describe logging** (MF's AI Describe) — v1.5 stretch goal, add to non-goals-for-v1 with explicit v1.5 placement.
15. **Reverse diet mode** — v1.5, add to v1.5 roadmap (not v1 blocker).
16. **Weekly check-in copy-variation system** — infrastructure requirement (data-driven copy table, not inline strings).

### Validate pre-commit

- **Trial length**: 14 days including one full weekly check-in vs. 7 days?
- **Partial-logging threshold**: what % of trend-average triggers the prompt? (MF doesn't publish; needs user-testing on Israeli eating patterns)
- **Pause mode max duration**: 14 days? 30 days?

---

## 11. Open questions for user-testing before committing

1. **Time-window grouping in Free mode** — pure timeline vs. soft windows (בוקר/צהריים/ערב/לילה) vs. named meal slots. Test with 2 beginner + 2 intermediate users per variant.
2. **Weekly check-in day/time** — Friday evening (Shabbat reset) feels culturally right but needs validation. Test vs. Sunday morning.
3. **"הפסקה" copy and trigger** — does explicit pause mode feel like permission or guilt-relief? Test copy: "הפסקה" vs "יום חופש" vs "חופשה".
4. **Partial-logging prompt wording** — "האם חסר לרשום?" vs "היום היה יום של מעט אוכל?" — framing matters for honesty. Test 2 variants.
5. **Adherence display language** — how do we show pattern data neutrally? "רשמת 5/7 ימים" vs "רשום היטב" vs no display. Need to test that pattern facts don't feel like grades.
6. **Mode-choice onboarding copy** — comparison screenshots matter. Need side-by-side mocks for user-test before shipping.
7. **Pre-built mixed dishes list** — which 20 to ship? The list in the current spec (sabich, shakshuka, etc.) needs Israeli-user validation, not just our guesses.
8. **Pause mode max** — 14 days vs. 30. Longer = more permission, but risks trend-weight going stale. Need algorithm-sim testing.
9. **Barcode-free rule vs. monetization reality** — if Israeli subscription ARPU is low, can we afford barcode-free? Need finance sim before committing publicly.

---

## 12. Final calibration: where I'd push back

The user's brief said _"do not agree with my current direction just because I committed to it."_ Three places I'd push:

1. **Two-mode is right — but the framing "beginners vs. intermediates" is wrong.** Research shows MacroFactor loses _beginners who want structure_ (not "intermediates who want speed"). The split is **"want a plan vs. want a tracker"**, orthogonal to experience. Consider rewording onboarding copy away from experience-level and toward intent. _"אני רוצה תוכנית"_ vs. _"אני רוצה מעקב"_.

2. **"No adherence gate" is correct, but "track patterns neutrally" is genuinely hard.** The difference between useful-pattern-surfacing and covert-grading is paper-thin in copy. Budget real design+test time for this. It could become the defining tone quality of the app or its biggest betrayal of the adherence-neutral promise.

3. **Pre-built Israeli dishes are a bigger deal than the spec implies.** Spec treats this as an escape hatch. Research says it's central. Israeli food = composite food. Consider a dedicated v1 workstream for curating + photographing + macro-verifying 20 core dishes, equal in weight to the dietitian-gold-list track.

---

_End of research report._
