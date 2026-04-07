import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '@/theme'
import { t } from '@/i18n'

export default function WelcomeScreen() {
  const strings = t().onboarding.welcome

  return (
    <View style={styles.container}>
      <Ionicons name="fitness-outline" size={80} color={colors.primary} />
      <Text style={styles.title}>{strings.title}</Text>
      <Text style={styles.subtitle}>{strings.subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
