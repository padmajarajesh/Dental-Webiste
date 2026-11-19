import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoveHorizontal, Info } from 'lucide-react'
import RevealHeadline from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'

/**
 * Before/after slider on dental photographs. The "before" frames are shade
 * SIMULATIONS (only the tooth pixels were tinted), so they are labelled.
 * Not patient results.
 */
const CASES = [
  { key: 'wide', label: 'Full smile', after: '/images/smile-wide.webp', before: '/images/smile-wide-before.webp', w: 736, h: 736, pos: '50% 50%' },
  { key: 'portrait', label: 'Close-up', after: '/images/smile-portrait.webp', before: '/images/smile-portrait-before.webp', w: 736, h: 1298, pos: '50% 48%' },
]

function Compare({ c }) {
  const [pos, setPos] = useState(50)
  const box = useRef()
  const dragging = useRef(false)

  const setFromEvent = useCallback((e) => {
    const r = box.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
  }, [])

  const imgProps = { width: c.w, height: c.h, loading: 'lazy', decoding: 'async', draggable: false, style: { objectPosition: c.pos } }

  return (
    <div
      className="compare"
      ref={box}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        setFromEvent(e)
      }}
      onPointerMove={(e) => dragging.current && setFromEvent(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <div className="compare-layer">
        <img src={c.before} alt="Simulated before: teeth with a yellow shade" {...imgProps} />
        <span className="compare-tag left">Before (simulated)</span>
      </div>
      <div className="compare-layer" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img src={c.after} alt="After: bright, white teeth" {...imgProps} />
        <span className="compare-tag right">After</span>
      </div>
      <div className="compare-handle" style={{ left: `${pos}%` }} aria-hidden="true">
        <span><MoveHorizontal size={16} /></span>
      </div>
      <input
        className="compare-range"
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(+e.target.value)}
        aria-label={`${c.label}: compare before and after`}
      />
    </div>
  )
}

export default function SmileGallery() {
  const [active, setActive] = useState(0)
  const c = CASES[active]
  return (
    <section id="gallery" className="story-section section-pad gallery" data-tooth-stop="gallery">
      <div className="section-bg" aria-hidden="true">
        <div className="env-glow gallery-glow" />
      </div>
      <div className="split split-gallery">
        <div className="gallery-left">
          <ToothStage id="gallery" className="stage-gallery" />
          <div className="copy">
            <p className="kicker"><span className="dot" /> Smile gallery</p>
            <RevealHeadline lines={['Before', 'and after.']} />
            <p className="lead">Drag the slider to compare. You'll see a preview like this of your own smile during planning.</p>
            <div className="gallery-tabs" role="tablist" aria-label="Smile photos">
              {CASES.map((k, i) => (
                <button key={k.key} role="tab" aria-selected={i === active} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="gallery-stage">
          <AnimatePresence mode="wait">
            <motion.div key={c.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45 }}>
              <Compare c={c} />
            </motion.div>
          </AnimatePresence>
          <p className="gallery-disclaimer">
            <Info size={14} aria-hidden="true" /> Whitening shade simulation on sample photos. Not real patient results.
          </p>
        </div>
      </div>
    </section>
  )
}
