/**
 * ManualFoodForm — fallback form when OFF returns 404 for a scanned EAN.
 *
 * Hebrew-first input (name + 4 macros required, fiber + natural-unit serving optional).
 * Emits a FoodItem on successful submit; the host (BarcodeScannerSheet this PR,
 * future text-search entry in a follow-up PR) is responsible for persistence.
 *
 * Validation flow:
 *   1. Pre-parse numeric strings → numbers (empty / NaN surfaces as numberInvalid)
 *   2. Run ManualFoodInputSchema.safeParse → Zod enforces clamps + p+f+c ≤ 101 + serving-pair refine
 *   3. On success: construct FoodItem (id = manual_<ean>, isUserCreated, auto 100g serving)
 *   4. Atwater delta warning renders inline when kcal diverges >25% from 4·p + 9·f + 4·c
 *      (soft warn only — does not block submit)
 */

import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import type { FoodItem, ServingSize } from '@/types'
import { ManualFoodInputSchema, computeAtwaterDelta } from '@/security/validation'

// ── Types ─────────────────────────────────────────────────────────────

interface ManualFoodFormProps {
  ean: string
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

// ── Component ─────────────────────────────────────────────────────────

export function ManualFoodForm({ ean, onSubmit, onCancel, testID }: ManualFoodFormProps) {
  const strings = t().manualFood

  const [nameHe, setNameHe] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fiber, setFiber] = useState('')
  const [servingName, setServingName] = useState('')
  const [servingGrams, setServingGrams] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

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

    // 1. Pre-parse numeric fields
    const caloriesParsed = parseRequiredNumeric(calories)
    const proteinParsed = parseRequiredNumeric(protein)
    const fatParsed = parseRequiredNumeric(fat)
    const carbsParsed = parseRequiredNumeric(carbs)
    const fiberParsed = parseOptionalNumeric(fiber)
    const servingGramsParsed = parseOptionalNumeric(servingGrams)

    if (!caloriesParsed.ok) newErrors.caloriesPer100g = caloriesParsed.reason
    if (!proteinParsed.ok) newErrors.proteinPer100g = proteinParsed.reason
    if (!fatParsed.ok) newErrors.fatPer100g = fatParsed.reason
    if (!carbsParsed.ok) newErrors.carbsPer100g = carbsParsed.reason
    if (!fiberParsed.ok) newErrors.fiberPer100g = fiberParsed.reason
    if (!servingGramsParsed.ok) newErrors.servingGrams = servingGramsParsed.reason

    if (
      !caloriesParsed.ok ||
      !proteinParsed.ok ||
      !fatParsed.ok ||
      !carbsParsed.ok ||
      !fiberParsed.ok ||
      !servingGramsParsed.ok
    ) {
      // Surface parse errors on macro fields; we still fall through to Zod for nameHe
      // and serving-pair refinements, so the user sees everything wrong at once.
    }

    // 2. Zod validation (uses parsed numbers; empty macros replaced with 0 so the
    //    schema still evaluates the p+f+c refinement meaningfully even on parse-fail
    //    rows — the parse-fail errors above already block submit for those fields)
    const input = {
      nameHe,
      nameEn: nameEn || undefined,
      caloriesPer100g: caloriesParsed.ok ? caloriesParsed.value : 0,
      proteinPer100g: proteinParsed.ok ? proteinParsed.value : 0,
      fatPer100g: fatParsed.ok ? fatParsed.value : 0,
      carbsPer100g: carbsParsed.ok ? carbsParsed.value : 0,
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
      id: `manual_${ean}`,
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

      <View style={styles.eanRow}>
        <Text style={styles.eanLabel}>{strings.barcodeLabel}:</Text>
        <Text style={styles.eanValue} testID={tid('ean-display')}>
          {ean}
        </Text>
      </View>

      <TextInput
        label={strings.nameHeLabel}
        value={nameHe}
        onChangeText={setNameHe}
        placeholder={strings.nameHePlaceholder}
        error={resolveError('nameHe')}
        testID={tid('name-he')}
      />

      <TextInput
        label={strings.nameEnLabel}
        value={nameEn}
        onChangeText={setNameEn}
        placeholder={strings.nameEnPlaceholder}
        testID={tid('name-en')}
      />

      <Text style={styles.sectionHeader}>{strings.per100gHeader}</Text>
      <Text style={styles.sectionSubtitle}>{strings.per100gSubtitle}</Text>

      <TextInput
        label={strings.caloriesLabel}
        value={calories}
        onChangeText={setCalories}
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

      <TextInput
        label={strings.fiberLabel}
        value={fiber}
        onChangeText={setFiber}
        keyboardType="decimal-pad"
        error={resolveError('fiberPer100g')}
        testID={tid('fiber')}
      />

      <Text style={styles.sectionHeader}>{strings.servingSectionLabel}</Text>
      <Text style={styles.sectionSubtitle}>{strings.servingSectionSubtitle}</Text>

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
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  atwaterWarning: {
    fontSize: fontSize.xs,
    color: colors.warning,
    paddingHorizontal: spacing.sm,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
})
