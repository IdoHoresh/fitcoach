import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/Card'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'

interface RestDayCardProps {
  testID?: string
}

export function RestDayCard({ testID }: RestDayCardProps) {
  const strings = t().workout
  const tips = strings.restDayTips as readonly string[]
  const tipIndex = new Date().getDay() % tips.length
  const tip = tips[tipIndex]

  return (
    <Card variant="elevated" testID={testID}>
      <View style={styles.container}>
        <Ionicons name="leaf-outline" size={32} color={colors.success} />
        <Text style={styles.title}>{strings.restDay}</Text>
        <Text style={styles.message}>{strings.restDayMessage}</Text>
        <Text style={styles.tip} testID={testID ? `${testID}-tip` : undefined}>
          {tip}
        </Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tip: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
