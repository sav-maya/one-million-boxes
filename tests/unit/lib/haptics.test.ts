import { afterEach, describe, expect, it, vi } from "vitest"
import { buzz } from "../../../src/haptics"
import { vibration } from "../../../src/lib/settings"

describe(`buzz`, () => {
  afterEach(() => {
    vibration.set(true)
    vi.mocked(navigator.vibrate).mockClear()
  })

  it(`vibrates with the given pattern when Vibration is on`, () => {
    buzz(10)
    buzz([20, 40, 20])
    expect(navigator.vibrate).toHaveBeenNthCalledWith(1, 10)
    expect(navigator.vibrate).toHaveBeenNthCalledWith(2, [20, 40, 20])
  })

  it(`does nothing when the player turned Vibration off`, () => {
    vibration.set(false)
    buzz(60)
    expect(navigator.vibrate).not.toHaveBeenCalled()
  })

  it(`never throws when the device rejects vibration`, () => {
    vi.mocked(navigator.vibrate).mockImplementationOnce(() => {
      throw new Error(`blocked`)
    })
    expect(() => buzz(10)).not.toThrow()
  })
})
