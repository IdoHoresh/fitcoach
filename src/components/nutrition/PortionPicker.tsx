import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodItem, MealType, ServingUnit } from '@/types'
import { computeFoodMacros } from './foodSearch.helpers'

interface PortionPickerProps {
  food: FoodItem
  mealType: MealType
  date: string
  onBack: () => void
  onConfirmed: () => void
  testID?: string
}

export function PortionPicker({
  food,
  mealType,
  date,
  onBack,
  onConfirmed,
  testID,
}: PortionPickerProps) {
  const strings = t().nutrition
  const logFood = useNutritionStore((s) => s.logFood)

  const defaultGrams = food.servingSizes[0]?.grams ?? 100
  const [grams, setGrams] = useState(defaultGrams)
  const [inputValue, setInputValue] = useState(String(defaultGrams))
  const [selectedServingIndex, setSelectedServingIndex] = useState<number | null>(
    food.servingSizes.length > 0 ? 0 : null,
  )

  const macros = computeFoodMacros(food, grams)

  function handleServingSelect(index: number) {
    const g = food.servingSizes[index].grams
    setSelectedServingIndex(index)
    setGrams(g)
    setInputValue(String(g))
  }

  function handleDecrement() {
    setGrams((prev) => {
      const next = Math.max(1, prev - 10)
      setInputValue(String(next))
      return next
    })
    setSelectedServingIndex(null)
  }

  function handleIncrement() {
    setGrams((prev) => {
      const next = prev + 10
      setInputValue(String(next))
      return next
    })
    setSelectedServingIndex(null)
  }

  function handleInputChange(text: string) {
    setInputValue(text)
    const parsed = parseInt(text, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      setGrams(parsed)
      setSelectedServingIndex(null)
    }
  }

  function handleInputBlur() {
    const parsed = parseInt(inputValue, 10)
    const clamped = isNaN(parsed) || parsed < 1 ? 1 : parsed
    setGrams(clamped)
    setInputValue(String(clamped))
    setSelectedServingIndex(null)
  }

  async function handleConfirm() {
    const servingUnit: ServingUnit = 'grams'
    await logFood({
      foodId: food.id,
      nameHe: food.nameHe,
      mealType,
      date,
      servingAmount: grams,
      servingUnit,
      gramsConsumed: grams,
      calories: Math.round(macros.calories),
      protein: Math.round(macros.protein * 10) / 10,
      fat: Math.round(macros.fat * 10) / 10,
      carbs: Math.round(macros.carbs * 10) / 10,
    })
    onConfirmed()
  }

  return (
    <ScrollView style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} testID={testID ? `${testID}-back` : undefined}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.foodName} testID={testID ? `${testID}-name` : undefined}>
          {food.nameHe}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Quick serving chips */}
      {food.servingSizes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{strings.servingSize}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsRow}>
              {food.servingSizes.map((serving, index) => {
                const selected = selectedServingIndex === index
                return (
                  <Pressable
                    key={index}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => handleServingSelect(index)}
                    testID={testID ? `${testID}-serving-${index}` : undefined}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {serving.nameHe} ({serving.grams}
                      {strings.grams})
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Gram stepper */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{strings.customAmount}</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={handleDecrement}
            testID={testID ? `${testID}-decrement` : undefined}
          >
            <Ionicons name="remove" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.gramDisplay}>
            <TextInput
              style={styles.gramValue}
              value={inputValue}
              onChangeText={handleInputChange}
              onBlur={handleInputBlur}
              keyboardType="numeric"
              textAlign="center"
              selectTextOnFocus
              testID={testID ? `${testID}-grams` : undefined}
            />
            <Text style={styles.gramUnit}>{strings.grams}</Text>
          </View>
          <Pressable
            style={styles.stepButton}
            onPress={handleIncrement}
            testID={testID ? `${testID}-increment` : undefined}
          >
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Macro preview */}
      <View style={styles.macroCard}>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>{t().nutrition.macros.protein}</Text>
          <Text style={styles.macroValue} testID={testID ? `${testID}-protein` : undefined}>
            {macros.protein.toFixed(1)}g
          </Text>
        </View>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>{t().nutrition.macros.carbs}</Text>
          <Text style={styles.macroValue} testID={testID ? `${testID}-carbs` : undefined}>
            {macros.carbs.toFixed(1)}g
          </Text>
        </View>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>{t().nutrition.macros.fat}</Text>
          <Text style={styles.macroValue} testID={testID ? `${testID}-fat` : undefined}>
            {macros.fat.toFixed(1)}g
          </Text>
        </View>
        <View style={[styles.macroRow, styles.caloriesRow]}>
          <Text style={styles.caloriesLabel}>{t().nutrition.kcal}</Text>
          <Text style={styles.caloriesValue} testID={testID ? `${testID}-calories` : undefined}>
            {Math.round(macros.calories)}
          </Text>
        </View>
      </View>

      {/* Confirm button */}
      <Pressable
        style={styles.confirmButton}
        onPress={handleConfirm}
        testID={testID ? `${testID}-confirm` : undefined}
      >
        <Text style={styles.confirmLabel}>{strings.confirm}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  foodName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.ms,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gramDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  gramValue: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  gramUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  macroCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  macroValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  caloriesRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  caloriesLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  caloriesValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  confirmButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
})
