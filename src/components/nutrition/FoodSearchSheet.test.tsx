/**
 * Tests for FoodSearchSheet component.
 * UI-only tests — store and repository are mocked.
 */

import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { FoodSearchSheet } from './FoodSearchSheet'
import type { FoodItem } from '@/types'
import { foodRepository, FoodCollisionError } from '@/db/food-repository'

// ── Mocks ─────────────────────────────────────────────────────────────

jest.mock('@/stores/useNutritionStore', () => ({
  useNutritionStore: jest.fn(() => ({
    logFood: jest.fn(),
    selectedDateLog: [],
  })),
}))

jest.mock('@/db', () => ({
  todayISO: () => '2026-04-10',
}))

// jest.mock is hoisted by babel-jest — fns created inside factory are used via import above
jest.mock('@/db/food-repository', () => {
  class FoodCollisionError extends Error {
    existing: FoodItem
    constructor(existing: FoodItem) {
      super(`Food with id "${existing.id}" already exists`)
      this.name = 'FoodCollisionError'
      this.existing = existing
    }
  }
  return {
    FoodCollisionError,
    foodRepository: {
      search: jest.fn(),
      getRecent: jest.fn(),
      getById: jest.fn(),
      getByCategory: jest.fn(),
      insertFoodStrict: jest.fn(),
      upsertFood: jest.fn(),
    },
  }
})

const mockSearch = foodRepository.search as jest.Mock
const mockGetRecent = foodRepository.getRecent as jest.Mock
const mockInsertFoodStrict = foodRepository.insertFoodStrict as jest.Mock
const mockUpsertFood = foodRepository.upsertFood as jest.Mock

// ── Fixtures ──────────────────────────────────────────────────────────

const MOCK_CHICKEN: FoodItem = {
  id: 'tz_chicken_001',
  nameHe: 'חזה עוף בגריל',
  nameEn: 'Grilled Chicken Breast',
  category: 'protein',
  isUserCreated: false,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  fatPer100g: 3.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('FoodSearchSheet', () => {
  const defaultProps = {
    visible: true,
    mealType: 'breakfast' as const,
    date: '2026-04-10',
    onClose: jest.fn(),
    testID: 'search-sheet',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetRecent.mockResolvedValue([])
    mockSearch.mockResolvedValue([])
  })

  it('renders the search input when visible', () => {
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    expect(getByTestId('search-sheet-input')).toBeTruthy()
  })

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} onClose={onClose} />)
    fireEvent.press(getByTestId('search-sheet-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the add custom food button', () => {
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    expect(getByTestId('search-sheet-custom-food')).toBeTruthy()
  })

  it('does not render when visible is false', () => {
    const { queryByTestId } = render(<FoodSearchSheet {...defaultProps} visible={false} />)
    expect(queryByTestId('search-sheet-input')).toBeNull()
  })

  it('shows search results after typing a query', async () => {
    mockSearch.mockResolvedValue([MOCK_CHICKEN])

    const { getByTestId, findAllByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.changeText(getByTestId('search-sheet-input'), 'עוף')

    const results = await findAllByTestId(/^search-sheet-result-/)
    expect(results.length).toBeGreaterThan(0)
  })

  it('shows no results for an unmatched query', async () => {
    mockSearch.mockResolvedValue([])

    const { getByTestId, queryAllByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.changeText(getByTestId('search-sheet-input'), 'xyzxyzxyz')

    await new Promise((r) => setTimeout(r, 0))
    expect(queryAllByTestId(/^search-sheet-result-/).length).toBe(0)
  })

  it('calls foodRepository.search with the typed query', async () => {
    mockSearch.mockResolvedValue([MOCK_CHICKEN])

    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.changeText(getByTestId('search-sheet-input'), 'עוף')

    await new Promise((r) => setTimeout(r, 0))
    expect(mockSearch).toHaveBeenCalledWith('עוף', 50)
  })

  it('calls getRecent when sheet opens with empty query', async () => {
    render(<FoodSearchSheet {...defaultProps} />)
    await new Promise((r) => setTimeout(r, 0))
    expect(mockGetRecent).toHaveBeenCalledWith(30)
  })
})

// ── Manual create flow ────────────────────────────────────────────────

describe('FoodSearchSheet — manual create', () => {
  const defaultProps = {
    visible: true,
    mealType: 'breakfast' as const,
    date: '2026-04-10',
    onClose: jest.fn(),
    testID: 'search-sheet',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetRecent.mockResolvedValue([])
    mockSearch.mockResolvedValue([])
    mockInsertFoodStrict.mockResolvedValue(undefined)
    mockUpsertFood.mockResolvedValue(undefined)
  })

  function fillFormMinimally(getByTestId: ReturnType<typeof render>['getByTestId']) {
    const prefix = 'search-sheet-manual-form'
    fireEvent.changeText(getByTestId(`${prefix}-name-he-field`), 'מוצר ידני')
    fireEvent.changeText(getByTestId(`${prefix}-calories-field`), '200')
    fireEvent.changeText(getByTestId(`${prefix}-protein-field`), '10')
    fireEvent.changeText(getByTestId(`${prefix}-fat-field`), '5')
    fireEvent.changeText(getByTestId(`${prefix}-carbs-field`), '30')
  }

  it('opens ManualFoodForm when "הוסף מאכל אישי" button is tapped', () => {
    const { getByTestId, queryByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    expect(queryByTestId('search-sheet-manual-form')).toBeNull()

    fireEvent.press(getByTestId('search-sheet-custom-food'))

    expect(getByTestId('search-sheet-manual-form')).toBeTruthy()
  })

  it('prefills the form with the current search query as initialNameHe', async () => {
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.changeText(getByTestId('search-sheet-input'), 'פתיבר ביתי')
    await new Promise((r) => setTimeout(r, 0))

    fireEvent.press(getByTestId('search-sheet-custom-food'))

    expect(getByTestId('search-sheet-manual-form-name-he-field').props.value).toBe('פתיבר ביתי')
  })

  it('routes to PortionPicker on a successful manual-create submit (no collision)', async () => {
    const { getByTestId, queryByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.press(getByTestId('search-sheet-custom-food'))
    fillFormMinimally(getByTestId)

    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-manual-form-submit'))
    })

    expect(mockInsertFoodStrict).toHaveBeenCalledTimes(1)
    // PortionPicker replaces the sheet; the search input is gone.
    expect(queryByTestId('search-sheet-input')).toBeNull()
  })

  it('shows the collision sheet when insertFoodStrict throws FoodCollisionError', async () => {
    const existing: FoodItem = {
      id: 'manual_7290012345678',
      nameHe: 'מוצר קיים',
      nameEn: 'Existing Product',
      category: 'snacks',
      caloriesPer100g: 100,
      proteinPer100g: 5,
      fatPer100g: 3,
      carbsPer100g: 10,
      fiberPer100g: 1,
      isUserCreated: true,
      servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
    }
    mockInsertFoodStrict.mockRejectedValueOnce(new FoodCollisionError(existing))

    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.press(getByTestId('search-sheet-custom-food'))
    fillFormMinimally(getByTestId)
    fireEvent.changeText(getByTestId('search-sheet-manual-form-ean-input-field'), '7290012345678')

    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-manual-form-submit'))
    })

    expect(getByTestId('search-sheet-collision-title')).toHaveTextContent(/מוצר קיים/)
  })

  it('routes to PortionPicker with the EXISTING food on "use existing"', async () => {
    const existing: FoodItem = {
      id: 'manual_7290012345678',
      nameHe: 'מוצר קיים',
      nameEn: 'Existing Product',
      category: 'snacks',
      caloriesPer100g: 100,
      proteinPer100g: 5,
      fatPer100g: 3,
      carbsPer100g: 10,
      fiberPer100g: 1,
      isUserCreated: true,
      servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
    }
    mockInsertFoodStrict.mockRejectedValueOnce(new FoodCollisionError(existing))

    const { getByTestId, queryByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.press(getByTestId('search-sheet-custom-food'))
    fillFormMinimally(getByTestId)
    fireEvent.changeText(getByTestId('search-sheet-manual-form-ean-input-field'), '7290012345678')
    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-manual-form-submit'))
    })

    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-collision-use-existing'))
    })

    expect(mockUpsertFood).not.toHaveBeenCalled()
    // PortionPicker is open; collision sheet + form dismissed.
    expect(queryByTestId('search-sheet-collision-title')).toBeNull()
    expect(queryByTestId('search-sheet-manual-form')).toBeNull()
  })

  it('calls upsertFood and routes to PortionPicker with the NEW food on "replace"', async () => {
    const existing: FoodItem = {
      id: 'manual_7290012345678',
      nameHe: 'מוצר קיים',
      nameEn: 'Existing Product',
      category: 'snacks',
      caloriesPer100g: 100,
      proteinPer100g: 5,
      fatPer100g: 3,
      carbsPer100g: 10,
      fiberPer100g: 1,
      isUserCreated: true,
      servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
    }
    mockInsertFoodStrict.mockRejectedValueOnce(new FoodCollisionError(existing))

    const { getByTestId, queryByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.press(getByTestId('search-sheet-custom-food'))
    fillFormMinimally(getByTestId)
    fireEvent.changeText(getByTestId('search-sheet-manual-form-ean-input-field'), '7290012345678')
    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-manual-form-submit'))
    })

    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-collision-replace'))
    })

    expect(mockUpsertFood).toHaveBeenCalledTimes(1)
    const overwritten = mockUpsertFood.mock.calls[0][0] as FoodItem
    expect(overwritten.nameHe).toBe('מוצר ידני') // the form's new data
    expect(overwritten.id).toBe('manual_7290012345678')
    expect(queryByTestId('search-sheet-collision-title')).toBeNull()
  })

  it('keeps the form open on "cancel" (sheet closes, form still mounted)', async () => {
    const existing: FoodItem = {
      id: 'manual_7290012345678',
      nameHe: 'מוצר קיים',
      nameEn: 'Existing Product',
      category: 'snacks',
      caloriesPer100g: 100,
      proteinPer100g: 5,
      fatPer100g: 3,
      carbsPer100g: 10,
      fiberPer100g: 1,
      isUserCreated: true,
      servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
    }
    mockInsertFoodStrict.mockRejectedValueOnce(new FoodCollisionError(existing))

    const { getByTestId, queryByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.press(getByTestId('search-sheet-custom-food'))
    fillFormMinimally(getByTestId)
    fireEvent.changeText(getByTestId('search-sheet-manual-form-ean-input-field'), '7290012345678')
    await act(async () => {
      fireEvent.press(getByTestId('search-sheet-manual-form-submit'))
    })

    fireEvent.press(getByTestId('search-sheet-collision-cancel'))

    expect(queryByTestId('search-sheet-collision-title')).toBeNull()
    expect(getByTestId('search-sheet-manual-form')).toBeTruthy()
    // Form's filled-in values preserved
    expect(getByTestId('search-sheet-manual-form-name-he-field').props.value).toBe('מוצר ידני')
  })
})
