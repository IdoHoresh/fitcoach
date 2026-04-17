import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme'
import { t } from '@/i18n'
import { AmbientOverlay, Button, Icon } from '@/components'

const HERO_CARD_SIZE = 128
const HERO_ICON_SIZE = 72
const HERO_CARD_RADIUS = 28
const HERO_GLOW_OPACITY = 0.18
const BRAND_SIZE = 48
const DOT_HEIGHT = 4

export default function WelcomeScreen() {
  const router = useRouter()
  const strings = t().onboarding.welcome

  const handleSignIn = () => {
    // TODO: wire to auth flow
  }

  return (
    <View style={styles.container}>
      <AmbientOverlay />

      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroCard}>
            <Icon name="fitness-center" size={HERO_ICON_SIZE} color={colors.primary} />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.brandName}>{strings.title}</Text>
          <Text style={styles.tagline}>{strings.subtitle}</Text>
        </View>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label={strings.cta}
          icon={<Icon name="arrow-back" size={20} color={colors.onPrimary} />}
          onPress={() => router.push('/(onboarding)/goal')}
          variant="primary"
          size="lg"
          glow
          testID="welcome-cta"
        />
        <Pressable onPress={handleSignIn} testID="welcome-auth-link" hitSlop={12}>
          <Text style={styles.authText}>
            {strings.authPrompt} <Text style={styles.authLink}>{strings.authLink}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  heroIconWrap: {
    width: HERO_CARD_SIZE,
    height: HERO_CARD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: HERO_CARD_RADIUS,
    backgroundColor: colors.primary,
    opacity: HERO_GLOW_OPACITY,
    transform: [{ scale: 1.4 }],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  heroCard: {
    width: HERO_CARD_SIZE,
    height: HERO_CARD_SIZE,
    borderRadius: HERO_CARD_RADIUS,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.ms,
  },
  brandName: {
    fontSize: BRAND_SIZE,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    height: DOT_HEIGHT,
    width: DOT_HEIGHT * 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  dotActive: {
    width: DOT_HEIGHT * 8,
    backgroundColor: colors.primary,
    opacity: 1,
  },
  footer: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  authText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  authLink: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
})
