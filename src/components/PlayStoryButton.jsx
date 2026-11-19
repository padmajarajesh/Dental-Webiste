import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Square } from 'lucide-react'
import { gsap, ScrollTrigger } from '../animation/gsap'
import { PLAY_STORY_SECONDS } from '../animation/toothConfig'

/**
 * ▶ PLAY STORY — auto-scrolls the real page. The tooth is never animated
 * independently: it simply follows scroll progress, exactly as with manual
 * scrolling. Any wheel / touch / key input (or STOP) hands control back.
 */
export default function PlayStoryButton() {
  const [playing, setPlaying] = useState(false)
  const tween = useRef(null)

  const stop = useCallback(() => {
    tween.current?.kill()
    tween.current = null
    setPlaying(false)
  }, [])

  const play = useCallback(() => {
    const max = ScrollTrigger.maxScroll(window)
    setPlaying(true)
    const tl = gsap.timeline({ onComplete: stop })
    if (window.scrollY > 4) {
      tl.to(window, { scrollTo: { y: 0 }, duration: Math.min(2, 0.6 + window.scrollY / 6000), ease: 'power2.inOut' })
      tl.to({}, { duration: 0.6 })
    }
    tl.to(window, { scrollTo: { y: max }, duration: PLAY_STORY_SECONDS, ease: 'sine.inOut' })
    tween.current = tl
  }, [stop])

  useEffect(() => {
    if (!playing) return
    const interrupt = (e) => {
      if (e.type === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape'].includes(e.key)) return
      stop()
    }
    window.addEventListener('wheel', interrupt, { passive: true })
    window.addEventListener('touchstart', interrupt, { passive: true })
    window.addEventListener('keydown', interrupt)
    return () => {
      window.removeEventListener('wheel', interrupt)
      window.removeEventListener('touchstart', interrupt)
      window.removeEventListener('keydown', interrupt)
    }
  }, [playing, stop])

  useEffect(() => () => tween.current?.kill(), [])

  return (
    <div className="play-story">
      <AnimatePresence mode="wait" initial={false}>
        {playing ? (
          <motion.button
            key="stop"
            className="play-btn is-playing"
            onClick={stop}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            aria-label="Stop story playback"
          >
            <Square size={12} fill="currentColor" aria-hidden="true" />
            <span>STOP</span>
            <span className="play-live" aria-hidden="true" />
          </motion.button>
        ) : (
          <motion.button
            key="play"
            className="play-btn"
            onClick={play}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            aria-label="Play the story: auto-scroll the whole page"
          >
            <Play size={13} fill="currentColor" aria-hidden="true" />
            <span>PLAY STORY</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
