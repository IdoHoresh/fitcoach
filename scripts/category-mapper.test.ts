import { assignCategory } from './category-mapper'

describe('assignCategory', () => {
  describe('keyword rules (highest priority)', () => {
    it('assigns dairy when Hebrew name contains גבינה', () => {
      expect(assignCategory('גבינה צהובה', 25, 10, 1)).toBe('dairy')
    })

    it('assigns dairy when Hebrew name contains יוגורט', () => {
      expect(assignCategory('יוגורט 3% שומן', 4, 3, 5)).toBe('dairy')
    })

    it('assigns dairy when Hebrew name contains חלב', () => {
      expect(assignCategory('חלב 3% שומן', 3, 3, 5)).toBe('dairy')
    })

    it('assigns protein when Hebrew name contains עוף', () => {
      expect(assignCategory('חזה עוף מבושל', 31, 3.6, 0)).toBe('protein')
    })

    it('assigns protein when Hebrew name contains דג', () => {
      expect(assignCategory('דג סלמון', 20, 6, 0)).toBe('protein')
    })

    it('assigns protein when Hebrew name contains ביצה', () => {
      expect(assignCategory('ביצה שלמה', 13, 10, 1)).toBe('protein')
    })

    it('assigns carbs when Hebrew name contains אורז', () => {
      expect(assignCategory('אורז לבן מבושל', 3, 0.3, 28)).toBe('carbs')
    })

    it('assigns carbs when Hebrew name contains לחם', () => {
      expect(assignCategory('לחם מחיטה מלאה', 8, 2, 45)).toBe('carbs')
    })

    it('assigns vegetables when Hebrew name contains עגבנ', () => {
      expect(assignCategory('עגבניה שרי', 1, 0.2, 4)).toBe('vegetables')
    })

    it('assigns vegetables when Hebrew name contains ברוקולי', () => {
      expect(assignCategory('ברוקולי מבושל', 3, 0.3, 7)).toBe('vegetables')
    })

    it('assigns fruits when Hebrew name contains תפוח', () => {
      expect(assignCategory('תפוח עץ', 0.3, 0.2, 14)).toBe('fruits')
    })

    it('assigns fruits when Hebrew name contains בננה', () => {
      expect(assignCategory('בננה טריה', 1, 0.3, 20)).toBe('fruits')
    })

    it('assigns fats when Hebrew name contains טחינה', () => {
      expect(assignCategory('טחינה גולמית', 21, 55, 4)).toBe('fats')
    })

    it('assigns fats when Hebrew name contains אבוקדו', () => {
      expect(assignCategory('אבוקדו', 2, 15, 9)).toBe('fats')
    })

    it('assigns traditional when Hebrew name contains חומוס', () => {
      expect(assignCategory('חומוס ביתי', 8, 6, 18)).toBe('traditional')
    })

    it('assigns traditional when Hebrew name contains שניצל', () => {
      expect(assignCategory('שניצל עוף', 26, 11, 12)).toBe('traditional')
    })

    it('assigns traditional when Hebrew name contains פלאפל', () => {
      expect(assignCategory('פלאפל מטוגן', 13, 18, 30)).toBe('traditional')
    })
  })

  describe('macro fallback rules (when no keyword matches)', () => {
    it('assigns protein when protein > 15 and no keyword match', () => {
      expect(assignCategory('תוסף ספורט', 20, 3, 0)).toBe('protein')
    })

    it('assigns fats when fat > 25 and no keyword match', () => {
      expect(assignCategory('רוטב קרם', 0, 100, 0)).toBe('fats')
    })

    it('assigns carbs when carbs > 40 and no keyword match', () => {
      expect(assignCategory('חטיף מלוח', 4, 5, 60)).toBe('carbs')
    })
  })

  describe('default fallback', () => {
    it('assigns snacks when nothing matches', () => {
      expect(assignCategory('מוצר לא מזוהה', 4, 8, 20)).toBe('snacks')
    })
  })

  describe('priority — keyword beats macro', () => {
    it('dairy keyword wins over high-protein macro', () => {
      // cottage cheese: high protein but Hebrew says גבינה → dairy
      expect(assignCategory('גבינת קוטג 0.5%', 12, 1, 2)).toBe('dairy')
    })

    it('traditional keyword wins over high-carbs macro', () => {
      expect(assignCategory('שקשוקה ביתית', 8, 10, 5)).toBe('traditional')
    })
  })
})
