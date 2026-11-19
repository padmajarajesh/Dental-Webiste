/**
 * Single mutable source of truth for the traveling tooth.
 * GSAP writes into it (scroll-scrubbed), the R3F render loop reads from it.
 * Nothing here triggers React renders — that's deliberate.
 *
 * Screen-space values (sx, sy, size) are in CSS pixels of the viewport, so the
 * same data drives the WebGL tooth and the non-WebGL fallback.
 */
export const toothState = {
  sx: typeof window !== 'undefined' ? window.innerWidth * 0.7 : 900,
  sy: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
  size: typeof window !== 'undefined' ? window.innerHeight * 0.62 : 500,
  rx: 0.2,
  ry: 0.5,
  rz: -0.1,
  rim: 1, // strength of the soft blue glow behind him (never drawn over him)
  warm: 0, // shifts the glow / particles toward the soft "smile" environment
  spin: 1, // hero idle rotation amount
  sway: 0, // camera sway, peaks mid-transition
  poseA: 0, // index into MASCOT_KEYS: image he is leaving
  poseB: 0, // index into MASCOT_KEYS: image he is arriving with
  poseMix: 0, // 0 = poseA, 1 = poseB (cross-fade while travelling)
  alpha: 1, // mobile hand-over fade (he slides out with one stage, grows in at the next)
  progress: 0, // global scroll progress (0..1)
}

export const pointer = { x: 0, y: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    },
    { passive: true },
  )
}

const reducedMql =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
export const prefersReducedMotion = () => !!reducedMql?.matches

export const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches

// Dev-only: lets automated layout tests read the tooth's live screen box.
if (import.meta.env.DEV && typeof window !== 'undefined') window.__toothState = toothState
