# Feature: Exercise GIF Demos in Detail Sheet

**Date:** 2026-04-10
**Status:** Approved

## What

Each exercise in the workout screen shows a looping GIF demo at the top of the detail sheet, sourced from ExerciseDB's free V1 API. An info button (ℹ️) on each ExerciseCard provides a quick way to open the sheet.

## Why

Beginners don't know what exercises look like. A short looping animation showing proper form builds confidence and reduces injury risk. This is the #1 feature gym beginners ask for.

## Requirements

- [ ] Add `gifUrl` field to each exercise in `exercises.ts` (mapped from ExerciseDB)
- [ ] Show looping GIF at the top of ExerciseDetailSheet
- [ ] Add ℹ️ info button on each ExerciseCard that opens the detail sheet
- [ ] GIF loads from static CDN URL (no runtime API calls)
- [ ] Loading state while GIF downloads
- [ ] Graceful fallback if GIF fails to load (show exercise name instead)
- [ ] Works offline after first load (React Native Image caching)

## Design

### Data Flow

```
One-time script → ExerciseDB API search → match 70 exercises → save gifUrl in exercises.ts
Runtime: ExerciseDetailSheet → <Image source={{ uri: gifUrl }} /> → static CDN
```

### GIF Source

- API: `https://oss.exercisedb.dev/api/v1/exercises/search?name={name}`
- GIF CDN: `https://static.exercisedb.dev/media/{exerciseId}.gif`
- Resolution: 180p (sufficient for bottom sheet display)
- License: Free for non-commercial use, attribution required

### Files to Modify

| File                                             | Action | Description                         |
| ------------------------------------------------ | ------ | ----------------------------------- |
| `src/data/exercises.ts`                          | Modify | Add `gifUrl` field to each exercise |
| `src/types/workout.ts`                           | Modify | Add `gifUrl` to Exercise interface  |
| `src/components/workout/ExerciseDetailSheet.tsx` | Modify | Add GIF image at top of sheet       |
| `src/components/workout/ExerciseCard.tsx`        | Modify | Add ℹ️ info button                  |
| `scripts/map-exercise-gifs.ts`                   | Create | One-time mapping script             |

### ExerciseCard Layout Change

```
Before:                          After:
┌─────────────────────────┐     ┌─────────────────────────────┐
│ [1] Exercise Name  [muscle]│     │ [1] Exercise Name  [muscle] ℹ️│
│     3 × 8-12 · 1:30 rest │     │     3 × 8-12 · 1:30 rest    │
└─────────────────────────┘     └─────────────────────────────┘
```

### ExerciseDetailSheet Layout Change

```
Before:                          After:
┌─────────────────────────┐     ┌─────────────────────────────┐
│  Exercise Name           │     │  ┌─────────────────────┐    │
│  3 × 8-12 · 1:30 rest   │     │  │   Looping GIF Demo  │    │
│  Primary: chest          │     │  └─────────────────────┘    │
│  ...                     │     │  Exercise Name              │
└─────────────────────────┘     │  3 × 8-12 · 1:30 rest      │
                                │  Primary: chest             │
                                │  ...                        │
                                └─────────────────────────────┘
```

## Acceptance Criteria

- [ ] 70 exercises have `gifUrl` mapped from ExerciseDB
- [ ] GIF displays and loops in detail sheet
- [ ] ℹ️ button on ExerciseCard opens detail sheet
- [ ] Loading state shown while GIF downloads
- [ ] Fallback shown if GIF fails to load
- [ ] No API keys in the app code
- [ ] Attribution to AscendAPI included

## Open Questions

None — all decisions made during brainstorm.
