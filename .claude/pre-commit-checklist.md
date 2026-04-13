# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — feat/raw-ingredients-usda-fetch
- [x] /review skipped — network-bound one-shot script, no business logic, per spec Task 2 "manual verification only"
- [x] lessons.md checked — no new patterns (follows existing fetch-rl-nutrition.ts pattern)
- [x] REVIEW.md checked — no new patterns
- [x] TASKS.md updated — Task 2 entry added with date 2026-04-13
- [x] git diff scanned for secrets/keys/tokens — no secrets found (only empty USDA_API_KEY= placeholder)
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 2,087 tests (unchanged, no new tests — network script)
- [x] Commit size checked — 7 files, 1,946 lines (1,433 data JSON + 189 spec + 314 script + ~10 wiring)
