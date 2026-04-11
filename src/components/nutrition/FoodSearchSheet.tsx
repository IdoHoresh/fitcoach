import React, { useState, useMemo, useEffect } from 'react'
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
import type { FoodItem, FoodCategory, MealType } from '@/types'
import { MACRO_SATISFIED_THRESHOLD } from '@/data/constants'
import { FOOD_MAP } from '@/data/foods'
import type { MealMacroTargetByName } from '@/algorithms/meal-targets'
import { searchFoods } from './foodSearch.helpers'
import { MacroTab } from './MacroTab'
import { PortionPicker } from './PortionPicker'

// ── Tab types & constants ────────────────────────────────────────────

type MacroTabId = 'protein' | 'fat' | 'carbs' | 'all'

const PROTEIN_CATS: ReadonlySet<FoodCategory> = new Set(['protein', 'dairy'])
const FAT_CATS: ReadonlySet<FoodCategory> = new Set(['fats'])
const CARB_CATS: ReadonlySet<FoodCategory> = new Set([
  'carbs',
  'fruits',
  'vegetables',
  'traditional',
  'snacks',
])

const TAB_DEFS = [
  { id: 'protein' as MacroTabId, emoji: '🥩', label: 'בשר ודגים', subtitle: 'עוף, ביצים, דגים' },
  { id: 'carbs' as MacroTabId, emoji: '🥦', label: 'פחמימות', subtitle: 'דגנים, ירקות, פירות' },
  { id: 'fat' as MacroTabId, emoji: '🥑', label: 'שומן', subtitle: 'אבוקדו, שמן' },
  { id: 'all' as MacroTabId, emoji: '🔍', label: 'הכל', subtitle: undefined },
] as const

interface MealLogged {
  protein: number
  fat: number
  carbs: number
}

interface FoodSearchSheetProps {
  visible: boolean
  mealType: MealType
  date: string
  onClose: () => void
  mealTarget?: MealMacroTargetByName
  mealLogged?: MealLogged
  testID?: string
}

interface FoodRowProps {
  food: FoodItem
  onPress: (food: FoodItem) => void
  testID?: string
}

function FoodRow({ food, onPress, testID }: FoodRowProps) {
  const strings = t().nutrition
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
      <View style={styles.foodMacros}>
        <Text style={styles.foodCalories}>
          {Math.round(food.caloriesPer100g)} {strings.kcal}
        </Text>
        <Text style={styles.foodProtein}>
          {Math.round(food.proteinPer100g)}g {strings.macros.protein}
        </Text>
      </View>
    </Pressable>
  )
}

export function FoodSearchSheet({
  visible,
  mealType,
  date,
  onClose,
  mealTarget,
  mealLogged,
  testID,
}: FoodSearchSheetProps) {
  const strings = t().nutrition
  const id = testID ?? 'food-search-sheet'

  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [activeTab, setActiveTab] = useState<MacroTabId>('all')

  // Reset to 'all' tab every time the sheet opens
  useEffect(() => {
    if (visible) {
      setActiveTab('all')
    }
  }, [visible])

  const allResults = useMemo(() => searchFoods(query, FOOD_MAP), [query])

  // Filter results by active tab (search query still applies within tab)
  const results = useMemo(() => {
    if (activeTab === 'all') return allResults
    const cats = activeTab === 'protein' ? PROTEIN_CATS : activeTab === 'fat' ? FAT_CATS : CARB_CATS
    return allResults.filter((f) => cats.has(f.category))
  }, [allResults, activeTab])

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

        {/* Macro tabs — only shown when mealTarget is provided */}
        {mealTarget && (
          <View style={styles.tabsRow} testID={`${id}-tabs`}>
            {TAB_DEFS.map((tab) => (
              <MacroTab
                key={tab.id}
                emoji={tab.emoji}
                label={tab.label}
                subtitle={tab.subtitle}
                isSelected={activeTab === tab.id}
                isMet={isTabMet(tab.id, mealTarget, mealLogged)}
                onPress={() => setActiveTab(tab.id)}
                testID={`${id}-tab-${tab.id}`}
              />
            ))}
          </View>
        )}

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

        {/* Section label — show result count while searching */}
        {query.trim().length > 0 && results.length === 0 && (
          <Text style={styles.sectionLabel}>{strings.noResults ?? 'לא נמצאו תוצאות'}</Text>
        )}

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

// ── Helpers ──────────────────────────────────────────────────────────

/** Returns true when the macro for this tab is ≥ 90% met. */
function isTabMet(tabId: MacroTabId, target: MealMacroTargetByName, logged?: MealLogged): boolean {
  if (tabId === 'all') return false
  const loggedVal = logged?.[tabId] ?? 0
  const goalVal = target[tabId as keyof MealMacroTargetByName]
  if (typeof goalVal !== 'number' || goalVal <= 0) return false
  return loggedVal / goalVal >= MACRO_SATISFIED_THRESHOLD
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  foodMacros: {
    alignItems: 'flex-end',
    gap: 2,
    marginStart: spacing.sm,
    flexShrink: 0,
  },
  foodCalories: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textAlign: 'right',
  },
  foodProtein: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
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
