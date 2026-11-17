import { beforeAll, describe, expect, it, vi } from "vitest"
import { GameState } from "../../../../shared/game-state"
import { coordsToEdgeId } from "../../../../shared/edge-math"
import { renderEdges } from "../../../../src/components/game/EdgeRenderer"

class Path2DMock {
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
}

interface Stroke {
  color: string
  lineWidth: number
  dash: ReadonlyArray<number>
}

function mockContext() {
  const strokes: Array<Stroke> = []
  let dash: ReadonlyArray<number> = []
  const ctx = {
    strokeStyle: ``,
    lineWidth: 1,
    lineCap: `butt`,
    setLineDash: vi.fn((segments: ReadonlyArray<number>) => {
      dash = segments
    }),
    stroke: vi.fn(() => {
      strokes.push({ color: ctx.strokeStyle, lineWidth: ctx.lineWidth, dash })
    }),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, strokes }
}

// zoom 2 with DOT_SPACING 10 gives 20px cells.
const view = { centerX: 500, centerY: 500, zoom: 2 }
const edgeId = coordsToEdgeId(500, 500, true)
const selected = { edgeId, color: `rgba(0, 99, 155, 0.6)` }

describe(`renderEdges touch selection`, () => {
  let gameState: GameState

  beforeAll(() => {
    vi.stubGlobal(`Path2D`, Path2DMock)
    gameState = new GameState()
  })

  it(`draws the selected edge dashed and thicker in the translucent team colour`, () => {
    const { ctx, strokes } = mockContext()
    renderEdges(ctx, gameState, view, 200, 200, null, null, false, true, undefined, null, selected)

    expect(strokes).toHaveLength(1)
    expect(strokes[0].color).toBe(selected.color)
    expect(strokes[0].lineWidth).toBeCloseTo(2 * 1.8)
    expect(strokes[0].dash).toEqual([20 * 0.16, 20 * 0.12])
  })

  it(`gives the in-flight pending edge priority over the selection`, () => {
    const { ctx, strokes } = mockContext()
    renderEdges(
      ctx,
      gameState,
      view,
      200,
      200,
      edgeId,
      null,
      false,
      true,
      undefined,
      null,
      selected,
    )

    expect(strokes).toHaveLength(1)
    expect(strokes[0].color).not.toBe(selected.color)
    expect(strokes[0].dash).toEqual([4, 4])
  })

  it(`draws nothing for an empty board without a selection`, () => {
    const { ctx, strokes } = mockContext()
    renderEdges(ctx, gameState, view, 200, 200, null, null, false, true, undefined, null, null)

    expect(strokes).toHaveLength(0)
  })
})
