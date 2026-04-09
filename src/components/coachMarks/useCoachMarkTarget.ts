/**
 * Registers a View ref as a coach mark target.
 *
 * Returns a callback ref to attach to a <View>. When the view mounts (or
 * re-mounts after a tab focus change), `measureInWindow` is called and the
 * resulting rect is stored in CoachMarksContext under `id`.
 *
 * Usage:
 *   const ref = useCoachMarkTarget('tab-home')
 *   return <View ref={ref}>{icon}</View>
 */

import { useCallback, useEffect, useRef } from 'react'
import type { View } from 'react-native'
import { useCoachMarks } from './CoachMarksContext'

export function useCoachMarkTarget(id: string) {
  const { registerTarget, unregisterTarget } = useCoachMarks()
  const viewRef = useRef<View | null>(null)

  const measureAndRegister = useCallback(() => {
    const node = viewRef.current
    if (node === null) return
    node.measureInWindow((x, y, width, height) => {
      // Skip degenerate measurements (view not yet laid out).
      if (width === 0 && height === 0) return
      registerTarget(id, { x, y, width, height })
    })
  }, [id, registerTarget])

  // Re-measure on every render of the host (cheap; just stores into a Map).
  useEffect(() => {
    measureAndRegister()
    return () => {
      unregisterTarget(id)
    }
  }, [measureAndRegister, unregisterTarget, id])

  // Callback ref: capture the node, then schedule a measurement on the next
  // frame so the layout pass has completed.
  return useCallback(
    (node: View | null) => {
      viewRef.current = node
      if (node !== null) {
        // Defer to next tick so layout has flushed.
        setTimeout(measureAndRegister, 0)
      }
    },
    [measureAndRegister],
  )
}
