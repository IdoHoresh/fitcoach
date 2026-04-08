/**
 * Secure storage wrapper.
 * Sensitive data (tokens, API keys) goes through expo-secure-store (encrypted keychain).
 * Non-sensitive data goes through regular storage.
 *
 * This abstraction means we can swap the implementation without touching business logic.
 */

import * as SecureStore from 'expo-secure-store'

/** Maximum value length for expo-secure-store (iOS Keychain limit) */
const MAX_SECURE_VALUE_LENGTH = 2048

/**
 * Stores a sensitive value in the device's encrypted keychain.
 * Returns true on success, false on failure (never throws).
 */
export async function setSecureItem(key: string, value: string): Promise<boolean> {
  if (value.length > MAX_SECURE_VALUE_LENGTH) {
    console.warn(
      `[SecureStorage] Value too long (${value.length} chars, max ${MAX_SECURE_VALUE_LENGTH})`,
    )
    return false
  }

  try {
    await SecureStore.setItemAsync(key, value)
    return true
  } catch (error) {
    console.error('[SecureStorage] Failed to store value:', error)
    return false
  }
}

/**
 * Retrieves a sensitive value from the encrypted keychain.
 * Returns null if the key doesn't exist or on error (never throws).
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch (error) {
    console.error('[SecureStorage] Failed to retrieve value:', error)
    return null
  }
}

/**
 * Deletes a sensitive value from the encrypted keychain.
 * Returns true on success, false on failure (never throws).
 */
export async function deleteSecureItem(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key)
    return true
  } catch (error) {
    console.error('[SecureStorage] Failed to delete value:', error)
    return false
  }
}
