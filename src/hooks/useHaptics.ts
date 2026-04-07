import * as Haptics from 'expo-haptics'

type HapticStyle = 'light' | 'medium' | 'heavy'

const STYLE_MAP: Record<HapticStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
}

/** Trigger haptic feedback. Silently catches errors (e.g., on simulators). */
export async function triggerHaptic(style: HapticStyle): Promise<void> {
  try {
    await Haptics.impactAsync(STYLE_MAP[style])
  } catch {
    // Haptics unavailable (simulator, unsupported device) — fail silently
  }
}
