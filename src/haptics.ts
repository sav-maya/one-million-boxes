import { vibration } from "./lib/settings"

/**
 * Vibrate for the player's own actions. Does nothing without the Vibration API
 * (for example iOS Safari) or when the player turned Vibration off.
 */
export function buzz(pattern: number | Array<number>): void {
  if (!("vibrate" in navigator) || !vibration.get()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Haptics are optional and must never interrupt a move.
  }
}
