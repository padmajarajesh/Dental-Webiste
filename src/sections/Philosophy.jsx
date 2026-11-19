import { useLayoutEffect, useRef } from 'react'
import { HeartHandshake, MessageSquareText, ShieldCheck } from 'lucide-react'
import { gsap } from '../animation/gsap'
import RevealHeadline, { FadeUp } from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'

const STATEMENT =
  'We explain every option in plain words, protect as much of your natural tooth as we can, and only recommend what you really need.'

const PRINCIPLES = [
  [HeartHandshake, 'Gentle first', 'Minimal drilling. Natural teeth come first.'],
  [MessageSquareText, 'Clear answers', 'You see your scan, your plan and your cost upfront.'],
  [ShieldCheck, 'Prevention', 'Small checks now save big treatments later.'],
]

export default function Philosophy() {
  const root = useRef()

  // The statement lights up word by word as you scroll, so reading pace follows scroll pace.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.statement-word',
        { opacity: 0.2 },
        { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 55%', scrub: true } },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="philosophy" className="story-section section-pad philosophy" ref={root} data-tooth-stop="philosophy">
      <div className="section-bg" aria-hidden="true">
        <div className="env-glow philo-glow" />
      </div>
      <div className="split">
        <ToothStage id="philosophy" />
        <div className="copy">
          <p className="kicker"><span className="dot" /> Our approach</p>
          <RevealHeadline lines={['Care that starts', 'with listening.']} />
          <p className="statement">
            {STATEMENT.split(' ').map((w, i) => (
              <span className="statement-word" key={i}>{w} </span>
            ))}
          </p>
          <ul className="principles">
            {PRINCIPLES.map(([Icon, t, d], i) => (
              <FadeUp as="li" key={t} delay={i * 0.08}>
                <span className="icon-chip"><Icon size={18} aria-hidden="true" /></span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </FadeUp>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
