import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingSubtitle,
  OnboardingContent,
  OptionSelector,
} from '@/components'
import type { WorkoutTime } from '@/types'

const WORKOUT_TIME_OPTIONS: {
  id: WorkoutTime
  icon: string
  descKey: 'morningDesc' | 'eveningDesc' | 'flexibleDesc'
}[] = [
  { id: 'morning', icon: '🌅', descKey: 'morningDesc' },
  { id: 'evening', icon: '🌙', descKey: 'eveningDesc' },
  { id: 'flexible', icon: '🔄', descKey: 'flexibleDesc' },
]

export default function WorkoutTimeScreen() {
  const router = useRouter()
  const strings = t().onboarding.workoutTime
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [selected, setSelected] = useState<string>(draft.workoutTime ?? '')

  const options = WORKOUT_TIME_OPTIONS.map(({ id, icon, descKey }) => ({
    id,
    label: strings[id],
    description: strings[descKey],
    icon,
  }))

  const handleSelect = (id: string) => {
    setSelected(id)
    updateDraft({ workoutTime: id as WorkoutTime })
  }

  return (
    <OnboardingLayout
      step={7}
      onNext={() => router.push('/(onboarding)/activity')}
      onBack={() => router.back()}
      nextDisabled={!selected}
      testID="workout-time-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingSubtitle>
        <Text style={styles.subtitle}>{strings.subtitle}</Text>
      </OnboardingSubtitle>
      <OnboardingContent>
        <OptionSelector
          options={options}
          selected={selected}
          onSelect={handleSelect}
          layout="list"
          testID="workout-time"
        />
      </OnboardingContent>
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
})
