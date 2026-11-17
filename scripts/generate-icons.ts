#!/usr/bin/env npx tsx
/**
 * Generate home screen and favicon PNGs from artwork/logo-mark.svg.
 *
 * Usage:
 *   pnpm icons
 *
 * Output (public/):
 *   apple-touch-icon.png   180px, opaque (iOS fills transparency with black)
 *   icon-192.png           192px, purpose "any"
 *   icon-512.png           512px, purpose "any"
 *   icon-maskable-512.png  512px, full-bleed background, logo inside the
 *                          central 80% circle that launchers never crop
 *   favicon.png            128px, transparent
 */

import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { HEADER_COLOR } from "../shared/brand"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), `..`)
const MARK_VIEWBOX = 48
// The mark's drawn extent within its 48-unit viewBox (dots reach 3.6 to 44.4).
const MARK_EXTENT = 40.8

interface Icon {
  file: string
  size: number
  /** Mark width as a fraction of the icon. */
  scale: number
  background: string | null
  /** Corner radius as a fraction of the icon, for non-maskable icons. */
  radius?: number
}

// Maskable: the mark's diagonal must fit the 80% safe circle.
// extent * scale * sqrt(2) <= 0.8 * 48  ->  scale <= 0.665
const MASKABLE_SCALE = 0.64

const ICONS: Array<Icon> = [
  { file: `apple-touch-icon.png`, size: 180, scale: 0.72, background: HEADER_COLOR },
  { file: `icon-192.png`, size: 192, scale: 0.7, background: HEADER_COLOR, radius: 0.22 },
  { file: `icon-512.png`, size: 512, scale: 0.7, background: HEADER_COLOR, radius: 0.22 },
  { file: `icon-maskable-512.png`, size: 512, scale: MASKABLE_SCALE, background: HEADER_COLOR },
  { file: `favicon.png`, size: 128, scale: 1, background: null },
]

function iconSvg(markInner: string, icon: Icon): string {
  const { size, scale, background, radius = 0 } = icon
  const markSize = size * scale
  const offset = (size - markSize) / 2
  const fill = background
    ? `<rect width="${size}" height="${size}" rx="${size * radius}" fill="${background}"/>`
    : ``
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${fill}
  <svg x="${offset}" y="${offset}" width="${markSize}" height="${markSize}" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}">${markInner}</svg>
</svg>`
}

async function main() {
  const mark = await readFile(join(ROOT, `artwork`, `logo-mark.svg`), `utf-8`)
  const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, ``).replace(/<\/svg>\s*$/, ``)

  const safeDiagonal = (MARK_EXTENT / MARK_VIEWBOX) * MASKABLE_SCALE * Math.SQRT2
  if (safeDiagonal > 0.8) throw new Error(`Maskable logo exceeds the 80% safe circle`)

  for (const icon of ICONS) {
    const png = new Resvg(iconSvg(inner, icon), {
      fitTo: { mode: `width`, value: icon.size },
    })
      .render()
      .asPng()
    await writeFile(join(ROOT, `public`, icon.file), png)
    console.log(`✅ public/${icon.file} (${icon.size}px)`)
  }
  console.log(
    `   Maskable logo diagonal: ${(safeDiagonal * 100).toFixed(1)}% of the icon (limit 80%)`,
  )
}

main().catch((err) => {
  console.error(`Error:`, err)
  process.exit(1)
})
