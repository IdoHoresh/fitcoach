import { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors, spacing, fontSize, fontWeight, fontFamily, borderRadius } from '@/theme'
import { t } from '@/i18n'
import { isRTL } from '@/hooks/rtl'
import { Button } from '@/components'

const PULSE_SCALE = 1.03
const PULSE_DURATION = 1500
const BRAND_FONT_SIZE = 56 // One-off display size for brand name — not a theme token
const APP_ICON_SIZE = 72
const BARBELL_ICON_SIZE = 32

export default function WelcomeScreen() {
  const router = useRouter()
  const strings = t().onboarding.welcome
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(PULSE_SCALE, { duration: PULSE_DURATION }),
        withTiming(1, { duration: PULSE_DURATION }),
      ),
      -1,
    )
  }, [pulseScale])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const handleSignIn = () => {
    // TODO: wire to auth flow
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.appIconContainer}>
          <Ionicons name="barbell" size={BARBELL_ICON_SIZE} color={colors.textInverse} />
        </View>
        <Text style={styles.brandName}>{strings.title}</Text>
        <Text style={styles.tagline}>{strings.subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <Animated.View style={[styles.ctaWrapper, pulseStyle]}>
          <Button
            label={strings.cta}
            icon={
              <Ionicons
                name={isRTL() ? 'arrow-back' : 'arrow-forward'}
                size={20}
                color={colors.textPrimary}
              />
            }
            onPress={() => router.push('/(onboarding)/goal')}
            size="lg"
            testID="welcome-cta"
          />
        </Animated.View>
        <Pressable onPress={handleSignIn} testID="welcome-auth-link">
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
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  appIconContainer: {
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Ambient glow (iOS only — Android elevation doesn't support colored shadows)
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  brandName: {
    fontSize: BRAND_FONT_SIZE,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  ctaWrapper: {
    width: '100%',
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
