// react-native-gesture-handler must be imported FIRST — before any other
// import that might transitively load components which use gestures (e.g.
// the A2 portion-slider). Importing GestureHandlerRootView from RNGH
// triggers the same side-effect side; one import is enough.
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { useEffect, useState } from 'react'
import { I18nManager } from 'react-native'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik'
import { initializeDatabase } from '@/db'
import { useUserStore, useWorkoutStore, useNutritionStore } from '@/stores'
import { rehydratePlans } from '@/stores/onboardingBootstrap'
import { isRTL } from '@/i18n'

// Force RTL at module level — must happen before first render.
// On Android, forceRTL requires an app restart to take effect.
if (isRTL() && !I18nManager.isRTL) {
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(true)
}

// Keep splash visible while we initialize
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false)

  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  })

  useEffect(() => {
    async function init() {
      try {
        // 1. Initialize SQLite database (must happen before any store reads)
        await initializeDatabase()

        // 2. Load user profile from DB into Zustand store
        await useUserStore.getState().loadProfile()

        // 3. Re-hydrate workout + nutrition stores so the tabs have real data
        //    on cold start. No-op for users who haven't finished onboarding.
        await rehydratePlans({
          isOnboarded: useUserStore.getState().isOnboarded,
          loadWorkoutPlan: () => useWorkoutStore.getState().loadPlan(),
          loadActiveMealPlan: () => useNutritionStore.getState().loadActivePlan(),
          loadTodaysLog: () => useNutritionStore.getState().loadTodaysLog(),
          refreshMealTargets: () => useNutritionStore.getState().refreshMealTargets(),
        })

        // RTL is forced at module level (above), no need to do it here
      } catch (error) {
        // Log but don't crash — app can still show onboarding
        console.error('[RootLayout] Initialization error:', error)
      } finally {
        setAppReady(true)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (appReady && fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [appReady, fontsLoaded])

  // Keep splash screen visible until ready
  if (!appReady || !fontsLoaded) return null

  // GestureHandlerRootView wraps the app so RNGH's gesture recognizers can
  // hook into the view hierarchy. Required for any gesture in any descendant.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  )
}
