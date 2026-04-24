import { useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontFamily, spacing, borderRadius } from '@/theme'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import { useUserStore } from '@/stores/useUserStore'
import { VALIDATION, SLEEP } from '@/data/constants'
import { OnboardingLayout, OnboardingTitle, OnboardingContent, NumberInput } from '@/components'

const DEFAULT_SLEEP = 7

export default function SleepScreen() {
  const router = useRouter()
  const strings = t().onboarding.sleep
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [sleepHours, setSleepHours] = useState<number>(
    draft.lifestyle?.sleepHoursPerNight ?? DEFAULT_SLEEP,
  )

  const showWarning = sleepHours < SLEEP.LOW_WARNING_HOURS

  const handleNext = () => {
    updateDraft({
      lifestyle: {
        ...draft.lifestyle,
        sleepHoursPerNight: sleepHours,
      } as typeof draft.lifestyle,
    })
    router.push('/(onboarding)/mode-choice')
  }

  return (
    <OnboardingLayout
      step={10}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={false}
      testID="sleep-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        <NumberInput
          value={sleepHours}
          onChangeValue={setSleepHours}
          min={VALIDATION.SLEEP_HOURS.min}
          max={VALIDATION.SLEEP_HOURS.max}
          step={0.5}
          unit={strings.hours}
          testID="sleep-hours"
        />

        {showWarning && (
          <View style={styles.warningBanner} testID="sleep-warning">
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{strings.lowWarning}</Text>
          </View>
        )}
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
  warningBanner: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '1A',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  warningIcon: {
    fontSize: fontSize.lg,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.warning,
    lineHeight: fontSize.sm * 1.5,
    textAlign: isRTL() ? 'right' : 'left',
  },
})
