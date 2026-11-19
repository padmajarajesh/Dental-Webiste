import { useLayoutEffect, useRef } from 'react'
import { ScanLine, Box, BrainCircuit, Crosshair } from 'lucide-react'
import ScrollStorySection from '../components/ScrollStorySection'
import RevealHeadline, { FadeUp } from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'
import { gsap } from '../animation/gsap'

const TECH = [
  { icon: ScanLine, title: '3D intraoral scanner', text: 'A small camera maps your teeth in minutes. No messy moulds.' },
  { icon: Box, title: 'Low-dose 3D X-ray (CBCT)', text: 'Shows bone, roots and nerves in 3D for safe planning.' },
  { icon: BrainCircuit, title: 'AI-assisted checks', text: 'Software highlights possible problems. Your dentist always makes the call.' },
  { icon: Crosshair, title: 'Guided implant surgery', text: 'A 3D-printed guide places implants exactly where they were planned.' },
]

function TechEnv() {
  return (
    <>
      <div className="tech-grid-floor" />
      <div className="tech-beam" />
      <div className="env-glow tech-glow" />
    </>
  )
}

export default function Technology() {
  const root = useRef()

  // The read-out is scrubbed by the same scroll that drives Dr. Molar's scan.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const counter = { v: 0 }
      const out = root.current.querySelector('.scan-readout b')
      const bar = root.current.querySelector('.scan-bar i')
      gsap.to(counter, {
        v: 100,
        ease: 'none',
        scrollTrigger: { trigger: '[data-tooth-stop="tech-scan"]', start: 'top 85%', end: 'center 50%', scrub: true },
        onUpdate: () => {
          out.textContent = String(Math.round(counter.v)).padStart(3, '0')
          bar.style.transform = `scaleX(${counter.v / 100})`
        },
      })
      gsap.fromTo(
        '.tech-beam',
        { yPercent: -60, opacity: 0 },
        { yPercent: 160, opacity: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'center center', scrub: true } },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <ScrollStorySection id="part-tech" part="02" className="technology" env={<TechEnv />}>
      <div ref={root}>
        <div className="section-pad tech-block" data-tooth-stop="tech-scan">
          <div className="split">
            <div className="copy">
              <p className="kicker"><span className="dot" /> Technology</p>
              <RevealHeadline lines={['Precision', 'begins here.']} />
              <FadeUp as="p" className="lead">
                Before we treat anything, we look closely. A quick 3D scan turns your teeth into an exact digital model we can measure and plan on, and you can see it too.
              </FadeUp>
            </div>
            <ToothStage id="tech-scan">
              <div className="hud-frame">
                <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
                <div className="scan-readout">Scan <b>000</b>%</div>
                <div className="scan-bar"><i /></div>
              </div>
            </ToothStage>
          </div>
        </div>

        <div className="section-pad tech-block" data-tooth-stop="tech-holo">
          <div className="split">
            <div className="copy">
              <h3 className="subhead">What we use</h3>
              <ul className="tech-list">
                {TECH.map(({ icon: Icon, title, text }, i) => (
                  <FadeUp as="li" key={title} delay={i * 0.06}>
                    <span className="icon-chip"><Icon size={18} aria-hidden="true" /></span>
                    <div>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </FadeUp>
                ))}
              </ul>
            </div>
            <ToothStage id="tech-holo">
              <div className="hud-frame is-holo">
                <span className="hud-tag">Digital model</span>
              </div>
            </ToothStage>
          </div>
        </div>
      </div>
    </ScrollStorySection>
  )
}
