/**
 * Split Selection Algorithm.
 *
 * Recommends the optimal training split based on:
 * - Available training days per week
 * - Training experience
 *
 * Decision logic:
 *   2-3 days → Full Body (Schoenfeld 2016: higher frequency = more hypertrophy)
 *   4 days   → Upper/Lower (balanced volume and recovery)
 *   5-6 days → PPL if experienced enough, otherwise Upper/Lower + cardio days
 *
 * Pure function — no side effects.
 */

import type { DayOfWeek, ExperienceLevel, SplitType, WorkoutDayType } from '../types';
import { SPLIT_THRESHOLDS } from '../data/constants';

/** Result of split selection — includes the split type and day assignments */
export interface SplitRecommendation {
  readonly splitType: SplitType;
  readonly schedule: readonly ScheduleDay[];
  readonly reasoning: string;
  readonly reasoningHe: string;
}

/** A single day in the weekly schedule */
export interface ScheduleDay {
  readonly dayOfWeek: DayOfWeek;
  readonly dayType: WorkoutDayType;
}

/**
 * Recommends the optimal split type based on available days and experience.
 */
export function recommendSplitType(
  trainingDaysCount: number,
  experience: ExperienceLevel,
): SplitType {
  if (trainingDaysCount <= SPLIT_THRESHOLDS.FULL_BODY_MAX_DAYS) {
    return 'full_body';
  }

  if (trainingDaysCount === SPLIT_THRESHOLDS.UPPER_LOWER_DAYS) {
    return 'upper_lower';
  }

  // 5-6 days: PPL for experienced, Upper/Lower for beginners
  if (experience === 'beginner') {
    return 'upper_lower';
  }

  return 'push_pull_legs';
}

/**
 * Assigns workout day types to the selected training days.
 * Ensures proper muscle group spacing (no two chest days back-to-back, etc.).
 */
export function assignDayTypes(
  trainingDays: readonly DayOfWeek[],
  splitType: SplitType,
): readonly ScheduleDay[] {
  const sorted = [...trainingDays].sort((a, b) => a - b);

  switch (splitType) {
    case 'full_body':
      return assignFullBodyDays(sorted);
    case 'upper_lower':
      return assignUpperLowerDays(sorted);
    case 'push_pull_legs':
      return assignPplDays(sorted);
  }
}

function assignFullBodyDays(days: DayOfWeek[]): ScheduleDay[] {
  const dayTypes: WorkoutDayType[] = ['full_body_a', 'full_body_b', 'full_body_c'];

  return days.map((day, index) => ({
    dayOfWeek: day,
    dayType: dayTypes[index % dayTypes.length],
  }));
}

function assignUpperLowerDays(days: DayOfWeek[]): ScheduleDay[] {
  // Pattern: Upper, Lower, Upper, Lower (alternating)
  const dayTypes: WorkoutDayType[] = ['upper_a', 'lower_a', 'upper_b', 'lower_b'];

  return days.map((day, index) => ({
    dayOfWeek: day,
    dayType: dayTypes[index % dayTypes.length],
  }));
}

function assignPplDays(days: DayOfWeek[]): ScheduleDay[] {
  // Pattern: Push, Pull, Legs (A variants first, then B)
  const dayTypes: WorkoutDayType[] = [
    'push_a', 'pull_a', 'legs_a',
    'push_b', 'pull_b', 'legs_b',
  ];

  return days.map((day, index) => ({
    dayOfWeek: day,
    dayType: dayTypes[index % dayTypes.length],
  }));
}

/**
 * Creates a complete split recommendation with reasoning.
 */
export function createSplitRecommendation(
  trainingDays: readonly DayOfWeek[],
  experience: ExperienceLevel,
): SplitRecommendation {
  const splitType = recommendSplitType(trainingDays.length, experience);
  const schedule = assignDayTypes(trainingDays, splitType);

  const reasoningMap: Record<SplitType, { en: string; he: string }> = {
    full_body: {
      en: `With ${trainingDays.length} training days, Full Body gives you the best frequency — each muscle trained 2-3× per week.`,
      he: `עם ${trainingDays.length} ימי אימון, פול-בודי נותן את התדירות הטובה ביותר — כל שריר מאומן 2-3 פעמים בשבוע.`,
    },
    upper_lower: {
      en: `With ${trainingDays.length} training days, Upper/Lower splits each session into upper and lower body for balanced volume.`,
      he: `עם ${trainingDays.length} ימי אימון, חלוקת עליון/תחתון מאפשרת נפח מאוזן עם מספיק זמן התאוששות.`,
    },
    push_pull_legs: {
      en: `With ${trainingDays.length} training days, Push/Pull/Legs maximizes volume per muscle with dedicated sessions.`,
      he: `עם ${trainingDays.length} ימי אימון, דחיפה/משיכה/רגליים מאפשר נפח מקסימלי עם אימונים ייעודיים.`,
    },
  };

  return {
    splitType,
    schedule,
    reasoning: reasoningMap[splitType].en,
    reasoningHe: reasoningMap[splitType].he,
  };
}
