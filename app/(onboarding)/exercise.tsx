import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontFamily, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { OnboardingLayout, OnboardingTitle, OnboardingContent, OptionSelector } from '@/components'
import type { ExerciseType, ExerciseIntensity, SessionDuration } from '@/types'

const DAYS_OPTIONS = Array.from({ length: 7 }, (_, i) => ({
  id: String(i + 1),
  label: String(i + 1),
}))

const DURATION_VALUES: SessionDuration[] = [30, 45, 60, 75, 90]

const TYPE_KEYS = ['strength', 'cardio', 'both'] as const
const INTENSITY_KEYS = ['light', 'moderate', 'intense'] as const

export default function ExerciseScreen() {
  const router = useRouter()
  const strings = t().onboarding.exercise
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [daysPerWeek, setDaysPerWeek] = useState<string>(
    draft.lifestyle?.exerciseDaysPerWeek?.toString() ?? '',
  )
  const [duration, setDuration] = useState<string>(
    draft.lifestyle?.sessionDurationMinutes?.toString() ?? '',
  )
  const [exerciseType, setExerciseType] = useState<string>(draft.lifestyle?.exerciseType ?? '')
  const [intensity, setIntensity] = useState<string>(draft.lifestyle?.exerciseIntensity ?? '')

  const durationOptions = DURATION_VALUES.map((val) => ({
    id: String(val),
    label: `${val} ${strings.minutes}`,
  }))

  const typeOptions = TYPE_KEYS.map((key) => ({
    id: key,
    label: strings[key] as string,
  }))

  const intensityOptions = INTENSITY_KEYS.map((key) => ({
    id: key,
    label: strings[key] as string,
  }))

  const isValid = daysPerWeek !== '' && duration !== '' && exerciseType !== '' && intensity !== ''

  const handleNext = () => {
    updateDraft({
      lifestyle: {
        ...draft.lifestyle,
        exerciseDaysPerWeek: Number(daysPerWeek),
        sessionDurationMinutes: Number(duration) as SessionDuration,
        exerciseType: exerciseType as ExerciseType,
        exerciseIntensity: intensity as ExerciseIntensity,
      } as typeof draft.lifestyle,
    })
    router.push('/(onboarding)/sleep')
  }

  return (
    <OnboardingLayout
      step={8}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!isValid}
      testID="exercise-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        <Text style={styles.sectionLabel}>{strings.daysPerWeek}</Text>
        <OptionSelector
          options={DAYS_OPTIONS}
          selected={daysPerWeek}
          onSelect={setDaysPerWeek}
          layout="grid"
          testID="days-per-week"
        />

        <Text style={styles.sectionLabel}>{strings.sessionLength}</Text>
        <OptionSelector
          options={durationOptions}
          selected={duration}
          onSelect={setDuration}
          layout="grid"
          testID="session-duration"
        />

        <Text style={styles.sectionLabel}>{strings.type}</Text>
        <OptionSelector
          options={typeOptions}
          selected={exerciseType}
          onSelect={setExerciseType}
          layout="list"
          testID="exercise-type"
        />

        <Text style={styles.sectionLabel}>{strings.intensity}</Text>
        <OptionSelector
          options={intensityOptions}
          selected={intensity}
          onSelect={setIntensity}
          layout="list"
          testID="exercise-intensity"
        />
      </OnboardingContent>
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
})
