import { motion } from 'framer-motion'
import RevealHeadline from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'

// Sample profiles: replace with the clinic's real team and registrations.
const TEAM = [
  { name: 'Dr. Ananya Rao', role: 'Prosthodontist', quals: 'BDS, MDS (Prosthodontics)', focus: 'Smile design, veneers, crowns', initials: 'AR' },
  { name: 'Dr. Vikram Mehta', role: 'Orthodontist', quals: 'BDS, MDS (Orthodontics)', focus: 'Clear aligners, braces', initials: 'VM' },
  { name: 'Dr. Kavya Iyer', role: 'Implantologist', quals: 'BDS, MDS (Periodontics)', focus: 'Implants, gum care', initials: 'KI' },
  { name: 'Dr. Arjun Nair', role: 'Endodontist', quals: 'BDS, MDS (Endodontics)', focus: 'Root canals, preventive care', initials: 'AN' },
]

export default function Specialists() {
  return (
    <section id="specialists" className="story-section section-pad specialists" data-tooth-stop="specialists">
      <div className="section-bg" aria-hidden="true">
        <div className="env-glow spec-glow" />
      </div>
      <div className="split">
        <div className="copy copy-wide">
          <p className="kicker"><span className="dot" /> Specialists</p>
          <RevealHeadline lines={['Meet the', 'team.']} />
          <p className="lead">Each dentist focuses on one area, and all work from your shared digital record.</p>
          <ul className="spec-list">
            {TEAM.map((p, i) => (
              <motion.li
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
              >
                <span className="spec-avatar" aria-hidden="true">{p.initials}</span>
                <div className="spec-info">
                  <h3>{p.name}</h3>
                  <p className="spec-role">{p.role} · <span>{p.quals}</span></p>
                  <p className="spec-focus">{p.focus}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
        <ToothStage id="specialists" />
      </div>
    </section>
  )
}
