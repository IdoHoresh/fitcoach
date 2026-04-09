import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { getGreetingKey, getRandomMotivation } from '@/utils/greeting'
import { isRTL } from '@/hooks/rtl'

const AVATAR_SIZE = 36

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [motivation] = useState(() => getRandomMotivation())

  const hour = new Date().getHours()
  const greetingKey = getGreetingKey(hour)
  const greetingTemplate = t().home.greetings[greetingKey]
  // TODO: get real user name from store once onboarding is built
  const userName: string = '?'
  const greeting = greetingTemplate.replace('{name}', userName)
  const initial = userName === '?' ? '?' : userName.charAt(0).toUpperCase()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.motivation}>{motivation}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel={t().tabs.profile}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  motivation: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: spacing.md,
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
})
