/**
 * Internationalization module.
 * Hebrew is the primary language. English is secondary.
 *
 * Usage:
 *   import { t } from '@/i18n';
 *   <Text>{t.onboarding.welcome.title}</Text>
 */

import { he } from './he';
import { en } from './en';

export type Language = 'he' | 'en';

const translations = { he, en } as const;

/** Default language */
let currentLanguage: Language = 'he';

/**
 * Returns the current translation object.
 * Use this for all user-facing strings.
 */
export function t() {
  return translations[currentLanguage];
}

/**
 * Sets the active language.
 */
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

/**
 * Returns the current language code.
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Returns true if current language is RTL.
 */
export function isRTL(): boolean {
  return currentLanguage === 'he';
}

export { he, en };
export type { TranslationKeys } from './he';
