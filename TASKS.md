# FitCoach — Full Roadmap to v1.0 Launch

> Each phase lists tasks in order. Tasks marked with ⚡ can start in parallel with coding.
> Tasks marked with 💰 have a cost.

---

## Phase 1: Foundation (Current)

### Code

- [x] Nutrition algorithms (macro distributor, meal plan generator, weekly recalibration)
- [x] Nutrition store (useNutritionStore — last Zustand store) — PR #7, 1,348 tests

### ⚡ Start Now (Parallel with coding)

- [ ] Reserve social media handles (Instagram: @gibor_app, TikTok: @gibor_app)
- [ ] 💰 Apple Developer account ($99/year) — takes a few days to approve
- [x] Register domain — gibor.app ✅
- [ ] Set up simple landing page with email capture (Carrd $19/year or free Vercel)
- [ ] Join 5 Israeli fitness Facebook groups — start participating genuinely, don't promote
  - כושר ואימונים
  - תזונת ספורט
  - CrossFit Israel communities
  - אימון כוח
  - הייטק ובריאות (tech + health)
- [ ] Start dogfooding — use the app yourself for real workouts daily

---

## Phase 2: Navigation & App Shell

- [x] Root layout (app/\_layout.tsx — database init, conditional routing)
- [x] Onboarding stack navigator (app/(onboarding)/\_layout.tsx)
- [x] Tab navigator (app/(tabs)/\_layout.tsx — 5 tabs with icons)
- [x] "Is onboarded?" routing (onboarding → tabs transition)
- [x] Splash screen (branded, fast load)
- [x] Tab redesign — 3 tabs RTL (Nutrition | Workout | Home), greeting header, avatar (PR #12), 1,475 tests

---

## Phase 3: Shared Components

### Tier 1: Foundation (PR #10 — Done)

- [x] RTL-aware layout wrappers (RTLWrapper + isRTL helper)
- [x] Button component (primary, secondary, outline, ghost variants + 3 sizes)
- [x] TextInput component (text input with validation errors, RTL support)
- [x] Card component (default, elevated, outlined variants)
- [x] Shared hooks (useAnimatedPress, useHaptics)
- [x] Infrastructure (react-native-reanimated, expo-haptics, jest component testing)

### Tier 2: Onboarding-critical (PR #11 — Done)

- [x] NumberInput (numeric stepper with +/- buttons, tap-to-edit, long-press)
- [x] OptionSelector (single-choice cards/chips, grid + list layouts)
- [x] CheckboxList (multi-choice with checkmarks, select all/clear all)
- [x] i18n component strings (he + en)

### Tier 3: Post-onboarding (PR #21 — Done)

- [x] MacroRing — animated SVG ring with calories + P/C/F stats (RTL-correct)
- [x] StreakCounter — 7-dot weekly row + flame badge for current streak
- [x] RestTimer — MM:SS countdown with pause/resume/reset, haptic on complete

---

## Phase 4: Onboarding Flow (11 screens)

### PR #13 — Done

- [x] ProgressBar + OnboardingLayout shared components (21 tests)
- [x] Welcome screen (pulse CTA animation)
- [x] Goal picker (muscle_gain / fat_loss / maintenance)
- [x] Body stats form (height, weight, age, sex)
- [x] Body fat (optional, with skip)
- [x] Experience level picker (beginner / intermediate)
- [x] Equipment checklist (conditional: full_gym / home / bodyweight)
- [x] Training days picker (min 2, max 6)

### PR #14 — Done

- [x] Activity screen (occupation + after-work activity + daily steps)
- [x] Exercise habits screen (days/week, duration, type, intensity)
- [x] Sleep screen (hours + warning if < 6)
- [x] Review & confirm screen (animated TDEE reveal, macros, completeOnboarding)
- [x] Health disclaimer in onboarding footer
- [x] Removed Claude AI Code Review CI workflow (redundant with local /review)

### Future Improvements (Backlog)

- [ ] Split Activity screen into 2 screens (occupation + activity | daily steps)
- [ ] Add input summary screen before result screen
- [ ] Persist onboarding draft to AsyncStorage (resume if user exits mid-flow)
- [ ] Add edit capability from result screen (navigate back to specific screen)
- [ ] Improve body fat skip messaging (explain that an estimate will be used)
- [ ] Add excessive sleep warning (>9 hours)
- [ ] ProgressBar text label option ("Step X of Y")

---

## Phase 5: Main Screens

- [x] Post-onboarding coach marks tab tour (PR #24) — 3-step tour highlighting Home/Workout/Nutrition tab icons on first entry, dev-only reset button in Profile, 1,595 tests
- [x] Home dashboard review lessons port (PR #27) — 3 lessons from closed PR #26 review ported to lessons.md + REVIEW.md (throwing lookups in render, currentWeek streak semantics, mocking @/db in component tests)
- [x] Home screen v2 — "Today's plan" dashboard (PR #28) — half-circle macro gauge + today's plan checklist with inline "Next" CTA + weekday streak strip. Supersedes closed PR #26. 6 new components + pure `buildTodaysPlan` utility (24 unit tests) + 4 dev-only `__DEV__` buttons on Profile for testing without a production food-logging UI. 1,680 tests passing (+85 vs main baseline). Spec: `docs/specs/2026-04-09-home-tab-v2.md`
- [x] Add `name` field to UserProfile + onboarding (PR #29) — required string persisted via SQLite v7 migration (`ALTER TABLE … DEFAULT ''`), captured on body-stats screen as first field, HomeHeader now renders "בוקר טוב, {name}" with graceful `greetingNoName` fallback for the pre-load render. Zod bounds `[1, 50]`, trimmed. 10 new tests (7 validation + 3 HomeHeader). 1,690 tests passing.
- [ ] Remove dev-only buttons from Profile tab (cleanup after Nutrition + Workout tabs ship)
- [x] Workout screen (daily workout display, exercise list with sets/reps)
- [x] Active workout UI (guided session — current exercise, log sets, rest timer)
- [x] Nutrition screen (daily macro targets, food log, meal tracking) — PR #40, 1,853 tests
- [x] WorkoutTime field + onboarding screen — PR #41, 1,856 tests
- [x] `computeMealTargets()` + per-meal macro constants — PR #42, 1,869 tests
- [x] Guided meal logging — macro tabs, per-meal targets, meal generation, redistribution (spec: docs/specs/2026-04-11-guided-meal-logging.md) — PR #43, 1,885 tests

### Food Logging UX — Best-in-Class (researched Apr 2026)

- [ ] **Israeli food database** — Tzameret (2,500 MoH-verified foods) + Israeli brands (Tnuva, Osem, Strauss) + pre-built dishes (shakshuka, hummus, falafel, burekas, schnitzel). No competitor covers this. Biggest moat.
- [ ] **Recent foods as default** — When food search opens, show last 10–15 logged foods before user types anything. 80% of logs are repeats. Zero-tap re-log of a known food.
- [ ] **One-tap re-log previous meal** — "Same breakfast as yesterday" — one tap, entire meal re-logged. MacroFactor + MFP power-user favourite. Kills #1 dropout cause (effort).
- [ ] **Streak with grace day** — Log streak shown on home screen. 1 grace day per week before streak resets. Avoids all-or-nothing abandonment after a single missed day.
- [ ] **Free barcode scanning** — Israeli packaged foods via Open Food Facts. Must be free — every app that locked barcodes to premium lost users.

- [ ] Progress screen (weight chart, volume trends, body measurements)
- [ ] Settings screen (edit profile, equipment, language, app info)
- [ ] "Data is stored locally" notice in Settings (users need to know — no cloud sync in v1.0)

---

## Phase 6: Polish & Edge Cases

- [ ] Error boundaries (crash prevention on all screens)
- [ ] Empty states (no plan yet, no logs, first time screens)
- [ ] Loading states (skeleton screens while data loads)
- [ ] RTL layout testing on every screen
- [ ] Accessibility labels on all interactive elements
- [ ] Offline mode validation (all features work without internet)
- [ ] Performance testing (60fps scrolling, cold start < 2 seconds)
- [ ] Test on oldest supported iPhone (iPhone 11/12)
- [ ] Watch a non-tech friend log a workout without helping them (where they pause 3 sec = UI failing)
- [ ] Set up crash reporting (Sentry or Expo built-in)
- [ ] In-app review prompt (SKStoreReviewController — after completing a workout, not during onboarding)

---

## Phase 7: ⚡ Content & ASO (Start during Phase 4-5)

### App Store Listing — Hebrew Primary

- [ ] App name (30 chars): "Gibor - מאמן כושר אישי"
- [ ] Subtitle (30 chars): "תוכנית אימונים מבוססת מדע"
- [ ] Keywords (100 chars, Hebrew): אימון,כושר,תזונה,שריר,דיאטה,חדר כושר,משקולות,תרגילים,בריאות,מאקרו,חיטוב,מסה,אפליקציית כושר
- [ ] Description — Hebrew (first 3 lines = most important, visible before "more" tap)
- [ ] Description — English
- [ ] App category: Health & Fitness
- [ ] Age rating: 4+

### Screenshots (6-8 per language)

- [ ] Screenshot 1: Hero — main value proposition "אימון מותאם אישית בשבילך"
- [ ] Screenshot 2: Workout screen in action
- [ ] Screenshot 3: Progress tracking
- [ ] Screenshot 4: Nutrition/macros
- [ ] Screenshot 5: Science-based differentiator
- [ ] Screenshot 6: Onboarding simplicity
- [ ] Use real device frames + Hebrew headlines + brand colors
- [ ] Tools: Figma (free) + Rotato or screenshots.pro for 3D mockups

### App Icon

- [ ] 1024x1024, no transparency, no rounded corners
- [ ] Recognizable at small sizes (avoid text in the icon)

### App Preview Video (optional but boosts conversion)

- [ ] 15-30 second screen recording with Hebrew text overlays
- [ ] Show: onboarding → workout plan → active session → progress
- [ ] No voiceover needed (most browse with sound off)

---

## Phase 8: ⚡ Social Media & Community (Start during Phase 3-4)

### Content Calendar — Start 6-8 weeks before launch

**Post 3-4x/week, mix:**

- [ ] 40% Educational fitness content (Hebrew tips, myth-busting)
  - "3 טעויות שהורגות לך את הגב באימון"
  - "למה אתה לא צריך 6 ימי אימון בשבוע"
  - "מה עדיף: יותר משקל או יותר חזרות?"
- [ ] 30% Behind-the-scenes / building in public
  - "Building a fitness app alone — day 47"
  - Show your screen, design iterations, decisions
  - The solo dev story resonates — people root for you
- [ ] 30% App previews and feature reveals
  - Screen recordings of real features
  - Before/after of UI improvements
  - "This is what your workout plan looks like"

### Platform Strategy

- [ ] Instagram — primary channel (Reels get most reach). 3-4 Reels/week + daily Stories
- [ ] Facebook Groups — 2-3 value posts/week in Israeli fitness groups (never spam)
- [ ] TikTok — repurpose Instagram Reels. 3-5 short videos/week
- [ ] WhatsApp channel or group — for community updates (Israelis live on WhatsApp)

### Goal before launch day: 500+ engaged followers

---

## Phase 9: Legal & Accounts

- [ ] 💰 Apple Developer account ($99/year) — if not done in Phase 1
- [ ] 💰 Google Play account ($25 one-time) — if launching on Android
- [ ] Privacy policy page (local-only data, no cloud sync, no tracking)
- [ ] Terms of service page
- [ ] Health/fitness disclaimer (app is not medical advice)
- [ ] Support email set up (support@gibor.app)

---

## Phase 10: Build & Beta Testing

### Build Pipeline

- [ ] EAS config (eas.json — development, preview, production profiles)
- [ ] EAS projectId in app.json
- [ ] Version bump (0.1.0 → 1.0.0)
- [ ] First TestFlight build (iOS)

### Beta Phase 1: Friends & Family (5-8 people, 1 week)

- [ ] Select 5-8 honest people (not people who will just say "looks great")
- [ ] Create short feedback form (Google Forms, 5 questions max):
  1. What was confusing when you first opened the app?
  2. Did the workout plan feel right for your level?
  3. What's the ONE thing you'd change?
  4. Would you recommend this to a friend? Why/why not?
  5. What would make you pay for this?
- [ ] Fix critical issues found

### Beta Phase 2: Target Users (15-25 people, 2-3 weeks)

- [ ] Recruit from Facebook fitness groups + Instagram DMs + BetaList.com + Beta Family
- [ ] Frame it as: "אני בונה אפליקציית כושר ואני צריך עזרה — מחפש בודקים"
- [ ] Batch feedback responses every 48 hours (24h is burnout territory while coding full-time)
- [ ] Ship at least 2 beta updates based on feedback
- [ ] Track: onboarding completion rate (target >80%), Day 1/3/7 retention

### Beta Phase 3: Open Beta (30-40 people, 1-2 weeks)

- [ ] Broader audience recruitment (cap at 40 — more = drowning in feedback as solo dev)
- [ ] Final polish based on patterns (not individual opinions — 3+ people = real issue)
- [ ] Prepare launch day pipeline

### Total beta period: 4-6 weeks

---

## Phase 11: Pre-Launch (2 weeks before)

- [ ] 🔴 Purchase ExerciseDB Pro dataset (Gumroad, ~$30 one-time) — replace free-tier GIF URLs with owned files + commercial license before App Store submission
- [ ] Submit to App Store Review (budget 1 week for potential rejection + resubmission)
- [ ] Select release date in App Store Connect (use "Manual Release")
- [ ] Pre-write ALL launch day posts (Instagram, Facebook, Reddit, TikTok)
- [ ] Schedule posts using Later or Buffer
- [ ] Email beta testers: "Launch is coming — be ready to leave a review on day one"
- [ ] Reach out to 5-10 Israeli fitness micro-influencers (1K-20K followers)
  - Offer free lifetime access for honest review
  - Target small accounts that actually respond to DMs
- [ ] Contact Israeli tech blogs:
  - Geektime.co.il
  - TechNation
- [ ] Prepare physical launch-day checklist (you'll be stressed and forget things)
- [ ] Brief anyone who agreed to post about you on launch day
- [ ] Prepare a "thank you" message for post-launch

---

## Phase 12: Launch Day 🚀

### Morning (7-8 AM Israel time)

- [ ] Release the app (trigger manual release in App Store Connect)
- [ ] Post on all social media simultaneously
- [ ] Email beta testers: "We're live! A review would mean the world" + direct App Store review link
- [ ] Post in Facebook fitness groups (only the ones where you've been active for months)

### Mid-Morning (10 AM - 12 PM)

- [ ] Post on Reddit (r/fitness, r/Israel, r/SideProject, r/IndieHackers)
- [ ] Post on LinkedIn ("Solo Israeli dev launches science-based fitness app")
- [ ] Send press/blog outreach emails
- [ ] Submit to Product Hunt (optional — Tuesday or Wednesday is best)

### Afternoon & Evening

- [ ] Respond to EVERY comment, review, and message (speed matters)
- [ ] Share milestones on Instagram Stories: "100 downloads!", "First 5-star review!"
- [ ] Thank people publicly who share the app
- [ ] Send "thank you" update to beta testers and supporters

### Launch Day Goal: 20+ App Store reviews on day one (prime 50+ people — not everyone follows through)

---

## Phase 13: Post-Launch — First 30 Days

### Week 1: Stabilize

- [ ] Fix any crash or critical bug within hours (1-star "crashes on launch" reviews kill apps)
- [ ] Respond to every App Store review (positive AND negative — Apple shows responses publicly)
- [ ] Goal: 20+ ratings by end of week 1

### Week 2-3: Iterate

- [ ] Analyze analytics — where do people drop off? What's used? What's ignored?
- [ ] Ship 1-2 updates based on real user data
- [ ] Mention fixes in release notes ("Fixed X based on your feedback" — users appreciate this)
- [ ] Start WhatsApp group for most engaged users (they become your product council)

### Week 4: Grow

- [ ] Write 1-2 blog posts about your launch experience (creates backlinks + awareness)
- [ ] Evaluate retention: Day 7 > 20% = healthy, > 30% = great
- [ ] If retention is healthy, consider paid acquisition:
  - [ ] 💰 Apple Search Ads ($5-10/day) — Hebrew keywords, low competition
  - [ ] 💰 Instagram/Facebook ads ($10/day) — only after 30+ reviews and 4.0+ rating

### Ongoing

- [ ] Post 3x/week on social media (don't stop after launch)
- [ ] Weekly progress notification to users: "This week: 3 workouts, +2.5kg on bench"
- [ ] Monthly app update with improvements
- [ ] Update ASO keywords every 4-6 weeks (check App Store Connect search trends)
- [ ] A/B test screenshots using Apple's Product Page Optimization

---

## Key Data & Benchmarks (from live research, April 2026)

### Your #1 Competitive Advantage

**Only 4 out of 30 top Israeli fitness apps have Hebrew-localized product pages** (AppTweak research). FitCoach being Hebrew-first is a massive moat. Emphasize this: "נבנה בעברית מהיום הראשון"

### Retention Benchmarks for Fitness Apps (2025-2026)

| Metric | Average | Top Performers | FitCoach Target |
| ------ | ------- | -------------- | --------------- |
| Day 1  | 20-35%  | 45%            | 35%+            |
| Day 7  | 15-20%  | 30%            | 25%+            |
| Day 30 | 8-12%   | 25-47%         | 20%+            |

**Key finding:** AI-driven personalization = **50% higher retention**. Your component-based TDEE and personalized programming ARE the retention strategy.

### ASO Numbers

- 70% of users discover apps through app store search
- 65% of downloads are organic search
- Top 3 results get 90% more downloads
- Optimizing first 3 screenshots: **20-35% conversion bump**
- Localized screenshots: additional **30% conversion lift**
- **Update keywords every 4-6 weeks** (most devs optimize once and forget)

### Cost Benchmarks

- Apple Search Ads fitness apps: **$1.00-$3.50 per tap**, **$15-$40 per install**
- Organic tactics: **10-30x cheaper** than paid ads
- Most indie devs reach 1,000 downloads in 60-90 days spending **under $1,500** organically
- Apple Ads Basic (CPI pricing) is better for indie devs than Advanced (CPT)

### Pre-Launch Impact

- Apps with strong pre-launch campaigns: **136% more installs** in first month
- Landing pages drive **40% more initial downloads**
- Relevant influencer coverage: **312% download increase** during launch week

### Product Hunt Reality Check

Product Hunt skews tech/dev audience, not fitness consumers. Better ROI from Israeli fitness communities, Hebrew content, and local micro-influencers. Use PH for press/backlinks, not direct user acquisition.

---

## Monetization Plan

- **v1.0:** 100% free, all features. Focus on downloads, reviews, retention data.
- **v1.1-v1.2:** Introduce "FitCoach Pro" after 500+ users and retention data.
- **What goes behind paywall:** Advanced analytics, workout history export, custom exercises — NOT the core workout generator (that's the hook).
- **Why free first:** Paywall on day one kills review pipeline. You need 20+ reviews fast. Free → reviews → ASO ranking → more downloads → then monetize.

## Apple Health App Scrutiny

Apple reviews health/fitness apps more strictly. Key rules:

- Use "suggested" and "personalized template" — never "prescribed" or "medical"
- Health disclaimer must be in: App Store description + onboarding footer + Settings
- If Apple asks "is this medical advice?" → answer: "No, it provides personalized workout suggestions based on published exercise science research"

---

## Common Mistakes to Avoid

1. **Don't build too many features before launching.** If onboarding + workout plan works, ship it.
2. **Don't launch on Friday/weekend.** Press is offline, communities are quiet, bugs go unpatched.
3. **Don't start marketing on launch day.** Start 6-8 weeks before. Build audience first.
4. **Don't ignore negative reviews.** One unanswered bad review scares away new users.
5. **Don't compare yourself to VC-funded apps.** Compete on niche focus and quality.
6. **Don't add features to fix retention.** Fix the core experience first.
7. **Don't spend money on ads before product-market fit.** (500+ organic users, 20%+ Day 7 retention, 30+ reviews)
8. **Don't burn out.** Mon-Thu = code, Fri = marketing/community, Weekend = rest.
9. **Don't optimize ASO once and forget it.** Update keywords every 4-6 weeks based on search trends.
10. **Don't launch with bugs.** Data shows bad first impressions are nearly impossible to recover from — quality at launch > speed to market.

---

## Budget Summary

| Item                                | Cost           | When                 |
| ----------------------------------- | -------------- | -------------------- |
| Apple Developer Account             | $99/year       | Phase 1 (now)        |
| Domain name                         | $10-15/year    | Phase 1 (now)        |
| Landing page (Carrd or free Vercel) | $0-19/year     | Phase 1 (now)        |
| Google Play Account (optional)      | $25 one-time   | Phase 9              |
| Apple Search Ads                    | $150-300/month | Phase 13 (after PMF) |
| Instagram/Facebook ads              | $300/month     | Phase 13 (after PMF) |
| Figma (free tier)                   | $0             | Phase 7              |
| Analytics (PostHog free tier)       | $0             | Phase 6              |

**Total to launch: ~$130-150**
**Monthly after launch (if doing paid ads): $450-600**

---

## Done ✅

- [x] TDEE calculator (component-based)
- [x] Macro calculator (adjusted body weight)
- [x] Split selector (FB/UL/PPL)
- [x] Exercise database (~70 exercises, stretch-position tagged)
- [x] Split templates (13 templates with A/B variants)
- [x] Workout generator (orchestrates split + exercises + volume + equipment)
- [x] Volume manager (MEV to MAV progression, deload detection)
- [x] Progressive overload (double progression)
- [x] Equipment system (checklist-based)
- [x] SQLite database + repositories (14 tables)
- [x] Zustand user profile store (67 tests)
- [x] Zustand workout store (102 tests)
- [x] Security (Zod, secure store, env validation)
- [x] i18n (Hebrew + English)
- [x] Theme system (colors, spacing, typography)
- [x] CI/CD (GitHub Actions, Husky, CommitLint)
- [x] Development workflow (ESLint, Prettier, pre-commit checks)
- [x] 356 tests passing (100% algorithm coverage)
- [x] Nutrition foundation — types, Israeli food DB (105 foods), meal templates (13) (PR #4)
- [x] Nutrition repositories — FoodLog, MealPlan, WeeklyCheckIn repos + 3 new DB tables (PR #5)
- [x] 1,223 tests passing
- [x] Nutrition algorithms — macro distributor, meal plan generator, weekly recalibration (PR #6)
- [x] 1,312 tests passing
- [x] Nutrition store (useNutritionStore — last Zustand store) — PR #7, 1,348 tests
- [x] Navigation & App Shell — root layout, onboarding stack, tab navigator (PR #9), 1,348 tests
- [x] Shared Components Foundation — RTLWrapper, Button, TextInput, Card, hooks (PR #10), 1,395 tests
- [x] Onboarding Components — NumberInput, OptionSelector, CheckboxList (PR #11), 1,460 tests
- [x] Tab Redesign — 3 tabs RTL, greeting header, avatar, motivational pool (PR #12), 1,475 tests
- [x] Onboarding Flow screens 1-7 — ProgressBar, OnboardingLayout, Welcome-TrainingDays (PR #13), 1,496 tests
- [x] Onboarding Flow screens 8-11 — Activity, Exercise, Sleep, animated TDEE Result (PR #14), 1,512 tests
- [x] Onboarding bug fixes — ProgressBar RTL, NumberInput blur/unmount (PR #15), 1,518 tests
- [x] Calculating animation screen — 10s animated step checklist before results, RTL fix (PR #16), 1,518 tests
- [x] Critical fix: display goal-adjusted calories instead of maintenance TDEE (PR #17), 1,538 tests
- [x] Tier 3 shared components — MacroRing, StreakCounter, RestTimer + calculateStreak algorithm (PR #21), 1,570 tests
- [x] RTL rendering bugs across onboarding + remove invalid app.json plugins (PR #22), 1,524 tests + Node 24 dev server fix
- [x] Test flake fix — useWorkoutStore week-advance test was using real Date.now vs mocked todayISO (PR #21/#22)
- [x] Post-onboarding coach marks tab tour (PR #24) — 3-step tour, SQLite v6 migration, dev reset button, 1,595 tests
- [x] QA audit fix: validation guards at algorithm + store boundaries (PR #31) — RangeError in calculateEat(), Zod validateInput() in logFood/logWeight/logSet, 1,696 tests
- [x] Workout screen: daily workout display, exercise list, detail sheet, rest day card (PR #32) — 7 new components, i18n muscle names, 1,751 tests
- [x] Exercise GIF demos + Hebrew instructions (PR #33) — 59 GIFs from ExerciseDB, ℹ️ info button, 76 exercises with beginner Hebrew instructions, RTL fixes, 28 Hebrew name corrections, 1,754 tests
- [x] Active workout UI (PR #35) — 7 new components (SetRow, ActiveExerciseCard, ActiveWorkoutView, FloatingRestBubble, FinishWorkoutBar, EndEarlyDialog, WorkoutTimer), guided session with set logging, auto-advance, inline rest timer + floating bubble, end early dialog, 1,754 tests
- [x] Home dashboard Stitch redesign (PR #39) — converted Home Dashboard and Welcome screens to Stitch design system
- [x] Nutrition screen — full daily food log with meal tracking (PR #40) — 10 new components (DaySelector, NutritionCalorieArc, NutritionMacroPills, MealSection, FoodItemRow, MealEmptyState, AdherencePicker, FoodSearchSheet, PortionPicker + helpers), MealAdherence DB table + repository, date-aware store, 1,853 tests
- [x] WorkoutTime field + DB column + onboarding screen (PR #41) — `WorkoutTime` type, SQLite v9 migration, workout-time onboarding screen after training-days, Zod validation, 1,856 tests
- [x] `computeMealTargets()` + per-meal macro constants (PR #42) — pure algorithm maps daily macros + WorkoutTime + goal to per-meal `{calories, protein, fat, carbs}` for 4 named meals; `MEAL_CALORIE_SPLIT_BY_GOAL`, `FAT_CAP_PRE_WORKOUT`, `PROTEIN_BOOST_MULTIPLIER`, `MACRO_SATISFIED_THRESHOLD` constants with citations; 13 tests, 1,869 tests total
- [x] Guided meal logging — macro tabs, per-meal targets, meal generation, redistribution (PR #43) — 1,885 tests
- [x] Tzameret food database (PR #44) — 4,609 MoH foods seeded via v10 migration, 1,932 tests
- [x] Shufersal scraper pipeline + 46 protein yoghurt SKUs + schema v11 (PR #45) — scrape-shufersal.ts, normalize-food.ts, deduplicate.ts, shufersal-overrides.ts, build-supermarket-seed.ts, 1,997 tests
- [x] Supermarket-only food database: remove Tzameret, fix search relevance, schema v12 (PR #46) — deleted tzameret-seed.json (60K lines), migrateToV12 purges tz\_ rows, search now orders starts-with first, 1,998 tests
- [x] Food log display name fix — schema v13 adds name_he to food_log, logged items now show Hebrew name instead of raw ID, logSavedMeal uses foodRepository instead of FOOD_MAP (PR #47) — 1,998 tests

- [x] Full Shufersal catalog — schema v14, 5,459 products (6,573 scraped, 1,160 deduped, 46 overrides), migrateToV14 wipes old sh\_ rows and reseeds (PR #50) — 2,000 tests
- [x] Manual gram input in PortionPicker — TextInput replaces read-only gram display, live macro update, clamp on blur, stepper + chips stay in sync (PR #52) — 2,003 tests
- [x] Raw ingredients Task 1 — RawIngredientSchema + Zod validation (2026-04-13) — `scripts/raw-ingredients/{schema.ts,schema.test.ts,raw-ingredients.ts}`. Extends FoodSeed with `state: 'raw' | 'cooked'`, `baseSlug`, `priority: P0|P1|P2`. Zod enforces `raw_` id prefix, positive calories, non-negative macros, servingSizesJson must parse + include a 100g entry. 17 new tests, 2,087 tests total.
- [x] Raw ingredients Task 2 — USDA SR Legacy fetch helper (2026-04-13) — `scripts/raw-ingredients/{fetch-usda.ts,usda-targets.json}`, `.env.example`, `package.json`. Two-stage fetcher: search → fdcId → `/food/{fdcId}` detail (required for foodPortions). 202 curated targets across 14 categories with raw/cooked variants where macros diverge. Rate-limited 1 req/s, cache-resumable via `tmp/usda-cache/`, optional `fdcIdHint` override. Dry-run flag for 5-item sample. Output `tmp/usda-raw.json` = 202/202 entries, 0 misses, 0 errors on full run. Spec `docs/specs/2026-04-13-raw-ingredients-seed.md` committed alongside. Manual verification only (network-bound one-shot, no TDD per spec). 2,087 tests unchanged.
- [x] Raw ingredients fetch fixes — pinned fdcIds + Tzameret-only split (2026-04-13) — `scripts/raw-ingredients/{fetch-usda.ts,usda-targets.json}`. Task 2's first full fetch surfaced ~17 bad matches: USDA search top-hit picked wrong foods (chicken_thigh got "skin", beef_sirloin got veal, yogurt plain got fruit yogurt, etc.) and ~9 Israeli-specific items have no SR Legacy equivalent at all (labneh, white cheese 5%, cottage 5%/9%, milk 3%, yellow cheese Emek, denis, beef_shoulder raw/cooked — SR Legacy only has it as bison). Added `--slugs <csv>` flag for surgical re-fetch, pinned 8 correct fdcIds via `fdcIdHint`, removed 9 Tzameret-only slugs into a new `tzameretOnlySlugs` doc field (Task 3 populates those directly from Tzameret composition tables), deleted 19 stale cache files. Fetch output now logs description+fdcId+calories per network call so mismatches surface immediately. Verified via real fetch run: chicken_thigh raw 121 kcal (was 440 bogus "skin"), beef_sirloin 131 kcal (was 110 veal), yogurt_plain_lowfat 63 kcal (was 102 fruit), tuna_canned_water 116 kcal (was 198 oil). 2,087 tests unchanged.
- [x] Rami Levy pipeline run + seed shipped + content/fuzzy dedup (PR #56) — ran scrape-rl-ids → fetch-rl-nutrition (2 passes, ~35% transient errors recovered) → build-rami-levy-seed (6,916 rl\_ rows). Added `normalizeNameForDedup`, `buildContentHash`, `deduplicateFuzzy`, `filterAgainstContentHashes` to scripts/deduplicate.ts. Strict content hash + window-based fuzzy clustering (±15 kcal, ±2g macros). Shufersal 5,459 → 5,193; Rami Levy 0 → 6,916 (44 cross-seed dupes vs Shufersal removed). Gouda 17 → 7; גבינה לבנה 5% 4 → 1. Also dropped Notion step from workflow. 2,070 tests.
- [x] Raw ingredients fetch fixes round 2 — pinned 4 broken slugs + 5 beverages + salt (2026-04-13) — `scripts/raw-ingredients/{schema.ts,schema.test.ts,usda-targets.json,raw-ingredients.ts}`. Pinned `fdcIdHint` for oats_dry (173904), oatmeal_cooked (173905), tortilla_flour (175037), sweet_potato raw (168482), salt (173468). Added 5 beverage targets: water (173647), coffee_brewed (171890), tea_black_brewed (173227), orange_juice (169098), apple_juice (173933). Relaxed `caloriesPer100g` from `.positive()` to `.min(0)` so water/salt/plain coffee/tea pass schema (0 kcal is physical reality, not a data-quality signal). Ran `fetch-usda --slugs` for the 10 targets, added corresponding entries to raw-ingredients.ts with Hebrew names + realistic serving sizes (cup/bottle/liter for water, ספל 237g for coffee/tea, כוס 248g for juice). Catalog 181 → 191 entries. Schema test "rejects zero calories" flipped to "accepts zero calories". 2,094 tests.
- [x] Raw ingredients Task 3 session 3 — fruits + fats + nuts + condiments data entry (2026-04-13) — `scripts/raw-ingredients/raw-ingredients.ts`. Populated 54 entries across fruits (25), fats/oils/spreads (8), nuts/seeds (12), condiments/sweeteners (9). All USDA SR Legacy-backed (values pulled from `tmp/usda-raw.json`). Hebrew name + 1–3 serving sizes each (100g + natural unit: תפוח בינוני 161g, כף שמן זית 13.5g, חופן שקדים 28g, כף דבש 21g, etc.). Narrow category field (fruits/fats/nuts/condiments). 2 targeted items skipped: salt (fdc 173468, 0 kcal fails schema `positive()`) and beverages (user requested water/coffee/tea/juices but none exist in usda-targets.json — needs target list expansion + refetch in follow-up). Catalog now 181 entries, 0 id dupes, 0 macro-sum violations. 2,093 tests unchanged (catalog test iterates full array).
- [x] Raw ingredients Task 3 session 2 — legumes + grains + vegetables data entry (2026-04-13) — `scripts/raw-ingredients/raw-ingredients.ts`. Populated 57 entries across legumes (11), grains (17), vegetables (29). All USDA SR Legacy-backed (values pulled from `tmp/usda-raw.json`). Hebrew name + 2–3 serving sizes each (100g + natural unit: כוס מבושל 158g, פרוסה 28g, עגבנייה בינונית 123g, שן שום 3g, etc.). Narrow category field (legumes/grains/vegetables) matches session 1 pattern. 4 target slugs skipped due to broken USDA fetches (oats_dry → "Oil, oat", oatmeal_cooked → dry oats, tortilla_flour → "Sauce, pesto", sweet_potato raw → "Sweet Potato puffs") — follow-up PR will pin fdcIds same way as session-1 fix PR #61. 2,093 tests unchanged (catalog test iterates full array).
- [x] Raw ingredients Tasks 4+5+6 — seed builder + schema v16 migration + search ranker boost (2026-04-13) — `scripts/raw-ingredients/build-raw-ingredients-seed.{ts,test.ts}`, `src/assets/raw-ingredients-seed.json` (191 entries), `src/db/{schema.ts,database.ts,food-repository.{ts,test.ts}}`, `package.json`. Build script validates `RAW_INGREDIENTS` through `RawIngredientSchema`, strips non-DB fields (baseSlug/state/priority/sourceComment), maps narrow raw categories (poultry/meat/fish/eggs/legumes/nuts/grains/fats/dairy/vegetables/fruits/condiments/beverages) to the `FoodCategory` union (protein/carbs/fats/dairy/vegetables/fruits/snacks) via pure `mapRawCategory`, enforces id uniqueness, emits `src/assets/raw-ingredients-seed.json` in the same shape as rami-levy-seed.json. `SCHEMA_VERSION` bumped 15 → 16, `migrateToV16` wipes `WHERE id LIKE 'raw_%'` and batch-inserts 50×11 params following the v14/v15 pattern. Food search `ORDER BY` extended with a secondary source-tier tiebreaker (`raw_% < manual_% < sh_% < rl_%`) keeping starts-with as the primary signal so generic queries (חזה עוף) surface raw_chicken_breast_raw first while branded starts-with queries (עוף אחלה) still return the brand first. +27 tests (20 build-script, 6 v16 seed integrity, 1 ranker SQL structure), 2,121 tests total.
- [x] Raw ingredients Task 3 session 1 — protein + dairy data entry (2026-04-13) — `scripts/raw-ingredients/{raw-ingredients.ts,raw-ingredients.test.ts}`. Populated 71 entries across poultry (19), eggs (3), meat (18), fish (13), dairy (18). 61 USDA-backed (values pulled from `tmp/usda-raw.json` via pinned fdcIds from Task 2 fixes), 10 Tzameret-only items sourced from current Israeli manufacturer labels (Tnuva/Tara April 2026): beef_shoulder raw/cooked, sea_bream (denis), milk_3pct, labneh 5%, white cheese 5%, cottage 5%, cottage 9%, Emek. Each entry ships Hebrew name + 2–4 serving sizes including 100g + natural unit (חזה בינוני 170g, ביצה L 60g, כוס 240g, etc.). Narrow category field (poultry/eggs/meat/fish/dairy) so catalog UI can browse-by-category. Schema validation test iterates RAW_INGREDIENTS through RawIngredientSchema + enforces unique ids, id-convention, macro sanity bound (p+f+c ≤ 100). 6 new tests, 2,093 tests total.

- [x] QA sweep fixes — i18n extract + deload docs + FK indices schema v18 (2026-04-13) — `src/i18n/{he,en}.ts` (`nutrition.foodCategoryTabs` keys), `src/components/nutrition/FoodSearchSheet.tsx` (TAB_ORDER + per-render `tabDefs` via useMemo, Hebrew tab labels no longer hardcoded), `src/algorithms/volume-manager.ts` + `src/data/constants.ts` (jsdoc + constant comment now match actual deload formula `MV + round(MV × 0.5) = 1.5 × MV`, previously contradictory), `src/db/schema.ts` v17 → v18 with 4 FK lookup indices (`idx_workout_plan_user`, `idx_workout_template_plan`, `idx_exercise_prescription_template`, `idx_saved_meal_item_meal`). Driven by 3-agent parallel QA sweep over algorithms+types / DB+security+stores / UI+tests+config; sweep also debunked 3 false-positive "critical" claims (foodRepository export was present, NutritionMacroPills `row` auto-flips under RTL, macro-calculator Math.max is safety clamp). 2,154 tests unchanged.
- [x] Food catalog dedup + schema v17 (2026-04-13) — `src/shared/normalizeFoodName.{ts,test.ts}` (new shared helper), `scripts/deduplicate.{ts,test.ts}` (rewrote `deduplicateFuzzy` to name-only grouping + garbage-row filter + richness tie-break; imports from shared module), `src/db/{schema.ts,database.ts,food-repository.test.ts}`, `src/assets/{supermarket,rami-levy,raw-ingredients}-seed.json`. Discovery: PR #56's macro-window clustering (±15 kcal / ±2g) failed on Shufersal's 3× `אורז פרסי` at 348/350/336 kcal with protein 6/8.7/0 — Δprotein > window on every pair, so none collapsed. Fix: once normalized name matches (% preserved so `חלב 3%` stays distinct from `חלב 9%`), collapse aggressively; pick non-garbage → most non-null macros → first occurrence. Rebuild counts: Shufersal 5,193 → 4,964 (-229, +495 fuzzy drops vs prior); Rami Levy 6,916 → 6,799 (-117, -44 cross-seed). Schema v17 adds `name_norm TEXT` column + `idx_foods_name_norm` index (index creation inside migration only — `CREATE INDEX` in `CREATE_TABLE_STATEMENTS` crashes upgrade installs with "no such column"). `migrateToV17` backfills `name_norm` for every row via shared helper, then runs cross-source tier cleanup (DELETE lower-tier rows where higher-tier same-`name_norm` exists; `raw_%` > `manual_%` > `sh_%` > `rl_%`). Device-verified: backfilled 12,300 rows, deleted 172 cross-source dups. Search `אורז פרסי` now 1 row; `חזה עוף`, `שמן זית`, `ביצה`, `תפוח`, `אורז לבן` all surface `raw_%` row first. +14 deduplicate tests (43 total), +1 v17 dedup-invariant integration test. 2,154 tests.

- [x] Raw ingredients Task 7 — device cold-start verification + lessons (2026-04-13) — fresh-install replay logged v10→v18 in order: v14 Shufersal 4,964 → v15 Rami Levy 6,799 → v16 raw 191 → v17 backfilled 11,954 `name_norm` rows + deleted 152 cross-source dups → v18 FK indices, zero Metro errors. Device search for all 5 spec queries (`חזה עוף`, `אורז לבן`, `תפוח`, `ביצה`, `שמן זית`) surfaced the `raw_%` row first. Portion picker showed the natural unit (100g + קישוא-style serving), log persisted Hebrew name. Closes the 7-task raw-ingredients epic (spec `docs/specs/2026-04-13-raw-ingredients-seed.md`). Lessons added: fresh-install migration chain replay + tier-tiebreaker/cross-source-cleanup defense in depth. Doc-only change: lessons.md + TASKS.md. 2,154 tests unchanged.

- [x] Stitch theme foundation — welcome + goal onboarding rebuild (2026-04-17) — 17 Stitch mocks + DESIGN.md imported as reference (`stitch/`); theme extended with `onPrimary` (#003731), `surfaceContainerLow` (#181c22), `surfaceBright` (#353940); new shared primitives `Icon` (MaterialIcons wrapper), `AmbientOverlay` (SVG radial blobs for hero screens), `SelectionCard` (onboarding radio card with emoji + description + check indicator), `StepProgressHeader` (step/total label + computed %), `InfoCallout` (accent-strip insight card), `BottomButtonBar` (fade-gradient + glow CTA); `Button` gained `glow` prop + primary text color flipped to `onPrimary` (dark-on-teal per mock); `welcome.tsx` rebuilt with glow icon card + ambient overlay + progress dots + glow CTA; `goal.tsx` rebuilt with step progress header + RTL-aligned headline + 3 `SelectionCard`s + `InfoCallout` + fixed bottom button; i18n keys added (`onboarding.common.{stepOf,continue,didYouKnow}`, goal `subtitle`/`*Desc`/`insight`); deps `expo-linear-gradient@~15.0.8` + `expo-blur@~15.0.8` added; `Button.tsx` `isRTL()` conditional removed (forward-compatible with main-repo RTL refactor). +9 tests, 2,163 tests total.

- [x] Post-onboarding plan bootstrap + cold-start rehydrate (2026-04-17) — `src/stores/onboardingBootstrap.{ts,test.ts}` (new testable pair: `finishOnboarding` orchestrates `completeOnboarding → generateWorkoutPlan → generateMealPlan(4)` with short-circuit on first store-level `error`; `rehydratePlans` runs `loadPlan` + `loadActivePlan` + `loadTodaysLog` in parallel then `refreshMealTargets`, no-op when not onboarded). `app/(onboarding)/result.tsx` `handleStart` now calls `finishOnboarding` and surfaces the first non-null error through `useUserStore` before blocking navigation. `app/_layout.tsx` `init()` calls `rehydratePlans` after `loadProfile`. `useUserStore.completeOnboarding` made idempotent (early-return if `isOnboarded`) to fix a retry bug where the now-empty draft would fail `validateDraft` and strand the user. Dev-only "Generate sample plans" comment on `profile.tsx` updated (no longer claims onboarding skips plan generation). Spec: `docs/specs/2026-04-17-post-onboarding-plan-bootstrap.md`. +7 tests, 2,170 tests total.

- [x] Barcode scanner unhappy-path — manual-create fallback + OFF retry (2026-04-18) — `src/services/open-food-facts.{ts,test.ts}` adds pure `retryOnNetworkError` helper + tagged `OffNetworkError` class; `fetchOffProduct` now runs inside the helper with 10s `AbortController` timeout per attempt and one 2s-delayed retry on thrown errors (404 / OFF `status:0` return null → no retry, structural not conditional). `src/security/validation.{ts,test.ts}` adds `ManualFoodInputSchema` + pure `computeAtwaterDelta` helper; schema enforces `nameHe` required, macros clamped 0–900 kcal / 0–100g each, `p+f+c ≤ 101` (1g rounding slack above the 100g physics cap), serving fields complete-or-both-absent, empty-string optional fields preprocessed to `undefined`, error messages emitted as i18n-key tokens so the schema stays locale-agnostic. New `src/components/nutrition/scan-resolver.{ts,test.ts}` extracts `handleBarcodeScanned`'s branching logic into `resolveScan(ean, deps): ScanResolution` with DI deps (`getByBarcode` / `fetchOffProduct` / `insertFood`) and a discriminated-union result (`local_hit` / `off_hit` / `not_found` / `network_error`) — pure helper, 8 tests, no CameraView mocking needed. New `src/components/nutrition/ManualFoodForm.{tsx,test.tsx}` is a Hebrew-first form (name + 4 macros required, fiber + one optional natural-unit serving) that validates via the schema, shows an inline Atwater soft-warning when kcal diverges >25% from `4·p + 9·f + 4·c` (kJ-in-kcal trap catcher, non-blocking), and emits a `FoodItem` with `id: manual_<ean>` + `isUserCreated: true` + auto-prepended 100g serving — 14 tests. `BarcodeScannerSheet.tsx` refactored to use `resolveScan` + adds `scanState: 'creating'` + `lastEan` ref; `not_found` now shows a "צור מוצר חדש" CTA opening the inline form, `no_connection` retries OFF-only via `handleRetryOff(lastEan)` without re-prompting the camera. i18n gained `barcode.notFoundCreate` + a full `manualFood.*` namespace (he + en). Spec: `docs/specs/2026-04-18-barcode-manual-create-fallback.md`. +53 tests (6 retry + 20 schema + 5 Atwater + 8 resolver + 14 form), 2,239 tests total.

## Next Up

- [x] **Barcode scanning** — expo-camera CameraView in FoodSearchSheet, barcode icon in search row, getByBarcode() local DB lookup (sh*/rl*/raw*/manual* tiers), Open Food Facts fallback with normalizeOffProduct(), manual\_<ean> persistence, partial-data badge in PortionPicker, permission-denied → Settings deep-link (2026-04-15)

- [ ] **Manual-create food from text-search "no results"** — reuse `ManualFoodForm.tsx` from the scanner unhappy-path PR. Add a "צור מוצר חדש" CTA in `FoodSearchSheet` when a query returns zero results. Because this path bypasses `getByBarcode` (user may not have a barcode at all, or may type one manually), implement the Q5-decision UX: barcode-less entries get `manual_<uuid>` ids; entries with a typed EAN pre-submit `foodRepository.getById("manual_<ean>")` and show a "מוצר קיים — החלף?" confirm sheet on collision. Also move the "INSERT OR REPLACE is unsafe for generic manual writes" invariant from lessons.md into executable code: add `foodRepository.insertFoodStrict(food)` that throws on collision; `ManualFoodForm`'s host decides to call `insertFoodStrict` (scanner path, guarded) vs `upsertFood` (OFF refresh path, overwrite-legitimate).

- [ ] **Add more Israeli supermarkets** — Tiv Taam, Victory, Yohananof, Am-Pm. Each needs a scraper module following the same pipeline pattern as Shufersal. Deferred until raw ingredients ship and usage data reveals a real catalog gap.
