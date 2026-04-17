import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/useUserStore'
import { SelectionCard, StepProgressHeader, InfoCallout, BottomButtonBar } from '@/components'
import type { TrainingGoal } from '@/types'

const STEP = 1
const TOTAL_STEPS = 11
// Extra bottom padding so the last card isn't hidden behind the fixed BottomButtonBar.
const SCROLL_BOTTOM_PADDING = 140
// One-off display size tuned to the Stitch mock's `text-3xl`; tighter than fontSize.hero (32).
const HEADLINE_SIZE = 30

const GOAL_META: Record<
  TrainingGoal,
  { key: 'muscleGain' | 'fatLoss' | 'maintenance'; emoji: string }
> = {
  muscle_gain: { key: 'muscleGain', emoji: '💪' },
  fat_loss: { key: 'fatLoss', emoji: '🔥' },
  maintenance: { key: 'maintenance', emoji: '⚖️' },
}

export default function GoalScreen() {
  const router = useRouter()
  const strings = t().onboarding.goal
  const commonStrings = t().onboarding.common
  const updateDraft = useUserStore((s) => s.updateDraft)
  const draft = useUserStore((s) => s.draft)
  const [selected, setSelected] = useState<TrainingGoal | ''>(draft.goal ?? '')

  const handleSelect = (id: TrainingGoal) => {
    setSelected(id)
    updateDraft({ goal: id })
  }

  const handleContinue = () => {
    if (selected) router.push('/(onboarding)/body-stats')
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepProgressHeader step={STEP} total={TOTAL_STEPS} testID="goal-progress" />

        <View style={styles.heroText}>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
        </View>

        <View style={styles.cardList}>
          {(Object.keys(GOAL_META) as TrainingGoal[]).map((id) => {
            const { key, emoji } = GOAL_META[id]
            return (
              <SelectionCard
                key={id}
                title={strings[key]}
                description={strings[`${key}Desc` as const]}
                emoji={emoji}
                selected={selected === id}
                onPress={() => handleSelect(id)}
                testID={`goal-option-${id}`}
              />
            )
          })}
        </View>

        <InfoCallout
          title={commonStrings.didYouKnow}
          body={strings.insight}
          testID="goal-insight"
        />
      </ScrollView>

      <BottomButtonBar
        label={commonStrings.continue}
        onPress={handleContinue}
        disabled={!selected}
        testID="goal-continue"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: SCROLL_BOTTOM_PADDING,
    gap: spacing.xl,
  },
  heroText: {
    gap: spacing.sm,
  },
  title: {
    fontSize: HEADLINE_SIZE,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  cardList: {
    gap: spacing.md,
  },
})
