import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'
import { fontSize, fontWeight } from '@/theme/typography'
import { t } from '@/i18n'
import { Button } from '@/components/Button'
import { WorkoutTimer } from './WorkoutTimer'

interface FinishWorkoutBarProps {
  totalExercises: number
  completedExercises: number
  allDone: boolean
  startedAt: string
  onFinish: () => void
  onEndEarly: () => void
  testID?: string
}

export function FinishWorkoutBar({
  totalExercises,
  completedExercises,
  allDone,
  startedAt,
  onFinish,
  onEndEarly,
  testID,
}: FinishWorkoutBarProps) {
  const strings = t().workout

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.info}>
        <Text style={styles.progress}>
          {strings.exercisesCompleted
            .replace('{done}', String(completedExercises))
            .replace('{total}', String(totalExercises))}
        </Text>
        <WorkoutTimer startedAt={startedAt} testID={testID ? `${testID}-timer` : undefined} />
      </View>
      {allDone ? (
        <Button
          label={strings.finishWorkout}
          onPress={onFinish}
          variant="primary"
          testID={testID ? `${testID}-finish` : undefined}
        />
      ) : (
        <Button
          label={strings.endEarly}
          onPress={onEndEarly}
          variant="ghost"
          testID={testID ? `${testID}-end-early` : undefined}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
})
