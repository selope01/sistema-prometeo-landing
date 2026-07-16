import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// State 1 (0-0.15): darkness + drifting specks, no entity yet. They fade
// out as the entity fades in (Phase 4's VISIBILITY_START/END on
// PrometeoEntity), so the two hand off to each other instead of both
// being visible mid-transition.
const BOUNDS = { x: [-3.5, 4], y: [-2, 3], z: [-1.5, 3] }
const MAX_OPACITY = 0.85
const FADE_START = 0.15
const FADE_END = 0.35
const DRIFT_SPEED = 0.02

function randomInRange([min, max]) {
  return min + Math.random() * (max - min)
}

function AmbientParticles({ scrollProgress, count = 160 }) {
  const pointsRef = useRef(null)
  const materialRef = useRef(null)

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      array[i * 3] = randomInRange(BOUNDS.x)
      array[i * 3 + 1] = randomInRange(BOUNDS.y)
      array[i * 3 + 2] = randomInRange(BOUNDS.z)
    }
    return array
  }, [count])

  useFrame((_, delta) => {
    const progress = scrollProgress ? scrollProgress.get() : 1

    if (materialRef.current) {
      const fade = 1 - THREE.MathUtils.smoothstep(progress, FADE_START, FADE_END)
      materialRef.current.opacity = MAX_OPACITY * fade
    }
    // Slow, cheap drift so the field reads as floating rather than a
    // frozen sprite -- a single rotation update, negligible cost.
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * DRIFT_SPEED
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#f1f5f9"
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

export default AmbientParticles
