import { describe, expect, it } from "vitest"
import {
  isConfirmTap,
  resolveTap,
  selectionAfterBoardUpdate,
  selectionAfterCommit,
} from "../../../src/lib/tap-selection"

const takenSet = (...ids: Array<number>) => {
  const taken = new Set(ids)
  return (edgeId: number) => taken.has(edgeId)
}

describe(`resolveTap`, () => {
  it(`selects a free edge on the first tap`, () => {
    expect(resolveTap(null, 7, takenSet())).toEqual({ type: `select`, edgeId: 7 })
  })

  it(`commits on a second tap on the selected edge`, () => {
    expect(resolveTap(7, 7, takenSet())).toEqual({ type: `commit`, edgeId: 7 })
  })

  it(`moves the selection to another free edge`, () => {
    expect(resolveTap(7, 8, takenSet())).toEqual({ type: `select`, edgeId: 8 })
  })

  it(`clears the selection on empty space`, () => {
    expect(resolveTap(7, null, takenSet())).toEqual({ type: `clear` })
  })

  it(`clears the selection on a taken edge`, () => {
    expect(resolveTap(7, 9, takenSet(9))).toEqual({ type: `clear` })
  })

  it(`does nothing without a selection on empty space or a taken edge`, () => {
    expect(resolveTap(null, null, takenSet())).toEqual({ type: `none` })
    expect(resolveTap(null, 9, takenSet(9))).toEqual({ type: `none` })
  })

  it(`never commits a selected edge that was taken in the meantime`, () => {
    expect(resolveTap(7, 7, takenSet(7))).toEqual({ type: `clear` })
  })

  it(`selects edge 0, which is a valid edge ID`, () => {
    expect(resolveTap(null, 0, takenSet())).toEqual({ type: `select`, edgeId: 0 })
    expect(resolveTap(0, 0, takenSet())).toEqual({ type: `commit`, edgeId: 0 })
  })
})

describe(`selectionAfterCommit`, () => {
  it(`clears once the move passes the client checks`, () => {
    expect(selectionAfterCommit(7, true)).toBeNull()
  })

  it(`keeps the selection when the player is out of moves`, () => {
    expect(selectionAfterCommit(7, false)).toBe(7)
  })
})

describe(`selectionAfterBoardUpdate`, () => {
  it(`clears when another player takes the selected edge`, () => {
    expect(selectionAfterBoardUpdate(7, takenSet(7))).toBeNull()
  })

  it(`keeps the selection when other edges change`, () => {
    expect(selectionAfterBoardUpdate(7, takenSet(8))).toBe(7)
    expect(selectionAfterBoardUpdate(null, takenSet(8))).toBeNull()
  })
})

describe(`isConfirmTap`, () => {
  it(`is true only for a tap on the selected edge`, () => {
    expect(isConfirmTap(7, 7)).toBe(true)
    expect(isConfirmTap(7, 8)).toBe(false)
    expect(isConfirmTap(7, null)).toBe(false)
    expect(isConfirmTap(null, 7)).toBe(false)
    expect(isConfirmTap(0, 0)).toBe(true)
  })
})
