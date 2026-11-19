import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger, scrollToTarget } from '../animation/gsap'
import { STORY_PARTS } from '../animation/toothConfig'

/** Fixed chapter indicator: 01–05 with a scroll-linked progress line. */
export default function StoryRail() {
  const [active, setActive] = useState(0)
  const fill = useRef()

  useEffect(() => {
    const triggers = STORY_PARTS.map((p, i) =>
      ScrollTrigger.create({
        trigger: `#${p.id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(i),
      }),
    )
    const prog = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (fill.current) fill.current.style.transform = `scaleY(${self.progress})`
      },
    })
    return () => {
      triggers.forEach((t) => t.kill())
      prog.kill()
    }
  }, [])

  return (
    <nav className="story-rail" aria-label="Story chapters">
      <div className="rail-line">
        <i ref={fill} />
      </div>
      {STORY_PARTS.map((p, i) => (
        <button
          key={p.id}
          className={i === active ? 'is-active' : ''}
          onClick={() => scrollToTarget(`#${p.id}`, 1.6)}
          aria-current={i === active ? 'step' : undefined}
        >
          <span className="rail-num">{p.num}</span>
          <span className="rail-label">{p.label}</span>
        </button>
      ))}
    </nav>
  )
}
