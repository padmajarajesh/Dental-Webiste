import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import ScrollStorySection from '../components/ScrollStorySection'
import RevealHeadline from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'
import { scrollToTarget } from '../animation/gsap'

const EASE = [0.16, 1, 0.3, 1]

function HeroEnv() {
  return (
    <>
      <div className="env-stars" />
      <div className="env-glow hero-glow" />
      <div className="hero-horizon" />
    </>
  )
}

export default function Hero() {
  return (
    <ScrollStorySection id="part-hero" part="01" className="hero" env={<HeroEnv />} data-tooth-stop="hero">
      <div className="split hero-split">
        <div className="copy">
          <motion.p className="kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}>
            <span className="dot" /> Future Smile Dental Studio
          </motion.p>
          <RevealHeadline as="h1" lines={['The future', 'of your smile.']} immediate delay={0.35} className="hero-title" />
          <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.9 }}>
            Gentle, precise dental care. We scan your teeth in 3D and plan every step digitally, so you can see the result before treatment starts.
          </motion.p>
          <motion.div className="actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 1.1 }}>
            <button className="btn" onClick={() => scrollToTarget('#appointment-form')}>
              Book your visit <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button className="btn btn-ghost" onClick={() => scrollToTarget('#philosophy', 1.6)}>
              See how it works
            </button>
          </motion.div>
          <motion.button
            className="scroll-indicator"
            onClick={() => scrollToTarget('#philosophy', 1.6)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            aria-label="Scroll to continue"
          >
            <span className="scroll-mouse">
              <i />
            </span>
            <span>Scroll</span>
            <ArrowDown size={14} aria-hidden="true" />
          </motion.button>
        </div>
        <ToothStage id="hero" className="stage-hero" />
      </div>
    </ScrollStorySection>
  )
}
