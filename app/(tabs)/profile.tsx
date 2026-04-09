import { View, Text, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '@/theme'
import { t } from '@/i18n'
import { Button } from '@/components/Button'
// Relative import: `src/dev/` was added after Metro's initial cache build
// and this is a single dev-only consumer — a relative path is simpler than
// asking contributors to `expo start --clear` on first pull.
import { resetApp } from '../../src/dev/resetApp'

/** Dev-only: deletes the SQLite DB and reloads the bundle after confirmation. */
function handleDevReset() {
  Alert.alert(
    'Reset app?',
    'Deletes all profile, workout, and nutrition data and restarts the bundle. Dev only — cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetApp()
          } catch (error) {
            Alert.alert('Reset failed', String(error))
          }
        },
      },
    ],
  )
}

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="person-outline" size={64} color={colors.primary} />
      <Text style={styles.title}>{t().tabs.profile}</Text>

      {__DEV__ ? (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>Dev tools</Text>
          <Button
            label="Reset app (wipe DB + reload)"
            onPress={handleDevReset}
            variant="outline"
            size="sm"
            testID="dev-reset-button"
          />
        </View>
      ) : null}
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
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  devSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    gap: spacing.sm,
    alignItems: 'center',
  },
  devLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})
