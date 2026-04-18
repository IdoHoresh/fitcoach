/**
 * ManualFoodCollisionSheet — three-action confirm sheet shown when a typed
 * EAN in the manual-create form collides with an existing manual_<ean> row.
 *
 * Default action ("use existing") routes the user to the existing food in
 * PortionPicker — preserves data, matches the most-likely intent. The
 * destructive "replace" path overwrites via upsertFood. "Cancel" returns to
 * the still-mounted form so the user can edit the EAN and try again.
 */

import React from 'react'
import { Modal, View, Text, StyleSheet } from 'react-native'
import { Button } from '@/components/Button'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodItem } from '@/types'

interface ManualFoodCollisionSheetProps {
  visible: boolean
  existing: FoodItem
  onUseExisting: () => void
  onReplace: () => void
  onCancel: () => void
  testID?: string
}

export function ManualFoodCollisionSheet({
  visible,
  existing,
  onUseExisting,
  onReplace,
  onCancel,
  testID,
}: ManualFoodCollisionSheetProps) {
  const strings = t().manualFood.collision

  function tid(suffix: string): string | undefined {
    return testID ? `${testID}-${suffix}` : undefined
  }

  // Title template uses {name} placeholder; resolve at render time.
  const title = strings.title.replace('{name}', existing.nameHe)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
      testID={testID}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title} testID={tid('title')}>
            {title}
          </Text>

          <View style={styles.actions}>
            <Button
              label={strings.useExisting}
              variant="primary"
              onPress={onUseExisting}
              testID={tid('use-existing')}
            />
            <Button
              label={strings.replace}
              variant="secondary"
              onPress={onReplace}
              testID={tid('replace')}
            />
            <Button
              label={strings.cancel}
              variant="ghost"
              onPress={onCancel}
              testID={tid('cancel')}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
})
