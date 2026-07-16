import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { usePointerTracking } from './usePointerTracking'

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

// State 5: this is the climax, so it stays lit at full (or even a touch
// brighter) while the rest of the scene recedes/dims around it -- see
// Composition in HeroScene.jsx for the scene-wide fade/scale-down.
const CLIMAX_BOOST_START = 0.85
const CLIMAX_BOOST_END = 1.0
const CLIMAX_BOOST_AMOUNT = 0.2

function BlackHole({ position = [0, 0, 0], radius = 0.5, scrollProgress }) {
  const pointer = usePointerTracking()
  const approachRef = useRef(null)
  const followRef = useRef(null)
  const lightRef = useRef(null)
  const torusMaterialRef = useRef(null)
  const coreMaterialRef = useRef(null)

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

    const orbOpacity = THREE.MathUtils.smoothstep(progress, ORB_VISIBLE_START, ORB_VISIBLE_END)
    const emissiveRise = THREE.MathUtils.smoothstep(progress, EMISSIVE_RISE_START, EMISSIVE_RISE_END)
    const climaxBoost =
      1 + CLIMAX_BOOST_AMOUNT * THREE.MathUtils.smoothstep(progress, CLIMAX_BOOST_START, CLIMAX_BOOST_END)

    if (torusMaterialRef.current) {
      torusMaterialRef.current.opacity = orbOpacity
      torusMaterialRef.current.emissiveIntensity = emissiveRise * EMISSIVE_MAX * climaxBoost
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

          <mesh>
            <torusGeometry args={[radius, radius * 0.18, 16, 48]} />
            <meshStandardMaterial
              ref={torusMaterialRef}
              color="#FF741F"
              emissive="#FF741F"
              emissiveIntensity={0}
              roughness={0.35}
              metalness={0.25}
              transparent
              opacity={0}
              toneMapped={false}
            />
          </mesh>

          <mesh>
            <circleGeometry args={[radius * 0.68, 32]} />
            <meshBasicMaterial ref={coreMaterialRef} color="#050505" transparent opacity={0} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export default BlackHole
