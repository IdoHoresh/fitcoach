import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { AdherenceLevel } from '@/types'

interface AdherencePickerProps {
  value: AdherenceLevel | null
  onChange: (level: AdherenceLevel) => void
  testID?: string
}

interface ButtonConfig {
  level: AdherenceLevel
  label: string
  selectedColor: string
}

export function AdherencePicker({ value, onChange, testID }: AdherencePickerProps) {
  const strings = t().nutrition.adherence
  const id = testID ?? 'adherence-picker'

  const buttons: ButtonConfig[] = [
    { level: 'not_accurate', label: strings.notAccurate, selectedColor: colors.protein },
    { level: 'roughly', label: strings.roughly, selectedColor: colors.fat },
    { level: 'accurate', label: strings.accurate, selectedColor: colors.primary },
  ]

  return (
    <View style={styles.row} testID={id}>
      {buttons.map(({ level, label, selectedColor }) => {
        const selected = value === level
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={[
              styles.button,
              selected && { backgroundColor: selectedColor + '20', borderColor: selectedColor },
            ]}
            testID={`${id}-${level}`}
          >
            {selected && (
              <View
                testID={`${id}-${level}-selected`}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            )}
            <Text
              style={[
                styles.label,
                selected && { color: selectedColor, fontWeight: fontWeight.semibold },
              ]}
              testID={`${id}-${level}-label`}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
})
