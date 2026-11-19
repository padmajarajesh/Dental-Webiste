import { Clock, UserCheck, PenTool, AlignCenter, Sparkles, Anchor, Sun, ShieldPlus } from 'lucide-react'
import ScrollStorySection from '../components/ScrollStorySection'
import RevealHeadline, { FadeUp } from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'
import { scrollToTarget } from '../animation/gsap'

export const TREATMENTS = [
  { key: 'design', icon: PenTool, title: 'Digital Smile Design', line: 'Preview your new smile first.', text: 'We photograph and scan your face and teeth, then design a smile that suits you. You approve the design before we begin.', time: '1–2 visits', fit: 'Anyone planning a smile makeover' },
  { key: 'aligners', icon: AlignCenter, title: 'Clear Aligners', line: 'Straighter teeth, almost invisibly.', text: 'A series of clear trays gently moves your teeth. You see the full plan on screen before you start.', time: 'Usually 6–18 months', fit: 'Crowded or gapped teeth' },
  { key: 'cosmetic', icon: Sparkles, title: 'Cosmetic Dentistry', line: 'Fix chips, gaps and shape.', text: 'Veneers and bonding, colour-matched to your natural teeth so they blend in.', time: '2–3 visits', fit: 'Chipped, worn or uneven teeth' },
  { key: 'implants', icon: Anchor, title: 'Dental Implants', line: 'A strong, natural-looking replacement.', text: 'A titanium post replaces the missing root and a crown sits on top. Placement is planned on your 3D scan.', time: '3–6 months', fit: 'One or more missing teeth' },
  { key: 'whitening', icon: Sun, title: 'Teeth Whitening', line: 'Brighter, safely.', text: 'Dentist-supervised whitening with care for sensitivity. We record your starting shade to track progress.', time: '1 visit + home care', fit: 'Stains from tea, coffee or age' },
  { key: 'prevention', icon: ShieldPlus, title: 'Preventive Care', line: 'Stop problems early.', text: 'Regular check-ups, cleaning and scans that catch small issues before they become big ones.', time: 'Every 6 months', fit: 'Everyone' },
]

function TreatmentRow({ t, i }) {
  const Icon = t.icon
  // Odd rows: Dr. Molar left, text right. Even rows: text left, Dr. Molar right.
  const stageFirst = i % 2 === 0
  const stage = <ToothStage id={`treat-${i + 1}`} className="stage-treat" />
  return (
    <article className="treat-row section-pad" data-tooth-stop={`treat-${i + 1}`} id={`treat-${t.key}`}>
      <div className={`split ${stageFirst ? '' : 'split-reverse'}`}>
        {stageFirst && stage}
        <div className="copy treat-copy">
          <p className="treat-label">
            <span className="icon-chip"><Icon size={18} aria-hidden="true" /></span>
            Treatment {String(i + 1).padStart(2, '0')} / 06
          </p>
          <FadeUp as="h3" className="treat-title">{t.title}</FadeUp>
          <FadeUp as="p" className="treat-line" delay={0.05}>{t.line}</FadeUp>
          <FadeUp as="p" className="treat-text" delay={0.1}>{t.text}</FadeUp>
          <FadeUp as="dl" className="treat-meta" delay={0.15}>
            <div><dt><Clock size={14} aria-hidden="true" /> Time</dt><dd>{t.time}</dd></div>
            <div><dt><UserCheck size={14} aria-hidden="true" /> Good for</dt><dd>{t.fit}</dd></div>
          </FadeUp>
          <button className="link-btn" onClick={() => scrollToTarget('#appointment-form')}>
            Ask about this treatment →
          </button>
        </div>
        {!stageFirst && stage}
      </div>
    </article>
  )
}

export default function Treatments() {
  return (
    <ScrollStorySection id="part-treatments" part="03" className="treatments" env={<div className="treat-lines" />}>
      <header className="section-pad treat-intro" data-tooth-stop="treat-intro">
        <div className="split">
          <div className="copy">
          <p className="kicker"><span className="dot" /> Treatments</p>
          <RevealHeadline lines={['Your smile.', 'Your journey.']} />
          <FadeUp as="p" className="lead">Six treatments, each planned from the same 3D scan.</FadeUp>
          <nav className="treat-index-nav" aria-label="Treatments">
            {TREATMENTS.map((t, i) => (
              <button key={t.key} onClick={() => scrollToTarget(`#treat-${t.key}`)}>
                <span>0{i + 1}</span> {t.title}
              </button>
              ))}
            </nav>
          </div>
          <ToothStage id="treat-intro" />
        </div>
      </header>
      {TREATMENTS.map((t, i) => (
        <TreatmentRow key={t.key} t={t} i={i} />
      ))}
    </ScrollStorySection>
  )
}
