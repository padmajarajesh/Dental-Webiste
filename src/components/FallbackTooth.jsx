import { useEffect, useRef } from 'react'
import { toothState } from '../animation/toothStore'
import { computeTooth } from '../animation/toothLayout'
import { MASCOTS, MASCOT_KEYS, MASCOT_ASPECT } from '../animation/toothConfig'

const SRC = MASCOT_KEYS.map((k) => MASCOTS[k].src)

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Non-WebGL fallback: the same journey, driven by the same toothState,
 * rendered as two stacked images (leaving pose / arriving pose) that
 * cross-fade. Images are shown as-is: object-fit contain, no filters.
 */
export default function FallbackTooth() {
  const box = useRef()
  const imgA = useRef()
  const imgB = useRef()

  useEffect(() => {
    // Preload + decode every pose up front so a swap never flickers.
    SRC.forEach((src) => {
      const im = new Image()
      im.src = src
      im.decode?.().catch(() => {})
    })
    let raf
    let a = -1
    let b = -1
    const loop = () => {
      const s = computeTooth(window.scrollY, toothState)
      const el = box.current
      if (el) {
        const h = s.size
        const w = h * MASCOT_ASPECT
        el.style.width = `${w}px`
        el.style.height = `${h}px`
        el.style.transform = `translate3d(${s.sx - w / 2}px, ${s.sy - h / 2}px, 0) rotate(${s.rz}rad)`
        el.style.opacity = s.alpha ?? 1
        if (s.poseA !== a) imgA.current.src = SRC[(a = s.poseA)]
        if (s.poseB !== b) imgB.current.src = SRC[(b = s.poseB)]
        imgA.current.style.opacity = 1 - smooth(0, 0.6, s.poseMix)
        imgB.current.style.opacity = a === b ? 0 : smooth(0.4, 1, s.poseMix)
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="tooth-canvas" aria-hidden="true">
      <div ref={box} className="fallback-tooth">
        <img ref={imgA} src={SRC[0]} alt="" decoding="async" />
        <img ref={imgB} src={SRC[0]} alt="" decoding="async" style={{ opacity: 0 }} />
      </div>
    </div>
  )
}
