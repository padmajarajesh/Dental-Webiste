import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, animate, useMotionValue, useMotionTemplate, useTransform } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import ToothStage from '../components/ToothStage'
import { FadeUp } from '../components/RevealHeadline'
import { prefersReducedMotion } from '../animation/toothStore'

/**
 * PART 4: Tooth journey. The visitor drags the cavity tooth through the
 * scan room; inside, a beam sweeps down it and the healthy tooth replaces
 * the cavity tooth line by line, then the visitor drags it out to the finish.
 *
 * One coordinated state, driven by two motion values (no React re-render per frame):
 *   u    ∈ [0, 2]  position along the track: 0 start → 1 scanner → 2 finish
 *   scan ∈ [0, 1]  scan progress (cavity → healthy)
 * The tooth only moves when the visitor drags it (or uses the arrow keys);
 * the scanner just centres it once it is inside.
 */

const SRC = {
  cavity: '/images/journey/tooth-cavity.webp',
  healthy: '/images/journey/tooth-healthy.webp',
  room: '/images/journey/scan-room.webp',
}
const TOOTH_ASPECT = 960 / 900 // both teeth share this canvas (scripts/prepare-journey.mjs)
const ROOM_ASPECT = 900 / 983.6 // scan-room.webp
// Glass area of the scan-room door, as fractions of the scan-room image
const GLASS = { l: 0.301, r: 0.815, t: 0.332, b: 0.982 }
const DOOR_CX = (GLASS.l + GLASS.r) / 2
const ENTER_AT = 0.86 // u at which the tooth counts as inside the scanner
const SCAN_SECONDS = 2.6

function measure(el) {
  const W = el.clientWidth
  const H = el.clientHeight
  const labelSpace = W < 560 ? 38 : 46
  const floorY = H - labelSpace
  const roomH = Math.min(H * 0.96 - labelSpace + 20, (W * (W < 560 ? 0.54 : 0.46)) / ROOM_ASPECT)
  const roomW = roomH * ROOM_ASPECT
  const roomLeft = W / 2 - DOOR_CX * roomW
  const roomTop = floorY - GLASS.b * roomH
  const glass = {
    left: roomLeft + GLASS.l * roomW,
    top: roomTop + GLASS.t * roomH,
    width: (GLASS.r - GLASS.l) * roomW,
    height: (GLASS.b - GLASS.t) * roomH,
  }
  const th = Math.min(glass.height * 0.8, (glass.width * 0.98) / TOOTH_ASPECT)
  const tw = th * TOOTH_ASPECT
  const toothTop = floorY - th * 0.985
  const scanX = W / 2
  const startX = Math.max(tw / 2 + 4, roomLeft / 2)
  const endX = Math.min(W - tw / 2 - 4, (roomLeft + roomW + W) / 2)
  return { W, H, floorY, roomH, roomW, roomLeft, roomTop, glass, th, tw, toothTop, scanX, startX, endX }
}

const xAt = (u, g) => (u <= 1 ? g.startX + (g.scanX - g.startX) * u : g.scanX + (g.endX - g.scanX) * (u - 1))

const STATUS = {
  idle: 'Drag the tooth into the scanner →',
  toScanner: 'Keep going: into the scanner →',
  scanning: 'Scanning…',
  scanned: 'Scan complete. Drag the healthy tooth out →',
  done: 'Healthy again.',
}

export default function ToothJourney() {
  const sceneRef = useRef()
  const toothRef = useRef()
  const pctRef = useRef()
  const geoRef = useRef(null)
  const [geo, setGeo] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | toScanner | scanning | scanned | done
  const [dragging, setDragging] = useState(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const u = useMotionValue(0)
  const scan = useMotionValue(0)
  const tx = useMotionValue(0)
  const lift = useMotionValue(0)

  // ----- layout -----
  useLayoutEffect(() => {
    const el = sceneRef.current
    const update = () => {
      const g = measure(el)
      geoRef.current = g
      tx.set(xAt(u.get(), g) - g.tw / 2)
      setGeo(g)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [u, tx])

  useEffect(() => {
    const unsub = u.on('change', (v) => {
      const g = geoRef.current
      if (g) tx.set(xAt(v, g) - g.tw / 2)
    })
    return unsub
  }, [u, tx])

  // preload + decode both teeth so the transformation never flickers
  useEffect(() => {
    Object.values(SRC).forEach((s) => {
      const i = new Image()
      i.src = s
      i.decode?.().catch(() => {})
    })
  }, [])

  // ----- scan: beam position + mask that swaps cavity → healthy line by line -----
  const q = useTransform(scan, (p) => -10 + p * 120) // beam position in % of the tooth height
  const qa = useTransform(q, (v) => v - 7)
  const qb = useTransform(q, (v) => v + 7)
  const healthyMask = useMotionTemplate`linear-gradient(to bottom, #000 ${qa}%, transparent ${qb}%)`
  const cavityMask = useMotionTemplate`linear-gradient(to bottom, transparent ${qa}%, #000 ${qb}%)`
  const beamY = useTransform(q, (v) => (geoRef.current ? (v / 100) * geoRef.current.th : 0))
  const trackFill = useTransform(u, (v) => v / 2)
  const shadowScale = useTransform(lift, [0, -14], [1, 0.82])

  useEffect(
    () =>
      scan.on('change', (p) => {
        if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}%`
      }),
    [scan],
  )

  const startScan = useCallback(() => {
    setPhase('scanning')
    setDragging(false)
    animate(lift, 0, { duration: 0.3 })
    animate(u, 1, { type: 'spring', stiffness: 160, damping: 22 })
    animate(scan, 1, {
      duration: prefersReducedMotion() ? 0.6 : SCAN_SECONDS,
      ease: 'easeInOut',
      delay: 0.35,
      onComplete: () => setPhase('scanned'),
    })
  }, [u, scan, lift])

  const finish = useCallback(() => {
    setPhase('done')
    animate(u, 2, { type: 'spring', stiffness: 170, damping: 24 })
    if (!prefersReducedMotion()) animate(lift, [0, -16, 0], { duration: 0.7, ease: 'easeOut', delay: 0.15 })
  }, [u, lift])

  /** Applies a requested position, respecting the gates (scanner must come first). */
  const moveTo = useCallback(
    (next) => {
      const p = phaseRef.current
      if (p === 'scanning' || p === 'done') return
      if (p === 'idle' || p === 'toScanner') {
        const v = Math.min(Math.max(next, 0), 1)
        u.set(v)
        if (p === 'idle' && v > 0.02) setPhase('toScanner')
        if (v >= ENTER_AT) startScan()
      } else if (p === 'scanned') {
        const v = Math.min(Math.max(next, 1), 2)
        u.set(v)
        if (v >= 1.97) finish()
      }
    },
    [u, startScan, finish],
  )

  // ----- pointer dragging (mouse, pen and touch) -----
  const drag = useRef(null)
  const onPointerDown = (e) => {
    const p = phaseRef.current
    if (p === 'scanning' || p === 'done' || !geoRef.current) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, x0: e.clientX, u0: u.get() }
    setDragging(true)
    animate(lift, -10, { type: 'spring', stiffness: 300, damping: 20 })
  }
  const onPointerMove = (e) => {
    const d = drag.current
    const g = geoRef.current
    if (!d || d.id !== e.pointerId || !g) return
    const dx = e.clientX - d.x0
    const startPx = xAt(d.u0, g)
    const px = startPx + dx
    // convert px back to u on the right segment
    const next = px <= g.scanX ? (px - g.startX) / (g.scanX - g.startX) : 1 + (px - g.scanX) / (g.endX - g.scanX)
    moveTo(next)
    if (phaseRef.current === 'scanning' || phaseRef.current === 'done') drag.current = null
  }
  const endDrag = (e) => {
    if (drag.current && drag.current.id === e.pointerId) {
      drag.current = null
      setDragging(false)
      animate(lift, 0, { type: 'spring', stiffness: 300, damping: 22 })
      // released close to the finish: settle onto it
      if (phaseRef.current === 'scanned' && u.get() >= 1.8) finish()
    }
  }
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 0.25 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') moveTo(u.get() + step)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') moveTo(u.get() - step)
    else if (e.key === 'End') moveTo(phaseRef.current === 'scanned' ? 2 : 1)
    else return
    e.preventDefault()
  }

  const reset = () => {
    scan.stop()
    u.stop()
    drag.current = null
    setDragging(false)
    setPhase('idle')
    animate(u, 0, { type: 'spring', stiffness: 140, damping: 22 })
    animate(scan, 0, { duration: 0.5, ease: 'easeOut' })
    lift.set(0)
  }

  const g = geo
  const scanning = phase === 'scanning'
  const toothLabel =
    phase === 'scanned' || phase === 'done' ? 'Healthy tooth' : 'Tooth with a cavity'

  return (
    <section id="part-smile" className="story-section section-pad journey" data-part="part-smile" data-tooth-stop="smile-reveal">
      <div className="section-bg" aria-hidden="true">
        <div className="journey-glow" />
      </div>

      <div className="split journey-head">
        <div className="copy">
          <p className="kicker"><span className="dot" /> Tooth journey</p>
          <FadeUp as="h2" className="journey-title">
            Every smile starts with a <span className="accent">healthy tooth.</span>
          </FadeUp>
          <FadeUp as="p" className="lead" delay={0.05}>Follow the journey from detection to a healthier smile.</FadeUp>
        </div>
        <ToothStage id="smile-reveal" className="stage-journey" />
      </div>

      <div
        ref={sceneRef}
        className={`journey-scene phase-${phase}${dragging ? ' is-dragging' : ''}`}
        style={
          g
            ? {
                '--floor': `${g.floorY}px`,
                '--gl': `${g.glass.left}px`,
                '--gt': `${g.glass.top}px`,
                '--gw': `${g.glass.width}px`,
                '--gh': `${g.glass.height}px`,
                '--tw': `${g.tw}px`,
                '--th': `${g.th}px`,
                '--tt': `${g.toothTop}px`,
              }
            : undefined
        }
      >
        {g && (
          <>
            {/* floor + track */}
            <div className="j-floor" aria-hidden="true" />
            <div className="j-track" style={{ left: g.startX, width: g.endX - g.startX }} aria-hidden="true">
              <motion.i style={{ scaleX: trackFill }} />
            </div>
            <div className="j-pad j-pad-start" style={{ left: g.startX }} aria-hidden="true" />
            <div className="j-pad j-pad-end" style={{ left: g.endX }} aria-hidden="true" />

            {/* finish: the healthy tooth waiting at the destination */}
            <img
              className="j-ghost"
              src={SRC.healthy}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ left: g.endX - g.tw / 2, top: g.toothTop, width: g.tw, height: g.th }}
            />

            {/* the scan room (uploaded) + its cyan chamber lights */}
            <img
              className="j-room"
              src={SRC.room}
              alt="Scan room door"
              draggable={false}
              style={{ left: g.roomLeft, top: g.roomTop, width: g.roomW, height: g.roomH }}
            />
            <div className="j-chamber" aria-hidden="true">
              <span className="j-emitter j-emitter-top" />
              <span className="j-emitter j-emitter-floor" />
            </div>
            <div className="j-progress" aria-hidden="true">
              <span className="j-progress-label">
                {phase === 'scanned' || phase === 'done' ? 'Scan complete' : scanning ? 'Scanning' : 'Scanner ready'}
              </span>
              <span className="j-progress-bar"><motion.i style={{ scaleX: scan }} /></span>
              <span className="j-progress-pct" ref={pctRef}>0%</span>
            </div>

            {/* the draggable tooth */}
            <motion.button
              ref={toothRef}
              type="button"
              className="j-tooth"
              style={{ x: tx, y: lift, width: g.tw, height: g.th, top: g.toothTop }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
              aria-label={`${toothLabel}. Drag it, or use the arrow keys, to move it ${phase === 'scanned' ? 'to the finish' : 'into the scanner'}.`}
            >
              <motion.span className="j-shadow" style={{ scale: shadowScale }} />
              <span className="j-invite" />
              <motion.img
                className="j-img j-cavity"
                src={SRC.cavity}
                alt=""
                draggable={false}
                style={{ WebkitMaskImage: cavityMask, maskImage: cavityMask }}
              />
              <motion.img
                className="j-img j-healthy"
                src={SRC.healthy}
                alt=""
                draggable={false}
                style={{ WebkitMaskImage: healthyMask, maskImage: healthyMask }}
              />
            </motion.button>

            {/* scanner effects, in FRONT of the tooth while it is inside */}
            <div className="j-fx" aria-hidden="true">
              <span className="j-ring r1" />
              <span className="j-ring r2" />
              <span className="j-ring r3" />
              <motion.span className="j-beam" style={{ y: beamY }} />
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className="j-particle" style={{ '--i': i }} />
              ))}
            </div>

            {/* completion sparkle at the finish */}
            <div className="j-burst" style={{ left: g.endX, top: g.toothTop + g.th * 0.45 }} aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} style={{ '--a': `${i * 45}deg` }} />
              ))}
            </div>

            {/* labels */}
            <p className="j-label" style={{ left: g.startX }}>01 — Cavity</p>
            <p className="j-label" style={{ left: g.scanX }}>02 — Scan</p>
            <p className="j-label" style={{ left: g.endX }}>03 — Healthy tooth</p>
          </>
        )}
      </div>

      <div className="journey-foot">
        <p className="journey-status" aria-live="polite">{STATUS[phase]}</p>
        {phase !== 'idle' && (
          <button type="button" className="journey-reset" onClick={reset} disabled={scanning}>
            <RotateCcw size={15} aria-hidden="true" /> {phase === 'done' ? 'Replay' : 'Reset'}
          </button>
        )}
      </div>
    </section>
  )
}
