import { getGreetingKey, getRandomMotivation } from './greeting'

describe('getGreetingKey', () => {
  it('returns morning for hour 6', () => {
    expect(getGreetingKey(6)).toBe('morning')
  })

  it('returns afternoon for hour 14', () => {
    expect(getGreetingKey(14)).toBe('afternoon')
  })

  it('returns evening for hour 20', () => {
    expect(getGreetingKey(20)).toBe('evening')
  })

  it('returns night for hour 3', () => {
    expect(getGreetingKey(3)).toBe('night')
  })

  // Boundary tests
  it('returns morning at hour 5 (start of morning)', () => {
    expect(getGreetingKey(5)).toBe('morning')
  })

  it('returns morning at hour 11 (end of morning)', () => {
    expect(getGreetingKey(11)).toBe('morning')
  })

  it('returns afternoon at hour 12 (start of afternoon)', () => {
    expect(getGreetingKey(12)).toBe('afternoon')
  })

  it('returns afternoon at hour 16 (end of afternoon)', () => {
    expect(getGreetingKey(16)).toBe('afternoon')
  })

  it('returns evening at hour 17 (start of evening)', () => {
    expect(getGreetingKey(17)).toBe('evening')
  })

  it('returns evening at hour 23 (end of evening)', () => {
    expect(getGreetingKey(23)).toBe('evening')
  })

  it('returns night at hour 0 (midnight)', () => {
    expect(getGreetingKey(0)).toBe('night')
  })

  it('returns night at hour 4 (end of night)', () => {
    expect(getGreetingKey(4)).toBe('night')
  })
})

describe('getRandomMotivation', () => {
  it('returns a string', () => {
    expect(typeof getRandomMotivation()).toBe('string')
  })

  it('never returns undefined', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomMotivation()).toBeDefined()
    }
  })

  it('returns a non-empty string', () => {
    expect(getRandomMotivation().length).toBeGreaterThan(0)
  })
})
