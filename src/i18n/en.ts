/**
 * English translations — secondary language.
 * Structure mirrors he.ts exactly for type safety.
 */

import type { TranslationKeys } from './he';

export const en: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    start: 'Start',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    kg: 'kg',
    cm: 'cm',
    kcal: 'kcal',
    grams: 'g',
    sets: 'sets',
    reps: 'reps',
    rest: 'rest',
    minutes: 'min',
    seconds: 'sec',
  },

  onboarding: {
    welcome: {
      title: 'Welcome to FitCoach',
      subtitle: "We'll build your personal plan in 2 minutes",
      cta: "Let's go",
    },
    goal: {
      title: "What's your goal?",
      muscleGain: 'Build Muscle',
      fatLoss: 'Lose Fat',
      maintenance: 'Maintain',
    },
    bodyStats: {
      title: 'Body Stats',
      height: 'Height',
      weight: 'Weight',
      age: 'Age',
      sex: 'Sex',
      male: 'Male',
      female: 'Female',
      bodyFat: 'Body Fat % (optional)',
      bodyFatHelp: "Not sure? Skip — we'll calculate without it",
    },
    experience: {
      title: 'Training Experience',
      beginner: 'Beginner',
      beginnerDesc: 'Less than 1 year of consistent training',
      intermediate: 'Intermediate',
      intermediateDesc: '1-3 years of consistent training',
    },
    schedule: {
      title: 'Which days can you train?',
      subtitle: 'Select at least 2 days',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    equipment: {
      title: 'What equipment do you have?',
      fullGym: 'Full Gym',
      fullGymDesc: 'Barbells, machines, cables',
      homeGym: 'Home Gym',
      homeGymDesc: 'Dumbbells, bench, pull-up bar',
      minimal: 'Minimal',
      minimalDesc: 'Bodyweight + resistance bands',
    },
    result: {
      title: 'Your Plan is Ready!',
      split: 'Training Split',
      days: 'Training Days',
      calories: 'Daily Calories',
      protein: 'Protein',
      cta: "Let's start!",
    },
  },

  tabs: {
    home: 'Home',
    workout: 'Workout',
    nutrition: 'Nutrition',
    progress: 'Progress',
    settings: 'Settings',
  },

  workout: {
    startWorkout: 'Start Workout',
    finishWorkout: 'Finish Workout',
    restTimer: 'Rest',
    addSet: 'Add Set',
    warmup: 'Warm-up',
    workingSet: 'Working Set',
    previous: 'Previous',
    noWorkoutToday: 'No workout today — rest day',
    deloadWeek: 'Deload week — reduced volume',
  },

  nutrition: {
    addFood: 'Add Food',
    searchFood: 'Search food...',
    meals: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      preWorkout: 'Pre-Workout',
      postWorkout: 'Post-Workout',
    },
    macros: {
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      fiber: 'Fiber',
    },
    remaining: 'remaining',
    over: 'over',
  },

  progress: {
    weight: 'Weight',
    measurements: 'Measurements',
    photos: 'Photos',
    addMeasurement: 'Add Measurement',
    trend: 'Trend',
  },

  splits: {
    full_body: 'Full Body',
    upper_lower: 'Upper / Lower',
    push_pull_legs: 'Push / Pull / Legs',
  },

  progression: {
    increaseWeight: 'Increase weight!',
    stayWeight: 'Keep current weight',
    deload: 'Time for a deload',
  },

  errors: {
    invalidInput: 'Invalid input',
    saveFailed: 'Save failed',
    loadFailed: 'Load failed',
    networkError: 'Connection error',
  },
} as const;
