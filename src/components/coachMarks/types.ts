/**
 * Coach marks shared types.
 */

/** A single step in a coach marks tour. */
export interface CoachMarkStep {
  /**
   * Stable identifier matching a registered target on screen.
   * The overlay uses this id to look up the target's measured rect.
   */
  id: string
  /** Localized title shown in the tooltip. */
  title: string
  /** Localized body shown below the title. */
  body: string
}

/** Window-relative rect of a coach mark target, populated via measureInWindow. */
export interface TargetRect {
  x: number
  y: number
  width: number
  height: number
}
