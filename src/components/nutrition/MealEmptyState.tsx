import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize } from '@/theme/typography'
import { t } from '@/i18n'

interface MealEmptyStateProps {
  testID?: string
}

export function MealEmptyState({ testID }: MealEmptyStateProps) {
  const strings = t().nutrition

  return (
    <View style={styles.container} testID={testID}>
      <Ionicons name="restaurant-outline" size={28} color={colors.textMuted} />
      <Text style={styles.message} testID={testID ? `${testID}-message` : undefined}>
        {strings.noFoodsLogged}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
