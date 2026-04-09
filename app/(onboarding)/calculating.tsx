import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/theme'
import { t } from '@/i18n'
import { OnboardingLayout, OnboardingTitle, OnboardingContent } from '@/components'
import { RTLWrapper } from '@/components/shared/RTLWrapper'
import { isRTL } from '@/hooks/rtl'

const STEP_DURATION = 2000
const TOTAL_DURATION = 10000
const POST_COMPLETE_DELAY = 500

type StepState = 'pending' | 'active' | 'complete'

function CalculatingStep({
  label,
  state,
  index,
}: {
  label: string
  state: StepState
  index: number
}) {
  const pulseOpacity = useSharedValue(1)

  useEffect(() => {
    if (state === 'active') {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
      )
    } else {
      pulseOpacity.value = 1
    }
  }, [state, pulseOpacity])

  const dotStyle = useAnimatedStyle(() => ({
    opacity: state === 'active' ? pulseOpacity.value : 1,
  }))

  const icon = state === 'complete' ? '✓' : state === 'active' ? '●' : '○'
  const iconColor =
    state === 'complete' ? colors.success : state === 'active' ? colors.primary : colors.textMuted
  const textColor = state === 'pending' ? colors.textMuted : colors.textPrimary

  return (
    <Animated.View
      entering={FadeIn.delay(index * 200).duration(300)}
      testID={`calculating-step-${index}`}
    >
      <RTLWrapper style={styles.stepRow}>
        <Text style={[styles.stepLabel, { color: textColor }]}>{label}</Text>
        <Animated.Text style={[styles.stepIcon, { color: iconColor }, dotStyle]}>
          {icon}
        </Animated.Text>
      </RTLWrapper>
    </Animated.View>
  )
}

export default function CalculatingScreen() {
  const router = useRouter()
  const strings = t().onboarding.calculating
  const [currentStep, setCurrentStep] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const progressWidth = useSharedValue(0)

  const steps = [strings.step1, strings.step2, strings.step3, strings.step4, strings.step5]

  useEffect(() => {
    // Start progress bar animation
    progressWidth.value = withTiming(100, {
      duration: TOTAL_DURATION,
      easing: Easing.linear,
    })

    // Schedule each step transition
    for (let i = 0; i < steps.length; i++) {
      const timer = setTimeout(
        () => {
          setCurrentStep(i + 1)
        },
        STEP_DURATION * (i + 1),
      )
      timersRef.current.push(timer)
    }

    // Navigate to result after all steps + delay
    const navTimer = setTimeout(() => {
      router.replace('/(onboarding)/result')
    }, TOTAL_DURATION + POST_COMPLETE_DELAY)
    timersRef.current.push(navTimer)

    // Cleanup all timers on unmount
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }))

  function getStepState(index: number): StepState {
    if (index < currentStep) return 'complete'
    if (index === currentStep) return 'active'
    return 'pending'
  }

  return (
    <OnboardingLayout step={10} onNext={() => {}} nextDisabled={true} testID="calculating-screen">
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        <View style={styles.stepsContainer}>
          {steps.map((label, index) => (
            <CalculatingStep key={index} label={label} state={getStepState(index)} index={index} />
          ))}
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </OnboardingContent>
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  stepsContainer: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  stepRow: {
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIcon: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    width: 24,
    textAlign: 'center',
  },
  stepLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    flex: 1,
    textAlign: isRTL() ? 'right' : 'left',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xl,
    position: 'relative',
    // RTL fix: mirror the entire track horizontally. The fill is pinned to
    // `left: 0` and animates its `width` via reanimated's `useAnimatedStyle`.
    // React Native is supposed to auto-swap `left` ↔ `right` in RTL, but
    // that swap does NOT apply to style arrays that include a reanimated
    // animated-style output — the UI-thread setter bypasses the JS-side
    // layout interpolator that handles the swap. Result: the fill would
    // grow left→right in both languages, which looks backwards in Hebrew.
    //
    // `transform: scaleX(-1)` is unaffected by RTL auto-swap and flips the
    // entire track visually. The fill still grows left→right in raw layout,
    // but the viewer sees right→left. The track has no text children, so
    // there's nothing else to worry about mirroring.
    transform: isRTL() ? [{ scaleX: -1 }] : undefined,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
})
