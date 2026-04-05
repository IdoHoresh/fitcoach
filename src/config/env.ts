/**
 * Environment variable configuration.
 * All env vars are validated at app startup — app crashes early if misconfigured.
 * This prevents silent failures from missing config in production.
 *
 * SECURITY: No fallback values for secrets. If it's not set, the app must not start.
 */

import { z } from 'zod';

/**
 * Schema for required environment variables.
 * Phase 1 (MVP): All optional since we're local-first.
 * Phase 2+: Supabase keys become required.
 */
const envSchema = z.object({
  // RevenueCat — required only when payments are enabled (Phase 4)
  EXPO_PUBLIC_REVENUECAT_API_KEY: z.string().optional(),

  // Supabase — required only when cloud sync is enabled (Phase 2)
  EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Sentry — required only when error tracking is enabled
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

/**
 * Loads and validates environment variables.
 * Call once at app startup. Throws on invalid config.
 */
export function loadEnv(): EnvConfig {
  if (cachedEnv !== null) {
    return cachedEnv;
  }

  const rawEnv = {
    EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[Config] Invalid environment variables:\n${errors}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Checks if a specific feature's required env vars are present.
 * Use this to conditionally enable features.
 */
export function isFeatureEnabled(feature: 'payments' | 'cloud_sync' | 'error_tracking'): boolean {
  const env = loadEnv();

  switch (feature) {
    case 'payments':
      return env.EXPO_PUBLIC_REVENUECAT_API_KEY !== undefined;
    case 'cloud_sync':
      return env.EXPO_PUBLIC_SUPABASE_URL !== undefined
        && env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== undefined;
    case 'error_tracking':
      return env.EXPO_PUBLIC_SENTRY_DSN !== undefined;
  }
}
