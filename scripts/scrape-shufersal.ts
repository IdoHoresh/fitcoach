/**
 * Shufersal product scraper.
 *
 * Fetches all food products from Shufersal's website using their SAP Commerce
 * (Hybris) storefront HTML endpoints. No auth required. Outputs raw product
 * data to tmp/shufersal-raw.json for downstream processing by build-supermarket-seed.ts.
 *
 * Usage:
 *   npm run scrape-shufersal              — full scrape (skips if output already exists)
 *   npm run scrape-shufersal -- --force   — re-scrape even if output exists
 *   npm run scrape-shufersal -- --dry-run — first page of first category only, print sample
 */

import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { FOOD_CATEGORIES } from './shufersal-types'
import type { RawShufersalProduct, RawNutrition } from './shufersal-types'

// ── Constants ──────────────────────────────────────────────────────────────

const BASE_URL = 'https://www.shufersal.co.il'
const PAGE_SIZE = 48
const RATE_LIMIT_MS = 1000 // 1 request per second — polite scraping
const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'shufersal-raw.json')

const HEBREW_HEADERS = {
  'Accept-Language': 'he-IL,he;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

// ── CLI flags ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const DRY_RUN = args.includes('--dry-run')

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseFloat_(s: string | undefined): number {
  if (!s) return 0
  const n = parseFloat(s.replace(',', '.').trim())
  return isNaN(n) ? 0 : n
}

/** Extracts container size in grams from the "מידה/סוג" field (e.g. "215 גרם" → 215). */
function parseContainerGrams(text: string): number | null {
  // Matches patterns like "215 גרם", "1 ק\"ג", "500 מ\"ל", "200 מל"
  const gramsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:גרם|ג'|g\b)/i)
  if (gramsMatch) return parseFloat(gramsMatch[1])

  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ק"ג|קילוגרם|kg\b)/i)
  if (kgMatch) return parseFloat(kgMatch[1]) * 1000

  const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:מ"ל|מיליליטר|מל|ml\b)/i)
  if (mlMatch) return parseFloat(mlMatch[1]) // ml ≈ g for aqueous products

  const literMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ליטר|l\b)/i)
  if (literMatch) return parseFloat(literMatch[1]) * 1000

  return null
}

// ── Shufersal API ──────────────────────────────────────────────────────────

/**
 * Fetches a category listing page.
 * Returns product codes (e.g. "P_7290119377411") from all food product tiles.
 * Also returns pagination info.
 */
async function fetchCategoryPage(
  categoryCode: string,
  page: number,
): Promise<{ productCodes: string[]; totalPages: number }> {
  const url = `${BASE_URL}/online/he/c/${categoryCode}/fragment?q=%3Arelevance&page=${page}&pageSize=${PAGE_SIZE}`
  const res = await fetch(url, { headers: HEBREW_HEADERS })

  if (!res.ok) {
    throw new Error(`Category ${categoryCode} page ${page}: HTTP ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  // Parse pagination from root container attributes
  const root = $('[data-results]').first()
  const totalPages = parseInt(root.attr('data-pages') ?? '1', 10)

  // Extract product codes from food tiles only
  const productCodes: string[] = []
  $('li[data-product-code]').each((_, el) => {
    const isFood = $(el).attr('data-food')
    const code = $(el).attr('data-product-code')
    if (isFood === 'true' && code) {
      productCodes.push(code)
    }
  })

  return { productCodes, totalPages }
}

/**
 * Parses a nutrition table section from the product detail HTML.
 * Each .nutritionItem contains: .number[title] (value), .text (nutrient label).
 */
function parseNutritionSection($: cheerio.CheerioAPI, section: AnyNode): RawNutrition {
  const nutrition: RawNutrition = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }

  $(section)
    .find('.nutritionItem')
    .each((_, item) => {
      const valueStr = $(item).find('.number').attr('title') ?? $(item).find('.number').text()
      const label = $(item).find('.text').text().trim()
      const value = parseFloat_(valueStr)

      if (label.includes('אנרגיה') || label.includes('קלוריות')) nutrition.calories = value
      else if (label.includes('חלבונים')) nutrition.protein = value
      else if (label.includes('שומנים')) nutrition.fat = value
      else if (label.includes('פחמימות')) nutrition.carbs = value
      else if (label.includes('סיבים')) nutrition.fiber = value
    })

  return nutrition
}

/**
 * Fetches product detail HTML and extracts full nutrition + serving size data.
 * Returns null if the product has no nutrition data (calories = 0).
 */
async function fetchProductDetail(productCode: string): Promise<RawShufersalProduct | null> {
  const url = `${BASE_URL}/online/he/p/${productCode}/json`
  const res = await fetch(url, { headers: HEBREW_HEADERS })

  if (!res.ok) return null

  const html = await res.text()
  const $ = cheerio.load(html)

  // Hebrew name from <h2>
  const nameHe = $('h2').first().text().trim()
  if (!nameHe) return null

  // Barcode from hidden input
  const barcode = ($('input[name="productCodePost"]').val() as string | undefined)
    ?.replace(/^P_/, '')
    .trim()
  if (!barcode) return null

  // Container size from dataList — look for "מידה/סוג" item
  let containerGrams: number | null = null
  $('.dataList li').each((_, li) => {
    const text = $(li).text()
    if (text.includes('מידה') || text.includes('סוג')) {
      // Value is in a nested span or just the remaining text after the label
      const parts = text.split(':')
      if (parts.length >= 2) {
        containerGrams = parseContainerGrams(parts.slice(1).join(':').trim())
      }
    }
  })

  // Nutrition tables — first is per-100g, second (if present) is per-serving
  const nutritionLists = $('.nutritionList').toArray()
  if (nutritionLists.length === 0) return null

  const per100g = parseNutritionSection($, nutritionLists[0])
  if (per100g.calories <= 0) return null

  let perServing: RawNutrition | null = null
  let servingSizeGrams: number | null = null

  if (nutritionLists.length >= 2) {
    perServing = parseNutritionSection($, nutritionLists[1])

    // Parse serving size from the .subInfo label preceding the second table
    // e.g. "מנה (215 גרם)" or "מנה 30 גרם"
    const subInfoText = $(nutritionLists[1]).prev('.subInfo').text()
    if (subInfoText) {
      servingSizeGrams = parseContainerGrams(subInfoText)
    }

    // If perServing has all zeros it's invalid — discard it
    if (perServing.calories <= 0) {
      perServing = null
      servingSizeGrams = null
    }
  }

  return {
    productCode,
    barcode,
    nameHe,
    containerGrams,
    servingSizeGrams,
    per100g,
    perServing,
  }
}

// ── Main scrape loop ───────────────────────────────────────────────────────

async function scrape(): Promise<void> {
  // Skip if output already exists and --force not set
  if (!FORCE && !DRY_RUN && fs.existsSync(OUTPUT_PATH)) {
    console.log(`[Shufersal] Output already exists at ${OUTPUT_PATH}. Use --force to re-scrape.`)
    return
  }

  const allProducts: RawShufersalProduct[] = []
  let totalSkipped = 0
  let totalRequests = 0

  const categoriesToScrape = DRY_RUN ? FOOD_CATEGORIES.slice(0, 1) : FOOD_CATEGORIES

  for (const category of categoriesToScrape) {
    console.log(`\n[Shufersal] ── ${category.nameHe} (${category.code}) ──`)

    // Fetch first page to get total page count
    let totalPages = 1
    let page = 0

    do {
      try {
        const { productCodes, totalPages: pages } = await fetchCategoryPage(category.code, page)
        totalPages = pages
        totalRequests++

        console.log(`  page ${page + 1}/${totalPages}: ${productCodes.length} products found`)

        // Fetch detail for each product (rate limited)
        for (const code of productCodes) {
          await sleep(RATE_LIMIT_MS)
          totalRequests++

          try {
            const product = await fetchProductDetail(code)
            if (product) {
              allProducts.push(product)
            } else {
              totalSkipped++
            }
          } catch (err) {
            console.warn(`  [warn] Failed to fetch ${code}: ${(err as Error).message}`)
            totalSkipped++
          }
        }

        page++

        if (page < totalPages) {
          await sleep(RATE_LIMIT_MS) // rate limit between pages too
        }
      } catch (err) {
        console.error(`  [error] Category ${category.code} page ${page}: ${(err as Error).message}`)
        break
      }

      if (DRY_RUN) {
        if (allProducts.length > 0) {
          console.log('\n[Dry-run] Sample product:')
          console.log(JSON.stringify(allProducts[0], null, 2))
        }
        break
      }
    } while (page < totalPages)
  }

  if (!DRY_RUN) {
    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allProducts, null, 2), 'utf8')

    console.log(`\n[Shufersal] ── Complete ──`)
    console.log(`  Products scraped : ${allProducts.length}`)
    console.log(`  Products skipped : ${totalSkipped} (no nutrition data)`)
    console.log(`  Total requests   : ${totalRequests}`)
    console.log(`  Output           : ${OUTPUT_PATH}`)
  }
}

scrape().catch((err) => {
  console.error('[Shufersal] Fatal error:', err)
  process.exit(1)
})
