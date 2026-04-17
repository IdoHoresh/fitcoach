import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import {
  CoachMarksOverlay,
  CoachMarksProvider,
  useCoachMarkTarget,
  useCoachMarks,
  type CoachMarkStep,
} from '@/components/coachMarks'

type TabIconProps = {
  color: string
  size: number
}

const TARGET_HOME = 'tab-home'
const TARGET_WORKOUT = 'tab-workout'
const TARGET_NUTRITION = 'tab-nutrition'

/**
 * Wraps a tab icon in a View whose ref registers as a coach mark target.
 * The icon itself comes through as children so each tab can pass its own.
 */
function TabIconTarget({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  const ref = useCoachMarkTarget(targetId)
  return <View ref={ref}>{children}</View>
}

/**
 * Bridges Zustand state into the coach marks tour.
 * Starts the tour once when the user lands on the tabs after onboarding,
 * and persists completion through the store on Skip / Done.
 */
function CoachMarksTourBridge() {
  const isOnboarded = useUserStore((s) => s.isOnboarded)
  const coachMarksCompleted = useUserStore((s) => s.coachMarksCompleted)
  const isLoading = useUserStore((s) => s.isLoading)
  const { startTour, isActive } = useCoachMarks()

  const steps = useMemo<CoachMarkStep[]>(() => {
    const labels = t().components.coachMarks.tabs
    return [
      { id: TARGET_HOME, title: labels.home.title, body: labels.home.body },
      { id: TARGET_WORKOUT, title: labels.workout.title, body: labels.workout.body },
      { id: TARGET_NUTRITION, title: labels.nutrition.title, body: labels.nutrition.body },
    ]
  }, [])

  useEffect(() => {
    // Wait until profile load is settled, the user is onboarded, and they
    // haven't already completed the tour. Start once.
    if (isLoading) return
    if (!isOnboarded) return
    if (coachMarksCompleted) return
    if (isActive) return

    // Defer slightly so the tab bar has laid out and target refs have been
    // measured before the overlay reads them.
    const handle = setTimeout(() => startTour(steps), 250)
    return () => clearTimeout(handle)
  }, [isLoading, isOnboarded, coachMarksCompleted, isActive, startTour, steps])

  return null
}

export default function TabLayout() {
  const labels = t().tabs
  const markCoachMarksComplete = useUserStore((s) => s.markCoachMarksComplete)

  return (
    <CoachMarksProvider onFinish={markCoachMarksComplete}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: labels.home,
            headerShown: false,
            tabBarIcon: ({ color, size }: TabIconProps) => (
              <TabIconTarget targetId={TARGET_HOME}>
                <Ionicons name="home-outline" size={size} color={color} />
              </TabIconTarget>
            ),
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: labels.workout,
            tabBarIcon: ({ color, size }: TabIconProps) => (
              <TabIconTarget targetId={TARGET_WORKOUT}>
                <Ionicons name="barbell-outline" size={size} color={color} />
              </TabIconTarget>
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: labels.nutrition,
            tabBarIcon: ({ color, size }: TabIconProps) => (
              <TabIconTarget targetId={TARGET_NUTRITION}>
                <Ionicons name="nutrition-outline" size={size} color={color} />
              </TabIconTarget>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
            title: labels.profile,
          }}
        />
      </Tabs>
      <CoachMarksTourBridge />
      <CoachMarksOverlay />
    </CoachMarksProvider>
  )
}
