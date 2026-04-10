import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodItem, MealType } from '@/types'
import { FOOD_MAP } from '@/data/foods'
import { searchFoods } from './foodSearch.helpers'
import { PortionPicker } from './PortionPicker'

interface FoodSearchSheetProps {
  visible: boolean
  mealType: MealType
  date: string
  onClose: () => void
  testID?: string
}

interface FoodRowProps {
  food: FoodItem
  onPress: (food: FoodItem) => void
  testID?: string
}

function FoodRow({ food, onPress, testID }: FoodRowProps) {
  return (
    <Pressable style={styles.foodRow} onPress={() => onPress(food)} testID={testID}>
      <View style={styles.foodRowContent}>
        <Text style={styles.foodName} numberOfLines={1}>
          {food.nameHe}
        </Text>
        <Text style={styles.foodSub} numberOfLines={1}>
          {food.nameEn}
        </Text>
      </View>
      <Text style={styles.foodCalories}>
        {Math.round(food.caloriesPer100g)} {t().nutrition.kcal}
      </Text>
    </Pressable>
  )
}

export function FoodSearchSheet({
  visible,
  mealType,
  date,
  onClose,
  testID,
}: FoodSearchSheetProps) {
  const strings = t().nutrition
  const id = testID ?? 'food-search-sheet'

  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)

  const results = useMemo(() => searchFoods(query, FOOD_MAP), [query])

  function handleFoodPress(food: FoodItem) {
    setSelectedFood(food)
  }

  function handleClose() {
    setQuery('')
    setSelectedFood(null)
    onClose()
  }

  if (!visible) return null

  if (selectedFood) {
    return (
      <Modal visible animationType="slide" onRequestClose={() => setSelectedFood(null)}>
        <PortionPicker
          food={selectedFood}
          mealType={mealType}
          date={date}
          onBack={() => setSelectedFood(null)}
          onConfirmed={handleClose}
        />
      </Modal>
    )
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={handleClose} testID={`${id}-close`}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>

        {/* Search input */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={strings.searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            testID={`${id}-input`}
          />
        </View>

        {/* Section label */}
        {!query && <Text style={styles.sectionLabel}>{strings.recentlyUsed}</Text>}

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodRow food={item} onPress={handleFoodPress} testID={`${id}-result-${item.id}`} />
          )}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
        />

        {/* Add custom food */}
        <Pressable style={styles.customFoodButton} testID={`${id}-custom-food`}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.customFoodLabel}>{strings.addCustomFood}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    padding: spacing.xs,
    zIndex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  list: {
    flex: 1,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  foodRowContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  foodName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  foodSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  foodCalories: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.md,
    minWidth: 50,
    textAlign: 'left',
  },
  customFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  customFoodLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
