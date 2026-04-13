# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — fix/usda-fetch-pinned-fdcids
- [x] /review skipped — script CLI flag + config data, mechanical; no business logic
- [x] lessons.md updated — 3 USDA-specific entries (search top-hit untrustworthy, SR Legacy regional-cheese gaps, surgical re-fetch pattern)
- [x] REVIEW.md checked — no new cross-cutting pattern (insights are USDA-pipeline specific)
- [x] TASKS.md updated — Raw ingredients fetch fixes entry added with date 2026-04-13
- [x] git diff scanned for secrets/keys/tokens — no secrets found (only `USDA_API_KEY` env var name in docs, no values)
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 2,087 tests (unchanged, no new tests — config + script flag only)
- [x] Commit size checked — 4 files, +88/-80 lines
