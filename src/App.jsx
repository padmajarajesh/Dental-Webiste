import { lazy, Suspense, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Header from './components/Header'
import StoryRail from './components/StoryRail'
import PlayStoryButton from './components/PlayStoryButton'
import FallbackTooth, { hasWebGL } from './components/FallbackTooth'
import Hero from './sections/Hero'
import Philosophy from './sections/Philosophy'
import Technology from './sections/Technology'
import Treatments from './sections/Treatments'
import ToothJourney from './sections/ToothJourney'
import SmileGallery from './sections/SmileGallery'
import Specialists from './sections/Specialists'
import Experience from './sections/Experience'
import Appointment from './sections/Appointment'
import Footer from './sections/Footer'
import { useToothScrollTimeline } from './animation/ToothScrollTimeline'

// three.js + R3F are split into their own chunk and loaded after first paint.
const ToothExperience = lazy(() => import('./three/ToothExperience'))

export default function App() {
  const [webgl] = useState(hasWebGL)
  useToothScrollTimeline()

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#appointment-form">Skip to booking</a>
      <Header />
      {webgl ? (
        <Suspense fallback={null}>
          <ToothExperience />
        </Suspense>
      ) : (
        <FallbackTooth />
      )}
      <main id="story">
        <Hero />
        <Philosophy />
        <Technology />
        <Treatments />
        <ToothJourney />
        <SmileGallery />
        <Specialists />
        <Experience />
        <Appointment />
      </main>
      <Footer />
      <StoryRail />
      <PlayStoryButton />
    </MotionConfig>
  )
}
