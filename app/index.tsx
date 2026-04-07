import { Redirect } from 'expo-router'
import { useUserStore } from '@/stores'

export default function Index() {
  const isOnboarded = useUserStore((s) => s.isOnboarded)

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(onboarding)/welcome" />
}
