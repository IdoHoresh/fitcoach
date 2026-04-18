/**
 * ManualFoodForm — fallback form for creating a manual food entry.
 *
 * Two entry modes:
 *   - Scanner unhappy-path: `ean` prop is provided; rendered read-only at top.
 *     Id = `manual_<ean>`. Caller is `BarcodeScannerSheet` after OFF 404.
 *   - Text-search no-results: `ean` prop omitted; an optional EAN input lives
 *     in the collapsed "more details" section. Id = `manual_<digits>` if user
 *     typed an EAN (digits stripped), else `manual_<uuid-v4>`.
 *
 * Form shape: MacroFactor/MFP-inspired progressive disclosure.
 *   Always visible:    name, calories, protein, fat, carbs
 *   Collapsed expander: English name, fiber, serving size (name + grams), EAN (text-search)
 *
 * Macros are visible but blank-allowed — leaving them empty submits the food
 * with macros=0, which the `isMacroIncomplete` helper later detects to show
 * "—" in search results and skip from daily macro totals. No separate
 * "calories only" toggle is needed; the blank fields themselves ARE the signal.
 *
 * Validation flow:
 *   1. Pre-parse numeric strings → numbers (blank macros → 0; blank calories blocks)
 *   2. Run ManualFoodInputSchema.safeParse → Zod enforces clamps + p+f+c ≤ 101 + serving-pair refine
 *   3. On success: construct FoodItem (id per mode, isUserCreated, auto 100g serving)
 *   4. Atwater delta warning renders inline when kcal diverges >25% from 4·p + 9·f + 4·c
 *      (soft warn only — only fires when all three macros are filled)
 *
 * Persistence is the host's responsibility (insertFoodStrict for manual paths,
 * upsertFood for OFF refresh paths). The form is repository-agnostic.
 */

import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { randomUUID } from 'expo-crypto'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodItem, ServingSize } from '@/types'
import { ManualFoodInputSchema, computeAtwaterDelta } from '@/security/validation'
import { normalizeEan } from '@/shared/normalizeEan'

// ── Types ─────────────────────────────────────────────────────────────

interface ManualFoodFormProps {
  /** Pre-known EAN from the scanner path. Omit for text-search entry. */
  ean?: string
  /** Pre-fill the Hebrew name (e.g. from the FoodSearchSheet query). */
  initialNameHe?: string
  onSubmit: (food: FoodItem) => void | Promise<void>
  onCancel: () => void
  testID?: string
}

type FormErrors = Partial<Record<string, string>>

const ATWATER_WARN_THRESHOLD = 0.25

// ── Parse helpers ─────────────────────────────────────────────────────

type NumericParseResult = { ok: true; value: number } | { ok: false; reason: 'numberInvalid' }

function parseRequiredNumeric(raw: string): NumericParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: false, reason: 'numberInvalid' }
  const n = Number(trimmed)
  if (Number.isNaN(n)) return { ok: false, reason: 'numberInvalid' }
  return { ok: true, value: n }
}

function parseOptionalNumeric(
  raw: string,
): { ok: true; value: number | undefined } | { ok: false; reason: 'numberInvalid' } {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: true, value: undefined }
  const n = Number(trimmed)
  if (Number.isNaN(n)) return { ok: false, reason: 'numberInvalid' }
  return { ok: true, value: n }
}

function shouldShowAtwaterWarning(
  kcalStr: string,
  pStr: string,
  fStr: string,
  cStr: string,
): boolean {
  if (!kcalStr.trim() || !pStr.trim() || !fStr.trim() || !cStr.trim()) return false
  const kcal = Number(kcalStr)
  const p = Number(pStr)
  const f = Number(fStr)
  const c = Number(cStr)
  if ([kcal, p, f, c].some(Number.isNaN)) return false
  if (kcal <= 0) return false
  return computeAtwaterDelta(kcal, p, f, c).deltaPct > ATWATER_WARN_THRESHOLD
}

/**
 * Picks the suffix used for the FoodItem id:
 *   - scanner path (eanProp set) → use the scanned EAN as-is
 *   - text-search path with typed EAN → strip non-digits; use if any remain
 *   - text-search path with no usable EAN → fresh uuid v4
 */
function resolveFoodIdSuffix(eanProp: string | undefined, typedEan: string): string {
  if (eanProp != null) return eanProp
  const cleaned = normalizeEan(typedEan)
  return cleaned.length > 0 ? cleaned : randomUUID()
}

// ── Component ─────────────────────────────────────────────────────────

export function ManualFoodForm({
  ean,
  initialNameHe,
  onSubmit,
  onCancel,
  testID,
}: ManualFoodFormProps) {
  const strings = t().manualFood

  const [nameHe, setNameHe] = useState(initialNameHe ?? '')
  const [nameEn, setNameEn] = useState('')
  const [typedEan, setTypedEan] = useState('')
  const [calories, setCalories] = useState('')
  const [caloriesManuallyEdited, setCaloriesManuallyEdited] = useState(false)
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fiber, setFiber] = useState('')
  const [servingName, setServingName] = useState('')
  const [servingGrams, setServingGrams] = useState('')
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Auto-fill calories from Atwater (4·p + 9·f + 4·c) when all three macros are
  // complete and the user hasn't manually typed into the calories field yet.
  // Once the user overrides, flag is set and auto-fill stops — lets them match
  // a label's rounded kcal value instead of the strict Atwater estimate.
  React.useEffect(() => {
    if (caloriesManuallyEdited) return
    if (protein.trim() === '' || fat.trim() === '' || carbs.trim() === '') return
    const p = Number(protein)
    const f = Number(fat)
    const c = Number(carbs)
    if ([p, f, c].some(Number.isNaN)) return
    const kcal = 4 * p + 9 * f + 4 * c
    setCalories(String(Math.round(kcal)))
  }, [protein, fat, carbs, caloriesManuallyEdited])

  function handleCaloriesChange(next: string) {
    setCalories(next)
    setCaloriesManuallyEdited(true)
  }

  const showAtwater = shouldShowAtwaterWarning(calories, protein, fat, carbs)

  function tid(suffix: string): string | undefined {
    return testID ? `${testID}-${suffix}` : undefined
  }

  function resolveError(field: string): string | undefined {
    const token = errors[field]
    if (!token) return undefined
    const errs = strings.errors as Record<string, string>
    return errs[token] ?? token
  }

  function handleSubmit() {
    const newErrors: FormErrors = {}

    // 1. Pre-parse numeric fields. Calories is required (blank blocks submit);
    //    macros are blank-allowed (blank → 0 → isMacroIncomplete detects later
    //    and hides them from daily totals).
    const caloriesParsed = parseRequiredNumeric(calories)
    const proteinParsed = parseOptionalNumeric(protein)
    const fatParsed = parseOptionalNumeric(fat)
    const carbsParsed = parseOptionalNumeric(carbs)
    const fiberParsed = parseOptionalNumeric(fiber)
    const servingGramsParsed = parseOptionalNumeric(servingGrams)

    if (!caloriesParsed.ok) newErrors.caloriesPer100g = caloriesParsed.reason
    if (!proteinParsed.ok) newErrors.proteinPer100g = proteinParsed.reason
    if (!fatParsed.ok) newErrors.fatPer100g = fatParsed.reason
    if (!carbsParsed.ok) newErrors.carbsPer100g = carbsParsed.reason
    if (!fiberParsed.ok) newErrors.fiberPer100g = fiberParsed.reason
    if (!servingGramsParsed.ok) newErrors.servingGrams = servingGramsParsed.reason

    // 2. Zod validation (blank macros → 0; p+f+c refinement trivially passes when
    //    all three are 0, which is the "calories-only" intent).
    const input = {
      nameHe,
      nameEn: nameEn || undefined,
      caloriesPer100g: caloriesParsed.ok ? caloriesParsed.value : 0,
      proteinPer100g: proteinParsed.ok ? (proteinParsed.value ?? 0) : 0,
      fatPer100g: fatParsed.ok ? (fatParsed.value ?? 0) : 0,
      carbsPer100g: carbsParsed.ok ? (carbsParsed.value ?? 0) : 0,
      fiberPer100g: fiberParsed.ok ? (fiberParsed.value ?? 0) : 0,
      servingName: servingName || undefined,
      servingGrams: servingGramsParsed.ok ? servingGramsParsed.value : undefined,
    }

    const result = ManualFoodInputSchema.safeParse(input)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !newErrors[field]) {
          newErrors[field] = issue.message
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // 3. Build FoodItem
    if (!result.success) return // typescript narrowing (unreachable after error gate)
    const data = result.data

    const servingSizes: ServingSize[] = [
      { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
    ]
    if (data.servingName != null && data.servingGrams != null) {
      servingSizes.push({
        nameHe: data.servingName,
        nameEn: data.servingName,
        unit: 'grams',
        grams: data.servingGrams,
      })
    }

    const food: FoodItem = {
      id: `manual_${resolveFoodIdSuffix(ean, typedEan)}`,
      nameHe: data.nameHe,
      nameEn: data.nameEn ?? data.nameHe,
      category: 'snacks',
      caloriesPer100g: data.caloriesPer100g,
      proteinPer100g: data.proteinPer100g,
      fatPer100g: data.fatPer100g,
      carbsPer100g: data.carbsPer100g,
      fiberPer100g: data.fiberPer100g,
      isUserCreated: true,
      servingSizes,
    }

    setErrors({})
    void onSubmit(food)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID={testID}>
      <Text style={styles.title}>{strings.title}</Text>

      {ean != null && (
        <View style={styles.eanRow}>
          <Text style={styles.eanLabel}>{strings.barcodeLabel}:</Text>
          <Text style={styles.eanValue} testID={tid('ean-display')}>
            {ean}
          </Text>
        </View>
      )}

      <TextInput
        label={strings.nameHeLabel}
        value={nameHe}
        onChangeText={setNameHe}
        placeholder={strings.nameHePlaceholder}
        error={resolveError('nameHe')}
        testID={tid('name-he')}
      />

      <Text style={styles.sectionHeader} testID={tid('per-100g-header')}>
        {strings.per100gHeader}
      </Text>
      <Text style={styles.sectionSubtitle}>{strings.per100gSubtitle}</Text>

      <TextInput
        label={strings.caloriesLabel}
        value={calories}
        onChangeText={handleCaloriesChange}
        keyboardType="decimal-pad"
        error={resolveError('caloriesPer100g')}
        testID={tid('calories')}
      />

      {showAtwater && (
        <Text style={styles.atwaterWarning} testID={tid('atwater-warning')}>
          {strings.atwaterWarning}
        </Text>
      )}

      <TextInput
        label={strings.proteinLabel}
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
        error={resolveError('proteinPer100g')}
        testID={tid('protein')}
      />

      <TextInput
        label={strings.fatLabel}
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
        error={resolveError('fatPer100g')}
        testID={tid('fat')}
      />

      <TextInput
        label={strings.carbsLabel}
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
        error={resolveError('carbsPer100g')}
        testID={tid('carbs')}
      />

      <Pressable
        style={styles.moreDetailsToggle}
        onPress={() => setShowMoreDetails((v) => !v)}
        testID={tid('more-details-toggle')}
      >
        <Text style={styles.moreDetailsLabel}>
          {showMoreDetails ? strings.hideMoreDetails : strings.showMoreDetails}
        </Text>
        <Ionicons
          name={showMoreDetails ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.primary}
        />
      </Pressable>

      {showMoreDetails && (
        <View style={styles.moreDetailsBlock} testID={tid('more-details-block')}>
          {ean == null && (
            <TextInput
              label={strings.eanInputLabel}
              value={typedEan}
              onChangeText={setTypedEan}
              placeholder={strings.eanInputPlaceholder}
              keyboardType="number-pad"
              testID={tid('ean-input')}
            />
          )}

          <TextInput
            label={strings.nameEnLabel}
            value={nameEn}
            onChangeText={setNameEn}
            placeholder={strings.nameEnPlaceholder}
            testID={tid('name-en')}
          />

          <TextInput
            label={strings.fiberLabel}
            value={fiber}
            onChangeText={setFiber}
            keyboardType="decimal-pad"
            error={resolveError('fiberPer100g')}
            testID={tid('fiber')}
          />

          <TextInput
            label={strings.servingNameLabel}
            value={servingName}
            onChangeText={setServingName}
            placeholder={strings.servingNamePlaceholder}
            error={resolveError('servingName')}
            testID={tid('serving-name')}
          />

          <TextInput
            label={strings.servingGramsLabel}
            value={servingGrams}
            onChangeText={setServingGrams}
            keyboardType="decimal-pad"
            error={resolveError('servingGrams')}
            testID={tid('serving-grams')}
          />
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          label={strings.cancelButton}
          variant="outline"
          onPress={onCancel}
          testID={tid('cancel')}
        />
        <Button
          label={strings.submitButton}
          variant="primary"
          onPress={handleSubmit}
          testID={tid('submit')}
        />
      </View>
    </ScrollView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  eanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
  },
  eanLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  eanValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    lineHeight: 18,
    textAlign: 'right',
  },
  atwaterWarning: {
    fontSize: fontSize.xs,
    color: colors.warning,
    paddingHorizontal: spacing.sm,
    lineHeight: 18,
  },
  moreDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  moreDetailsLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  moreDetailsBlock: {
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
})
