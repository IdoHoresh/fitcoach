import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { StepProgressHeader, BottomButtonBar } from '@/components'
import { ModeCard } from '@/components/onboarding/ModeCard'
import {
  ModeInfoSheet,
  type ModeSheetBullet,
  type ModeSheetContent,
} from '@/components/onboarding/ModeInfoSheet'
import { StructuredModePreview } from '@/components/onboarding/previews/StructuredModePreview'
import { FreeModePreview } from '@/components/onboarding/previews/FreeModePreview'
import { track } from '@/analytics/track'
import type { MealLoggingMode } from '@/types'

const DEFAULT_MODE: MealLoggingMode = 'structured'

const STEP = 12
const TOTAL_STEPS = 13
const HEADLINE_SIZE = 24
const SCROLL_BOTTOM_PADDING = 160

type SheetKind = MealLoggingMode | null

/**
 * Mode-choice onboarding screen — `app/(onboarding)/mode-choice.tsx`.
 *
 * Lets the user pick between Structured ("אני רוצה תוכנית") and Free
 * ("אני רוצה מעקב") meal-logging modes. Structured is pre-selected on mount
 * to reduce beginner paralysis (intent framing, not experience framing — see
 * docs/specs/2026-04-24-two-mode-meal-logging.md §Invariants and §Onboarding).
 *
 * Tapping ⓘ on a card opens a bottom sheet with fuller info (read-only).
 * Tapping המשך commits the current selection to the user draft and proceeds
 * to the calculating screen.
 */
export default function ModeChoiceScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const strings = t().onboarding.modeChoice
  const draft = useUserStore((s) => s.draft)
  const updateDraft = useUserStore((s) => s.updateDraft)

  const [selected, setSelected] = useState<MealLoggingMode>(draft.mealLoggingMode ?? DEFAULT_MODE)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const mountedAt = useRef(Date.now())

  const structuredSheet: ModeSheetContent = useMemo(
    () => ({
      header: strings.sheetStructured.header,
      intro: strings.sheetStructured.intro,
      whatYouGet: [
        { icon: 'restaurant', text: strings.sheetStructured.get[0] },
        { icon: 'check-circle', text: strings.sheetStructured.get[1] },
        { icon: 'info-outline', text: strings.sheetStructured.get[2] },
      ] as readonly ModeSheetBullet[],
      how: strings.sheetStructured.how,
      fit: strings.sheetStructured.fit,
      footer: strings.sheetStructured.footer,
    }),
    [strings.sheetStructured],
  )

  const freeSheet: ModeSheetContent = useMemo(
    () => ({
      header: strings.sheetFree.header,
      intro: strings.sheetFree.intro,
      whatYouGet: [
        { icon: 'home', text: strings.sheetFree.get[0] },
        { icon: 'restaurant', text: strings.sheetFree.get[1] },
        { icon: 'check-circle', text: strings.sheetFree.get[2] },
      ] as readonly ModeSheetBullet[],
      how: strings.sheetFree.how,
      fit: strings.sheetFree.fit,
      footer: strings.sheetFree.footer,
    }),
    [strings.sheetFree],
  )

  const handleSelect = useCallback(
    (mode: MealLoggingMode) => {
      setSelected(mode)
      updateDraft({ mealLoggingMode: mode })
    },
    [updateDraft],
  )

  const handleContinue = useCallback(() => {
    updateDraft({ mealLoggingMode: selected })
    track({
      type: 'mode_choice_picked',
      mode: selected,
      time_to_pick_ms: Date.now() - mountedAt.current,
      changed_from_default: selected !== DEFAULT_MODE,
    })
    router.push('/(onboarding)/calculating')
  }, [router, selected, updateDraft])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepProgressHeader step={STEP} total={TOTAL_STEPS} testID="mode-choice-progress" />

        <View style={styles.heroText}>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </View>

        <View style={styles.cardList}>
          <ModeCard
            title={strings.structured.title}
            subtitle={strings.structured.subtitle}
            calloutLabel={strings.structured.calloutLabel}
            infoAccessibilityLabel={strings.infoAccessibilityLabel}
            selected={selected === 'structured'}
            onPress={() => handleSelect('structured')}
            onInfoPress={() => setSheet('structured')}
            preview={<StructuredModePreview accessibilityLabel={strings.structured.previewLabel} />}
            testID="mode-choice-structured"
          />
          <ModeCard
            title={strings.free.title}
            subtitle={strings.free.subtitle}
            calloutLabel={strings.free.calloutLabel}
            infoAccessibilityLabel={strings.infoAccessibilityLabel}
            selected={selected === 'free'}
            onPress={() => handleSelect('free')}
            onInfoPress={() => setSheet('free')}
            preview={<FreeModePreview accessibilityLabel={strings.free.previewLabel} />}
            testID="mode-choice-free"
          />
        </View>
      </ScrollView>

      <BottomButtonBar
        label={strings.continue}
        onPress={handleContinue}
        testID="mode-choice-continue"
      />

      <ModeInfoSheet
        visible={sheet === 'structured'}
        onClose={() => setSheet(null)}
        content={structuredSheet}
        closeLabel={strings.sheet.close}
        sectionTitles={{
          get: strings.sheet.sectionGet,
          how: strings.sheet.sectionHow,
          fit: strings.sheet.sectionFit,
        }}
        testID="mode-choice-sheet-structured"
      />
      <ModeInfoSheet
        visible={sheet === 'free'}
        onClose={() => setSheet(null)}
        content={freeSheet}
        closeLabel={strings.sheet.close}
        sectionTitles={{
          get: strings.sheet.sectionGet,
          how: strings.sheet.sectionHow,
          fit: strings.sheet.sectionFit,
        }}
        testID="mode-choice-sheet-free"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: SCROLL_BOTTOM_PADDING,
    gap: spacing.xl,
  },
  heroText: {
    gap: spacing.sm,
    width: '100%',
  },
  title: {
    fontSize: HEADLINE_SIZE,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: -0.3,
    lineHeight: HEADLINE_SIZE * 1.25,
    alignSelf: 'stretch',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: fontSize.sm * 1.4,
    alignSelf: 'stretch',
  },
  cardList: {
    gap: spacing.md,
  },
})
