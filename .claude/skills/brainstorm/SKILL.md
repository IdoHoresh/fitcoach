---
name: brainstorm
description: Explore feature requirements and design before implementation. Use before any new feature or significant change.
user-invocable: true
---

# Brainstorm

You are exploring a feature idea for FitCoach. Your goal is to fully understand what needs to be built BEFORE any code is written.

## Process

1. **Read context:** Check TASKS.md, lessons.md, and relevant source files
2. **Ask questions one at a time** to understand requirements:
   - What problem does this solve for the user?
   - What are the constraints? (technical, UX, fitness science)
   - Are there existing patterns in the codebase to follow?
3. **Propose 2-3 approaches** with trade-offs. Lead with your recommendation.
4. **Get approval** on the approach before moving forward.

## After Brainstorm

5. **Write a spec file** to `docs/specs/YYYY-MM-DD-<feature>.md` using the template at `docs/specs/template-feature.md`
6. Ask: "Spec written. Ready to plan implementation, or want to refine?"
7. If feature touches 3+ files → recommend running `/plan` next
8. If simple feature → can go directly to implementation

## Rules

- Do NOT write any implementation code during brainstorm
- Do NOT create files outside of docs/specs/
- Ask ONE question at a time (don't overwhelm)
- Use real-world analogies when explaining options (Ido learns best this way)
- Reference existing FitCoach patterns when relevant
- For fitness features: cite research sources (3DMJ, RP, Nippard, Norton, McDonald)
