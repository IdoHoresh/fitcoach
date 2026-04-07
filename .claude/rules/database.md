---
description: Database safety rules for SQLite code
paths:
  - 'src/db/**/*.ts'
---

# Database Rules

- Parameterized SQL ONLY — never string concatenation
- Use BaseRepository<T> pattern for all models
- Validate all inputs with Zod before writing to database
- Use expo-secure-store for sensitive user data (tokens, passwords)
- Always handle null results from queries
