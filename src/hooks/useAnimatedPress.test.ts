import { renderHook, act } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { useAnimatedPress } from './useAnimatedPress'

describe('useAnimatedPress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns animatedStyle, onPressIn, and onPressOut', () => {
    const { result } = renderHook(() => useAnimatedPress())
    expect(result.current.animatedStyle).toBeDefined()
    expect(typeof result.current.onPressIn).toBe('function')
    expect(typeof result.current.onPressOut).toBe('function')
  })

  it('triggers haptic on press-in', () => {
    const { result } = renderHook(() => useAnimatedPress())
    act(() => {
      result.current.onPressIn()
    })
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
  })

  it('does not trigger haptic when disabled', () => {
    const { result } = renderHook(() => useAnimatedPress({ disabled: true }))
    act(() => {
      result.current.onPressIn()
    })
    expect(Haptics.impactAsync).not.toHaveBeenCalled()
  })

  it('accepts custom haptic style', () => {
    const { result } = renderHook(() => useAnimatedPress({ hapticStyle: 'medium' }))
    act(() => {
      result.current.onPressIn()
    })
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
  })
})
