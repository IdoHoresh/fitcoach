# FitCoach — Lessons Learned

Codebase-specific patterns, gotchas, and decisions. Claude reads this at session start.

## What Has Worked

- Component-based TDEE is more accurate than single activity multiplier
- Equipment as checklist (not tiers) handles all gym configurations cleanly
- Every constant with a research citation prevents "where did this number come from?" confusion
- Zod schemas as single source of truth for validation + types

## What Has Failed

<!-- Add patterns that caused bugs or PR feedback here -->

## Expo / React Native Gotchas

<!-- Add RN-specific issues as we encounter them -->

## Architecture Patterns

- Pure functions for all algorithms (no side effects, easy to test)
- Barrel exports (index.ts) in each module folder
- Path aliases (@/algorithms, @/types) for clean imports
- Parameterized SQL only — never concatenate user input

## Open Questions

- Zustand store structure: one store per domain or single store?
- Navigation: stack-based onboarding → tab-based main app?
- Offline-first sync strategy when we add a backend later?
