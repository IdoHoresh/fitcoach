/**
 * Coach marks state machine + provider.
 *
 * Holds the active tour state in memory and exposes:
 *   - startTour(steps)  — begin a new tour from step 0
 *   - next()            — advance, or finish if on the final step
 *   - skip()            — finish immediately (skip = complete; never re-shown)
 *   - registerTarget()  — record a measured rect for a target id
 *
 * Skip and Done are deliberately the same outcome: both mark the tour as
 * permanently complete via the parent's `onFinish` callback. The provider
 * does NOT persist state itself — that lives in `useUserStore` so it can be
 * shared with the database layer.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { CoachMarkStep, TargetRect } from './types'

interface CoachMarksContextValue {
  /** Active step list, empty when no tour is running. */
  steps: CoachMarkStep[]
  /** Index into `steps`, or null when no tour is running. */
  activeIndex: number | null
  /** True while a tour is in progress. */
  isActive: boolean
  /** Looks up a registered target rect by id. */
  getTargetRect: (id: string) => TargetRect | undefined

  startTour: (steps: CoachMarkStep[]) => void
  next: () => void
  skip: () => void
  registerTarget: (id: string, rect: TargetRect) => void
  unregisterTarget: (id: string) => void
}

const CoachMarksContext = createContext<CoachMarksContextValue | null>(null)

interface CoachMarksProviderProps {
  /**
   * Called once when the user finishes (Done on the final step) OR skips.
   * The overlay closes immediately regardless of whether the parent
   * persists the completion state.
   */
  onFinish: () => void
  children: React.ReactNode
}

export function CoachMarksProvider({ onFinish, children }: CoachMarksProviderProps) {
  const [steps, setSteps] = useState<CoachMarkStep[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Target rects live in a ref so re-renders during tour navigation don't
  // clobber registrations from useCoachMarkTarget.
  const targetsRef = useRef<Map<string, TargetRect>>(new Map())

  const startTour = useCallback((nextSteps: CoachMarkStep[]) => {
    if (nextSteps.length === 0) {
      // Nothing to show — leave the overlay closed.
      return
    }
    setSteps(nextSteps)
    setActiveIndex(0)
  }, [])

  const finish = useCallback(() => {
    setActiveIndex(null)
    setSteps([])
    onFinish()
  }, [onFinish])

  const next = useCallback(() => {
    if (activeIndex === null) return
    const lastIndex = steps.length - 1
    if (activeIndex >= lastIndex) {
      finish()
      return
    }
    setActiveIndex(activeIndex + 1)
  }, [activeIndex, steps.length, finish])

  const skip = useCallback(() => {
    finish()
  }, [finish])

  const registerTarget = useCallback((id: string, rect: TargetRect) => {
    targetsRef.current.set(id, rect)
  }, [])

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id)
  }, [])

  const getTargetRect = useCallback((id: string): TargetRect | undefined => {
    return targetsRef.current.get(id)
  }, [])

  const value = useMemo<CoachMarksContextValue>(
    () => ({
      steps,
      activeIndex,
      isActive: activeIndex !== null,
      getTargetRect,
      startTour,
      next,
      skip,
      registerTarget,
      unregisterTarget,
    }),
    [steps, activeIndex, getTargetRect, startTour, next, skip, registerTarget, unregisterTarget],
  )

  return <CoachMarksContext.Provider value={value}>{children}</CoachMarksContext.Provider>
}

/**
 * Hook to read/control the active coach marks tour.
 * Throws if used outside a `<CoachMarksProvider>`.
 */
export function useCoachMarks(): CoachMarksContextValue {
  const ctx = useContext(CoachMarksContext)
  if (ctx === null) {
    throw new Error('useCoachMarks must be used inside a <CoachMarksProvider>')
  }
  return ctx
}
