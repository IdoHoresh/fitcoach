import { useMemo, useEffect, useState, useCallback } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  withTiming,
  withDelay,
  withSpring,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated'
import { colors, fontSize, fontFamily, spacing, borderRadius } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import {
  calculateBmr,
  calculateTdeeBreakdown,
  calculateNutritionTargets,
  createSplitRecommendation,
} from '@/algorithms'
import { OnboardingLayout, OnboardingTitle, OnboardingContent } from '@/components'
import type { UserProfile } from '@/types'

// ── Animation constants ──────────────────────────────────────────────

const COUNTER_DURATION = 1500
const BAR_SPRING = { damping: 15, stiffness: 100 }

const MACRO_COLORS = {
  protein: colors.protein,
  carbs: colors.carbs,
  fat: colors.fat,
} as const

// ── Computation (same logic tested in result.test.ts) ────────────────

function computeResults(draft: Partial<UserProfile>) {
  const bmr = calculateBmr(
    draft.weightKg!,
    draft.heightCm!,
    draft.age!,
    draft.sex!,
    draft.bodyFatPercent ?? null,
  )
  const tdeeBreakdown = calculateTdeeBreakdown(bmr, draft.weightKg!, draft.lifestyle!)
  const nutrition = calculateNutritionTargets(
    bmr,
    tdeeBreakdown.total,
    draft.weightKg!,
    draft.heightCm!,
    draft.bodyFatPercent ?? null,
    draft.goal!,
  )
  const split = createSplitRecommendation(draft.trainingDays!, draft.experience!)

  return { bmr, tdeeBreakdown, nutrition, split }
}

// ── Animated TDEE Counter ────────────────────────────────────────────

function AnimatedCounter({ target }: { target: number }) {
  const animatedValue = useSharedValue(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    animatedValue.value = withTiming(target, {
      duration: COUNTER_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  }, [target, animatedValue])

  useAnimatedReaction(
    () => Math.round(animatedValue.value),
    (current) => {
      runOnJS(setDisplayValue)(current)
    },
    [animatedValue],
  )

  return (
    <View style={styles.counterContainer}>
      <Text style={styles.counterValue} testID="tdee-counter">
        {displayValue.toLocaleString()}
      </Text>
      <Text style={styles.counterUnit}>{t().common.kcal}</Text>
    </View>
  )
}

// ── Breakdown Bar ────────────────────────────────────────────────────

function BreakdownBar({
  label,
  value,
  percentage,
  delay,
}: {
  label: string
  value: number
  percentage: number
  delay: number
}) {
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withDelay(delay, withSpring(percentage, BAR_SPRING))
  }, [percentage, delay, width])

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }))

  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
    </View>
  )
}

// ── Macro Card ───────────────────────────────────────────────────────

function MacroCard({
  name,
  grams,
  calories,
  totalCalories,
  color,
  delay,
}: {
  name: string
  grams: number
  calories: number
  totalCalories: number
  color: string
  delay: number
}) {
  const percentage = Math.round((calories / totalCalories) * 100)

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400)}
      style={[styles.macroCard, { borderLeftColor: color }]}
    >
      <Text style={styles.macroName}>{name}</Text>
      <Text style={styles.macroGrams}>
        {Math.round(grams)}
        {t().common.grams}
      </Text>
      <Text style={styles.macroPercent}>{percentage}%</Text>
    </Animated.View>
  )
}

// ── Main Screen ──────────────────────────────────────────────────────

export default function ResultScreen() {
  const router = useRouter()
  const strings = t().onboarding.result
  const splitStrings = t().splits
  const macroStrings = t().nutrition.macros
  const draft = useUserStore((s) => s.draft)
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)
  const isLoading = useUserStore((s) => s.isLoading)
  const error = useUserStore((s) => s.error)

  const results = useMemo(() => {
    try {
      return computeResults(draft)
    } catch {
      return null
    }
  }, [draft])

  const handleStart = useCallback(async () => {
    await completeOnboarding()
    const currentError = useUserStore.getState().error
    if (!currentError) {
      router.replace('/(tabs)')
    }
  }, [completeOnboarding, router])

  if (!results) {
    return (
      <OnboardingLayout
        step={11}
        onNext={() => router.back()}
        nextLabel={t().common.back}
        testID="result-screen"
      >
        <OnboardingTitle>
          <Text style={styles.title}>{t().common.error}</Text>
        </OnboardingTitle>
        <OnboardingContent>
          <Text style={styles.errorText}>{error ?? t().onboarding.result.missingData}</Text>
        </OnboardingContent>
      </OnboardingLayout>
    )
  }

  const { tdeeBreakdown, nutrition, split } = results
  const { total, bmr, neat, eat, tef } = tdeeBreakdown

  return (
    <OnboardingLayout
      step={11}
      onNext={handleStart}
      nextLabel={strings.cta}
      nextDisabled={isLoading}
      testID="result-screen"
    >
      <OnboardingTitle>
        <Text style={styles.title}>{strings.title}</Text>
      </OnboardingTitle>
      <OnboardingContent>
        {/* Split + days summary */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.splitText}>
            {splitStrings[split.splitType as keyof typeof splitStrings]} ·{' '}
            {draft.trainingDays?.length} {strings.days}
          </Text>
        </Animated.View>

        {/* TDEE animated counter */}
        <Text style={styles.sectionLabel}>{strings.calories}</Text>
        <AnimatedCounter target={nutrition.targetCalories} />

        {/* Macro cards */}
        <View style={styles.macroRow}>
          <MacroCard
            name={macroStrings.protein}
            grams={nutrition.proteinGrams}
            calories={nutrition.proteinGrams * 4}
            totalCalories={nutrition.targetCalories}
            color={MACRO_COLORS.protein}
            delay={400}
          />
          <MacroCard
            name={macroStrings.carbs}
            grams={nutrition.carbGrams}
            calories={nutrition.carbGrams * 4}
            totalCalories={nutrition.targetCalories}
            color={MACRO_COLORS.carbs}
            delay={600}
          />
          <MacroCard
            name={macroStrings.fat}
            grams={nutrition.fatGrams}
            calories={nutrition.fatGrams * 9}
            totalCalories={nutrition.targetCalories}
            color={MACRO_COLORS.fat}
            delay={800}
          />
        </View>

        {/* TDEE breakdown bars */}
        <Text style={styles.sectionLabel}>{strings.breakdown}</Text>
        <View style={styles.breakdownContainer}>
          <BreakdownBar
            label={strings.bmrLabel}
            value={bmr}
            percentage={(bmr / total) * 100}
            delay={100}
          />
          <BreakdownBar
            label={strings.neatLabel}
            value={neat}
            percentage={(neat / total) * 100}
            delay={200}
          />
          <BreakdownBar
            label={strings.eatLabel}
            value={eat}
            percentage={(eat / total) * 100}
            delay={300}
          />
          <BreakdownBar
            label={strings.tefLabel}
            value={tef}
            percentage={(tef / total) * 100}
            delay={400}
          />
        </View>

        {/* Health disclaimer */}
        <Animated.View entering={FadeInUp.delay(1200).duration(400)}>
          <Text style={styles.disclaimer}>{strings.disclaimer}</Text>
        </Animated.View>

        {/* Error display */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </OnboardingContent>
    </OnboardingLayout>
  )
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  splitText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Counter
  counterContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  counterValue: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  counterUnit: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Macro cards
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    padding: spacing.md,
    alignItems: 'center',
  },
  macroName: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  macroGrams: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  macroPercent: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Breakdown bars
  breakdownContainer: {
    gap: spacing.sm,
  },
  barRow: {
    gap: spacing.xs,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  barValue: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },

  // Disclaimer
  disclaimer: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: fontSize.xs * 1.6,
  },

  // Error
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
