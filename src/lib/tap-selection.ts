/**
 * Tap-to-confirm for touch drawing. A first tap on a free edge selects it; a
 * second tap on the same edge commits it. These rules are pure so the canvas
 * only applies the result.
 */
export type TapAction =
  | { type: "select"; edgeId: number }
  | { type: "commit"; edgeId: number }
  | { type: "clear" }
  | { type: "none" }

/**
 * Decide what a tap does, given the current selection and the edge the
 * existing picker found under the finger (null for empty space or when zoomed
 * out past the touch minimum).
 */
export function resolveTap(
  selected: number | null,
  tapped: number | null,
  isTaken: (edgeId: number) => boolean,
): TapAction {
  if (tapped === null || isTaken(tapped)) {
    return selected === null ? { type: "none" } : { type: "clear" }
  }
  if (tapped === selected) return { type: "commit", edgeId: tapped }
  return { type: "select", edgeId: tapped }
}

/**
 * A committed move clears the selection only once it passes the client checks.
 * Out of moves (or not yet connected) keeps it so the player can tap again.
 */
export function selectionAfterCommit(selected: number | null, accepted: boolean): number | null {
  return accepted ? null : selected
}

/** Realtime can hand the selected edge to another player at any moment. */
export function selectionAfterBoardUpdate(
  selected: number | null,
  isTaken: (edgeId: number) => boolean,
): number | null {
  return selected !== null && isTaken(selected) ? null : selected
}

/**
 * A quick second tap on the selected edge is a confirmation, not a
 * double-tap zoom.
 */
export function isConfirmTap(selected: number | null, tapped: number | null): boolean {
  return selected !== null && tapped === selected
}
