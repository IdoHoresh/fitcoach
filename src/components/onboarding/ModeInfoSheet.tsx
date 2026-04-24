import React from 'react'
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { Icon, type IconName } from '../Icon'
import { Button } from '../Button'

/**
 * Bottom-sheet modal displayed when the user taps the ⓘ button on a ModeCard.
 * Read-only information surface — does NOT select the mode. User closes the sheet
 * and picks from the parent cards. Separation: info ≠ commit.
 *
 * Strings are passed in by the parent screen from `i18n/*.ts` — no inline copy.
 */

const SHEET_RADIUS = 20
const DRAG_HANDLE_WIDTH = 36
const DRAG_HANDLE_HEIGHT = 4
const ICON_CHIP_SIZE = 32
const BULLET_DOT_SIZE = 6

export type ModeSheetIcon = Extract<
  IconName,
  'check-circle' | 'info-outline' | 'restaurant' | 'fitness-center' | 'home' | 'person'
>

export interface ModeSheetBullet {
  readonly icon: ModeSheetIcon
  readonly text: string
}

export interface ModeSheetContent {
  readonly header: string
  readonly intro: string
  readonly whatYouGet: readonly ModeSheetBullet[]
  readonly how: string
  readonly fit: readonly string[]
  readonly footer: string
}

interface ModeInfoSheetProps {
  visible: boolean
  onClose: () => void
  content: ModeSheetContent
  closeLabel: string
  sectionTitles: {
    readonly get: string
    readonly how: string
    readonly fit: string
  }
  testID?: string
}

export function ModeInfoSheet({
  visible,
  onClose,
  content,
  closeLabel,
  sectionTitles,
  testID,
}: ModeInfoSheetProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
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
            <Text style={styles.header}>{content.header}</Text>
            <Text style={styles.intro}>{content.intro}</Text>

            <Text style={styles.sectionTitle}>{sectionTitles.get}</Text>
            <View style={styles.getList}>
              {content.whatYouGet.map((b, i) => (
                <View key={i} style={styles.getRow}>
                  <View style={styles.getIconChip}>
                    <Icon name={b.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.getText}>{b.text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>{sectionTitles.how}</Text>
            <View style={styles.howBlock}>
              <Text style={styles.howText}>{content.how}</Text>
            </View>

            <Text style={styles.sectionTitle}>{sectionTitles.fit}</Text>
            <View style={styles.fitList}>
              {content.fit.map((f, i) => (
                <View key={i} style={styles.fitRow}>
                  <View style={styles.fitDot} />
                  <Text style={styles.fitText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.footerBlock}>
              <Text style={styles.footerText}>{content.footer}</Text>
            </View>
          </ScrollView>
          <View style={styles.closeArea}>
            <Button
              label={closeLabel}
              variant="secondary"
              size="md"
              onPress={onClose}
              testID={testID ? `${testID}-close` : undefined}
            />
          </View>
        </View>
      </View>
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
    maxHeight: '80%',
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
    paddingHorizontal: spacing.ml,
    paddingTop: spacing.sm,
  },
  header: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: fontSize.xl * 1.25,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  intro: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  getList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  getRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.ms,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.ms,
  },
  getIconChip: {
    width: ICON_CHIP_SIZE,
    height: ICON_CHIP_SIZE,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
    paddingTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  howBlock: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.ms,
    marginBottom: spacing.md,
  },
  howText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.7,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fitList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
  },
  fitDot: {
    width: BULLET_DOT_SIZE,
    height: BULLET_DOT_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  fitText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footerBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.ms,
    paddingBottom: spacing.md,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: fontSize.xs * 1.6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  closeArea: {
    paddingHorizontal: spacing.ml,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
