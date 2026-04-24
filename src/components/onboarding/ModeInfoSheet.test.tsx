import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ModeInfoSheet, type ModeSheetContent } from './ModeInfoSheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

describe('ModeInfoSheet', () => {
  const content: ModeSheetContent = {
    header: 'תוכנית — ליווי לכל ארוחה',
    intro: 'האפליקציה מחלקת את היעד היומי לארוחות',
    whatYouGet: [
      { icon: 'restaurant', text: 'יעד לכל ארוחה' },
      { icon: 'check-circle', text: 'בחירה שלב אחר שלב' },
      { icon: 'info-outline', text: 'מחוון מידה בכמויות אמיתיות' },
    ],
    how: 'לוחצים על "ארוחת בוקר" ← האפליקציה מציעה חלבונים',
    fit: ['בא לך מסגרת ברורה', 'מעדיף שיציעו לך מאכלים'],
    footer: 'אפשר להחליף ל"מעקב" מההגדרות',
  }

  const sectionTitles = {
    get: 'מה מקבלים',
    how: 'איך זה עובד',
    fit: 'מתאים אם',
  }

  it('renders header, intro, and all section titles when visible', () => {
    render(
      <ModeInfoSheet
        visible
        onClose={jest.fn()}
        content={content}
        closeLabel="סגור"
        sectionTitles={sectionTitles}
      />,
    )
    expect(screen.getByText(content.header)).toBeTruthy()
    expect(screen.getByText(content.intro)).toBeTruthy()
    expect(screen.getByText(sectionTitles.get)).toBeTruthy()
    expect(screen.getByText(sectionTitles.how)).toBeTruthy()
    expect(screen.getByText(sectionTitles.fit)).toBeTruthy()
  })

  it('renders all what-you-get bullets and fit items', () => {
    render(
      <ModeInfoSheet
        visible
        onClose={jest.fn()}
        content={content}
        closeLabel="סגור"
        sectionTitles={sectionTitles}
      />,
    )
    content.whatYouGet.forEach((b) => expect(screen.getByText(b.text)).toBeTruthy())
    content.fit.forEach((f) => expect(screen.getByText(f)).toBeTruthy())
  })

  it('renders the footer and the close button', () => {
    render(
      <ModeInfoSheet
        visible
        onClose={jest.fn()}
        content={content}
        closeLabel="סגור"
        sectionTitles={sectionTitles}
      />,
    )
    expect(screen.getByText(content.footer)).toBeTruthy()
    expect(screen.getByText('סגור')).toBeTruthy()
  })

  it('calls onClose when the close button is pressed', () => {
    const onClose = jest.fn()
    render(
      <ModeInfoSheet
        visible
        onClose={onClose}
        content={content}
        closeLabel="סגור"
        sectionTitles={sectionTitles}
        testID="sheet"
      />,
    )
    fireEvent.press(screen.getByTestId('sheet-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
