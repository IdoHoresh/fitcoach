import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedProps, withSpring } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { computeGaugeProgress } from '@/components/home/MacroGauge'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const SIZE = 240
const STROKE_WIDTH = 16
const SPRING_CONFIG = { damping: 18, stiffness: 90 }

interface NutritionCalorieArcProps {
  plannedCalories: number
  goalCalories: number
  testID?: string
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function NutritionCalorieArc({
  plannedCalories,
  goalCalories,
  testID,
}: NutritionCalorieArcProps) {
  const strings = t().nutrition
  const progress = computeGaugeProgress(plannedCalories, goalCalories)

  const radius = (SIZE - STROKE_WIDTH) / 2
  const fullCircumference = 2 * Math.PI * radius
  const halfCircumference = Math.PI * radius
  const visibleHeight = radius + STROKE_WIDTH / 2

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withSpring(halfCircumference * (1 - progress), SPRING_CONFIG),
  }))

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.gaugeClip, { width: SIZE, height: visibleHeight }]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={colors.surface}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${halfCircumference} ${fullCircumference}`}
            transform={`rotate(180 ${SIZE / 2} ${SIZE / 2})`}
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${halfCircumference} ${fullCircumference}`}
            animatedProps={animatedProps}
            transform={`rotate(180 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>

        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.plannedNumber} testID={testID ? `${testID}-planned` : undefined}>
            {formatNumber(plannedCalories)}
          </Text>
          <Text style={styles.goalLabel} testID={testID ? `${testID}-goal` : undefined}>
            {`/ ${formatNumber(goalCalories)} ${strings.kcal}`}
          </Text>
          <Text style={styles.unitLabel} testID={testID ? `${testID}-label` : undefined}>
            {strings.caloriesOf.replace('{goal}', '')}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  gaugeClip: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  plannedNumber: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  goalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  unitLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
})
