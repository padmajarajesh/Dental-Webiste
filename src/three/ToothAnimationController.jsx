import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from '../animation/gsap'
import { toothState, pointer, prefersReducedMotion } from '../animation/toothStore'
import { computeTooth, layout } from '../animation/toothLayout'

const WARM_HALO = new THREE.Color(1, 0.9, 0.8)
const COOL_HALO = new THREE.Color('#2f8bff')

export const CAMERA_Z = 10
export const CAMERA_FOV = 30

/**
 * Bridges the scroll-driven toothState into the scene every frame.
 * Converts viewport pixels → world units on the z=0 plane so DOM "slots"
 * line up exactly with the character at any screen size.
 */
export default function ToothAnimationController({ tooth }) {
  const { camera } = useThree()

  // Entrance fade (time-based, once) × hand-over fade from the layout (mobile)
  const fade = useMemo(() => ({ value: prefersReducedMotion() ? 1 : 0 }), [])

  // Cinematic entrance (time-based, plays once on load)
  useEffect(() => {
    const t = tooth.current
    if (!t?.intro.current || prefersReducedMotion()) {
      fade.value = 1
      return
    }
    const g = t.intro.current
    const tl = gsap.timeline({ delay: 0.25 })
    tl.fromTo(g.scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 1, y: 1, z: 1, duration: 2.2, ease: 'expo.out' }, 0)
      .fromTo(g.position, { y: -0.6 }, { y: 0, duration: 2.2, ease: 'expo.out' }, 0)
      .fromTo(fade, { value: 0 }, { value: 1, duration: 1.2, ease: 'power2.out' }, 0)
    return () => tl.kill()
  }, [tooth, fade])

  const smoothPointer = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, delta) => {
    const t = tooth.current
    if (!t?.root.current) return
    const s = computeTooth(window.scrollY, toothState)
    const { width: vw, height: vh } = state.size
    const reduced = prefersReducedMotion()
    const time = state.clock.elapsedTime

    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2)) * CAMERA_Z
    const visW = visH * (vw / vh)

    const root = t.root.current
    root.position.set((s.sx / vw - 0.5) * visW, -(s.sy / vh - 0.5) * visH, 0)
    root.scale.setScalar(Math.max(0.0001, (s.size / vh) * visH))
    root.rotation.set(s.rx, s.ry, s.rz)

    // Idle float only: the artwork is never rotated or tilted (that would skew the flat image)
    smoothPointer.x = THREE.MathUtils.damp(smoothPointer.x, pointer.x, 3, delta)
    smoothPointer.y = THREE.MathUtils.damp(smoothPointer.y, pointer.y, 3, delta)
    const idle = t.idle.current
    if (!reduced) {
      idle.position.y = Math.sin(time * 1.1) * 0.022
    } else {
      idle.position.y = 0
    }
    idle.rotation.set(0, 0, 0)

    // Pose (which mascot image) + the soft glow behind him. His own pixels are never re-coloured.
    const m = t.materials
    const u = m.mascot.uniforms
    u.uA.value = t.textures[s.poseA] || t.textures[0]
    u.uB.value = t.textures[s.poseB] || t.textures[0]
    u.uMix.value = s.poseMix
    u.uRim.value = s.rim
    u.uWarm.value = s.warm

    const alpha = fade.value * (s.alpha ?? 1)
    u.uOpacity.value = alpha
    m.halo.uniforms.uOpacity.value = (0.1 + s.rim * 0.07) * alpha
    m.halo.uniforms.uColor.value.copy(COOL_HALO).lerp(WARM_HALO, s.warm * 0.7)

    // Camera: gentle sway between chapters + mouse parallax
    // (off on mobile: there he must sit exactly in his stage, and touch has no hover)
    const cam = layout.mobile ? 0 : 1
    camera.position.x = (s.sway * 0.55 + smoothPointer.x * 0.18) * cam
    camera.position.y = (-Math.abs(s.sway) * 0.2 + smoothPointer.y * 0.12) * cam
    camera.position.z = CAMERA_Z
    camera.lookAt(s.sway * 0.25 * cam, 0, 0)
  })

  return null
}
