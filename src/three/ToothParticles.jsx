import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toothState } from '../animation/toothStore'

/**
 * Subtle dust of cyan particles drifting in depth. A single draw call.
 * Warmer near the smile reveal.
 */
export default function ToothParticles({ count = 420 }) {
  const ref = useRef()

  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = -Math.random() * 8 + 1.5
      seed[i] = Math.random()
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uBoost: { value: 0 },
        uWarm: { value: 0 },
        uPx: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uScroll, uPx;
        varying float vSeed;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.05 + aSeed * 0.08) + uScroll * 6.0 + 5.0, 10.0) - 5.0;
          p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.15;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.0 + aSeed * 2.4) * uPx * (6.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vSeed = aSeed;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uBoost, uWarm, uTime;
        varying float vSeed;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          float tw = 0.55 + 0.45 * sin(uTime * (0.8 + vSeed * 2.0) + vSeed * 40.0);
          vec3 col = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.95, 0.88), uWarm);
          gl_FragColor = vec4(col, a * tw * (0.35 + uBoost * 0.45));
        }
      `,
    })
    return { geometry, material }
  }, [count])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uScroll.value = toothState.progress
    u.uWarm.value = toothState.warm * 0.6
  })

  return <points ref={ref} geometry={geometry} material={material} renderOrder={0} />
}
