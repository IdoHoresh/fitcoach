/**
 * Dev-only app reset utility.
 *
 * Wipes the SQLite database and reloads the JS bundle so the app comes back
 * up in its first-install state: no profile → redirected to onboarding →
 * coach marks tour armed to fire again.
 *
 * This file is only imported from `__DEV__`-gated UI — it should never run
 * in production. If you ever need a production-side "delete my data" flow,
 * build it separately with proper confirmation, auth, and telemetry.
 */

import * as SQLite from 'expo-sqlite'
import { DevSettings } from 'react-native'
import { closeDatabase } from '../db'

const DATABASE_NAME = 'fitcoach.db'

/**
 * Closes the DB, deletes the SQLite file, and reloads the JS bundle.
 *
 * After reload:
 *   - RootLayout re-runs `initializeDatabase()` → creates fresh tables
 *   - `useUserStore.loadProfile()` finds no row → `isOnboarded: false`
 *   - `app/index.tsx` redirects to `/welcome`
 *   - Every Zustand store is re-created at its initial state
 */
export async function resetApp(): Promise<void> {
  try {
    await closeDatabase()
  } catch {
    // Already closed or never opened — safe to ignore.
  }

  await SQLite.deleteDatabaseAsync(DATABASE_NAME)

  // `DevSettings.reload` only exists in dev builds. In production this file
  // shouldn't be imported at all, but guard just in case.
  if (typeof DevSettings?.reload === 'function') {
    DevSettings.reload()
  }
}
