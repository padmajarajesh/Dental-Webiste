import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { createGlowMaterial, createMascotMaterial } from './MascotMaterial'
import { MASCOTS, MASCOT_KEYS, MASCOT_ASPECT } from '../animation/toothConfig'

const SOURCES = MASCOT_KEYS.map((k) => MASCOTS[k].src)

/**
 * THE mascot. Mounted exactly once for the whole page.
 * The five pose images (all normalised to the same canvas, scale and foot
 * position) live on ONE plane; the shader cross-fades between the pose he is
 * leaving and the pose of the section he is travelling to.
 * Hierarchy: root (scroll destination) → intro (entrance) → idle (float + mouse) → visuals
 */
const ToothModel = forwardRef(function ToothModel(_, ref) {
  const root = useRef()
  const intro = useRef()
  const idle = useRef()

  const textures = useTexture(SOURCES)

  const materials = useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      t.generateMipmaps = true
      t.minFilter = THREE.LinearMipmapLinearFilter
      t.needsUpdate = true
    })
    const mascot = createMascotMaterial(textures[0])
    const halo = createGlowMaterial('#2f8bff')
    return { mascot, halo }
  }, [textures])

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  useImperativeHandle(ref, () => ({ root, intro, idle, materials, textures }), [materials, textures])

  return (
    <group ref={root}>
      <group ref={intro}>
        <group ref={idle}>
          <mesh material={materials.halo} position-z={-0.1} scale={[MASCOT_ASPECT * 1.7, 1.25, 1]} renderOrder={0}>
            <planeGeometry />
          </mesh>
          <mesh material={materials.mascot} renderOrder={2}>
            <planeGeometry args={[MASCOT_ASPECT, 1]} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

export default ToothModel
