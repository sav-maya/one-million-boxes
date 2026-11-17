import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { SettingsButton } from "../../../../src/components/ui/SettingsButton"

describe(`SettingsButton`, () => {
  it(`offers both switches, on by default, and persists changes`, async () => {
    Object.defineProperty(navigator, `maxTouchPoints`, { value: 5, configurable: true })
    render(<SettingsButton />)

    fireEvent.click(screen.getByRole(`button`, { name: `Settings` }))

    const tap = await screen.findByRole(`switch`, { name: `Tap twice to draw` })
    const buzz = screen.getByRole(`switch`, { name: `Vibration` })
    expect(tap).toHaveAttribute(`aria-checked`, `true`)
    expect(buzz).toHaveAttribute(`aria-checked`, `true`)
    expect(tap).toHaveAccessibleDescription(/tap it again to draw/)

    fireEvent.click(tap)
    expect(localStorage.setItem).toHaveBeenCalledWith(`boxes:tap-to-confirm`, `false`)
    expect(tap).toHaveAttribute(`aria-checked`, `false`)

    fireEvent.click(buzz)
    expect(localStorage.setItem).toHaveBeenCalledWith(`boxes:vibration`, `false`)
  })
})
