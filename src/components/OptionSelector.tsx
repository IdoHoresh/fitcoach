import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontFamily } from '@/theme/typography'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'
import { triggerHaptic } from '@/hooks/useHaptics'

const SELECTED_BG = colors.primary + '26'

type OptionLayout = 'grid' | 'list'

interface Option {
  id: string
  label: string
  icon?: string
  description?: string
}

interface OptionSelectorProps {
  options: Option[]
  selected: string
  onSelect: (id: string) => void
  layout: OptionLayout
  testID?: string
}

const LAYOUT_STYLES: Record<OptionLayout, ViewStyle> = {
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function OptionItem({
  option,
  isSelected,
  isGrid,
  onSelect,
  testID,
}: {
  option: Option
  isSelected: boolean
  isGrid: boolean
  onSelect: (id: string) => void
  testID: string
}) {
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress()

  const handlePressIn = useCallback(() => {
    onPressIn()
    onSelect(option.id)
    triggerHaptic('light')
  }, [onPressIn, onSelect, option.id])

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={onPressOut}
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ selected: isSelected }}
      testID={testID}
      style={[
        styles.option,
        isGrid && styles.gridItem,
        isSelected ? styles.selected : styles.unselected,
        animatedStyle,
      ]}
    >
      {option.icon ? <Text style={styles.icon}>{option.icon}</Text> : null}
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
      {option.description ? (
        <Text style={styles.description} testID={`${testID}-description`}>
          {option.description}
        </Text>
      ) : null}
    </AnimatedPressable>
  )
}

export function OptionSelector({
  options,
  selected,
  onSelect,
  layout,
  testID,
}: OptionSelectorProps) {
  const isGrid = layout === 'grid'

  return (
    <View
      style={LAYOUT_STYLES[layout]}
      testID={testID ? `${testID}-container` : 'selector-container'}
    >
      {options.map((option) => (
        <OptionItem
          key={option.id}
          option={option}
          isSelected={option.id === selected}
          isGrid={isGrid}
          onSelect={onSelect}
          testID={testID ? `${testID}-option-${option.id}` : `option-${option.id}`}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  option: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  selected: {
    backgroundColor: SELECTED_BG,
    borderColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  icon: {
    fontSize: fontSize.xl,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
})
