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
      title: 'ברוך הבא ל-Gibor',
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
      name: 'איך לקרוא לך?',
      namePlaceholder: 'השם הפרטי שלך',
      height: 'גובה',
      weight: 'משקל',
      age: 'גיל',
      sex: 'מין',
      male: 'זכר',
      female: 'נקבה',
      bodyFat: 'אחוז שומן (אופציונלי)',
      bodyFatHelp: 'אם לא בטוח, דלג — נחשב בלעדיו',
      bodyFatSkip: 'דלג, חשב בלעדיו',
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
      items: {
        barbell: 'מוט ומשקולות',
        squat_rack: 'מתקן סקוואט',
        dumbbells: 'משקולות יד',
        bench: 'ספסל אימון',
        pull_up_bar: 'מתח',
        cable_machine: 'מכונת כבלים',
        leg_machines: 'מכונות רגליים',
        resistance_bands: 'גומיות התנגדות',
      },
      selectedAll: 'כל הציוד נבחר אוטומטית',
      selectYours: 'בחר את הציוד שיש לך בבית',
    },
    occupation: {
      title: 'מה סוג העבודה שלך?',
      subtitle: 'זה עוזר לנו לחשב כמה קלוריות אתה שורף ביום',
      desk: 'יושב רוב היום',
      deskDesc: 'מחשב, משרד, קולגים מסביב',
      mixed: 'חצי יושב חצי עומד',
      mixedDesc: 'מורה, מוכר, עובד מעבדה',
      active: 'הולך ועומד רוב היום',
      activeDesc: 'אח/ות, מלצר, דוור',
      physicalLabor: 'עבודה פיזית',
      physicalLaborDesc: 'בניין, חקלאות, הובלות',
    },
    steps: {
      title: 'כמה צעדים אתה עושה ביום?',
      subtitle: 'אם יש לך שעון חכם או אייפון, תבדוק באפליקציית הבריאות',
      inputPlaceholder: 'מספר צעדים',
      dontKnow: 'לא יודע, תעריך בשבילי',
      iKnow: 'אני יודע כמה צעדים',
      helpText: 'לא בטוח? לא נורא — נעריך לפי סוג העבודה והשגרה שלך',
    },
    lifestyle: {
      title: 'מה אתה עושה אחרי העבודה?',
      subtitle: 'בלי לספור אימונים — רק השגרה הרגילה',
      sedentary: 'בעיקר בבית',
      sedentaryDesc: 'טלוויזיה, מחשב, מנוחה',
      moderate: 'יוצא קצת',
      moderateDesc: 'קניות, הליכות, מטלות בית',
      active: 'פעיל מאוד',
      activeDesc: 'ילדים, תחביבים פיזיים, גינה',
    },
    exercise: {
      title: 'העדפות אימון',
      subtitle: 'כבר יודעים מתי, עכשיו נקבע איך',
      sessionLength: 'כמה זמן כל אימון?',
      minutes: 'דקות',
      type: 'מה סוג האימון?',
      strength: 'כוח (משקולות)',
      cardio: 'אירובי (ריצה, אופניים)',
      both: 'שילוב של שניהם',
      intensity: 'כמה קשה?',
      light: 'קל — אפשר לדבר בנוחות',
      moderate: 'בינוני — מתנשף אבל אפשר לדבר',
      intense: 'קשה — בקושי אפשר לדבר',
    },
    sleep: {
      title: 'כמה שעות שינה בלילה?',
      hours: 'שעות',
      lowWarning: 'פחות מ-6 שעות שינה פוגע בהתאוששות ובתוצאות. שווה לנסות לשפר!',
    },
    calculating: {
      title: 'בונים את התוכנית שלך',
      step1: 'מחשב מטבוליזם בסיסי...',
      step2: 'מנתח תנועה יומית...',
      step3: 'מוסיף שריפת אימונים...',
      step4: 'מחשב עיכול מזון...',
      step5: 'בונה את התוכנית שלך...',
    },
    result: {
      title: 'התוכנית שלך מוכנה!',
      split: 'סוג אימון',
      days: 'ימי אימון',
      calories: 'קלוריות יומיות',
      protein: 'חלבון',
      cta: 'בוא נתחיל!',
      breakdown: 'איך חישבנו?',
      bmrLabel: 'מטבוליזם בסיסי',
      neatLabel: 'תנועה יומית',
      eatLabel: 'אימונים',
      tefLabel: 'עיכול מזון',
      totalLabel: 'סה"כ שריפה יומית',
      disclaimer: 'המידע מבוסס על מחקרים ומותאם אישית. אין לראות בכך ייעוץ רפואי.',
      missingData: 'חסרים נתונים. חזור ומלא את כל השלבים.',
    },
  },

  // ── Tabs ──
  tabs: {
    home: 'בית',
    workout: 'אימון',
    nutrition: 'תזונה',
    profile: 'פרופיל',
  },

  // ── Home ──
  home: {
    greetings: {
      morning: 'בוקר טוב, {name}',
      afternoon: 'צהריים טובים, {name}',
      evening: 'ערב טוב, {name}',
      night: 'לילה טוב, {name}',
    },
    motivational: [
      'עקביות מנצחת עוצמה',
      'כל חזרה נחשבת',
      'העצמי העתידי שלך יודה לך',
      'התקדמות, לא שלמות',
      'הגוף שלך יכול, הראש צריך להאמין',
      'היום אתה יותר חזק מאתמול',
      'אין קיצורי דרך, יש עקביות',
      'תן לתוצאות לדבר',
      'כל אימון הוא השקעה בעצמך',
      'השינוי מתחיל כשנגמר הנוח',
      'אל תספור ימים, תעשה שהימים יספרו',
      'הדרך הכי ארוכה מתחילה בצעד אחד',
      'אתה לא צריך להיות מושלם, רק עקבי',
      'המקום הכי טוב להתחיל הוא כאן',
      'גם יום קשה באימון עדיף מיום על הספה',
      'אימון של 20 דקות עדיף מאפס דקות',
      'השרירים גדלים במנוחה — תן לגוף להתאושש',
      'תזונה זה 80% מהתוצאה',
      'אל תשווה את עצמך לאחרים, רק לעצמך של אתמול',
      'הדרך לשינוי עוברת דרך ההרגלים',
    ],
    v2: {
      greetingNoName: {
        morning: 'בוקר טוב',
        afternoon: 'צהריים טובים',
        evening: 'ערב טוב',
        night: 'לילה טוב',
      },
      dateFormat: 'יום {weekday}, {day} ב{month}',
      weekdayShort: {
        sun: 'א',
        mon: 'ב',
        tue: 'ג',
        wed: 'ד',
        thu: 'ה',
        fri: 'ו',
        sat: 'ש',
      },
      monthsLong: {
        jan: 'ינואר',
        feb: 'פברואר',
        mar: 'מרץ',
        apr: 'אפריל',
        may: 'מאי',
        jun: 'יוני',
        jul: 'יולי',
        aug: 'אוגוסט',
        sep: 'ספטמבר',
        oct: 'אוקטובר',
        nov: 'נובמבר',
        dec: 'דצמבר',
      },
      todayTitle: 'התוכנית של היום',
      nextLabel: 'הבא',
      startPill: 'התחל',
      logPill: 'רשום',
      restDay: 'יום מנוחה — התאוששות',
      celebration: 'כל הכבוד להיום — סיימת',
      streakWeekLabel: 'שבוע {week} · {done}/{goal} אימונים',
      planItems: {
        breakfast: 'ארוחת בוקר',
        lunch: 'ארוחת צהריים',
        dinner: 'ארוחת ערב',
        snack: 'חטיף',
        pre_workout: 'לפני אימון',
        post_workout: 'אחרי אימון',
        workout: 'אימון',
        ghostMeal: 'ארוחה',
        ghostWorkout: 'אימון',
      },
      macroLegend: {
        proteinLetter: 'ח',
        carbsLetter: 'פ',
        fatLetter: 'ש',
        proteinLabel: 'חלבון',
        carbsLabel: 'פחמימות',
        fatLabel: 'שומן',
      },
      caloriesShort: 'קל׳',
      minutesShort: 'דק׳',
    },
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
    // Workout screen
    todaysWorkout: 'האימון של היום',
    restDay: 'יום מנוחה',
    restDayMessage: 'השרירים שלך גדלים עכשיו — תן לגוף להתאושש',
    restDayTips: [
      'מתיחות קלות יכולות לעזור להתאוששות',
      'שתה מספיק מים — לפחות 2 ליטר ביום',
      'שינה טובה היא חצי מהתוצאה',
      'אפשר ללכת הליכה קלה — תנועה עוזרת להתאוששות',
    ],
    tomorrowPreview: 'האימון של מחר',
    exerciseCount: '{count} תרגילים',
    comingSoon: 'בקרוב',
    primaryMuscle: 'שריר ראשי',
    secondaryMuscles: 'שרירים משניים',
    equipment: 'ציוד',
    instructions: 'ביצוע',
    progressionAdvice: 'המלצת התקדמות',
    noWorkoutPlan: 'עדיין אין תוכנית אימון — סיים את ההרשמה כדי לקבל אחת',
    deloadBadge: 'דילואד',
    weekLabel: 'שבוע {week}',
    exercises: 'תרגילים',
    // Active workout session
    weight: 'משקל',
    repsLabel: 'חזרות',
    kg: 'ק"ג',
    set: 'סט',
    setOf: 'סט {current} מתוך {total}',
    confirmSet: 'אשר סט',
    exerciseDone: 'תרגיל הושלם',
    setsCompleted: '{done}/{total} סטים',
    endEarly: 'סיום מוקדם',
    endEarlyTitle: 'לסיים את האימון?',
    endEarlyMessage: '{completed} מתוך {total} תרגילים הושלמו. ההתקדמות תישמר.',
    endEarlyConfirm: 'סיים אימון',
    continueWorkout: 'המשך אימון',
    restBubbleLabel: 'מנוחה',
    workoutDuration: 'משך אימון',
    greatJob: 'כל הכבוד!',
    totalSets: 'סהכ סטים',
    exercisesCompleted: '{done}/{total} תרגילים',
    muscles: {
      chest: 'חזה',
      back: 'גב',
      shoulders: 'כתפיים',
      quads: 'ארבע ראשי',
      hamstrings: 'אחורי ירך',
      biceps: 'ביספס',
      triceps: 'טריספס',
      glutes: 'ישבן',
      calves: 'תאומים',
      abs: 'בטן',
    },
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

  // ── Recalibration Coach Messages ──
  recalibration: {
    stay_course: 'אתה בדיוק במסלול! תמשיך ככה, זה עובד.',
    increase_calories: {
      minor_adjust: 'אתה יורד קצת מהר מדי. מוסיף 100 קלוריות כדי לשמור על השריר.',
      significant_adjust: 'יורד מהר מדי. מוסיף 200 קלוריות — שמירה על שריר עדיפה על מהירות.',
      concern: 'המשקל יורד מהר. מוסיף 300 קלוריות. אם זה ממשיך, שווה להתייעץ עם מקצוען.',
    },
    decrease_calories: {
      minor_adjust: 'המשקל עולה קצת. מוריד 100 קלוריות.',
      significant_adjust: 'עלייה מעבר לצפוי. מוריד 200 קלוריות.',
      concern: 'עלייה משמעותית. מוריד 300 קלוריות. בוא נהדק.',
    },
    increase_deficit: {
      minor_adjust: 'ההתקדמות קצת איטית. מוריד 100 קלוריות כדי לזוז.',
      significant_adjust: 'הירידה נתקעה. מוריד 200 קלוריות.',
      concern: 'הירידה נתקעה לגמרי. מוריד 300 קלוריות. אם זה לא עוזר, שווה להתייעץ.',
    },
    reduce_surplus: {
      minor_adjust: 'עולה קצת מהר. מוריד 100 קלוריות כדי למנוע שומן מיותר.',
      significant_adjust: 'עודף גדול מדי. מוריד 200 קלוריות.',
      concern: 'עלייה מהירה מאוד. מוריד 300 קלוריות. בוא נבדוק מה קורה.',
    },
    log_more: 'אין מספיק נתונים השבוע. נסה לשקול את עצמך ולתעד אוכל באופן עקבי יותר.',
    goal_achieved: 'הגעת ליעד! הגיע הזמן לעבור למצב שמירה.',
  },

  // ── Components ──
  components: {
    numberInput: {
      increment: 'הגדל',
      decrement: 'הקטן',
    },
    checkboxList: {
      selectAll: 'בחר הכל',
      clearAll: 'נקה הכל',
    },
    macroRing: {
      remaining: 'נותרו',
      protein: 'חלבון',
      carbs: 'פחמימות',
      fat: 'שומן',
    },
    streakCounter: {
      weeklyLabel: 'אימונים השבוע',
      streakWeeks: 'שבועות רצופים',
      streakWeek: 'שבוע רצוף',
    },
    restTimer: {
      pause: 'השהה',
      resume: 'המשך',
      reset: 'איפוס',
      done: 'סיים!',
    },
    coachMarks: {
      skip: 'דלג',
      next: 'הבא',
      done: 'סיום',
      stepSeparator: 'מתוך',
      tabs: {
        home: {
          title: 'הבית שלך',
          body: 'הסטטוס היומי, ההתקדמות וכל מה שחשוב — במקום אחד.',
        },
        workout: {
          title: 'אימון',
          body: 'התוכנית האישית שלך, מעקב סטים ומנוחה חכמה בין סטים.',
        },
        nutrition: {
          title: 'תזונה',
          body: 'תיעוד מהיר של ארוחות, מאקרוס וקלוריות לפי המטרה שלך.',
        },
      },
    },
  },

  // ── Errors ──
  errors: {
    invalidInput: 'קלט לא תקין',
    saveFailed: 'השמירה נכשלה',
    loadFailed: 'הטעינה נכשלה',
    networkError: 'בעיית חיבור',
  },
} as const

/** Deep structure type — allows different string values per language */
type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends readonly string[]
    ? string[]
    : T[K] extends string
      ? string
      : DeepStringRecord<T[K]>
}

export type TranslationKeys = DeepStringRecord<typeof he>
