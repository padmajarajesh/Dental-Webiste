/**
 * Prepares the uploaded artwork for the Tooth Journey section.
 *
 *   node scripts/prepare-journey.mjs
 *
 *   assets/uploads/tooth-cavity.png   (white background) → public/images/journey/tooth-cavity.webp
 *   assets/uploads/tooth-healthy.png  (black background) → public/images/journey/tooth-healthy.webp
 *   assets/uploads/scan-room.png      (white background) → public/images/journey/scan-room.webp
 *
 * Only the background is made transparent (flood-fill from the border); the
 * artwork's colours are not changed. The two teeth are placed in the SAME
 * canvas at the same body height and centre, so the scanner can blend one
 * into the other without any shift in size, angle or position.
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const UP = join(process.cwd(), 'assets', 'uploads')
const OUT = join(process.cwd(), 'public', 'images', 'journey')
mkdirSync(OUT, { recursive: true })

const TOOTH_CANVAS = { width: 960, height: 900 } // keep in sync with TOOTH_ASPECT in ToothJourney.jsx
const TOOTH_BODY_H = 760 // crown top → root tip, identical for both teeth
const TOOTH_BOTTOM = 870

/** Flood-fills background-coloured pixels connected to the border; returns a soft alpha per pixel. */
function cutout(data, w, h, isBg, softAlpha) {
  const n = w * h
  const seen = new Uint8Array(n)
  const stack = new Int32Array(n)
  let sp = 0
  const push = (p) => {
    if (!seen[p] && isBg(data, p)) { seen[p] = 1; stack[sp++] = p }
  }
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
  while (sp) {
    const p = stack[--sp], x = p % w
    if (x > 0) push(p - 1)
    if (x < w - 1) push(p + 1)
    if (p >= w) push(p - w)
    if (p < n - w) push(p + w)
  }
  for (let i = 0; i < n; i++) if (seen[i]) data[i * 4 + 3] = softAlpha(data, i)
}

const mx = (d, i) => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])
const mn = (d, i) => Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])

// white background (and the soft grey floor shadow under the tooth)
const whiteBg = (T) => (d, i) => mn(d, i) >= T && mx(d, i) - mn(d, i) <= 14
const whiteAlpha = (T) => (d, i) => (mn(d, i) >= 246 ? 0 : Math.round((255 * (246 - mn(d, i))) / (246 - T + 1) * 0.5))
// black background with a soft ramp so the blue glow edge stays smooth
const blackBg = (d, i) => mx(d, i) <= 42
const blackAlpha = (d, i) => (mx(d, i) <= 14 ? 0 : Math.round((255 * (mx(d, i) - 14)) / 28))

async function load(file) {
  return sharp(join(UP, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
}

/** Body box: ignores thin decorations (the sparkle) by using rows at least 30% as wide as the widest row. */
function bodyBox(data, w, h) {
  const rows = []
  let widest = 0
  for (let y = 0; y < h; y++) {
    let l = -1, r = -1
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 128) { if (l < 0) l = x; r = x }
    rows.push([l, r])
    if (l >= 0) widest = Math.max(widest, r - l)
  }
  let top = 0, bottom = h - 1
  while (top < h && !(rows[top][0] >= 0 && rows[top][1] - rows[top][0] > widest * 0.3)) top++
  while (bottom > 0 && rows[bottom][0] < 0) bottom--
  // horizontal centre from the crown (20% down the body), where both teeth are just the tooth
  const cy = Math.round(top + (bottom - top) * 0.2)
  const cx = (rows[cy][0] + rows[cy][1]) / 2
  return { top, bottom, cx }
}

async function tooth(file, isBg, alpha, outName) {
  const { data, info } = await load(file)
  cutout(data, info.width, info.height, isBg, alpha)
  const { top, bottom, cx } = bodyBox(data, info.width, info.height)
  const s = TOOTH_BODY_H / (bottom - top + 1)
  const rw = Math.round(info.width * s)
  const rh = Math.round(info.height * s)
  const img = await sharp(data, { raw: info }).resize(rw, rh, { kernel: 'lanczos3' }).png().toBuffer()
  // place so the body centre is at canvas centre and the root tip sits on TOOTH_BOTTOM
  const left = Math.round(TOOTH_CANVAS.width / 2 - cx * s)
  const topPx = Math.round(TOOTH_BOTTOM - bottom * s)
  // composite onto a bigger canvas first so negative offsets (arms) are clipped, not rejected
  const padX = Math.max(0, -left, left + rw - TOOTH_CANVAS.width)
  const padY = Math.max(0, -topPx, topPx + rh - TOOTH_CANVAS.height)
  const big = await sharp({
    create: { width: TOOTH_CANVAS.width + padX * 2, height: TOOTH_CANVAS.height + padY * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: img, left: left + padX, top: topPx + padY }])
    .png()
    .toBuffer()
  await sharp(big)
    .extract({ left: padX, top: padY, ...TOOTH_CANVAS })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(join(OUT, outName))
  console.log(`${outName}: body ${bottom - top + 1}px → ${TOOTH_BODY_H}px, centre x ${cx}`)
}

await tooth('tooth-cavity.png', whiteBg(228), whiteAlpha(228), 'tooth-cavity.webp')
await tooth('tooth-healthy.png', blackBg, blackAlpha, 'tooth-healthy.webp')

// Scan room: white background removed, cropped to just below the floor line (no resize of the art).
{
  const { data, info } = await load('scan-room.png')
  cutout(data, info.width, info.height, whiteBg(236), () => 0)
  const H = 1200
  await sharp(data, { raw: info })
    .extract({ left: 0, top: 0, width: info.width, height: H })
    .resize({ width: 900, kernel: 'lanczos3' })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(join(OUT, 'scan-room.webp'))
  console.log(`scan-room.webp: ${info.width}x${H} → 900 wide`)
}
