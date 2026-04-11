/**
 * Manual food overrides for the supermarket seed pipeline.
 *
 * PROTEIN_YOGHURT_OVERRIDES: 46 Israeli protein yoghurt SKUs entered with
 * verified macros sourced directly from brand websites and cross-verified
 * across 5+ sources (2026-04-11).
 *
 * Brands: Danone PRO (15 SKUs) · Müller Protein (14 SKUs) · Yoplait GO (17 SKUs)
 *
 * These override any Shufersal-scraped version of the same product —
 * brand-website data has higher confidence than retailer page data.
 */

import type { FoodSeed } from './tzameret-overrides'

// ── Serving size helpers ──────────────────────────────────────────────────

function s(grams: number): { nameHe: string; nameEn: string; unit: string; grams: number }[] {
  return [
    { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
    { nameHe: 'גביע שלם', nameEn: 'Full container', unit: 'grams', grams },
  ]
}

function sDrink(ml: number): { nameHe: string; nameEn: string; unit: string; grams: number }[] {
  return [
    { nameHe: '100 מ"ל', nameEn: '100ml', unit: 'ml', grams: 100 },
    { nameHe: 'בקבוק שלם', nameEn: 'Full bottle', unit: 'ml', grams: ml },
  ]
}

function dairy(
  id: string,
  nameHe: string,
  nameEn: string,
  containerGrams: number,
  cal: number,
  pro: number,
  fat: number,
  carbs: number,
  fiber: number,
): FoodSeed {
  return {
    id,
    nameHe,
    nameEn,
    category: 'dairy',
    caloriesPer100g: cal,
    proteinPer100g: pro,
    fatPer100g: fat,
    carbsPer100g: carbs,
    fiberPer100g: fiber,
    isUserCreated: false,
    servingSizesJson: JSON.stringify(s(containerGrams)),
  }
}

function drink(
  id: string,
  nameHe: string,
  nameEn: string,
  containerMl: number,
  cal: number,
  pro: number,
  fat: number,
  carbs: number,
  fiber: number,
): FoodSeed {
  return {
    id,
    nameHe,
    nameEn,
    category: 'dairy',
    caloriesPer100g: cal,
    proteinPer100g: pro,
    fatPer100g: fat,
    carbsPer100g: carbs,
    fiberPer100g: fiber,
    isUserCreated: false,
    servingSizesJson: JSON.stringify(sDrink(containerMl)),
  }
}

// ── Danone PRO (15 SKUs) ──────────────────────────────────────────────────
// Sources: danone.strauss-group.com, foodsdictionary.co.il (updated Sep 2025),
//          kaloria.co.il (updated Mar 2026), shufersal.co.il

const DANONE_PRO: FoodSeed[] = [
  // Classic plain
  dairy(
    'manual_danone_pro_natural_2pct_25g',
    'דנונה PRO יוגורט טבעי 25 גר׳ חלבון 2% שומן',
    'Danone PRO Natural Yogurt 25g Protein 2% Fat',
    215,
    88,
    11.6,
    2.0,
    4.1,
    1.9,
  ),
  dairy(
    'manual_danone_pro_natural_1_5pct_20g',
    'דנונה PRO יוגורט 20 גר׳ חלבון 1.5% שומן',
    'Danone PRO Yogurt 20g Protein 1.5% Fat',
    200,
    70,
    10.0,
    1.5,
    3.4,
    0,
  ),
  dairy(
    'manual_danone_pro_natural_0pct_21g',
    'דנונה PRO יוגורט 21 גר׳ חלבון 0% שומן',
    'Danone PRO Yogurt 21g Protein 0% Fat',
    200,
    58,
    10.5,
    0,
    3.3,
    0,
  ),

  // Classic flavored
  dairy(
    'manual_danone_pro_vanilla_0pct',
    'דנונה PRO יוגורט בטעם וניל 20 גר׳ חלבון 0% שומן',
    'Danone PRO Vanilla Yogurt 20g Protein 0% Fat',
    200,
    65,
    10.0,
    0,
    5.6,
    0,
  ),
  dairy(
    'manual_danone_pro_strawberry_0pct',
    'דנונה PRO יוגורט בטעם תות 20 גר׳ חלבון 0% שומן',
    'Danone PRO Strawberry Yogurt 20g Protein 0% Fat',
    200,
    65,
    10.0,
    0,
    5.6,
    0,
  ),
  dairy(
    'manual_danone_pro_berries_0pct',
    'דנונה PRO יוגורט בטעם פירות יער 20 גר׳ חלבון 0% שומן',
    'Danone PRO Forest Berries Yogurt 20g Protein 0% Fat',
    200,
    65,
    10.0,
    0,
    5.6,
    0,
  ),

  // Sugar-free line (ללא סוכר)
  dairy(
    'manual_danone_pro_lemon_sugar_free',
    'דנונה PRO קרם לימון ללא סוכר 20 גר׳ חלבון 0% שומן',
    'Danone PRO Lemon Cream Sugar-Free 0% Fat',
    200,
    55,
    10.0,
    0,
    3.4,
    3.2,
  ),
  dairy(
    'manual_danone_pro_cinnamon_sugar_free',
    'דנונה PRO רול קינמון ללא סוכר 20 גר׳ חלבון 0% שומן',
    'Danone PRO Cinnamon Roll Sugar-Free 0% Fat',
    200,
    56,
    10.0,
    0,
    3.4,
    0,
  ),
  dairy(
    'manual_danone_pro_pistachio_sugar_free',
    'דנונה PRO פיסטוק ללא סוכר 20 גר׳ חלבון 0% שומן',
    'Danone PRO Pistachio Sugar-Free 0% Fat',
    200,
    55,
    10.0,
    0,
    3.4,
    0,
  ),
  dairy(
    'manual_danone_pro_vanilla_cookies_sugar_free',
    'דנונה PRO וניל עוגיות ללא סוכר 20 גר׳ חלבון 0% שומן',
    'Danone PRO Vanilla Cookies Sugar-Free 0% Fat',
    200,
    56,
    10.0,
    0,
    3.4,
    0,
  ),
  dairy(
    'manual_danone_pro_banana_toffee_sugar_free',
    'דנונה PRO בננה טופי ללא סוכר 20 גר׳ חלבון 0% שומן',
    'Danone PRO Banana Toffee Sugar-Free 0% Fat',
    200,
    55,
    10.0,
    0,
    3.4,
    0,
  ),

  // Layered (שכבות)
  dairy(
    'manual_danone_pro_layered_mango_peach',
    'דנונה PRO יוגורט שכבות מנגו ואפרסק 0% שומן',
    'Danone PRO Layered Mango & Peach 0% Fat',
    200,
    57,
    10.0,
    0,
    3.7,
    3.5,
  ),
  dairy(
    'manual_danone_pro_layered_berries',
    'דנונה PRO יוגורט שכבות פירות יער 0% שומן',
    'Danone PRO Layered Forest Berries 0% Fat',
    200,
    57,
    10.0,
    0,
    3.7,
    0,
  ),

  // Drinkable (משקה יוגורט — per 100ml values; 255ml bottle)
  drink(
    'manual_danone_pro_drinkable_vanilla_cookies',
    'דנונה PRO משקה יוגורט וניל עוגיות 1% שומן',
    'Danone PRO Drinkable Yogurt Vanilla Cookies 1% Fat',
    255,
    60,
    7.8,
    1.0,
    4.0,
    3.6,
  ),
  drink(
    'manual_danone_pro_drinkable_strawberry',
    'דנונה PRO משקה יוגורט תות 1% שומן',
    'Danone PRO Drinkable Yogurt Strawberry 1% Fat',
    255,
    59,
    7.9,
    1.0,
    3.9,
    3.4,
  ),
]

// ── Müller Protein / PROTEIN (14 SKUs) ────────────────────────────────────
// Sources: muller-israel.co.il (official brand site),
//          foodsdictionary.co.il (updated Jun 2025)

const MULLER_PROTEIN: FoodSeed[] = [
  // Plain & vanilla — 25g protein per 200g cup
  dairy(
    'manual_muller_protein_plain_0pct',
    'מולר פרוטאין יוגורט קרמי 25 גרם חלבון 0% שומן',
    'Müller Protein Creamy Yogurt 25g Protein 0% Fat',
    200,
    65,
    12.5,
    0,
    2.5,
    2.5,
  ),
  dairy(
    'manual_muller_protein_plain_2pct',
    'מולר פרוטאין יוגורט קרמי 25 גרם חלבון 2% שומן',
    'Müller Protein Creamy Yogurt 25g Protein 2% Fat',
    200,
    82,
    12.5,
    2.0,
    2.2,
    2.5,
  ),
  dairy(
    'manual_muller_protein_vanilla_0pct',
    'מולר פרוטאין יוגורט וניל 25 גרם חלבון 0% שומן',
    'Müller Protein Vanilla Yogurt 25g Protein 0% Fat',
    200,
    68,
    12.5,
    0,
    5.8,
    1.0,
  ),
  dairy(
    'manual_muller_protein_lactose_free_2pct',
    'מולר פרוטאין יוגורט נטול לקטוז 25 גרם חלבון 2% שומן',
    'Müller Protein Lactose-Free Yogurt 25g Protein 2% Fat',
    200,
    82,
    12.5,
    2.0,
    2.2,
    2.5,
  ),

  // Flavored — 20g protein per 200g cup, 1.6% fat
  dairy(
    'manual_muller_protein_strawberry',
    'מולר פרוטאין יוגורט תות 20 גרם חלבון 1.6% שומן',
    'Müller Protein Strawberry Yogurt 20g Protein',
    200,
    101,
    10.0,
    1.6,
    10.6,
    2.1,
  ),
  dairy(
    'manual_muller_protein_berries',
    'מולר פרוטאין יוגורט פירות יער 20 גרם חלבון 1.6% שומן',
    'Müller Protein Forest Berries Yogurt 20g Protein',
    200,
    101,
    10.0,
    1.6,
    10.6,
    2.3,
  ),
  dairy(
    'manual_muller_protein_peach',
    'מולר פרוטאין יוגורט אפרסק 20 גרם חלבון 1.6% שומן',
    'Müller Protein Peach Yogurt 20g Protein',
    200,
    94,
    10.0,
    1.6,
    8.7,
    2.4,
  ),
  dairy(
    'manual_muller_protein_pineapple',
    'מולר פרוטאין יוגורט אננס 20 גרם חלבון 1.6% שומן',
    'Müller Protein Pineapple Yogurt 20g Protein',
    200,
    99,
    10.0,
    1.6,
    10.0,
    2.3,
  ),
  dairy(
    'manual_muller_protein_coconut_0pct',
    'מולר פרוטאין יוגורט קוקוס 20 גרם חלבון 0% שומן',
    'Müller Protein Coconut Yogurt 20g Protein 0% Fat',
    200,
    51,
    10.0,
    0,
    2.4,
    1.0,
  ),

  // Topping pack — 22g protein, 170g container
  dairy(
    'manual_muller_protein_topping_peanut_caramel',
    'מולר פרוטאין בוטנים ופצפוצים מקורמלים 22 גרם חלבון',
    'Müller Protein Caramelized Peanuts & Popcorn 22g Protein',
    170,
    133,
    13.1,
    5.0,
    7.5,
    2.9,
  ),

  // Protein drinks — 25g protein per 350ml bottle (per-100ml values)
  drink(
    'manual_muller_protein_drink_coffee_0pct',
    'מולר פרוטאין משקה חלבון קפה 0% שומן',
    'Müller Protein Coffee Drink 0% Fat',
    350,
    45,
    7.15,
    0,
    4.2,
    0,
  ),
  drink(
    'manual_muller_protein_drink_coffee_1_5pct',
    'מולר פרוטאין משקה חלבון קפה 1.5% שומן',
    'Müller Protein Coffee Drink 1.5% Fat',
    350,
    50,
    7.15,
    1.5,
    4.0,
    0,
  ),
  drink(
    'manual_muller_protein_drink_vanilla_0pct',
    'מולר פרוטאין משקה חלבון וניל 0% שומן',
    'Müller Protein Vanilla Drink 0% Fat',
    350,
    40,
    7.15,
    0,
    2.9,
    0,
  ),
  drink(
    'manual_muller_protein_drink_banana_0pct',
    'מולר פרוטאין משקה חלבון בננה 0% שומן',
    'Müller Protein Banana Drink 0% Fat',
    350,
    45,
    7.15,
    0,
    4.5,
    0,
  ),
]

// ── Yoplait GO (17 SKUs) ──────────────────────────────────────────────────
// Sources: tnuva.co.il (official), foodsdictionary.co.il,
//          kaloria.co.il (updated Aug 2025 / Feb 2026), onebody.co.il

const YOPLAIT_GO: FoodSeed[] = [
  // Classic 2% — 20g protein per 200g cup
  dairy(
    'manual_yoplait_go_natural_2pct',
    'יוגורט חלבון יופלה GO טבעי 20 גר׳ חלבון 2% שומן',
    'Yoplait GO Natural Protein Yogurt 2% Fat',
    200,
    72,
    10.0,
    2.0,
    3.5,
    0,
  ),
  dairy(
    'manual_yoplait_go_strawberry_2pct',
    'יוגורט חלבון יופלה GO תות 2% שומן',
    'Yoplait GO Strawberry Yogurt 2% Fat',
    200,
    98,
    10.0,
    2.0,
    10.0,
    0,
  ),
  dairy(
    'manual_yoplait_go_berries_2pct',
    'יוגורט חלבון יופלה GO פירות יער 2% שומן',
    'Yoplait GO Forest Berries Yogurt 2% Fat',
    200,
    100,
    10.0,
    2.0,
    10.1,
    0,
  ),
  dairy(
    'manual_yoplait_go_peach_2pct',
    'יוגורט חלבון יופלה GO אפרסק 2% שומן',
    'Yoplait GO Peach Yogurt 2% Fat',
    200,
    99,
    10.0,
    2.0,
    10.1,
    0,
  ),

  // Airy (אוורירי) — 1% fat, 20g protein
  dairy(
    'manual_yoplait_go_airy_vanilla',
    'יוגורט חלבון יופלה GO אוורירי וניל 1% שומן',
    'Yoplait GO Airy Vanilla 1% Fat',
    200,
    61,
    10.0,
    1.0,
    3.1,
    0,
  ),
  dairy(
    'manual_yoplait_go_airy_mango',
    'יוגורט חלבון יופלה GO אוורירי מנגו 1% שומן',
    'Yoplait GO Airy Mango 1% Fat',
    200,
    64,
    10.0,
    1.0,
    3.7,
    0,
  ),
  dairy(
    'manual_yoplait_go_airy_coffee',
    'יוגורט חלבון יופלה GO אוורירי קפה 1% שומן',
    'Yoplait GO Airy Coffee 1% Fat',
    200,
    63,
    10.0,
    1.0,
    3.2,
    0,
  ),

  // Thick (סמיך) — 0–0.4% fat, 20g protein
  dairy(
    'manual_yoplait_go_thick_coconut',
    'יוגורט חלבון יופלה GO סמיך קוקוס 0.4% שומן',
    'Yoplait GO Thick Coconut 0.4% Fat',
    200,
    57,
    10.0,
    0.4,
    3.2,
    0,
  ),
  dairy(
    'manual_yoplait_go_thick_peach',
    'יוגורט חלבון יופלה GO סמיך אפרסק 0% שומן',
    'Yoplait GO Thick Peach 0% Fat',
    200,
    55,
    10.0,
    0.3,
    3.6,
    0,
  ),
  dairy(
    'manual_yoplait_go_thick_strawberry',
    'יוגורט חלבון יופלה GO סמיך תות 0% שומן',
    'Yoplait GO Thick Strawberry 0% Fat',
    200,
    54,
    10.0,
    0.3,
    3.4,
    0,
  ),
  dairy(
    'manual_yoplait_go_thick_banana_caramel',
    'יוגורט חלבון יופלה GO סמיך בננה קרמל 0% שומן',
    'Yoplait GO Thick Banana Caramel 0% Fat',
    200,
    54,
    10.0,
    0,
    3.5,
    0,
  ),

  // Light (לייט) — <0.5% fat, 20g protein
  dairy(
    'manual_yoplait_go_light_peach',
    'יוגורט חלבון יופלה GO לייט אפרסק',
    'Yoplait GO Light Peach',
    200,
    62,
    10.0,
    0.3,
    4.5,
    0,
  ),
  dairy(
    'manual_yoplait_go_light_cherry',
    'יוגורט חלבון יופלה GO לייט דובדבן',
    'Yoplait GO Light Cherry',
    200,
    63,
    10.0,
    0.3,
    4.9,
    0,
  ),

  // High protein 25g line
  dairy(
    'manual_yoplait_go_25g_natural_2pct',
    'יוגורט חלבון 25 גרם יופלה GO טבעי 2% שומן',
    'Yoplait GO 25g Protein Natural 2% Fat',
    200,
    86,
    12.5,
    2.0,
    4.4,
    0,
  ),
  dairy(
    'manual_yoplait_go_vanilla_touch',
    'יוגורט חלבון 23 גרם יופלה GO בנגיעת טעם וניל',
    'Yoplait GO Vanilla Touch 23g Protein',
    200,
    82,
    11.7,
    1.5,
    4.4,
    0,
  ),
  dairy(
    'manual_yoplait_go_lactose_free_25g',
    'יוגורט חלבון 25 גרם יופלה GO נטול לקטוז',
    'Yoplait GO Lactose-Free 25g Protein',
    200,
    86,
    12.5,
    2.0,
    4.4,
    0,
  ),

  // Refined sweetness
  dairy(
    'manual_yoplait_go_refined_sweetness',
    'יופלה GO מתיקות מעודנת מועשר בחלבון 2.9% שומן',
    'Yoplait GO Refined Sweetness 2.9% Fat',
    200,
    100,
    10.0,
    2.9,
    8.5,
    0,
  ),
]

// ── Exports ───────────────────────────────────────────────────────────────

export const PROTEIN_YOGHURT_OVERRIDES: FoodSeed[] = [
  ...DANONE_PRO,
  ...MULLER_PROTEIN,
  ...YOPLAIT_GO,
]
