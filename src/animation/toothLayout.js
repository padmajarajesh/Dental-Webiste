import { gsap, ScrollTrigger } from './gsap'
import { TOOTH_STOPS, MASCOT_ASPECT, MASCOT_KEYS } from './toothConfig'
import { isMobileViewport } from './toothStore'

/**
 * Layout-driven path for Dr. Molar.
 *
 * Every frame, his position is computed from the LIVE position of the stage
 * boxes in the page (they scroll with the content), so he is glued to the
 * layout: inside stage A while A is on screen, then through the measured gap
 * between the two content blocks, then into stage B. He never drifts over text.
 *
 * Pose: each stop names one of the five mascot images. Between two stops the
 * image cross-fades at the point of the flight where he is smallest (the gap
 * between content blocks), so he never changes on arrival or over text.
 *
 * Mobile (≤ 820px): single column, every section shows its own stage ABOVE its
 * text (CSS). He stays glued to the stage of the current section and scrolls
 * with it, exactly like the content, and slides away under the header with it
 * (the canvas is clipped below the header). He then hands over to the next
 * section's stage: invisibly if neither stage is on screen, otherwise he grows
 * in from the next stage itself. He never travels across text or over the nav.
 * Positions come from the mobile layout's own measurements, never the
 * desktop ones, and are re-measured on resize / orientation change.
 */
export const layout = { ready: false, mobile: false, stops: [], headerBottom: 64, vh: 800 }

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // power3.inOut
const sine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.min(1, Math.max(0, t))
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

const docTop = (el) => el.getBoundingClientRect().top + window.scrollY

/** Natural (un-stuck) geometry of a sticky element. */
function stickyGeometry(el) {
  const prev = el.style.position
  el.style.position = 'static' // static ignores 'top', giving the true un-stuck position
  const natTop = docTop(el)
  el.style.position = prev
  const cs = getComputedStyle(el)
  const parent = el.parentElement
  const contBottom = docTop(parent) + parent.offsetHeight - parseFloat(getComputedStyle(parent).paddingBottom || 0)
  return { natTop, stickyTop: parseFloat(cs.top) || 0, contBottom, elH: el.offsetHeight }
}

function slotGeometry(slot) {
  const r = slot.getBoundingClientRect()
  if (r.width < 4 || r.height < 4) return null
  const x = r.left + r.width / 2
  const size = Math.min(r.height, r.width / MASCOT_ASPECT)
  const sticky = slot.closest('[data-sticky]')
  if (sticky) {
    const sr = sticky.getBoundingClientRect()
    return { kind: 'sticky', x, size, offCY: r.top - sr.top + r.height / 2, ...stickyGeometry(sticky) }
  }
  return { kind: 'static', x, size, docCY: r.top + window.scrollY + r.height / 2 }
}

export function liveY(g, y) {
  if (g.kind === 'static') return g.docCY - y
  const top = Math.min(Math.max(g.natTop - y, g.stickyTop), g.contBottom - y - g.elH)
  return top + g.offCY
}

export function measureLayout() {
  const vh = window.innerHeight
  const vw = window.innerWidth
  const maxScroll = Math.max(1, ScrollTrigger.maxScroll(window))
  const mobile = isMobileViewport()
  const header = document.querySelector('.site-header')
  layout.headerBottom = header ? header.getBoundingClientRect().bottom : 64

  const stops = [...document.querySelectorAll('[data-tooth-stop]')]
    .map((el) => {
      const id = el.dataset.toothStop
      const def = TOOTH_STOPS[id]
      if (!def) return null
      const cfg = { ...def.base, ...(mobile ? def.mobile : null) }
      const slot = document.querySelector(`[data-tooth-slot="${id}"]`)
      const geo = slot ? slotGeometry(slot) : null
      if (geo) geo.size *= cfg.fill

      // WHEN: the stage is centred (static), the stage first sticks (sticky
      // stage owned by this section), or the marker is centred (markers).
      let arrival
      if (geo && geo.kind === 'static' && el.contains(slot)) arrival = geo.docCY - vh / 2
      else if (geo && geo.kind === 'sticky' && el.contains(slot)) arrival = geo.natTop - geo.stickyTop
      else {
        const r = el.getBoundingClientRect()
        arrival = r.top + window.scrollY + r.height / 2 - vh / 2
      }
      arrival = gsap.utils.clamp(0, maxScroll, arrival)

      // Content block bounds (for routing crossings through the gap between blocks)
      const block = (slot && slot.closest('.split:not(.smile-split)')) || null
      const blockTop = block ? docTop(block) : null
      const blockBottom = block ? blockTop + block.offsetHeight : null

      const pose = Math.max(0, MASCOT_KEYS.indexOf(def.pose))
      return { id, arrival, t: arrival / maxScroll, geo, block, blockTop, blockBottom, cfg, pose }
    })
    .filter(Boolean)
    // mobile: only sections whose stage is actually laid out take part
    .filter((s) => !mobile || s.geo)
    .sort((a, b) => a.arrival - b.arrival)

  if (stops.length) {
    stops[0].arrival = 0
    stops[0].t = 0
  }
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].arrival <= stops[i - 1].arrival) {
      stops[i].arrival = Math.min(maxScroll, stops[i - 1].arrival + 1)
      stops[i].t = stops[i].arrival / maxScroll
    }
  }

  // Hand-off plan for each segment (desktop/tablet).
  // start: stage A is about to slide under the header → he leaves A
  // end:   stage B is fully on screen → he has landed in B
  // Crossings (A and B in different columns) route through the measured
  // gap between the two content blocks, shrinking on the way.
  const hb = header ? header.getBoundingClientRect().bottom : 64
  const firstY = (from, to, test) => {
    for (let y = from; y <= to; y += 4) if (test(y)) return y
    return to
  }
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]
    const b = stops[i]
    a.next = null
    if (!a.geo || !b.geo) continue
    const span = Math.max(1, b.arrival - a.arrival)
    if (mobile) {
      // A half under the header / A fully under the header / B starts entering at the bottom
      const yHalf = firstY(a.arrival, b.arrival, (y) => liveY(a.geo, y) <= hb)
      const yLeave = firstY(a.arrival, b.arrival, (y) => liveY(a.geo, y) + a.geo.size / 2 <= hb)
      const yEnter = firstY(a.arrival, b.arrival, (y) => liveY(b.geo, y) - b.geo.size / 2 < vh)
      let m
      if (yEnter >= yLeave) {
        // neither stage is on screen in between: switch while both are off screen
        m = { ys: (yLeave + yEnter) / 2, fadeFrom: (yLeave + yEnter) / 2, emerge: 0 }
      } else {
        // B is already on screen: A fades as it slides under the header, then he grows in at B
        m = { ys: yLeave, fadeFrom: yHalf, emerge: Math.min(140, vh * 0.18) }
      }
      a.m = m
      const pc = clamp01((m.ys - a.arrival) / span)
      a.next = { start: pc, end: Math.min(1, pc + 1e-4), crossing: false, pc, pw: 0.002 }
      continue
    }
    const yA = firstY(a.arrival, b.arrival, (y) => liveY(a.geo, y) - a.geo.size / 2 < hb + 12)
    const yB = firstY(a.arrival, b.arrival, (y) => liveY(b.geo, y) + b.geo.size / 2 <= vh - 12)
    let start = (Math.min(yA, yB) - a.arrival) / span
    let end = (Math.max(yA, yB) - a.arrival) / span
    if (end - start < 0.2) {
      const c = (start + end) / 2
      start = Math.max(0, c - 0.1)
      end = Math.min(1, c + 0.1)
    }
    const crossing = Math.abs(b.geo.x - a.geo.x) > vw * 0.25 && a.block && b.block && a.block !== b.block
    const plan = { start, end, crossing }
    if (crossing) {
      const gapMid = (a.blockBottom + b.blockTop) / 2
      const gapH = Math.max(0, b.blockTop - a.blockBottom)
      const pc = (gapMid - vh / 2 - a.arrival) / span
      const lo = start + (end - start) * 0.2
      const hi = end - (end - start) * 0.2
      plan.mid = (Math.min(hi, Math.max(lo, pc)) - start) / (end - start)
      plan.gx = (a.geo.x + b.geo.x) / 2
      plan.gapMid = gapMid
      plan.small = Math.max(70, Math.min(Math.min(a.geo.size, b.geo.size) * 0.42, gapH * 0.7))
      plan.pc = start + plan.mid * (end - start)
    } else {
      plan.pc = (start + end) / 2
    }
    a.next = plan
  }

  layout.vh = vh
  layout.headerBottom = hb
  layout.mobile = mobile
  // mobile: the mascot is never drawn over the navigation bar
  document.documentElement.style.setProperty('--tooth-clip-top', mobile ? `${Math.round(hb)}px` : '0px')
  layout.stops = stops
  layout.ready = stops.length > 0
  return stops
}


/** Which image(s) he shows at scroll position y: writes poseA / poseB / poseMix. */
function computePose(stops, i, y, out) {
  const a = stops[i]
  const b = stops[i + 1]
  out.poseA = a.pose
  if (!b || b.pose === a.pose) {
    out.poseB = a.pose
    out.poseMix = 0
    return
  }
  out.poseB = b.pose
  const p = clamp01((y - a.arrival) / Math.max(1, b.arrival - a.arrival))
  const n = a.next
  // centred on the smallest point of the flight (or mid-segment), done well before arrival
  const c = n ? n.pc : 0.5
  const w = n ? (n.pw ?? Math.min(0.12, Math.max(0.05, (n.end - n.start) * 0.22))) : 0.1
  out.poseMix = smooth(c - w, c + w, p)
}

/** Writes sx / sy / size and the pose for the given scroll position into `out`. */
export function computeTooth(y, out) {
  if (!layout.ready) return out
  const stops = layout.stops

  // find segment
  let i = 0
  while (i < stops.length - 1 && y >= stops[i + 1].arrival) i++
  computePose(stops, i, y, out)

  out.alpha = 1
  if (layout.mobile) return computeMobile(stops, i, y, out)

  const a = stops[i]
  const b = stops[i + 1]
  const A = a.geo
  if (!b || !A) {
    if (A) { out.sx = A.x; out.sy = liveY(A, y); out.size = A.size }
    return out
  }
  const B = b.geo
  const p = clamp01((y - a.arrival) / (b.arrival - a.arrival))
  const ay = liveY(A, y)
  const by = liveY(B, y)

  const n = a.next
  const q = n ? clamp01((p - n.start) / Math.max(1e-4, n.end - n.start)) : sine(p)
  if (q <= 0) {
    out.sx = A.x; out.sy = ay; out.size = A.size
  } else if (q >= 1) {
    out.sx = B.x; out.sy = by; out.size = B.size
  } else if (!n || !n.crossing) {
    const e = sine(q)
    out.sx = lerp(A.x, B.x, e)
    out.sy = lerp(ay, by, e)
    out.size = lerp(A.size, B.size, e)
  } else {
    // A → gap → B, all points live (they scroll with the page)
    const gy = n.gapMid - y
    if (q < n.mid) {
      const e = ease(q / n.mid)
      out.sx = lerp(A.x, n.gx, e)
      out.sy = lerp(ay, gy, e)
      out.size = lerp(A.size, n.small, e)
    } else {
      const e = ease((q - n.mid) / (1 - n.mid))
      out.sx = lerp(n.gx, B.x, e)
      out.sy = lerp(gy, by, e)
      out.size = lerp(n.small, B.size, e)
    }
  }
  return out
}

/** Mobile: glued to the current section's stage; hands over without crossing text. */
function computeMobile(stops, i, y, out) {
  const a = stops[i]
  const b = stops[i + 1]
  const m = a.m
  const A = a.geo
  if (!b || !m || y < m.ys) {
    out.sx = A.x
    out.sy = liveY(A, y)
    out.size = A.size
    if (m && b && m.fadeFrom < m.ys) out.alpha = 1 - smooth(m.fadeFrom, m.ys, y)
    return out
  }
  const B = b.geo
  out.sx = B.x
  out.sy = liveY(B, y)
  out.size = B.size
  if (m.emerge > 0) {
    const e = smooth(m.ys, m.ys + m.emerge, y)
    out.alpha = e
    out.size = B.size * (0.72 + 0.28 * e)
  }
  return out
}
