/**
 * Tests for FoodSearchSheet component.
 * UI-only tests — store and repository are mocked.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { FoodSearchSheet } from './FoodSearchSheet'
import type { FoodItem } from '@/types'
import { foodRepository } from '@/db/food-repository'

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
jest.mock('@/db/food-repository', () => ({
  foodRepository: {
    search: jest.fn(),
    getRecent: jest.fn(),
    getById: jest.fn(),
    getByCategory: jest.fn(),
  },
}))

const mockSearch = foodRepository.search as jest.Mock
const mockGetRecent = foodRepository.getRecent as jest.Mock

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
