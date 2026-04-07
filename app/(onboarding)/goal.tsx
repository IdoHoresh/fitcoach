import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { OnboardingLayout, OnboardingTitle, OnboardingContent, OptionSelector } from '@/components'
import type { TrainingGoal } from '@/types'

const GOAL_I18N_MAP: Record<
  TrainingGoal,
  { key: 'muscleGain' | 'fatLoss' | 'maintenance'; icon: string }
> = {
  muscle_gain: { key: 'muscleGain', icon: '💪' },
  fat_loss: { key: 'fatLoss', icon: '🔥' },
  maintenance: { key: 'maintenance', icon: '⚖️' },
}

export default function GoalScreen() {
  const router = useRouter()
  const strings = t().onboarding.goal
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)
  const [selected, setSelected] = useState<string>(draft.goal ?? '')

  const options = (
    Object.entries(GOAL_I18N_MAP) as [TrainingGoal, (typeof GOAL_I18N_MAP)[TrainingGoal]][]
  ).map(([id, { key, icon }]) => ({
    id,
    label: strings[key],
    icon,
  }))

  const handleSelect = (id: string) => {
    setSelected(id)
    updateDraft({ goal: id as TrainingGoal })
  }

  return (
    <OnboardingLayout
      step={1}
      onNext={() => router.push('/(onboarding)/body-stats')}
      onBack={() => router.back()}
      nextDisabled={!selected}
      testID="goal-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        <OptionSelector
          options={options}
          selected={selected}
          onSelect={handleSelect}
          layout="list"
          testID="goal"
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
    marginBottom: spacing.xl,
  },
})
