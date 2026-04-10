import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

interface FoodItemRowProps {
  nameHe: string
  grams: number
  calories: number
  onRemove: () => void
  testID?: string
}

export function FoodItemRow({ nameHe, grams, calories, onRemove, testID }: FoodItemRowProps) {
  const strings = t().nutrition

  return (
    <View style={styles.row} testID={testID}>
      {/* Left: calories in teal */}
      <Text style={styles.calories} testID={testID ? `${testID}-calories` : undefined}>
        {calories}
      </Text>

      {/* Right: food name + grams (RTL leading) */}
      <View style={styles.nameColumn}>
        <Text style={styles.name} testID={testID ? `${testID}-name` : undefined} numberOfLines={1}>
          {nameHe}
        </Text>
        <Text style={styles.grams} testID={testID ? `${testID}-grams` : undefined}>
          {grams} {strings.grams}
        </Text>
      </View>

      {/* Remove button */}
      <Pressable
        onPress={onRemove}
        style={styles.removeButton}
        testID={testID ? `${testID}-remove` : undefined}
        hitSlop={spacing.sm}
      >
        <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  calories: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    minWidth: 40,
    textAlign: 'left',
  },
  nameColumn: {
    flex: 1,
    alignItems: 'flex-end', // RTL: text aligns right
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  grams: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  removeButton: {
    padding: spacing.xxs,
  },
})
