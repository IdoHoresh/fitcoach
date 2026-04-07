import React from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  type KeyboardTypeOptions,
} from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, borderRadius } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { isRTL } from '@/hooks/rtl'

interface TextInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  error?: string
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean
  testID?: string
}

export function TextInput({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  secureTextEntry,
  testID,
}: TextInputProps) {
  const textAlign = isRTL() ? 'right' : 'left'
  const fieldTestID = testID ? `${testID}-field` : 'input-field'

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={label}
        testID={fieldTestID}
        style={[styles.input, { textAlign }, error ? styles.inputError : styles.inputDefault]}
      />
      {error ? (
        <Text style={styles.error} testID={testID ? `${testID}-error` : 'input-error'}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  inputDefault: {
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.xs,
  },
})
