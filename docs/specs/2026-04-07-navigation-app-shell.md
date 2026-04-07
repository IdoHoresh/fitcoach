# Feature: Navigation & App Shell (Phase 2)

**Date:** 2026-04-07
**Status:** Draft
**GitHub Issue:** TBD

## What

The app's navigation skeleton: a root layout that initializes the database and routes users to either the onboarding flow (stack navigator with back navigation) or the main app (5-tab bottom navigator). Includes a branded splash screen.

## Why

Phase 1 built all algorithms, stores, and data layers. Users currently can't interact with anything — there's no navigation, no screens, no entry point. Phase 2 creates the shell that all future screens plug into.

## Requirements

- [ ] Root layout initializes SQLite database on app launch
- [ ] Root layout checks `useUserStore` for onboarding status
- [ ] Shows loading/splash while store hydrates
- [ ] Routes to onboarding stack if not onboarded
- [ ] Routes to tab navigator if onboarded
- [ ] Onboarding stack supports forward/back navigation
- [ ] Tab navigator has 5 tabs: Home, Workout, Nutrition, Progress, Settings
- [ ] Tab bar shows Hebrew labels (RTL) with icons, respects i18n
- [ ] Active tab uses brand color (#4F46E5), inactive uses gray (#6B7280)
- [ ] Splash screen uses brand color background (no custom logo yet)

## Design

### Architecture

```
app/_layout.tsx (root)
├── Loading state → Splash/brand screen
├── Not onboarded → app/(onboarding)/_layout.tsx (Stack)
│   ├── welcome.tsx (placeholder)
│   └── ... (Phase 4 adds real screens)
└── Onboarded → app/(tabs)/_layout.tsx (Tabs)
    ├── index.tsx — Home (placeholder)
    ├── workout.tsx — Workout (placeholder)
    ├── nutrition.tsx — Nutrition (placeholder)
    ├── progress.tsx — Progress (placeholder)
    └── settings.tsx — Settings (placeholder)
```

### Data Flow

```
App opens → Root layout mounts
  → Initialize SQLite database
  → Hydrate useUserStore from DB
  → Check isOnboarded flag
  → Redirect to (onboarding) or (tabs)
```

### Key Decisions

1. **Routing check:** Store-based via `useUserStore` (not raw DB query)
2. **Onboarding nav:** Stack with back button — users can revise earlier answers
3. **Tab order (RTL):** Home → Workout → Nutrition → Progress → Settings
4. **Tab icons:** Ionicons — home, barbell, nutrition, trending-up, settings
5. **Home tab (Phase 5):** Daily calendar/planner with meals + workouts + timing
6. **Shopping list (Phase 5):** Sub-screen inside Nutrition tab
7. **Splash:** Default Expo splash with #4F46E5 background, swap logo later
8. **Placeholder screens:** Minimal — screen name + icon, styled with theme tokens

### Files to Create/Modify

| File                           | Action | Description                                                |
| ------------------------------ | ------ | ---------------------------------------------------------- |
| `app/_layout.tsx`              | Create | Root layout: DB init, store hydration, conditional routing |
| `app/(onboarding)/_layout.tsx` | Create | Stack navigator for onboarding flow                        |
| `app/(onboarding)/welcome.tsx` | Create | Placeholder onboarding screen                              |
| `app/(tabs)/_layout.tsx`       | Create | Tab navigator: 5 tabs, icons, Hebrew labels, RTL           |
| `app/(tabs)/index.tsx`         | Create | Home tab placeholder                                       |
| `app/(tabs)/workout.tsx`       | Create | Workout tab placeholder                                    |
| `app/(tabs)/nutrition.tsx`     | Create | Nutrition tab placeholder                                  |
| `app/(tabs)/progress.tsx`      | Create | Progress tab placeholder                                   |
| `app/(tabs)/settings.tsx`      | Create | Settings tab placeholder                                   |
| `app.json`                     | Modify | Splash screen background color                             |
| `app/index.tsx`                | Create | Entry redirect (expo-router convention)                    |

## Acceptance Criteria

- [ ] App launches and shows splash screen briefly
- [ ] Fresh user (no profile) → lands on onboarding welcome screen
- [ ] Onboarded user → lands on Home tab
- [ ] Can navigate back in onboarding stack
- [ ] All 5 tabs visible with correct Hebrew labels and icons
- [ ] Active tab highlighted in brand indigo
- [ ] Tab bar respects RTL layout
- [ ] Database initializes without errors on launch
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)

## Task Breakdown

1. [ ] Root layout with DB init + loading state (M)
2. [ ] Onboarding stack layout + placeholder screen (S)
3. [ ] Tab navigator layout with 5 tabs + icons + i18n (M)
4. [ ] 5 tab placeholder screens (S)
5. [ ] Entry redirect + splash config (S)
6. [ ] Manual testing: both routing paths work (S)

## Open Questions

- None — all decisions locked in during brainstorm.
