import { useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import { useUserStore } from '@/stores/useUserStore'
import { VALIDATION } from '@/data/constants'
import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingSubtitle,
  OnboardingContent,
  OptionSelector,
  NumberInput,
  Button,
} from '@/components'
import type { OccupationType, LifestyleActivity } from '@/types'

const OCCUPATION_OPTIONS = [
  { id: 'desk', i18nKey: 'desk', descKey: 'deskDesc' },
  { id: 'mixed', i18nKey: 'mixed', descKey: 'mixedDesc' },
  { id: 'active', i18nKey: 'active', descKey: 'activeDesc' },
  { id: 'physical_labor', i18nKey: 'physicalLabor', descKey: 'physicalLaborDesc' },
] as const

const LIFESTYLE_OPTIONS = [
  { id: 'sedentary', i18nKey: 'sedentary', descKey: 'sedentaryDesc' },
  { id: 'moderate', i18nKey: 'moderate', descKey: 'moderateDesc' },
  { id: 'active', i18nKey: 'active', descKey: 'activeDesc' },
] as const

const STEPS_DEFAULT = 5000
const STEPS_STEP = 1000

export default function ActivityScreen() {
  const router = useRouter()
  const occupationStrings = t().onboarding.occupation
  const lifestyleStrings = t().onboarding.lifestyle
  const stepsStrings = t().onboarding.steps
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [occupation, setOccupation] = useState<string>(draft.lifestyle?.occupation ?? '')
  const [afterWorkActivity, setAfterWorkActivity] = useState<string>(
    draft.lifestyle?.afterWorkActivity ?? '',
  )
  const [dailySteps, setDailySteps] = useState<number | null>(draft.lifestyle?.dailySteps ?? null)
  const [showSteps, setShowSteps] = useState(
    draft.lifestyle?.dailySteps !== null && draft.lifestyle?.dailySteps !== undefined,
  )

  const occupationOptions = OCCUPATION_OPTIONS.map((opt) => ({
    id: opt.id,
    label: occupationStrings[opt.i18nKey as keyof typeof occupationStrings] as string,
    description: occupationStrings[opt.descKey as keyof typeof occupationStrings] as string,
  }))

  const lifestyleOptions = LIFESTYLE_OPTIONS.map((opt) => ({
    id: opt.id,
    label: lifestyleStrings[opt.i18nKey as keyof typeof lifestyleStrings] as string,
    description: lifestyleStrings[opt.descKey as keyof typeof lifestyleStrings] as string,
  }))

  const isValid = occupation !== '' && afterWorkActivity !== ''

  const handleNext = () => {
    updateDraft({
      lifestyle: {
        ...draft.lifestyle,
        occupation: occupation as OccupationType,
        afterWorkActivity: afterWorkActivity as LifestyleActivity,
        dailySteps,
      } as typeof draft.lifestyle,
    })
    router.push('/(onboarding)/exercise')
  }

  const handleDontKnow = () => {
    setShowSteps(false)
    setDailySteps(null)
  }

  const handleShowSteps = () => {
    setShowSteps(true)
    setDailySteps(STEPS_DEFAULT)
  }

  return (
    <OnboardingLayout
      step={8}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!isValid}
      testID="activity-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{occupationStrings.title}</Text>
      </OnboardingTitle>
      <OnboardingSubtitle>
        <Text style={styles.subtitle}>{occupationStrings.subtitle}</Text>
      </OnboardingSubtitle>
      <OnboardingContent>
        <OptionSelector
          options={occupationOptions}
          selected={occupation}
          onSelect={setOccupation}
          layout="list"
          testID="occupation"
        />

        <Text style={styles.sectionTitle}>{lifestyleStrings.title}</Text>
        <Text style={styles.sectionSubtitle}>{lifestyleStrings.subtitle}</Text>
        <OptionSelector
          options={lifestyleOptions}
          selected={afterWorkActivity}
          onSelect={setAfterWorkActivity}
          layout="list"
          testID="after-work-activity"
        />

        <Text style={styles.sectionTitle}>{stepsStrings.title}</Text>
        <Text style={styles.sectionSubtitle}>{stepsStrings.subtitle}</Text>
        {showSteps ? (
          <View style={styles.stepsContainer}>
            <NumberInput
              label={stepsStrings.inputPlaceholder}
              value={dailySteps ?? STEPS_DEFAULT}
              onChangeValue={setDailySteps}
              min={VALIDATION.DAILY_STEPS.min}
              max={VALIDATION.DAILY_STEPS.max}
              step={STEPS_STEP}
              testID="daily-steps"
            />
            <Button
              label={stepsStrings.dontKnow}
              onPress={handleDontKnow}
              variant="ghost"
              size="sm"
              testID="dont-know-steps"
            />
          </View>
        ) : (
          <View style={styles.stepsContainer}>
            <Text style={styles.helpText}>{stepsStrings.helpText}</Text>
            <Button
              label={stepsStrings.iKnow}
              onPress={handleShowSteps}
              variant="outline"
              size="sm"
              testID="show-steps-input"
            />
          </View>
        )}
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    textAlign: isRTL() ? 'right' : 'left',
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stepsContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  helpText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
