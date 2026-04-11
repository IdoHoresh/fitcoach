import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'

interface MacroTabProps {
  emoji: string
  label: string
  subtitle?: string
  isSelected: boolean
  isMet: boolean
  onPress: () => void
  testID?: string
}

export function MacroTab({
  emoji,
  label,
  subtitle,
  isSelected,
  isMet,
  onPress,
  testID,
}: MacroTabProps) {
  return (
    <Pressable
      style={[styles.tab, isSelected && styles.tabSelected]}
      onPress={onPress}
      testID={testID}
    >
      <View style={styles.labelRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
        {isMet && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, isSelected && styles.subtitleSelected]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  tabSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: fontSize.sm,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primary,
  },
  checkmark: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  subtitleSelected: {
    color: colors.primary,
  },
})
