/**
 * Dev-only app reset utility.
 *
 * Wipes the SQLite database so the app comes back up in its first-install
 * state: no profile → redirected to onboarding → coach marks tour armed
 * to fire again.
 *
 * Why we do NOT auto-reload the JS bundle:
 *
 * `DevSettings.reload()` re-evaluates the JS bundle but does NOT trigger a
 * full native restart. On iOS, `I18nManager.forceRTL(true)` is a native-side
 * flag that only takes effect on the NEXT native launch — a JS-only reload
 * keeps the Yoga layout engine in whatever direction it was when the app
 * originally launched. After a JS reload, the module-level guard in
 * `app/_layout.tsx` sees `I18nManager.isRTL === true` and correctly skips
 * re-forcing, but the layout engine still renders some views LTR because
 * it was never re-initialized for RTL.
 *
 * The only reliable fix is to force-close and relaunch the app from the OS.
 * So this utility wipes the DB and then tells the user to do exactly that.
 *
 * This file is only imported from `__DEV__`-gated UI — it should never run
 * in production. If you ever need a production-side "delete my data" flow,
 * build it separately with proper confirmation, auth, and telemetry.
 */

import * as SQLite from 'expo-sqlite'
import { closeDatabase } from '../db'

const DATABASE_NAME = 'fitcoach.db'

/**
 * Closes the DB and deletes the SQLite file. Does NOT reload the bundle —
 * the caller must instruct the user to force-close and reopen the app so
 * RTL re-initializes cleanly on iOS.
 */
export async function resetApp(): Promise<void> {
  try {
    await closeDatabase()
  } catch {
    // Already closed or never opened — safe to ignore.
  }

  await SQLite.deleteDatabaseAsync(DATABASE_NAME)
}
