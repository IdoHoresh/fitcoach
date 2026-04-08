# Workflow Rules (HIGHEST PRIORITY — ABSOLUTE)

**NEVER skip, auto-check, or rubber-stamp ANY step. NOT ONE. EVER.**

This applies to the ENTIRE flow — every single step from branch creation to TASKS.md update. Missing even one step is a failure.

## The Complete Flow (ALL 16 steps, EVERY time)

### Before Code

1. **Branch** — `git checkout -b feat/<name>` before ANY code
2. **Brainstorm** — `/brainstorm` for new features, ask questions, get approval
3. **Plan** — `/plan` if 3+ files, get approval before implementation

### During Implementation

4. **TDD** — failing test → implement → refactor → run tests (mandatory for business logic)

### Before Commit (show ALL verification in conversation)

5. **Review** — run `/review`, fix ALL findings
6. **Lessons** — read review findings, add to lessons.md or state WHY nothing applies
7. **REVIEW.md** — check if review revealed new patterns, add or state WHY nothing applies
8. **Branch check** — run `git branch --show-current`, show output
9. **Secrets scan** — run `git diff --cached`, actually scan for keys/tokens, state "no secrets found"
10. **Lint** — run `npm run lint`, show clean output
11. **Typecheck** — run `npm run typecheck`, show clean output
12. **Tests** — run `npm test`, show pass count
13. **Size check** — run `git diff --cached --stat`, show line count, warn if >500
14. **Commit** — only after ALL above steps verified and shown

### After Commit

15. **Push + PR** — with complete test plan
16. **Wait for CI** — never start next task until CI passes

### After CI Passes (BEFORE merging)

17. **Verify EVERY test plan item individually** — run each command, show output, THEN check the box. NEVER batch-check items. If a test plan says "verify X", run the specific test or command that proves X and show the result. Checking a box without showing proof is rubber-stamping and is FORBIDDEN.

### After PR Merged

18. **Update CI checkbox** — mark CI item as checked in PR test plan
19. **Create Notion page** — beginner-friendly guide following template in memory/reference_notion_template.md
20. **Update TASKS.md** — move completed items to Done section, update test count

### MANDATORY POST-COMMIT BLOCK

**After EVERY commit, before doing ANYTHING else, output this checklist and verify each item:**

```
POST-COMMIT VERIFICATION:
□ Push + PR created
□ Wait for CI
□ CI passed → verify each test plan item with output shown → check boxes
□ PR merged → pull main
□ Notion page created
□ TASKS.md updated
```

**Do NOT move to the next task until ALL boxes are checked.**

### After ALL Post-Merge Steps Complete

21. **Recommend context clear** — Tell the user to run `/clear` and provide a ready-to-paste prompt for the next session. The prompt must include:
    - What the next task is (from TASKS.md)
    - What just shipped (PR number)
    - Current test count
    - What to start with (`/brainstorm`, `/plan`, or direct implementation)

**Example:**

```
Next task: [task name] — [brief description]. PR #X ([feature]) just merged. Y tests passing. Start with /brainstorm.
```

### Every 5 PRs — Full Codebase QA

After every 5th merged PR, run a deep QA review before starting the next feature. This catches cross-cutting bugs that per-PR reviews miss.

**What it covers:**

1. **Schema ↔ repository alignment** — every INSERT/UPDATE column exists in the CREATE TABLE
2. **TODO audit** — any TODO in a logic path (not comments/docs) is treated as a defect and fixed
3. **Cross-module consistency** — duplicate utilities, divergent implementations of the same concept
4. **Integration correctness** — things unit tests can't catch because the DB is mocked
5. **Validation coverage** — algorithm entry points, data boundaries, error paths
6. **Security scan** — log messages, error messages, hardcoded values

**How:** Launch 3 parallel Explore agents (algorithms+types, DB+security+stores, UI+tests+config), compile findings, fix, verify all tests/lint/typecheck pass.

**Track it:** After each PR merge, note the PR count. On every 5th PR, the next session starts with QA instead of a new feature.

## Why This Matters

FitCoach handles people's health data. Every shortcut is a potential bug that reaches real users. Ido has asked MULTIPLE TIMES to never skip steps. This rule has been violated before. It must NEVER be violated again.
