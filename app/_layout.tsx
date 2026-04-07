import { useEffect, useState } from 'react'
import { I18nManager } from 'react-native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { initializeDatabase } from '@/db'
import { useUserStore } from '@/stores'
import { isRTL } from '@/i18n'

// Keep splash visible while we initialize
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // 1. Initialize SQLite database (must happen before any store reads)
        await initializeDatabase()

        // 2. Load user profile from DB into Zustand store
        await useUserStore.getState().loadProfile()

        // 3. Force RTL layout for Hebrew
        I18nManager.forceRTL(isRTL())
      } catch (error) {
        // Log but don't crash — app can still show onboarding
        console.error('[RootLayout] Initialization error:', error)
      } finally {
        setAppReady(true)
        await SplashScreen.hideAsync()
      }
    }

    init()
  }, [])

  // Keep splash screen visible until ready
  if (!appReady) return null

  return <Slot />
}
