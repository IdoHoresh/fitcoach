import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { Icon } from './Icon'

const ACCENT_STRIP_WIDTH = 3
const ICON_SIZE = 20

interface InfoCalloutProps {
  title: string
  body: string
  testID?: string
}

export function InfoCallout({ title, body, testID }: InfoCalloutProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.accentStrip} />
      <View style={styles.content}>
        <View style={styles.textColumn}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
        <Icon name="info-outline" size={ICON_SIZE} color={colors.primary} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  accentStrip: {
    width: ACCENT_STRIP_WIDTH,
    backgroundColor: colors.primaryMuted,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.ms,
    padding: spacing.md,
  },
  textColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
})
