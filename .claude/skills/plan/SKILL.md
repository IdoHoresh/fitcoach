---
name: plan
description: Break a feature spec into an ordered implementation plan. Use after brainstorm for features touching 3+ files.
user-invocable: true
---

# Plan

You are creating an implementation plan for a FitCoach feature. A spec should already exist in `docs/specs/`.

## Process

1. **Read the spec** from docs/specs/ for this feature
2. **Read lessons.md** for patterns and gotchas
3. **Analyze the codebase** — identify files to create/modify
4. **Break into small tasks** where each task:
   - Does ONE thing
   - Can be implemented in a single fresh context session
   - Has clear acceptance criteria
   - Lists exact files to create/modify

## Plan Format

Write the plan to the spec file (append under ## Implementation Plan):

```markdown
## Implementation Plan

### Task 1: [Name] (S/M/L)

**Files:** `src/...`, `src/...`
**What:** Description of what this task does
**Test first:** Describe the failing test to write BEFORE implementation
**Acceptance:** How to verify it's done (test passes + manual check)

### Task 2: [Name] (S/M/L)

...
```

## TDD Loop (MANDATORY for business logic)

Every task that involves business logic, algorithms, state management, or data transformation
MUST follow this loop:

```
1. Write failing test (RED)    — defines WHAT should happen
2. Implement code (GREEN)      — makes the test pass
3. Refactor (CLEAN)            — improve without breaking tests
4. Run tests to confirm        — all green before moving on
```

For UI-only tasks (styling, layout, navigation), TDD is optional — use manual verification instead.

The test IS the specification. Natural language is ambiguous to AI, but a failing test is an exact, verifiable boundary.

## Rules

- Each task should be completable in one Claude session (~50% context)
- Order tasks by dependency (what must be built first)
- Identify shared types/interfaces that multiple tasks depend on — build those first
- Every business logic task MUST include a "Test first" section describing the test
- Do NOT implement anything — plan only
- Mark the spec status as "Approved" after user confirms the plan

## After Plan

Ask: "Plan ready. Each business logic task starts with a failing test. Want to start Task 1?"
