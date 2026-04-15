import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { selectedCardStyle } from '@/theme/selectedCard'
import { useAnimatedPress } from '@/hooks/useAnimatedPress'
import { triggerHaptic } from '@/hooks/useHaptics'
import { t } from '@/i18n'
import { RTLWrapper } from './shared/RTLWrapper'

interface CheckboxOption {
  id: string
  label: string
  icon?: string
}

interface CheckboxListProps {
  options: CheckboxOption[]
  selected: string[]
  onToggle: (id: string) => void
  showSelectAll?: boolean
  testID?: string
}

const CHECKMARK_SIZE = 24

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function CheckboxRow({
  option,
  isChecked,
  onToggle,
  testID,
}: {
  option: CheckboxOption
  isChecked: boolean
  onToggle: (id: string) => void
  testID: string
}) {
  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress()

  const handlePressIn = useCallback(() => {
    onPressIn()
    onToggle(option.id)
    triggerHaptic('light')
  }, [onPressIn, onToggle, option.id])

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={onPressOut}
      accessibilityRole="checkbox"
      accessibilityLabel={option.label}
      accessibilityState={{ checked: isChecked }}
      testID={testID}
      style={[styles.row, isChecked ? styles.rowChecked : styles.rowUnchecked, animatedStyle]}
    >
      <RTLWrapper style={styles.rowContent}>
        {option.icon ? <Text style={styles.icon}>{option.icon}</Text> : null}
        <Text style={[styles.label, isChecked && styles.labelChecked]}>{option.label}</Text>
        <View style={styles.spacer} />
        {isChecked ? (
          <View style={styles.checkmark} testID={`${testID.replace(/option/, 'checkmark')}`}>
            <Text style={styles.checkmarkText}>{'\u2713'}</Text>
          </View>
        ) : null}
      </RTLWrapper>
    </AnimatedPressable>
  )
}

export function CheckboxList({
  options,
  selected,
  onToggle,
  showSelectAll = true,
  testID,
}: CheckboxListProps) {
  const isAllSelected = options.every((o) => selected.includes(o.id))

  const { animatedStyle, onPressIn, onPressOut } = useAnimatedPress()

  const handleSelectAllPressIn = useCallback(() => {
    onPressIn()
    if (isAllSelected) {
      selected.forEach((id) => onToggle(id))
    } else {
      options.filter((o) => !selected.includes(o.id)).forEach((o) => onToggle(o.id))
    }
    triggerHaptic('light')
  }, [onPressIn, isAllSelected, selected, options, onToggle])

  const strings = t().components.checkboxList
  const selectAllLabel = isAllSelected ? strings.clearAll : strings.selectAll

  return (
    <View style={styles.container}>
      {showSelectAll ? (
        <AnimatedPressable
          onPressIn={handleSelectAllPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={selectAllLabel}
          testID={testID ? `${testID}-select-all` : 'select-all'}
          style={[styles.selectAllRow, animatedStyle]}
        >
          <Text
            style={styles.selectAllLabel}
            testID={testID ? `${testID}-select-all-label` : 'select-all-label'}
          >
            {selectAllLabel}
          </Text>
        </AnimatedPressable>
      ) : null}
      {options.map((option) => (
        <CheckboxRow
          key={option.id}
          option={option}
          isChecked={selected.includes(option.id)}
          onToggle={onToggle}
          testID={testID ? `${testID}-option-${option.id}` : `option-${option.id}`}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  selectAllRow: {
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  selectAllLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  row: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    ...selectedCardStyle.base,
  },
  rowChecked: selectedCardStyle.selected,
  rowUnchecked: selectedCardStyle.unselected,
  rowContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  labelChecked: selectedCardStyle.labelSelected,
  spacer: {
    flex: 1,
  },
  checkmark: {
    width: CHECKMARK_SIZE,
    height: CHECKMARK_SIZE,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
})
