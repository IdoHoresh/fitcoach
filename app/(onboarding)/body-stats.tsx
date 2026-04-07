import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { VALIDATION } from '@/data/constants'
import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingContent,
  NumberInput,
  OptionSelector,
} from '@/components'
import type { BiologicalSex } from '@/types'

const SEX_OPTIONS = [
  { id: 'male', label: '' },
  { id: 'female', label: '' },
]

export default function BodyStatsScreen() {
  const router = useRouter()
  const strings = t().onboarding.bodyStats
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [height, setHeight] = useState(draft.heightCm ?? 170)
  const [weight, setWeight] = useState(draft.weightKg ?? 70)
  const [age, setAge] = useState(draft.age ?? 25)
  const [sex, setSex] = useState<string>(draft.sex ?? '')

  const sexOptions = SEX_OPTIONS.map((opt) => ({
    ...opt,
    label: strings[opt.id as keyof typeof strings] as string,
  }))

  const isValid =
    height >= VALIDATION.HEIGHT_CM.min &&
    height <= VALIDATION.HEIGHT_CM.max &&
    weight >= VALIDATION.WEIGHT_KG.min &&
    weight <= VALIDATION.WEIGHT_KG.max &&
    age >= VALIDATION.AGE.min &&
    age <= VALIDATION.AGE.max &&
    sex !== ''

  const handleNext = () => {
    updateDraft({
      heightCm: height,
      weightKg: weight,
      age,
      sex: sex as BiologicalSex,
    })
    router.push('/(onboarding)/body-fat')
  }

  return (
    <OnboardingLayout
      step={2}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!isValid}
      testID="body-stats-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        <NumberInput
          label={strings.height}
          value={height}
          onChangeValue={setHeight}
          min={VALIDATION.HEIGHT_CM.min}
          max={VALIDATION.HEIGHT_CM.max}
          step={1}
          unit={t().common.cm}
          testID="height"
        />
        <NumberInput
          label={strings.weight}
          value={weight}
          onChangeValue={setWeight}
          min={VALIDATION.WEIGHT_KG.min}
          max={VALIDATION.WEIGHT_KG.max}
          step={0.5}
          unit={t().common.kg}
          testID="weight"
        />
        <NumberInput
          label={strings.age}
          value={age}
          onChangeValue={setAge}
          min={VALIDATION.AGE.min}
          max={VALIDATION.AGE.max}
          step={1}
          testID="age"
        />
        <Text style={styles.sectionLabel}>{strings.sex}</Text>
        <OptionSelector
          options={sexOptions}
          selected={sex}
          onSelect={setSex}
          layout="grid"
          testID="sex"
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
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
})
