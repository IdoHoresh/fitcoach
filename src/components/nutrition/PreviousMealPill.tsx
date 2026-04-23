import React from 'react'
import { Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

interface PreviousMealPillProps {
  mealTypeLabel: string
  dayWord: string
  onPress: () => void
  testID?: string
}

export function PreviousMealPill({
  mealTypeLabel,
  dayWord,
  onPress,
  testID,
}: PreviousMealPillProps) {
  const label = t().nutrition.sameMealAs.replace('{meal}', mealTypeLabel).replace('{day}', dayWord)

  return (
    <Pressable style={styles.pill} onPress={onPress} testID={testID} accessibilityRole="button">
      <Ionicons name="chevron-back" size={18} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.full,
    minHeight: 44,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
  },
})
