import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { ProgressBar } from './ProgressBar'
import { Button } from './Button'
import { t } from '@/i18n'

const TOTAL_STEPS = 10 // Screens 2-11 (Welcome has no progress bar)
const ENTRANCE_DURATION = 400
const STAGGER_DELAY = 80

interface OnboardingLayoutProps {
  step: number
  onNext: () => void
  onBack?: () => void
  nextDisabled?: boolean
  nextLabel?: string
  children: React.ReactNode
  testID?: string
}

export function OnboardingLayout({
  step,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel,
  children,
  testID,
}: OnboardingLayoutProps) {
  const strings = t()

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.progressArea}>
        <ProgressBar current={step} total={TOTAL_STEPS} testID="onboarding-progress" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(ENTRANCE_DURATION).delay(STAGGER_DELAY * 3)}
        style={styles.buttonArea}
      >
        <Button
          label={nextLabel ?? strings.common.next}
          onPress={onNext}
          disabled={nextDisabled}
          size="lg"
          testID="onboarding-next"
        />
        {onBack && (
          <Button
            label={strings.common.back}
            onPress={onBack}
            variant="ghost"
            size="md"
            testID="onboarding-back"
          />
        )}
      </Animated.View>
    </View>
  )
}

/** Animated wrapper for staggered content entrance */
export function OnboardingTitle({ children }: { children: React.ReactNode }) {
  return <Animated.View entering={FadeInDown.duration(ENTRANCE_DURATION)}>{children}</Animated.View>
}

export function OnboardingSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(ENTRANCE_DURATION).delay(STAGGER_DELAY)}>
      {children}
    </Animated.View>
  )
}

export function OnboardingContent({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(ENTRANCE_DURATION).delay(STAGGER_DELAY * 2)}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  buttonArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
})
