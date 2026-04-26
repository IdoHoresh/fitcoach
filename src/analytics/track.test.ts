import { track, type AnalyticsEvent } from './track'

describe('track', () => {
  let logSpy: jest.SpyInstance

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  describe('in __DEV__', () => {
    it('logs mode_choice_picked event with full payload', () => {
      const event: AnalyticsEvent = {
        type: 'mode_choice_picked',
        mode: 'structured',
        time_to_pick_ms: 1234,
        changed_from_default: false,
      }

      track(event)

      expect(logSpy).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith('[analytics]', event)
    })

    it('logs mode_switched_in_settings event with full payload', () => {
      const event: AnalyticsEvent = {
        type: 'mode_switched_in_settings',
        from: 'structured',
        to: 'free',
        days_since_onboarding: 7,
      }

      track(event)

      expect(logSpy).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith('[analytics]', event)
    })
  })

  describe('in production', () => {
    let originalDev: boolean

    beforeAll(() => {
      originalDev = (global as unknown as { __DEV__: boolean }).__DEV__
      ;(global as unknown as { __DEV__: boolean }).__DEV__ = false
    })

    afterAll(() => {
      ;(global as unknown as { __DEV__: boolean }).__DEV__ = originalDev
    })

    it('does not log mode_choice_picked', () => {
      track({
        type: 'mode_choice_picked',
        mode: 'free',
        time_to_pick_ms: 500,
        changed_from_default: true,
      })

      expect(logSpy).not.toHaveBeenCalled()
    })

    it('does not log mode_switched_in_settings', () => {
      track({
        type: 'mode_switched_in_settings',
        from: 'free',
        to: 'structured',
        days_since_onboarding: 0,
      })

      expect(logSpy).not.toHaveBeenCalled()
    })
  })

  it('returns undefined (fire-and-forget)', () => {
    const result = track({
      type: 'mode_choice_picked',
      mode: 'structured',
      time_to_pick_ms: 0,
      changed_from_default: false,
    })

    expect(result).toBeUndefined()
  })
})
