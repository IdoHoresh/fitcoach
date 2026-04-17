import { useState, useCallback } from 'react'
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
import type { DayOfWeek } from '@/types'

const MIN_DAYS = 2
const MAX_DAYS = 6

export default function TrainingDaysScreen() {
  const router = useRouter()
  const strings = t().onboarding.schedule
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [selectedDays, setSelectedDays] = useState<string[]>(draft.trainingDays?.map(String) ?? [])

  const dayOptions = strings.days.map((label: string, index: number) => ({
    id: String(index),
    label,
  }))

  const handleToggle = useCallback((id: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(id)) {
        return prev.filter((d) => d !== id)
      }
      if (prev.length >= MAX_DAYS) return prev
      return [...prev, id]
    })
  }, [])

  const isValid = selectedDays.length >= MIN_DAYS && selectedDays.length <= MAX_DAYS

  const handleNext = () => {
    updateDraft({
      trainingDays: selectedDays.map(Number) as DayOfWeek[],
    })
    router.push('/(onboarding)/workout-time')
  }

  return (
    <OnboardingLayout
      step={6}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!isValid}
      testID="training-days-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingSubtitle>
        <Text style={styles.subtitle}>{strings.subtitle}</Text>
      </OnboardingSubtitle>
      <OnboardingContent>
        <OptionSelector
          options={dayOptions}
          selected={selectedDays}
          onSelect={handleToggle}
          layout="list"
          testID="training-days"
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
