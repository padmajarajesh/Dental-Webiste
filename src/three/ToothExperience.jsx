import { useState } from 'react'
import PersistentToothCanvas from './PersistentToothCanvas'

/** Lazy-loaded entry for the whole 3D layer (keeps three.js out of the first paint). */
export default function ToothExperience() {
  const [ready, setReady] = useState(false)
  return (
    <>
      <PersistentToothCanvas onReady={() => setReady(true)} />
      {!ready && <div className="tooth-loading" aria-hidden="true" />}
    </>
  )
}
