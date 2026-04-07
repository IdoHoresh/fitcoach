import { t } from '@/i18n'

export type GreetingKey = 'morning' | 'afternoon' | 'evening' | 'night'

const MORNING_START = 5
const AFTERNOON_START = 12
const EVENING_START = 17

export function getGreetingKey(hour: number): GreetingKey {
  if (hour >= MORNING_START && hour < AFTERNOON_START) return 'morning'
  if (hour >= AFTERNOON_START && hour < EVENING_START) return 'afternoon'
  if (hour >= EVENING_START) return 'evening'
  return 'night'
}

export function getRandomMotivation(): string {
  const pool = t().home.motivational
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}
