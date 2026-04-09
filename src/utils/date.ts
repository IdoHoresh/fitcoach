/**
 * Date helpers shared across the app.
 *
 * Note: there is also a `todayISO()` in `src/db/base-repository.ts` that
 * is scoped to the DB layer. Do not import that one from UI code — the
 * component test suite mocks `@/db` wholesale, and importing date helpers
 * from the DB module would couple the UI to the mock surface. Keep these
 * UI-friendly helpers here.
 */

/**
 * Returns today's date as an ISO-8601 date string (`YYYY-MM-DD`) in the
 * device's local timezone. Matches the convention used everywhere the
 * Home tab compares log entries against "today".
 *
 * Deliberately uses `new Date()` + local getters (not `toISOString`)
 * because `toISOString` always renders UTC — in Israel (UTC+2/3) that
 * would misclassify late-evening entries as tomorrow. See
 * lessons.md → "Date parsing timezone traps".
 */
export function todayISO(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
