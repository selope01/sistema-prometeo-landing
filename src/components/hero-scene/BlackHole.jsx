import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { usePointerTracking } from './usePointerTracking'
import OrbitalParticles from './OrbitalParticles'

// Phase 3: faster/lighter than the entity's head or torso damping, so the
// orb reads as reacting to the cursor more eagerly than the figure does.
const FOLLOW_DAMP = 7.5
const MAX_OFFSET_X = 0.16
const MAX_OFFSET_Y = 0.12

// Phase 4: state 1-2 the orb doesn't exist yet; state 3 (0.35-0.55) it
// fades in and drifts in from above/afar onto the palm while igniting.
const ORB_VISIBLE_START = 0.22
const ORB_VISIBLE_END = 0.42
const APPROACH_START = 0.35
const APPROACH_END = 0.55
const APPROACH_FROM = [0.15, 0.85, 1.35]

const EMISSIVE_RISE_START = 0.35
const EMISSIVE_RISE_END = 0.55
const EMISSIVE_MAX = 2.2
const LIGHT_MAX_INTENSITY = 4

// This is the climax, so it stays lit at full (or a touch brighter)
// while the rest of the scene recedes/dims around it (Composition in
// HeroScene.jsx handles the scene-wide fade/scale-down).
const CLIMAX_BOOST_START = 0.85
const CLIMAX_BOOST_END = 1.0
const CLIMAX_BOOST_AMOUNT = 0.2

// Phase 5: accretion disc, slow swirl.
const DISC_ROTATION_SPEED = 0.15

const DISC_VERTEX_SHADER = `
  varying vec2 vPosition;
  void main() {
    vPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Radial gradient: amber near the core -> orange -> red at the outer
// edge, with both edges feathered so it reads as a glowing disc instead
// of a flat-shaded ring. uIntensity pushes the color past 1.0 on purpose
// so Bloom's luminance threshold picks it out from the rest of the scene.
const DISC_FRAGMENT_SHADER = `
  uniform vec3 uColorOuter;
  uniform vec3 uColorMid;
  uniform vec3 uColorInner;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec2 vPosition;

  void main() {
    float dist = length(vPosition);
    float t = clamp((dist - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);

    vec3 color = mix(uColorInner, uColorMid, smoothstep(0.0, 0.5, t));
    color = mix(color, uColorOuter, smoothstep(0.5, 1.0, t));

    float edgeFade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.8, 1.0, t));
    gl_FragColor = vec4(color * uIntensity, uOpacity * edgeFade);
  }
`

function BlackHole({ position = [0, 0, 0], radius = 0.5, scrollProgress }) {
  const pointer = usePointerTracking()
  const approachRef = useRef(null)
  const followRef = useRef(null)
  const discRef = useRef(null)
  const lightRef = useRef(null)
  const discMaterialRef = useRef(null)
  const coreMaterialRef = useRef(null)
  const orbOpacityRef = useRef(0)

  const innerRadius = radius * 0.62
  const outerRadius = radius * 1.5
  const coreRadius = radius * 0.68

  const discUniforms = useMemo(
    () => ({
      uColorOuter: { value: new THREE.Color('#FF3131') },
      uColorMid: { value: new THREE.Color('#FF741F') },
      uColorInner: { value: new THREE.Color('#FFC94A') },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
      uOpacity: { value: 0 },
      uIntensity: { value: 0 },
    }),
    [innerRadius, outerRadius],
  )

  useFrame((_, delta) => {
    const progress = scrollProgress ? scrollProgress.get() : 1

    if (approachRef.current) {
      const approach = THREE.MathUtils.smoothstep(progress, APPROACH_START, APPROACH_END)
      const target = approachRef.current.position
      target.x = THREE.MathUtils.lerp(APPROACH_FROM[0], 0, approach)
      target.y = THREE.MathUtils.lerp(APPROACH_FROM[1], 0, approach)
      target.z = THREE.MathUtils.lerp(APPROACH_FROM[2], 0, approach)
    }

    if (followRef.current) {
      const followPosition = followRef.current.position
      followPosition.x = THREE.MathUtils.damp(followPosition.x, pointer.x * MAX_OFFSET_X, FOLLOW_DAMP, delta)
      followPosition.y = THREE.MathUtils.damp(followPosition.y, -pointer.y * MAX_OFFSET_Y, FOLLOW_DAMP, delta)
    }

    if (discRef.current) {
      discRef.current.rotation.z += delta * DISC_ROTATION_SPEED
    }

    const orbOpacity = THREE.MathUtils.smoothstep(progress, ORB_VISIBLE_START, ORB_VISIBLE_END)
    const emissiveRise = THREE.MathUtils.smoothstep(progress, EMISSIVE_RISE_START, EMISSIVE_RISE_END)
    const climaxBoost =
      1 + CLIMAX_BOOST_AMOUNT * THREE.MathUtils.smoothstep(progress, CLIMAX_BOOST_START, CLIMAX_BOOST_END)

    orbOpacityRef.current = orbOpacity

    if (discMaterialRef.current) {
      discMaterialRef.current.uniforms.uOpacity.value = orbOpacity
      discMaterialRef.current.uniforms.uIntensity.value = emissiveRise * EMISSIVE_MAX * climaxBoost
    }
    if (coreMaterialRef.current) {
      coreMaterialRef.current.opacity = orbOpacity
    }
    if (lightRef.current) {
      lightRef.current.intensity = emissiveRise * LIGHT_MAX_INTENSITY * climaxBoost
    }
  })

  return (
    <group position={position}>
      <group ref={approachRef}>
        <group ref={followRef}>
          <pointLight ref={lightRef} color="#FF741F" intensity={0} distance={3} decay={2} />

          <mesh ref={discRef}>
            <ringGeometry args={[innerRadius, outerRadius, 64, 1]} />
            <shaderMaterial
              ref={discMaterialRef}
              uniforms={discUniforms}
              vertexShader={DISC_VERTEX_SHADER}
              fragmentShader={DISC_FRAGMENT_SHADER}
              transparent
              depthWrite={false}
            />
          </mesh>

          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[coreRadius, 32]} />
            <meshBasicMaterial ref={coreMaterialRef} color="#050505" transparent opacity={0} />
          </mesh>

          <OrbitalParticles opacityRef={orbOpacityRef} innerRadius={innerRadius} outerRadius={outerRadius} />
        </group>
      </group>
    </group>
  )
}

export default BlackHole
