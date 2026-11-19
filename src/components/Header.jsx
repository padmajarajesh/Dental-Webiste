import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { scrollToTarget } from '../animation/gsap'

const LINKS = [
  ['Technology', '#part-tech'],
  ['Treatments', '#part-treatments'],
  ['Smiles', '#gallery'],
  ['Specialists', '#specialists'],
  ['Contact', '#part-appointment'],
]

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10 5c-4 0-6 3-6 7 0 4 2 6 3 9 1 4 1 7 3.5 7S13 23 15 21.5c.6-.4 1.4-.4 2 0C19 23 19 28 21.5 28S24 25 25 21c1-3 3-5 3-9 0-4-2-7-6-7-3 0-4 2-6 2s-3-2-6-2z" />
      </svg>
      FUTURE<b>SMILE</b>
    </span>
  )
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const go = (e, href) => {
    e.preventDefault()
    scrollToTarget(href)
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#part-hero" onClick={(e) => go(e, '#part-hero')} aria-label="Future Smile — back to top">
        <Logo />
      </a>
      <nav aria-label="Primary">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} onClick={(e) => go(e, href)}>
            {label}
          </a>
        ))}
      </nav>
      <a className="btn btn-small" href="#part-appointment" onClick={(e) => go(e, '#appointment-form')}>
        <CalendarDays size={16} aria-hidden="true" /> Book visit
      </a>
    </header>
  )
}
