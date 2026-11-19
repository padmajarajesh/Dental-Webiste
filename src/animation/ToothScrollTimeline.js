import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from './gsap'
import { EFFECT_KEYS } from './toothConfig'
import { toothState, prefersReducedMotion } from './toothStore'
import { measureLayout, layout } from './toothLayout'

const pick = (s) => Object.fromEntries(EFFECT_KEYS.map((k) => [k, s.cfg[k]]))

/**
 * ONE master timeline for everything that is not position or pose: glow,
 * warmth, idle spin and camera sway, scrubbed by scroll across the whole
 * page. Position and pose (which mascot image) come from toothLayout every
 * frame, so he stays glued to the layout. Both are pure functions of scroll
 * position, so scrolling up reverses everything exactly.
 */
export function buildToothTimeline(stops) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' } })
  Object.assign(toothState, pick(stops[0]))
  const max = Math.max(1, ScrollTrigger.maxScroll(window))
  const at = { immediateRender: false }

  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]
    const b = stops[i]
    const d = Math.max(0.0001, b.t - a.t)
    tl.fromTo(toothState, pick(a), { ...pick(b), duration: d, ...at }, a.t)

    // Gentle camera sway peaking mid-flight
    const dir = b.geo && a.geo && b.geo.x > a.geo.x ? 1 : -1
    tl.fromTo(toothState, { sway: 0 }, { sway: dir * 0.5, duration: d / 2, ease: 'sine.out', ...at }, a.t)
    tl.fromTo(toothState, { sway: dir * 0.5 }, { sway: 0, duration: d / 2, ease: 'sine.in', ...at }, a.t + d / 2)
  }
  const last = stops[stops.length - 1]
  if (last.t < 1) tl.to({}, { duration: 1 - last.t }, last.t)
  if (import.meta.env.DEV) window.__toothMax = max
  return tl
}

/** Hook: owns the master ScrollTrigger and rebuilds it when the layout changes. */
export function useToothScrollTimeline() {
  useLayoutEffect(() => {
    let ctx
    let lastW = window.innerWidth
    let lastH = document.documentElement.scrollHeight
    let lastVh = window.innerHeight
    let timer

    const build = () => {
      ctx?.revert()
      ctx = gsap.context(() => {
        ScrollTrigger.refresh()
        const stops = measureLayout()
        if (stops.length < 2) return
        const tl = buildToothTimeline(stops)
        ScrollTrigger.create({
          id: 'tooth-master',
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          scrub: prefersReducedMotion() ? true : 0.6,
          animation: tl,
          onUpdate: (self) => {
            toothState.progress = self.progress
          },
        })
        if (import.meta.env.DEV) window.__toothLayout = layout
      })
    }

    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(build, 200)
    }

    const onResize = () => {
      const w = window.innerWidth
      const vh = window.innerHeight
      if (w !== lastW || Math.abs(vh - lastVh) > 140) {
        lastW = w
        lastVh = vh
        schedule()
      }
    }

    const ro = new ResizeObserver(() => {
      const hgt = document.documentElement.scrollHeight
      if (Math.abs(hgt - lastH) > 2) {
        lastH = hgt
        schedule()
      }
    })
    ro.observe(document.body)

    build()
    document.fonts?.ready.then(schedule)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      ctx?.revert()
    }
  }, [])
}
