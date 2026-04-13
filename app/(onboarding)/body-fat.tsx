import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontFamily, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { VALIDATION } from '@/data/constants'
import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingSubtitle,
  OnboardingContent,
  NumberInput,
  Button,
} from '@/components'

export default function BodyFatScreen() {
  const router = useRouter()
  const strings = t().onboarding.bodyStats
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [bodyFat, setBodyFat] = useState(draft.bodyFatPercent ?? 20)
  const [skipped, setSkipped] = useState(draft.bodyFatPercent === null)

  const handleNext = () => {
    updateDraft({ bodyFatPercent: skipped ? null : bodyFat })
    router.push('/(onboarding)/experience')
  }

  const handleSkip = () => {
    setSkipped(true)
    updateDraft({ bodyFatPercent: null })
    router.push('/(onboarding)/experience')
  }

  return (
    <OnboardingLayout
      step={3}
      onNext={handleNext}
      onBack={() => router.back()}
      testID="body-fat-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.bodyFat}</Text>
      </OnboardingTitle>
      <OnboardingSubtitle>
        <Text style={styles.helpText}>{strings.bodyFatHelp}</Text>
      </OnboardingSubtitle>
      <OnboardingContent>
        <NumberInput
          label="%"
          value={bodyFat}
          onChangeValue={(v) => {
            setBodyFat(v)
            setSkipped(false)
          }}
          min={VALIDATION.BODY_FAT_PERCENT.min}
          max={VALIDATION.BODY_FAT_PERCENT.max}
          step={1}
          unit="%"
          testID="body-fat"
        />
        <Button
          label={strings.bodyFatSkip}
          onPress={handleSkip}
          variant="ghost"
          size="md"
          testID="body-fat-skip"
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
    marginBottom: spacing.md,
  },
  helpText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
})
