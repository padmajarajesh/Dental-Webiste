import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import ToothModel from './ToothModel'
import ToothParticles from './ToothParticles'
import ToothAnimationController, { CAMERA_FOV, CAMERA_Z } from './ToothAnimationController'
import { isMobileViewport } from '../animation/toothStore'

/**
 * ONE fixed, full-viewport WebGL canvas for the whole page. It is never
 * unmounted or recreated. Sections scroll over/under it, and Dr. Molar inside
 * is moved by the master scroll timeline.
 */
export default function PersistentToothCanvas({ onReady }) {
  const tooth = useRef()
  const [mobile] = useState(isMobileViewport)
  const [dpr, setDpr] = useState(mobile ? 1.5 : 1.75)

  return (
    <div className="tooth-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          onReady?.()
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.3))}
          onIncline={() => setDpr((d) => Math.min(2, d + 0.2))}
        />
        <AdaptiveDpr pixelated={false} />
        <ToothParticles count={mobile ? 160 : 420} />
        <Suspense fallback={null}>
          <ToothModel ref={tooth} />
          <ToothAnimationController tooth={tooth} />
        </Suspense>
      </Canvas>
    </div>
  )
}
