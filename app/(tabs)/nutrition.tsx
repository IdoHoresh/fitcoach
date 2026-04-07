import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '@/theme'
import { t } from '@/i18n'

export default function NutritionScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="nutrition-outline" size={64} color={colors.primary} />
      <Text style={styles.title}>{t().tabs.nutrition}</Text>
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
})
