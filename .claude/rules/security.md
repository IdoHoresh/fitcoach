---
description: Security rules for sensitive files
paths:
  - 'src/security/**/*.ts'
  - 'src/config/**/*.ts'
  - '.env*'
---

# Security Rules

- NEVER hardcode secrets — environment variables only, no fallback values
- Zod validation on ALL data boundaries
- expo-secure-store for sensitive user data
- Validate environment variables at startup (fail fast)
- No secrets in error messages or logs
