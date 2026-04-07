import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors, spacing, fontSize, fontWeight } from '@/theme'
import { t } from '@/i18n'
import { Button } from '@/components'

const PULSE_SCALE = 1.03
const PULSE_DURATION = 1500

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

  return (
    <View style={styles.container}>
      <Ionicons name="fitness-outline" size={80} color={colors.primary} />
      <Text style={styles.title}>{strings.title}</Text>
      <Text style={styles.subtitle}>{strings.subtitle}</Text>
      <Animated.View style={[styles.ctaWrapper, pulseStyle]}>
        <Button
          label={strings.cta}
          onPress={() => router.push('/(onboarding)/goal')}
          size="lg"
          testID="welcome-cta"
        />
      </Animated.View>
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
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ctaWrapper: {
    width: '100%',
    marginTop: spacing.lg,
  },
})
