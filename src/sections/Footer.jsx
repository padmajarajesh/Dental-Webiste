import { Logo } from '../components/Header'
import { scrollToTarget } from '../animation/gsap'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Logo />
        <p>One tooth. One continuous journey. One future smile.</p>
        <button className="link-btn" onClick={() => scrollToTarget(0, 2.2)}>Back to the beginning ↑</button>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Future Smile Dental Studio</span>
        <span>Smile photos are sample imagery; before images are shade simulations. Outcomes vary; consult a dentist for advice.</span>
      </div>
    </footer>
  )
}
