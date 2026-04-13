/**
 * Raw ingredient catalog schema.
 *
 * Curated list of ~200 whole-food building blocks (meat, veg, grains, etc.)
 * cross-sourced from USDA SR Legacy and Tzameret. Shipped as schema v16.
 *
 * Shape extends the base FoodSeed used by the supermarket seeds, with three
 * extra fields specific to this catalog:
 *   - state: 'raw' | 'cooked'  — same food in two weigh-states
 *   - baseSlug: groups raw/cooked pairs for future UI toggles
 *   - priority: P0/P1/P2 ship tiering so Task 3 can ship partial and still be useful
 */

import { z } from 'zod'

const ServingSizeSchema = z.object({
  nameHe: z.string().min(1),
  nameEn: z.string().min(1),
  unit: z.string().min(1),
  grams: z.number().positive(),
})

const ServingSizesJsonSchema = z.string().superRefine((raw, ctx) => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'servingSizesJson is not valid JSON' })
    return
  }
  const result = z.array(ServingSizeSchema).min(1).safeParse(parsed)
  if (!result.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'servingSizes array invalid or empty' })
    return
  }
  if (!result.data.some((s) => s.grams === 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'servingSizes must include a 100g entry',
    })
  }
})

export const RawIngredientSchema = z.object({
  id: z.string().regex(/^raw_[a-z0-9_]+$/, 'id must start with raw_ and be snake_case'),
  baseSlug: z.string().min(1),
  state: z.enum(['raw', 'cooked']),
  priority: z.enum(['P0', 'P1', 'P2']),
  nameHe: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.string().min(1),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fiberPer100g: z.number().min(0),
  isUserCreated: z.literal(false),
  servingSizesJson: ServingSizesJsonSchema,
  sourceComment: z.string().optional(),
})

export type RawIngredient = z.infer<typeof RawIngredientSchema>
