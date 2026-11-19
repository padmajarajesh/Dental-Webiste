import * as THREE from 'three'

/**
 * Material for the mascot: two of the five pose textures on ONE plane,
 * cross-faded by uMix (0 = uA, 1 = uB). All poses share one canvas, so the
 * swap never shifts him.
 *
 * The character's pixels are output exactly as in the source image: no
 * hologram, grid, scan, tint or filter. The only effect is a soft blue glow
 * drawn OUTSIDE the silhouette (uRim), shifting warm near the smile reveal.
 */
export function createMascotMaterial(sample) {
  const img = sample.image
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uA: { value: sample },
      uB: { value: sample },
      uMix: { value: 0 },
      uTexel: { value: new THREE.Vector2(1 / img.width, 1 / img.height) },
      uRim: { value: 1 },
      uWarm: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uA, uB;
      uniform vec2 uTexel;
      uniform float uMix, uRim, uWarm, uOpacity;
      varying vec2 vUv;

      // Overlapping cross-fade: A fades out over the first 60%, B in over the last 60%.
      vec2 weights() {
        return vec2(1.0 - smoothstep(0.0, 0.6, uMix), smoothstep(0.4, 1.0, uMix));
      }
      // premultiplied "over" of B on top of A
      vec4 pm(vec4 t) { return vec4(t.rgb * t.a, t.a); }
      vec4 pose(vec2 uv, vec2 w) {
        vec4 a = w.x > 0.001 ? pm(texture2D(uA, uv)) * w.x : vec4(0.0);
        vec4 b = w.y > 0.001 ? pm(texture2D(uB, uv)) * w.y : vec4(0.0);
        return b + a * (1.0 - b.a);
      }
      float alphaAt(vec2 uv, vec2 w) {
        float a = w.x > 0.001 ? texture2D(uA, uv).a * w.x : 0.0;
        float b = w.y > 0.001 ? texture2D(uB, uv).a * w.y : 0.0;
        return b + a * (1.0 - b);
      }

      void main() {
        vec2 w = weights();
        vec4 tex = pose(vUv, w);
        float a = tex.a;

        // Soft outer glow: alpha sampled on two rings, only where the character is NOT
        float r1 = 0.0, r2 = 0.0;
        for (int i = 0; i < 8; i++) {
          float ang = float(i) * 0.7853982;
          vec2 d = vec2(cos(ang), sin(ang)) * uTexel;
          r1 = max(r1, alphaAt(vUv + d * 6.0, w));
          r2 = max(r2, alphaAt(vUv + d * 14.0, w));
        }
        float outer = (r1 * 0.6 + r2 * 0.3) * (1.0 - a);
        vec3 rimCol = mix(vec3(0.2, 0.55, 1.0), vec3(1.0, 0.9, 0.78), uWarm);
        float rimA = outer * (0.08 + uRim * 0.1);

        // Original colours untouched: un-premultiply, then composite over the glow
        vec3 col = tex.rgb / max(a, 1e-4);
        float outA = clamp(a + rimA * (1.0 - a), 0.0, 1.0);
        vec3 outC = mix(rimCol, col, a / max(outA, 1e-4));
        if (outA < 0.004) discard;
        gl_FragColor = vec4(outC, outA * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  })
}

/** Soft additive glow (halo behind the character). */
export function createGlowMaterial(color = '#2f8bff') {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float halo = smoothstep(0.5, 0.0, length(vUv - 0.5));
        gl_FragColor = vec4(uColor, halo * halo * uOpacity);
      }
    `,
  })
}
