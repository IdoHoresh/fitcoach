import React, { useEffect, useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { fontSize, fontWeight } from '@/theme/typography'
import { formatElapsed } from './helpers'

interface WorkoutTimerProps {
  startedAt: string
  testID?: string
}

export function WorkoutTimer({ startedAt, testID }: WorkoutTimerProps) {
  const [display, setDisplay] = useState(() => formatElapsed(startedAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(formatElapsed(startedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <Text style={styles.timer} testID={testID}>
      {display}
    </Text>
  )
}

const styles = StyleSheet.create({
  timer: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
})
