/**
 * Builds every Dr. Tooth pose used by the travelling mascot.
 *
 *   node scripts/prepare-poses.mjs
 *
 * Sources (assets/uploads):
 *   - the uploaded scene PNGs. They have NO real transparency: either an
 *     opaque black background or a checkerboard baked into the pixels.
 *   - legacy-poses/*.webp: the earlier, already transparent poses.
 *
 * For each pose:
 *   1. Background removal (alpha only, RGB is never modified).
 *   2. Trim to the visible artwork.
 *   3. CONTAIN it (uniform scale, no crop, no stretch) in ONE shared
 *      transparent canvas, centred horizontally and standing on the same
 *      baseline, so the mascot can cross-fade between poses without jumping.
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export const CANVAS = { width: 1000, height: 900 } // keep in sync with MASCOT_ASPECT in toothConfig.js
const PAD = { top: 16, side: 16, bottom: 12 }

const UP = join(process.cwd(), 'assets', 'uploads')
const POSES = {
  // key: [source file, background type]
  welcome: ['dentist-tooth-welcome.png', 'black'],
  care: ['dentist-hugging-tooth.png', 'black'],
  examination: ['tooth-dentist-examination.png', 'black'],
  treatments: ['dentist-tooth-treatments.png', 'black'],
  aligners: ['dr-tooth-aligners.png', 'checker'],
  implants: ['dr-tooth-implants.png', 'black'],
  whitening: ['dr-tooth-whitening.png', 'checker'],
  // earlier poses, already transparent
  toothbrush: ['legacy-poses/dr-tooth-welcome.webp', 'none'],
  tools: ['legacy-poses/dr-tooth-tools.webp', 'none'],
  checkup: ['legacy-poses/dr-tooth-checkup.webp', 'none'],
  location: ['legacy-poses/dr-tooth-location.webp', 'none'],
}

const BLACK_T = 42 // max channel at/below which a pixel can be black background
const BLACK_SOFT = 14 // below this fully transparent; alpha ramps up to BLACK_T
const CHECK_SAT = 18 // max(r,g,b)-min(r,g,b) at/below which a pixel counts as grey

const maxc = (d, i) => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])

/** Separable binary dilation with a square window of radius r. */
function dilate(src, w, h, r) {
  const tmp = new Uint8Array(src.length)
  const out = new Uint8Array(src.length)
  for (let y = 0; y < h; y++) {
    let last = -1e9
    for (let x = 0; x < w; x++) {
      if (src[y * w + x]) last = x
      if (x - last <= r) tmp[y * w + x] = 1
    }
    last = 1e9
    for (let x = w - 1; x >= 0; x--) {
      if (src[y * w + x]) last = x
      if (last - x <= r) tmp[y * w + x] = 1
    }
  }
  for (let x = 0; x < w; x++) {
    let last = -1e9
    for (let y = 0; y < h; y++) {
      if (tmp[y * w + x]) last = y
      if (y - last <= r) out[y * w + x] = 1
    }
    last = 1e9
    for (let y = h - 1; y >= 0; y--) {
      if (tmp[y * w + x]) last = y
      if (last - y <= r) out[y * w + x] = 1
    }
  }
  return out
}

/** Connected components of `cand` (4-neighbour). Calls fn(members, touchesBorder). */
function components(cand, w, h, fn) {
  const n = w * h
  const seen = new Uint8Array(n)
  const stack = new Int32Array(n)
  for (let s = 0; s < n; s++) {
    if (!cand[s] || seen[s]) continue
    const members = []
    let sp = 0, border = false
    stack[sp++] = s
    seen[s] = 1
    while (sp) {
      const p = stack[--sp]
      const x = p % w, y = (p / w) | 0
      members.push(p)
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true
      if (x > 0 && cand[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1 }
      if (x < w - 1 && cand[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1 }
      if (y > 0 && cand[p - w] && !seen[p - w]) { seen[p - w] = 1; stack[sp++] = p - w }
      if (y < h - 1 && cand[p + w] && !seen[p + w]) { seen[p + w] = 1; stack[sp++] = p + w }
    }
    fn(members, border)
  }
}

/** Black background: near-black connected to the border, plus large enclosed pure-black pockets. */
function removeBlack(data, w, h) {
  const n = w * h
  const cand = new Uint8Array(n)
  for (let i = 0; i < n; i++) cand[i] = maxc(data, i) <= BLACK_T
  const bg = new Uint8Array(n)
  components(cand, w, h, (m, border) => {
    let veryDark = 0
    for (const p of m) if (maxc(data, p) <= BLACK_SOFT) veryDark++
    if (border || (m.length > 6000 && veryDark / m.length > 0.85)) for (const p of m) bg[p] = 1
  })
  for (let i = 0; i < n; i++) {
    if (!bg[i]) continue
    const mx = maxc(data, i)
    data[i * 4 + 3] = mx <= BLACK_SOFT ? 0 : Math.round((255 * (mx - BLACK_SOFT)) / (BLACK_T - BLACK_SOFT))
  }
}

/**
 * Baked-in checkerboard. The tooth is as white/grey as the light tiles, so
 * colour alone can't separate them: the checker is recognised by its TEXTURE,
 * grey pixels whose neighbourhood holds both dark (~140) and light (~210+)
 * tiles. The subject's smooth surfaces never do.
 */
function removeChecker(data, w, h) {
  const n = w * h
  const R = 6
  const grey = new Uint8Array(n), dark = new Uint8Array(n), light = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    if (mx - mn > CHECK_SAT || mx < 112) continue
    grey[i] = 1
    if (mx <= 168) dark[i] = 1
    if (mx >= 190) light[i] = 1
  }
  const nearDark = dilate(dark, w, h, R)
  const nearLight = dilate(light, w, h, R)
  const cand = new Uint8Array(n)
  for (let i = 0; i < n; i++) cand[i] = grey[i] && nearDark[i] && nearLight[i]
  const bg = new Uint8Array(n)
  // border-connected checker, plus enclosed checker pockets (between an arm and the head)
  components(cand, w, h, (m, border) => {
    if (border || m.length > 1500) for (const p of m) bg[p] = 1
  })
  // drop the stray specks the AI checker left behind: small islands surrounded by background
  const notBg = new Uint8Array(n)
  for (let i = 0; i < n; i++) notBg[i] = bg[i] ? 0 : 1
  components(notBg, w, h, (m) => {
    if (m.length < 600) for (const p of m) bg[p] = 1
  })
  // The texture window reaches up to R px into the subject: give that band
  // back, except pixels that are dark checker tiles.
  const fg = new Uint8Array(n)
  for (let i = 0; i < n; i++) fg[i] = bg[i] ? 0 : 1
  const band = dilate(fg, w, h, 3)
  const edge = dilate(fg, w, h, 1)
  for (let i = 0; i < n; i++) {
    if (!bg[i]) continue
    if (band[i] && !dark[i]) data[i * 4 + 3] = edge[i] ? 210 : 120
    else data[i * 4 + 3] = 0
  }
}

const outDir = join(process.cwd(), 'public', 'images', 'mascot')
mkdirSync(outDir, { recursive: true })

for (const [key, [file, mode]] of Object.entries(POSES)) {
  const { data, info } = await sharp(join(UP, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  if (mode === 'black') removeBlack(data, w, h)
  else if (mode === 'checker') removeChecker(data, w, h)

  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4 + 3
      if (data[i] < 8) data[i] = 0
      else {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const scale = Math.min((CANVAS.width - PAD.side * 2) / cw, (CANVAS.height - PAD.top - PAD.bottom) / ch)
  const rw = Math.round(cw * scale)
  const rh = Math.round(ch * scale)

  const art = await sharp(data, { raw: info })
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .resize(rw, rh, { fit: 'fill', kernel: 'lanczos3' }) // uniform: rw/rh keep the trimmed aspect
    .png()
    .toBuffer()

  await sharp({ create: { ...CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, left: Math.round((CANVAS.width - rw) / 2), top: CANVAS.height - PAD.bottom - rh }])
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(join(outDir, `pose-${key}.webp`))

  console.log(`${key.padEnd(12)} ${mode.padEnd(8)} ${w}x${h} → ${cw}x${ch} → ${rw}x${rh}`)
}
