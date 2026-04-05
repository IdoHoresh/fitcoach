/**
 * Hebrew translations — primary language.
 * All user-facing strings live here. NO hardcoded Hebrew in components.
 */

export const he = {
  // ── Common ──
  common: {
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    edit: 'ערוך',
    done: 'סיום',
    next: 'הבא',
    back: 'חזרה',
    start: 'התחל',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    kg: 'ק"ג',
    cm: 'ס"מ',
    kcal: 'קלוריות',
    grams: 'גרם',
    sets: 'סטים',
    reps: 'חזרות',
    rest: 'מנוחה',
    minutes: 'דקות',
    seconds: 'שניות',
  },

  // ── Onboarding ──
  onboarding: {
    welcome: {
      title: 'ברוך הבא ל-FitCoach',
      subtitle: 'נבנה לך תוכנית אישית ב-2 דקות',
      cta: 'בוא נתחיל',
    },
    goal: {
      title: 'מה המטרה שלך?',
      muscleGain: 'עלייה במסת שריר',
      fatLoss: 'ירידה באחוזי שומן',
      maintenance: 'שמירה על המצב',
    },
    bodyStats: {
      title: 'נתוני גוף',
      height: 'גובה',
      weight: 'משקל',
      age: 'גיל',
      sex: 'מין',
      male: 'זכר',
      female: 'נקבה',
      bodyFat: 'אחוז שומן (אופציונלי)',
      bodyFatHelp: 'אם לא בטוח, דלג — נחשב בלעדיו',
    },
    experience: {
      title: 'ניסיון באימונים',
      beginner: 'מתחיל',
      beginnerDesc: 'פחות משנה של אימונים סדירים',
      intermediate: 'בינוני',
      intermediateDesc: '1-3 שנים של אימונים סדירים',
    },
    schedule: {
      title: 'באילו ימים אתה יכול להתאמן?',
      subtitle: 'בחר לפחות 2 ימים',
      days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    },
    equipment: {
      title: 'איזה ציוד זמין לך?',
      fullGym: 'חדר כושר מלא',
      fullGymDesc: 'מוטות, מכונות, כבלים',
      homeGym: 'חדר כושר ביתי',
      homeGymDesc: 'משקולות יד, ספסל, מתח',
      minimal: 'מינימלי',
      minimalDesc: 'משקל גוף + גומיות',
    },
    result: {
      title: 'התוכנית שלך מוכנה!',
      split: 'סוג אימון',
      days: 'ימי אימון',
      calories: 'קלוריות יומיות',
      protein: 'חלבון',
      cta: 'בוא נתחיל!',
    },
  },

  // ── Tabs ──
  tabs: {
    home: 'בית',
    workout: 'אימון',
    nutrition: 'תזונה',
    progress: 'התקדמות',
    settings: 'הגדרות',
  },

  // ── Workout ──
  workout: {
    startWorkout: 'התחל אימון',
    finishWorkout: 'סיים אימון',
    restTimer: 'מנוחה',
    addSet: 'הוסף סט',
    warmup: 'חימום',
    workingSet: 'סט עבודה',
    previous: 'קודם',
    noWorkoutToday: 'אין אימון היום — יום מנוחה',
    deloadWeek: 'שבוע דילואד — הורדת עומס',
  },

  // ── Nutrition ──
  nutrition: {
    addFood: 'הוסף מזון',
    searchFood: 'חפש מזון...',
    meals: {
      breakfast: 'ארוחת בוקר',
      lunch: 'ארוחת צהריים',
      dinner: 'ארוחת ערב',
      snack: 'חטיף',
      preWorkout: 'לפני אימון',
      postWorkout: 'אחרי אימון',
    },
    macros: {
      protein: 'חלבון',
      carbs: 'פחמימות',
      fat: 'שומן',
      fiber: 'סיבים',
    },
    remaining: 'נותר',
    over: 'מעל',
  },

  // ── Progress ──
  progress: {
    weight: 'משקל',
    measurements: 'מדידות',
    photos: 'תמונות',
    addMeasurement: 'הוסף מדידה',
    trend: 'מגמה',
  },

  // ── Split names ──
  splits: {
    full_body: 'פול בודי',
    upper_lower: 'עליון / תחתון',
    push_pull_legs: 'דחיפה / משיכה / רגליים',
  },

  // ── Progression ──
  progression: {
    increaseWeight: 'העלה משקל!',
    stayWeight: 'המשך עם אותו משקל',
    deload: 'הגיע הזמן לדילואד',
  },

  // ── Errors ──
  errors: {
    invalidInput: 'קלט לא תקין',
    saveFailed: 'השמירה נכשלה',
    loadFailed: 'הטעינה נכשלה',
    networkError: 'בעיית חיבור',
  },
} as const;

/** Deep structure type — allows different string values per language */
type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

export type TranslationKeys = DeepStringRecord<typeof he>;
