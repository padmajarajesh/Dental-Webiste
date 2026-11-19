import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }

/** Smoothly scroll to an element / y position (used by nav + CTAs). */
export function scrollToTarget(target, duration = 1.4) {
  gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration, ease: 'power3.inOut' })
}
