import { useCallback, useId, useState } from "react"
import type { CSSProperties } from "react"
import "./TouchFeedback.css"

interface Ripple {
  id: string
  x: number
  y: number
  color?: string
}

interface UseTouchFeedbackReturn {
  ripples: Array<Ripple>
  addRipple: (x: number, y: number, color?: string) => void
}

/**
 * Hook to manage touch feedback ripple effects.
 * Returns ripple state and a function to add new ripples.
 */
export function useTouchFeedback(): UseTouchFeedbackReturn {
  const [ripples, setRipples] = useState<Array<Ripple>>([])
  const baseId = useId()
  const counterRef = { current: 0 }

  const addRipple = useCallback(
    (x: number, y: number, color?: string) => {
      const id = `${baseId}-${counterRef.current++}`
      const newRipple: Ripple = { id, x, y, color }

      setRipples((prev) => [...prev, newRipple])

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 500)
    },
    [baseId],
  )

  return { ripples, addRipple }
}

interface TouchFeedbackProps {
  ripples: Array<Ripple>
}

/**
 * Component that renders touch feedback ripple effects.
 * Must be positioned within a relative/absolute container.
 */
export function TouchFeedback({ ripples }: TouchFeedbackProps) {
  if (ripples.length === 0) return null

  return (
    <div className="touch-feedback-container">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="touch-ripple"
          style={
            {
              left: ripple.x,
              top: ripple.y,
              ...(ripple.color ? { "--ripple-color": ripple.color } : {}),
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
