import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { getGreetingKey } from '@/utils/greeting'

const AVATAR_SIZE = 40

const MENU_ICON_SIZE = 24

interface HomeHeaderProps {
  onAvatarPress: () => void
  onMenuPress?: () => void
  name?: string
  testID?: string
}

// Ordered arrays so `Date.getDay()` (0 = Sunday … 6 = Saturday)
// and `Date.getMonth()` (0 = January … 11 = December) can index directly.
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

function formatTodayDate(now: Date): string {
  const weekdayKey = WEEKDAY_KEYS[now.getDay()]
  const monthKey = MONTH_KEYS[now.getMonth()]
  const strings = t().home.v2
  const weekday = strings.weekdayShort[weekdayKey]
  const month = strings.monthsLong[monthKey]
  return strings.dateFormat
    .replace('{weekday}', weekday)
    .replace('{day}', String(now.getDate()))
    .replace('{month}', month)
}

export function HomeHeader({ onAvatarPress, onMenuPress, name, testID }: HomeHeaderProps) {
  const now = new Date()
  const greetingKey = getGreetingKey(now.getHours())
  const trimmedName = name?.trim() ?? ''
  const greeting =
    trimmedName.length > 0
      ? t().home.greetings[greetingKey].replace('{name}', trimmedName)
      : t().home.v2.greetingNoName[greetingKey]
  const dateText = formatTodayDate(now)

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel={t().tabs.profile}
        style={styles.avatar}
        testID={testID ? `${testID}-avatar` : undefined}
      >
        <Text style={styles.avatarText}>?</Text>
      </Pressable>
      <View style={styles.textColumn}>
        <Text style={styles.greeting} testID={testID ? `${testID}-greeting` : undefined}>
          {greeting}
        </Text>
        <Text style={styles.date} testID={testID ? `${testID}-date` : undefined}>
          {dateText}
        </Text>
      </View>
      <Pressable
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel={t().home.v2.menuLabel}
        style={styles.menuButton}
        testID={testID ? `${testID}-menu` : undefined}
      >
        <Ionicons name="menu" size={MENU_ICON_SIZE} color={colors.textSecondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  textColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'left',
  },
  date: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'left',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  menuButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
