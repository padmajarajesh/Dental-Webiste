import { useLayoutEffect, useRef } from 'react'
import { Coffee, Headphones, Monitor, ShieldCheck } from 'lucide-react'
import RevealHeadline, { FadeUp } from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'
import { gsap } from '../animation/gsap'

const STEPS = [
  ['Arrive', 'Quick digital check-in and a calm lounge.'],
  ['Scan', 'A 3D scan of your teeth in a few minutes.'],
  ['Understand', 'Your dentist shows you your 3D model and explains the options.'],
  ['Treat', 'A clear plan and cost, with comfort at every step.'],
  ['Aftercare', 'Follow-up visits and reminders when you need them.'],
]
const COMFORT = [
  [Headphones, 'Noise-cancelling headphones'],
  [Monitor, 'Screens to watch during treatment'],
  [Coffee, 'Calm waiting lounge'],
  [ShieldCheck, 'Strict sterilisation'],
]

export default function Experience() {
  const root = useRef()
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.steps-progress i', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 55%', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="experience" className="story-section section-pad experience" ref={root} data-tooth-stop="experience">
      <div className="section-bg" aria-hidden="true">
        <div className="env-glow exp-glow" />
      </div>
      <div className="split">
        <ToothStage id="experience" />
        <div className="copy">
          <p className="kicker"><span className="dot" /> Patient experience</p>
          <RevealHeadline lines={['Your visit,', 'step by step.']} />
          <div className="steps">
            <div className="steps-progress" aria-hidden="true"><i /></div>
            <ol>
              {STEPS.map(([t, d], i) => (
                <FadeUp as="li" key={t} delay={i * 0.05}>
                  <span className="step-num">0{i + 1}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </FadeUp>
              ))}
            </ol>
          </div>
          <ul className="comfort">
            {COMFORT.map(([Icon, t]) => (
              <li key={t}><Icon size={16} aria-hidden="true" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
