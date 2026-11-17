#!/usr/bin/env npx tsx
// Modified by sav-maya
/**
 * Generate OpenGraph social media card image.
 *
 * Usage:
 *   npx tsx scripts/generate-og-image.ts
 *
 * Output:
 *   public/og-image.png (1200x630)
 *
 * Creates a hand-drawn style card: a sketched grid bleeding off the left edges,
 * coloured edges matching the game style and proper box completion rules,
 * beside a plain panel with the logo, tagline and team legend.
 */

import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import { TEAMS, TEAM_COLORS as SHARED_TEAM_COLORS, TEAM_LABELS } from "../shared/teams"
import type { TeamName } from "../shared/teams"
import { BOARD_COLOR, INK_COLOR, TAGLINE } from "../shared/brand"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, `..`)

// Image dimensions (OpenGraph standard)
const WIDTH = 1200
const HEIGHT = 630

const TEAM_COLORS = Object.fromEntries(
  TEAMS.map((team) => [team, SHARED_TEAM_COLORS[team].primary]),
) as Record<TeamName, string>

type TeamColor = TeamName

// Grid styling, matching the board's grid lines and dots
const DOT_COLOR = `#494B50`
const GRID_LINE_COLOR = `#D9DADD`
const BG_COLOR = BOARD_COLOR
const MUTED_COLOR = `#61646B`
const PANEL_LEFT = 640

// Large grid layout - extends beyond visible area on all sides
const GRID_COLS = 14 // Extra columns to bleed left/right
const GRID_ROWS = 12 // Extra rows to bleed top/bottom
const CELL_SIZE = 70
const DOT_SIZE = 10
const LINE_WIDTH = 4

// Position the grid - starts off-screen to bleed edges
const GRID_LEFT = -120
const GRID_TOP = -100 // Start above visible area

// Seeded random for consistent "hand-drawn" look
function seededRandom(seed: number): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return (seed / 0x7fffffff) * 2 - 1 // -1 to 1
}

function seededRandom2(seed: number): number {
  return seededRandom(seed * 127 + 31)
}

// Edge key helpers
function hEdgeKey(row: number, col: number): string {
  return `h-${row}-${col}`
}

function vEdgeKey(row: number, col: number): string {
  return `v-${row}-${col}`
}

// Generate a proper game state following the rules:
// - Edges are placed by teams
// - A box is only filled when all 4 edges exist
// - The box color is the team that placed the 4th (completing) edge
function generateGameState(): {
  edges: Map<string, TeamColor>
  filledBoxes: Map<string, TeamColor>
} {
  const edges = new Map<string, TeamColor>()
  const teams: ReadonlyArray<TeamColor> = TEAMS

  // Place edges with probability decreasing from left to right
  // This simulates a game where left side is more complete

  // Horizontal edges - higher probability for more complete boxes
  for (let row = 0; row <= GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const seed = row * 1000 + col + 100
      const rand = (seededRandom(seed) + 1) / 2

      // Probability decreases from left to right, but higher overall
      const probability = Math.max(0.08, 1.0 - (col / GRID_COLS) * 0.92)

      if (rand < probability) {
        const teamIndex = Math.floor(((seededRandom(seed * 7 + 13) + 1) / 2) * 4)
        edges.set(hEdgeKey(row, col), teams[teamIndex])
      }
    }
  }

  // Vertical edges - higher probability for more complete boxes
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS; col++) {
      const seed = row * 1000 + col + 50000
      const rand = (seededRandom(seed) + 1) / 2

      const probability = Math.max(0.08, 1.0 - (col / GRID_COLS) * 0.92)

      if (rand < probability) {
        const teamIndex = Math.floor(((seededRandom(seed * 11 + 17) + 1) / 2) * 4)
        edges.set(vEdgeKey(row, col), teams[teamIndex])
      }
    }
  }

  // Now determine which boxes are complete (have all 4 edges)
  // The box color is determined by which edge was placed "last"
  // We'll simulate this by picking the edge with the highest seed-based "timestamp"
  const filledBoxes = new Map<string, TeamColor>()

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const topEdge = edges.get(hEdgeKey(row, col))
      const bottomEdge = edges.get(hEdgeKey(row + 1, col))
      const leftEdge = edges.get(vEdgeKey(row, col))
      const rightEdge = edges.get(vEdgeKey(row, col + 1))

      // Only fill if ALL 4 edges exist
      if (topEdge && bottomEdge && leftEdge && rightEdge) {
        // Determine which edge was "last" (completing edge) using seeded random
        const boxSeed = row * 1000 + col + 200000
        const edgeOptions = [topEdge, bottomEdge, leftEdge, rightEdge]
        const lastEdgeIndex = Math.floor(((seededRandom(boxSeed) + 1) / 2) * 4)
        const completingTeam = edgeOptions[lastEdgeIndex]

        filledBoxes.set(`box-${row}-${col}`, completingTeam)
      }
    }
  }

  return { edges, filledBoxes }
}

// Create a wobbly SVG path for a line
function createWobblyLinePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
): string {
  const wobble = 2.5

  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length < 0.001) return ``

  const r1 = seededRandom(seed)
  const r2 = seededRandom2(seed)
  const r3 = seededRandom(seed + 1000)
  const r4 = seededRandom2(seed + 1000)

  // Perpendicular direction for wobble
  const px = -dy / length
  const py = dx / length

  const startX = x1 + r1 * 0.8
  const startY = y1 + r2 * 0.8
  const midX = (x1 + x2) / 2 + px * wobble * r1
  const midY = (y1 + y2) / 2 + py * wobble * r2
  const endX = x2 + r3 * 0.8
  const endY = y2 + r4 * 0.8

  return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`
}

// Build the React-like element tree for Satori
async function buildImage() {
  const children: Array<{ type: string; props: Record<string, unknown> }> = []
  const { edges, filledBoxes } = generateGameState()

  // Create watercolor-style filled boxes (only for complete boxes)
  let boxSeed = 42
  for (const [boxKey, team] of filledBoxes) {
    const match = boxKey.match(/box-(\d+)-(\d+)/)
    if (!match) continue

    const row = parseInt(match[1])
    const col = parseInt(match[2])

    const x = GRID_LEFT + col * CELL_SIZE + DOT_SIZE / 2
    const y = GRID_TOP + row * CELL_SIZE + DOT_SIZE / 2
    const size = CELL_SIZE - DOT_SIZE

    // Skip boxes that are completely off-screen
    if (x + size < -50 || x > WIDTH + 50) continue
    if (y + size < -50 || y > HEIGHT + 50) continue

    // Create 3 layered fills for watercolor effect
    for (let layer = 0; layer < 3; layer++) {
      const r1 = seededRandom(boxSeed + layer * 100)
      const r2 = seededRandom2(boxSeed + layer * 100)
      const inset = 3 + Math.abs(r1) * 2

      children.push({
        type: `div`,
        props: {
          style: {
            position: `absolute`,
            left: x + inset + r1 * 1.5,
            top: y + inset + r2 * 1.5,
            width: size - inset * 2,
            height: size - inset * 2,
            backgroundColor: TEAM_COLORS[team],
            opacity: 0.22 + Math.abs(r1) * 0.1,
            borderRadius: 2 + Math.abs(r2) * 2,
          } as React.CSSProperties,
        },
      })
    }
    boxSeed += 50
  }

  // Build SVG paths for all edges grouped by color
  const edgePathsByColor: Map<string, Array<string>> = new Map()
  const gridPaths: Array<string> = []

  // Horizontal edges
  for (let row = 0; row <= GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x1 = GRID_LEFT + col * CELL_SIZE + DOT_SIZE / 2
      const y1 = GRID_TOP + row * CELL_SIZE + DOT_SIZE / 2
      const x2 = x1 + CELL_SIZE - DOT_SIZE
      const y2 = y1

      // Skip if completely off-screen
      if (x2 < -50 || x1 > WIDTH + 50) continue
      if (y1 < -50 || y1 > HEIGHT + 50) continue

      const edgeKey = hEdgeKey(row, col)
      const edgeSeed = row * 1000 + col
      const path = createWobblyLinePath(x1, y1, x2, y2, edgeSeed)

      const edgeColor = edges.get(edgeKey)
      if (edgeColor) {
        const color = TEAM_COLORS[edgeColor]
        if (!edgePathsByColor.has(color)) {
          edgePathsByColor.set(color, [])
        }
        edgePathsByColor.get(color)!.push(path)
      } else {
        gridPaths.push(path)
      }
    }
  }

  // Vertical edges
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS; col++) {
      const x1 = GRID_LEFT + col * CELL_SIZE + DOT_SIZE / 2
      const y1 = GRID_TOP + row * CELL_SIZE + DOT_SIZE / 2
      const x2 = x1
      const y2 = y1 + CELL_SIZE - DOT_SIZE

      // Skip if completely off-screen
      if (x1 < -50 || x1 > WIDTH + 50) continue
      if (y2 < -50 || y1 > HEIGHT + 50) continue

      const edgeKey = vEdgeKey(row, col)
      const edgeSeed = row * 1000 + col + 50000
      const path = createWobblyLinePath(x1, y1, x2, y2, edgeSeed)

      const edgeColor = edges.get(edgeKey)
      if (edgeColor) {
        const color = TEAM_COLORS[edgeColor]
        if (!edgePathsByColor.has(color)) {
          edgePathsByColor.set(color, [])
        }
        edgePathsByColor.get(color)!.push(path)
      } else {
        gridPaths.push(path)
      }
    }
  }

  // Create SVG for grid lines (light gray, behind colored edges)
  const gridSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      ${gridPaths.map((d) => `<path d="${d}" stroke="${GRID_LINE_COLOR}" stroke-width="${LINE_WIDTH * 0.8}" stroke-linecap="round" fill="none"/>`).join(``)}
    </svg>
  `

  children.push({
    type: `img`,
    props: {
      src: `data:image/svg+xml,${encodeURIComponent(gridSvg)}`,
      style: {
        position: `absolute`,
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
      } as React.CSSProperties,
    },
  })

  // Create SVG for colored edges (on top of grid)
  const coloredEdgesSvgParts: Array<string> = []
  for (const [color, paths] of edgePathsByColor) {
    coloredEdgesSvgParts.push(
      ...paths.map(
        (d) =>
          `<path d="${d}" stroke="${color}" stroke-width="${LINE_WIDTH * 1.1}" stroke-linecap="round" fill="none"/>`,
      ),
    )
  }

  const coloredEdgesSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      ${coloredEdgesSvgParts.join(``)}
    </svg>
  `

  children.push({
    type: `img`,
    props: {
      src: `data:image/svg+xml,${encodeURIComponent(coloredEdgesSvg)}`,
      style: {
        position: `absolute`,
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
      } as React.CSSProperties,
    },
  })

  // Add wobbly dots
  let dotSeed = 5000
  for (let row = 0; row <= GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS; col++) {
      const x = GRID_LEFT + col * CELL_SIZE + DOT_SIZE / 2
      const y = GRID_TOP + row * CELL_SIZE + DOT_SIZE / 2

      // Skip if off-screen (with margin)
      if (x < -DOT_SIZE * 2 || x > WIDTH + DOT_SIZE * 2) continue
      if (y < -DOT_SIZE * 2 || y > HEIGHT + DOT_SIZE * 2) continue

      const r1 = seededRandom(dotSeed)
      const r2 = seededRandom2(dotSeed)
      const sizeVar = 1 + r1 * 0.12

      children.push({
        type: `div`,
        props: {
          style: {
            position: `absolute`,
            left: x - (DOT_SIZE / 2) * sizeVar + r1 * 0.5,
            top: y - (DOT_SIZE / 2) * sizeVar + r2 * 0.5,
            width: DOT_SIZE * sizeVar,
            height: DOT_SIZE * sizeVar,
            backgroundColor: DOT_COLOR,
            borderRadius: `50%`,
          } as React.CSSProperties,
        },
      })
      dotSeed += 7
    }
  }

  // Load and embed the logo
  const logoPath = join(ROOT, `public`, `logo.svg`)
  const logoSvg = await readFile(logoPath, `utf-8`)
  const logoDataUri = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`
  const [, logoWidth, logoHeight] = logoSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.map(Number)
  const logoDisplayWidth = 470

  // Main container
  return {
    type: `div`,
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: BG_COLOR,
        display: `flex`,
        position: `relative`,
        overflow: `hidden`,
        fontFamily: `Recursive`,
      } as React.CSSProperties,
      children: [
        // Grid elements
        ...children,

        // A plain panel holds the brand; the sketched board stays on the left.
        {
          type: `div`,
          props: {
            style: {
              position: `absolute`,
              left: PANEL_LEFT,
              top: 0,
              width: WIDTH - PANEL_LEFT,
              height: HEIGHT,
              backgroundColor: `#FFFFFF`,
              borderLeft: `2px solid ${GRID_LINE_COLOR}`,
              display: `flex`,
              flexDirection: `column`,
              justifyContent: `center`,
              padding: `0 56px`,
            } as React.CSSProperties,
            children: [
              {
                type: `img`,
                props: {
                  src: logoDataUri,
                  style: {
                    width: logoDisplayWidth,
                    height: (logoDisplayWidth * logoHeight) / logoWidth,
                  } as React.CSSProperties,
                },
              },
              {
                type: `div`,
                props: {
                  style: {
                    marginTop: 28,
                    fontSize: 30,
                    fontWeight: 400,
                    color: INK_COLOR,
                    lineHeight: 1.35,
                  } as React.CSSProperties,
                  children: TAGLINE.replace(`Dots & Boxes`, `Dots\u00a0&\u00a0Boxes`),
                },
              },
              {
                type: `div`,
                props: {
                  style: { display: `flex`, gap: 18, marginTop: 34 } as React.CSSProperties,
                  children: TEAMS.map((team) => ({
                    type: `div`,
                    props: {
                      style: {
                        display: `flex`,
                        alignItems: `center`,
                        gap: 8,
                        fontSize: 22,
                        fontWeight: 800,
                        color: INK_COLOR,
                      } as React.CSSProperties,
                      children: [
                        {
                          type: `div`,
                          props: {
                            style: {
                              width: 20,
                              height: 20,
                              borderRadius: 5,
                              backgroundColor: TEAM_COLORS[team],
                            } as React.CSSProperties,
                          },
                        },
                        TEAM_LABELS[team],
                      ],
                    },
                  })),
                },
              },
              {
                type: `div`,
                props: {
                  style: {
                    marginTop: 40,
                    fontSize: 22,
                    fontWeight: 400,
                    color: MUTED_COLOR,
                  } as React.CSSProperties,
                  children: `Draw the fourth line to claim the box.`,
                },
              },
            ],
          },
        },
      ],
    },
  }
}

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

interface FontConfig {
  name: string
  data: ArrayBuffer
  weight: FontWeight
  style: `normal` | `italic`
}

async function loadFonts(): Promise<Array<FontConfig>> {
  // Static instances of the web font (Recursive, Casual axis pinned). Satori
  // cannot read WOFF2, so the TTFs live in artwork/ and are not deployed.
  const fontsDir = join(ROOT, `artwork`, `fonts`)
  const fontFiles: Array<{ file: string; weight: FontWeight }> = [
    { file: `Recursive-Casual-Regular.ttf`, weight: 400 },
    { file: `Recursive-Casual-ExtraBold.ttf`, weight: 800 },
  ]

  return Promise.all(
    fontFiles.map(async ({ file, weight }) => {
      const fontData = await readFile(join(fontsDir, file))
      return {
        name: `Recursive`,
        data: fontData.buffer.slice(
          fontData.byteOffset,
          fontData.byteOffset + fontData.byteLength,
        ) as ArrayBuffer,
        weight,
        style: `normal` as const,
      }
    }),
  )
}

async function main() {
  console.log(`\n🎨 OG Image Generator`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Output: public/og-image.png (${WIDTH}x${HEIGHT})`)
  console.log(``)

  const element = await buildImage()

  const fonts = await loadFonts()
  console.log(`📝 Loaded ${fonts.length} font(s)`)

  console.log(`📐 Generating SVG...`)
  const svg = await satori(element as React.ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  })

  console.log(`🖼️  Converting to PNG...`)
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: `width`,
      value: WIDTH,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  const outputPath = join(ROOT, `public`, `og-image.png`)
  await writeFile(outputPath, pngBuffer)

  console.log(`✅ Done!`)
  console.log(`   Saved to: ${outputPath}`)
  console.log(``)

  const svgPath = join(ROOT, `public`, `og-image.svg`)
  await writeFile(svgPath, svg)
  console.log(`   SVG debug: ${svgPath}`)
  console.log(``)
}

main().catch((err) => {
  console.error(`Error:`, err)
  process.exit(1)
})
