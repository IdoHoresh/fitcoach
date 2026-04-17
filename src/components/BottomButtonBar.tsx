import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { Button } from './Button'

const FADE_HEIGHT = 48

interface BottomButtonBarProps {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  testID?: string
}

export function BottomButtonBar({
  label,
  onPress,
  disabled,
  loading,
  testID,
}: BottomButtonBarProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={['transparent', colors.background]}
        locations={[0, 1]}
        style={styles.fade}
        pointerEvents="none"
      />
      <View style={styles.buttonArea}>
        <Button
          label={label}
          onPress={onPress}
          disabled={disabled}
          loading={loading}
          variant="primary"
          size="lg"
          glow
          testID={testID}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fade: {
    height: FADE_HEIGHT,
    width: '100%',
  },
  buttonArea: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + spacing.sm,
  },
})
