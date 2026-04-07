import React from 'react'
import { View, type ViewStyle, type StyleProp } from 'react-native'
import { isRTL } from '@/hooks/rtl'

interface RTLWrapperProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Layout wrapper that flips flexDirection based on system RTL state.
 * Use inside components that need horizontal layouts to respect Hebrew/Arabic direction.
 */
export function RTLWrapper({ children, style, testID }: RTLWrapperProps) {
  const flexDirection = isRTL() ? 'row-reverse' : 'row'

  return (
    <View style={[{ flexDirection }, style]} testID={testID}>
      {children}
    </View>
  )
}
