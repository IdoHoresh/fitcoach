import * as Haptics from 'expo-haptics'
import { triggerHaptic } from './useHaptics'

describe('triggerHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls impactAsync with Light style', async () => {
    await triggerHaptic('light')
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
  })

  it('calls impactAsync with Medium style', async () => {
    await triggerHaptic('medium')
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
  })

  it('calls impactAsync with Heavy style', async () => {
    await triggerHaptic('heavy')
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy)
  })

  it('does not throw when haptics fails', async () => {
    ;(Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Haptics not available'))
    await expect(triggerHaptic('light')).resolves.toBeUndefined()
  })
})
