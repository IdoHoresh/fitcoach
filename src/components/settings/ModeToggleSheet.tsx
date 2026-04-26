import React, { useCallback, useMemo, useState } from 'react'
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { ModeCard } from '@/components/onboarding/ModeCard'
import {
  ModeInfoSheet,
  type ModeSheetBullet,
  type ModeSheetContent,
} from '@/components/onboarding/ModeInfoSheet'
import { StructuredModePreview } from '@/components/onboarding/previews/StructuredModePreview'
import { FreeModePreview } from '@/components/onboarding/previews/FreeModePreview'
import type { MealLoggingMode } from '@/types'

const SHEET_RADIUS = 20
const DRAG_HANDLE_WIDTH = 36
const DRAG_HANDLE_HEIGHT = 4

interface ModeToggleSheetProps {
  visible: boolean
  currentMode: MealLoggingMode
  onSelect: (mode: MealLoggingMode) => void
  onClose: () => void
  testID?: string
}

export function ModeToggleSheet({
  visible,
  currentMode,
  onSelect,
  onClose,
  testID,
}: ModeToggleSheetProps) {
  const insets = useSafeAreaInsets()
  const settingsStrings = t().settings.mealLoggingMode
  const modeStrings = t().onboarding.modeChoice
  const [infoMode, setInfoMode] = useState<MealLoggingMode | null>(null)

  const handlePick = useCallback(
    (mode: MealLoggingMode) => {
      onSelect(mode)
      onClose()
    },
    [onSelect, onClose],
  )

  const structuredSheet: ModeSheetContent = useMemo(
    () => ({
      header: modeStrings.sheetStructured.header,
      intro: modeStrings.sheetStructured.intro,
      whatYouGet: [
        { icon: 'restaurant', text: modeStrings.sheetStructured.get[0] },
        { icon: 'check-circle', text: modeStrings.sheetStructured.get[1] },
        { icon: 'info-outline', text: modeStrings.sheetStructured.get[2] },
      ] as readonly ModeSheetBullet[],
      how: modeStrings.sheetStructured.how,
      fit: modeStrings.sheetStructured.fit,
      footer: modeStrings.sheetStructured.footer,
    }),
    [modeStrings.sheetStructured],
  )

  const freeSheet: ModeSheetContent = useMemo(
    () => ({
      header: modeStrings.sheetFree.header,
      intro: modeStrings.sheetFree.intro,
      whatYouGet: [
        { icon: 'home', text: modeStrings.sheetFree.get[0] },
        { icon: 'restaurant', text: modeStrings.sheetFree.get[1] },
        { icon: 'check-circle', text: modeStrings.sheetFree.get[2] },
      ] as readonly ModeSheetBullet[],
      how: modeStrings.sheetFree.how,
      fit: modeStrings.sheetFree.fit,
      footer: modeStrings.sheetFree.footer,
    }),
    [modeStrings.sheetFree],
  )

  const activeSheet = infoMode === 'free' ? freeSheet : structuredSheet

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      {visible ? (
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            testID={testID ? `${testID}-backdrop` : undefined}
          />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
            accessibilityViewIsModal
          >
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{settingsStrings.sheetTitle}</Text>
              <View style={styles.cardList}>
                <ModeCard
                  title={modeStrings.structured.title}
                  subtitle={modeStrings.structured.subtitle}
                  calloutLabel={modeStrings.structured.calloutLabel}
                  infoAccessibilityLabel={modeStrings.infoAccessibilityLabel}
                  selected={currentMode === 'structured'}
                  onPress={() => handlePick('structured')}
                  onInfoPress={() => setInfoMode('structured')}
                  preview={
                    <StructuredModePreview
                      accessibilityLabel={modeStrings.structured.previewLabel}
                    />
                  }
                  testID={testID ? `${testID}-structured` : undefined}
                />
                <ModeCard
                  title={modeStrings.free.title}
                  subtitle={modeStrings.free.subtitle}
                  calloutLabel={modeStrings.free.calloutLabel}
                  infoAccessibilityLabel={modeStrings.infoAccessibilityLabel}
                  selected={currentMode === 'free'}
                  onPress={() => handlePick('free')}
                  onInfoPress={() => setInfoMode('free')}
                  preview={<FreeModePreview accessibilityLabel={modeStrings.free.previewLabel} />}
                  testID={testID ? `${testID}-free` : undefined}
                />
              </View>
            </ScrollView>

            <ModeInfoSheet
              visible={infoMode !== null}
              onClose={() => setInfoMode(null)}
              content={activeSheet}
              closeLabel={modeStrings.sheet.close}
              sectionTitles={{
                get: modeStrings.sheet.sectionGet,
                how: modeStrings.sheet.sectionHow,
                fit: modeStrings.sheet.sectionFit,
              }}
              testID={testID ? `${testID}-info-sheet` : undefined}
            />
          </View>
        </View>
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,10,14,0.6)',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '85%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: DRAG_HANDLE_WIDTH,
    height: DRAG_HANDLE_HEIGHT,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceBright,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardList: {
    gap: spacing.md,
  },
})
