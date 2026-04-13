import { useState, useCallback } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontFamily, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { FULL_GYM_EQUIPMENT } from '@/types/user'
import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingSubtitle,
  OnboardingContent,
  OptionSelector,
  CheckboxList,
} from '@/components'
import type { TrainingLocation, EquipmentItem } from '@/types'

const LOCATION_I18N: Record<string, { label: string; desc: string }> = {
  full_gym: { label: 'fullGym', desc: 'fullGymDesc' },
  home: { label: 'homeGym', desc: 'homeGymDesc' },
  bodyweight_only: { label: 'minimal', desc: 'minimalDesc' },
}

const LOCATION_IDS: { id: string; icon: string }[] = [
  { id: 'full_gym', icon: '🏋️' },
  { id: 'home', icon: '🏠' },
  { id: 'bodyweight_only', icon: '🤸' },
]

const HOME_EQUIPMENT_IDS: EquipmentItem[] = [
  'barbell',
  'squat_rack',
  'dumbbells',
  'bench',
  'pull_up_bar',
  'cable_machine',
  'leg_machines',
  'resistance_bands',
]

export default function EquipmentScreen() {
  const router = useRouter()
  const strings = t().onboarding.equipment
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)

  const [location, setLocation] = useState<string>(draft.equipment?.location ?? '')
  const [selectedItems, setSelectedItems] = useState<string[]>(
    draft.equipment?.availableEquipment?.map(String) ?? [],
  )

  const locationOptions = LOCATION_IDS.map((opt) => {
    const keys = LOCATION_I18N[opt.id]
    return {
      ...opt,
      label: strings[keys.label as keyof typeof strings] as string,
      description: strings[keys.desc as keyof typeof strings] as string,
    }
  })

  const equipmentOptions = HOME_EQUIPMENT_IDS.map((id) => ({
    id,
    label: strings.items[id as keyof typeof strings.items] as string,
  }))

  const handleLocationSelect = (id: string) => {
    setLocation(id)
    if (id === 'full_gym') {
      setSelectedItems([...FULL_GYM_EQUIPMENT] as string[])
    } else if (id === 'bodyweight_only') {
      setSelectedItems(['none'])
    } else {
      setSelectedItems([])
    }
  }

  const handleToggleItem = useCallback((id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }, [])

  const isValid = location !== '' && selectedItems.length > 0

  const handleNext = () => {
    updateDraft({
      equipment: {
        location: location as TrainingLocation,
        availableEquipment: selectedItems as EquipmentItem[],
      },
    })
    router.push('/(onboarding)/training-days')
  }

  return (
    <OnboardingLayout
      step={5}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!isValid}
      testID="equipment-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        <OptionSelector
          options={locationOptions}
          selected={location}
          onSelect={handleLocationSelect}
          layout="list"
          testID="location"
        />

        {location === 'home' && (
          <>
            <OnboardingSubtitle>
              <Text style={styles.subtitle}>{strings.selectYours}</Text>
            </OnboardingSubtitle>
            <CheckboxList
              options={equipmentOptions}
              selected={selectedItems}
              onToggle={handleToggleItem}
              testID="equipment-items"
            />
          </>
        )}

        {location === 'full_gym' && <Text style={styles.autoText}>{strings.selectedAll}</Text>}
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
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  autoText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
})
