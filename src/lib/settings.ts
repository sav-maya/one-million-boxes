import { useSyncExternalStore } from "react"
import { isTouchDevice } from "./edge-picker"

/**
 * A boolean player preference persisted like the sound toggle: on by default,
 * stored as "true"/"false" in localStorage, and still usable for the session
 * when storage is unavailable.
 */
function createPreference(key: string) {
  let value = true
  try {
    value = localStorage.getItem(key) !== "false"
  } catch {
    // Preferences still work for this session without browser storage.
  }
  const listeners = new Set<() => void>()
  const get = () => value
  const set = (next: boolean) => {
    value = next
    try {
      localStorage.setItem(key, String(next))
    } catch {
      // Keep the in-memory choice when storage is unavailable.
    }
    for (const listener of listeners) listener()
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  const use = () => useSyncExternalStore(subscribe, get, get)
  return { get, set, use }
}

/** Touch drawing selects an edge first and draws it on a second tap. */
export const tapToConfirm = createPreference("boxes:tap-to-confirm")

/** Haptic feedback for local moves, box claims and empty quota. */
export const vibration = createPreference("boxes:vibration")

export function canTapToConfirm(): boolean {
  return typeof window !== "undefined" && isTouchDevice()
}

export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator
}
