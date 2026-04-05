---
name: review
description: Review code changes against FitCoach quality standards. Run after completing any implementation task.
user-invocable: true
agent: true
---

# Code Review

You are reviewing code changes for FitCoach. Act as a senior engineer doing a thorough PR review.

## Process

1. **Read REVIEW.md** for FitCoach-specific review rules
2. **Read lessons.md** for known patterns and gotchas
3. **Get the diff:** Run `git diff` (or `git diff --cached` for staged changes)
4. **Review against all checklist items** in REVIEW.md
5. **Check each file changed** for:
   - Correctness (logic errors, edge cases, off-by-one)
   - Security (secrets, SQL injection, unvalidated input)
   - Performance (expensive operations in loops, unnecessary re-renders)
   - Code quality (naming, duplication, complexity)
   - Test coverage (business logic has tests?)
   - FitCoach-specific (algorithm accuracy, i18n, accessibility)

## Output Format

### Summary

One sentence: what these changes do.

### Findings

For each issue found:

```
[SEVERITY] file:line — description
  Suggestion: how to fix
  Confidence: X/100
```

Severities:

- **BLOCK** — Must fix before merge (security, correctness, data loss)
- **WARN** — Should fix, significant quality concern
- **NIT** — Minor improvement, optional

Only report findings with confidence >= 80.

### Verdict

- **APPROVE** — No blocking issues found
- **REQUEST CHANGES** — Has blocking issues that must be fixed

## After Review

If issues found: list them clearly, offer to fix.
If clean: say "Looks good. Ready to push and open PR."

## Rules

- Do NOT auto-fix issues without showing them first
- Be specific — cite exact file:line for every finding
- No false praise — skip "great job" if there are real issues
- Check lessons.md patterns — flag any that are violated
- Update lessons.md if the review reveals a new pattern
