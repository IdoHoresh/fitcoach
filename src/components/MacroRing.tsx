import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedProps, withSpring } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { RTLWrapper } from './shared/RTLWrapper'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const DEFAULT_SIZE = 200
const STROKE_WIDTH = 14
const SPRING_CONFIG = { damping: 18, stiffness: 90 }

interface MacroStat {
  readonly current: number
  readonly goal: number
}

interface MacroRingProps {
  consumedCalories: number
  goalCalories: number
  protein: MacroStat
  carbs: MacroStat
  fat: MacroStat
  size?: number
  testID?: string
}

export function MacroRing({
  consumedCalories,
  goalCalories,
  protein,
  carbs,
  fat,
  size = DEFAULT_SIZE,
  testID,
}: MacroRingProps) {
  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const progress = goalCalories > 0 ? Math.min(Math.max(consumedCalories / goalCalories, 0), 1) : 0

  const remaining = Math.max(goalCalories - consumedCalories, 0)

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withSpring(circumference * (1 - progress), SPRING_CONFIG),
  }))

  return (
    <View style={styles.container} testID={testID}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Fill (rotated -90° so the arc starts at the top) */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.centerNumber}>{remaining}</Text>
          <Text style={styles.centerSublabel}>{t().components.macroRing.remaining}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <MacroStatCell
          testID={testID ? `${testID}-protein` : undefined}
          label={t().components.macroRing.protein}
          color={colors.protein}
          stat={protein}
        />
        <MacroStatCell
          testID={testID ? `${testID}-carbs` : undefined}
          label={t().components.macroRing.carbs}
          color={colors.carbs}
          stat={carbs}
        />
        <MacroStatCell
          testID={testID ? `${testID}-fat` : undefined}
          label={t().components.macroRing.fat}
          color={colors.fat}
          stat={fat}
        />
      </View>
    </View>
  )
}

interface MacroStatCellProps {
  label: string
  color: string
  stat: MacroStat
  testID?: string
}

function MacroStatCell({ label, color, stat, testID }: MacroStatCellProps) {
  return (
    <View style={styles.statCell} testID={testID}>
      <RTLWrapper style={styles.statHeader}>
        <View
          style={[styles.dot, { backgroundColor: color }]}
          testID={testID ? `${testID}-dot` : undefined}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </RTLWrapper>
      <Text style={styles.statValue}>
        {stat.current} / {stat.goal} g
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  centerSublabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.lg,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statHeader: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  statValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xxs,
  },
})
