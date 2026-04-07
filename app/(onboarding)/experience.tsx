import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { OnboardingLayout, OnboardingTitle, OnboardingContent, OptionSelector } from '@/components'
import type { ExperienceLevel } from '@/types'

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: '', description: '' },
  { id: 'intermediate', label: '', description: '' },
]

export default function ExperienceScreen() {
  const router = useRouter()
  const strings = t().onboarding.experience
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)
  const [selected, setSelected] = useState<string>(draft.experience ?? '')

  const options = EXPERIENCE_OPTIONS.map((opt) => ({
    ...opt,
    label: strings[opt.id as keyof typeof strings] as string,
    description: strings[`${opt.id}Desc` as keyof typeof strings] as string,
  }))

  const handleSelect = (id: string) => {
    setSelected(id)
    updateDraft({ experience: id as ExperienceLevel })
  }

  return (
    <OnboardingLayout
      step={4}
      onNext={() => router.push('/(onboarding)/equipment')}
      onBack={() => router.back()}
      nextDisabled={!selected}
      testID="experience-screen"
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
          testID="experience"
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
