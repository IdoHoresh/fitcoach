import { Stack } from 'expo-router'
import { colors } from '@/theme'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'none' }} />
      <Stack.Screen name="goal" />
      <Stack.Screen name="body-stats" />
      <Stack.Screen name="body-fat" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="training-days" />
      <Stack.Screen name="workout-time" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="exercise" />
      <Stack.Screen name="sleep" />
      <Stack.Screen name="mode-choice" />
      <Stack.Screen name="calculating" options={{ gestureEnabled: false }} />
      <Stack.Screen name="result" options={{ gestureEnabled: false }} />
    </Stack>
  )
}
