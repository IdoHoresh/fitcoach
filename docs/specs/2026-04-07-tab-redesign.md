# Feature: Tab Redesign — 3 Tabs RTL

**Date:** 2026-04-07
**Status:** Draft
**Phase:** 2 (Navigation update)

## What

Reduce the tab bar from 5 tabs to 3 (Home, Workout, Nutrition) in RTL order (Home on the right). Remove Progress and Settings as standalone tabs. Add a time-aware greeting to the Home header with an avatar button for profile/settings access.

## Why

- 5 tabs is crowded — beginners face decision fatigue
- Settings is rarely visited, doesn't deserve a tab
- Progress is a weekly check, not a daily action — will live in the Home dashboard later
- Hebrew reads right-to-left, so the primary tab (Home) belongs on the right
- A personal greeting makes the app feel like a real coach, not a generic tool

## Decisions (from brainstorm)

1. **3 tabs in RTL order:** Nutrition | Workout | Home (Home on the right)
2. **Avatar button (top-right of Home header):** User's initial in a circle, opens Profile/Settings screen
3. **Time-aware greeting as Home header title:** "בוקר טוב, אידו" / "ערב טוב, אידו" etc.
4. **Motivational subtitle:** Random line from a pool of ~20 motivational strings, rotates on app open
5. **v1.0 scope:** Static motivational pool. Upgrade to context-aware (workout status, macros, streak) in Phase 5.

## Requirements

- [ ] Tab bar shows exactly 3 tabs: Nutrition, Workout, Home
- [ ] Tab order is RTL: Nutrition (left) → Workout (center) → Home (right)
- [ ] Home header shows time-aware greeting with user's name
- [ ] Home header shows rotating motivational subtitle
- [ ] Avatar button in Home header top-right with user's initial
- [ ] Avatar tapping navigates to a Profile/Settings screen (placeholder for now)
- [ ] Progress and Settings tab screens removed
- [ ] i18n strings for greetings, motivational lines, and profile label (he + en)
- [ ] All user-facing text in i18n (no hardcoded strings)

## Design

### Time Greeting Logic

| Time Range    | Hebrew               | English                |
| ------------- | -------------------- | ---------------------- |
| 05:00 - 11:59 | בוקר טוב, {name}     | Good morning, {name}   |
| 12:00 - 16:59 | צהריים טובים, {name} | Good afternoon, {name} |
| 17:00 - 23:59 | ערב טוב, {name}      | Good evening, {name}   |
| 00:00 - 04:59 | לילה טוב, {name}     | Good night, {name}     |

### Motivational Subtitle Pool (~20 strings)

Rotates randomly on each app open. Examples:

- "Consistency beats intensity" / "עקביות מנצחת עוצמה"
- "Every rep counts" / "כל חזרה נחשבת"
- "Your future self will thank you" / "העצמי העתידי שלך יודה לך"
- "Progress, not perfection" / "התקדמות, לא שלמות"
- (Full list in i18n files)

### Avatar Button

- Circle, 32px, background `colors.primary`
- White text: first letter of user's name (or "?" if no name yet)
- Position: Home header right side
- Tap: pushes to a Profile screen (placeholder stub for now)

### Architecture

```
app/(tabs)/
  _layout.tsx        — 3 tabs, RTL order
  index.tsx          — Home with greeting header
  workout.tsx        — unchanged placeholder
  nutrition.tsx      — unchanged placeholder
app/(tabs)/profile.tsx  — new placeholder (pushed from avatar)

src/i18n/he.ts      — add greetings + motivational pool
src/i18n/en.ts      — mirror
```

### Files to Create/Modify

| File                      | Action | Description                            |
| ------------------------- | ------ | -------------------------------------- |
| `app/(tabs)/_layout.tsx`  | Modify | 3 tabs, RTL order, custom Home header  |
| `app/(tabs)/index.tsx`    | Modify | Greeting + subtitle + avatar           |
| `app/(tabs)/progress.tsx` | Delete | Merged into Home                       |
| `app/(tabs)/settings.tsx` | Delete | Replaced by Profile                    |
| `app/(tabs)/profile.tsx`  | Create | Placeholder profile/settings screen    |
| `src/i18n/he.ts`          | Modify | Greetings, motivational lines, profile |
| `src/i18n/en.ts`          | Modify | Mirror Hebrew structure                |

## Acceptance Criteria

- [ ] Tab bar shows 3 tabs in RTL order: Nutrition | Workout | Home
- [ ] Home on the right side of the tab bar
- [ ] Home header shows correct time-aware greeting (morning/afternoon/evening/night)
- [ ] Motivational subtitle displays below greeting
- [ ] Avatar button visible in header, shows user initial
- [ ] Avatar tap navigates to Profile screen
- [ ] Progress and Settings tabs no longer exist
- [ ] All strings in i18n (he + en)
- [ ] Existing tests still pass

## Task Breakdown

1. [ ] i18n strings — greetings, motivational pool, profile label (S)
2. [ ] Tab layout redesign — 3 tabs RTL, remove progress/settings (S)
3. [ ] Home screen — greeting header, subtitle, avatar button (M)
4. [ ] Profile screen placeholder (S)

## Open Questions

None — all resolved in brainstorm.

## Implementation Plan

### Task 1: i18n Strings + Greeting Logic (S)

**Files:**

- `src/i18n/he.ts` — add greetings, motivational pool, profile label
- `src/i18n/en.ts` — mirror Hebrew structure
- `src/utils/greeting.ts` — pure function: hour → greeting key
- `src/utils/greeting.test.ts` — TDD tests for time boundaries

**What:** Add all i18n strings needed by the redesign (greetings for 4 time periods, ~20 motivational lines, profile tab label). Create a pure `getGreetingKey(hour: number)` function that returns `'morning' | 'afternoon' | 'evening' | 'night'` based on the hour. Also add `getRandomMotivation()` that picks a random string from the pool.

**Test first (TDD — business logic):**

- `getGreetingKey(6)` returns `'morning'` (05:00-11:59)
- `getGreetingKey(14)` returns `'afternoon'` (12:00-16:59)
- `getGreetingKey(20)` returns `'evening'` (17:00-23:59)
- `getGreetingKey(3)` returns `'night'` (00:00-04:59)
- Boundary tests: `getGreetingKey(5)` → morning, `getGreetingKey(12)` → afternoon, `getGreetingKey(17)` → evening, `getGreetingKey(0)` → night
- `getRandomMotivation()` returns a string from the pool
- `getRandomMotivation()` never returns undefined

**Acceptance:** Tests pass, `npm run typecheck` clean (i18n types match between he/en).

### Task 2: Tab Layout Redesign + Home Screen + Profile (M)

**Files:**

- `app/(tabs)/_layout.tsx` — 3 tabs, RTL order, custom Home header with avatar
- `app/(tabs)/index.tsx` — greeting + subtitle + avatar button
- `app/(tabs)/profile.tsx` — new placeholder screen
- `app/(tabs)/progress.tsx` — delete
- `app/(tabs)/settings.tsx` — delete

**What:** Restructure the tab layout to 3 tabs in RTL order (Nutrition left, Workout center, Home right). Remove progress and settings screens. Update Home screen with time-aware greeting header, motivational subtitle, and avatar button that navigates to a new Profile placeholder screen. Avatar shows user's first initial in a primary-colored circle.

**Test first:** TDD not required — this is UI/navigation work. Verified manually + existing tests still pass.

**Acceptance:**

- Tab bar shows exactly 3 tabs: Nutrition | Workout | Home (left to right)
- Home tab is on the right (RTL convention)
- Home header shows correct greeting for current time of day
- Motivational subtitle visible below greeting
- Avatar circle visible in header with "?" (no user name in store yet)
- Tapping avatar navigates to Profile screen
- `progress.tsx` and `settings.tsx` deleted
- `npm run typecheck` clean
- `npm run lint` clean
- All existing tests pass
