import React from 'react'
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { Button } from '@/components/Button'

interface EndEarlyDialogProps {
  visible: boolean
  completedExercises: number
  totalExercises: number
  onConfirm: () => void
  onCancel: () => void
  testID?: string
}

export function EndEarlyDialog({
  visible,
  completedExercises,
  totalExercises,
  onConfirm,
  onCancel,
  testID,
}: EndEarlyDialogProps) {
  const strings = t().workout

  const message = strings.endEarlyMessage
    .replace('{completed}', String(completedExercises))
    .replace('{total}', String(totalExercises))

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <View testID={testID}>
            <Text style={styles.title}>{strings.endEarlyTitle}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <Button
                label={strings.endEarlyConfirm}
                onPress={onConfirm}
                variant="primary"
                size="md"
                testID={testID ? `${testID}-confirm` : undefined}
              />
              <Button
                label={strings.continueWorkout}
                onPress={onCancel}
                variant="ghost"
                size="md"
                testID={testID ? `${testID}-cancel` : undefined}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSize.md * 1.5,
  },
  actions: {
    gap: spacing.sm,
  },
})
