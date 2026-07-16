import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { usePointerTracking } from './usePointerTracking'

// Faster/lighter than the entity's head or torso damping, so the orb
// reads as reacting to the cursor more eagerly than the figure does.
const FOLLOW_DAMP = 7.5
const MAX_OFFSET_X = 0.16
const MAX_OFFSET_Y = 0.12

function BlackHole({ position = [0, 0, 0], radius = 0.5 }) {
  const pointer = usePointerTracking()
  const followRef = useRef(null)

  useFrame((_, delta) => {
    if (!followRef.current) return
    const followPosition = followRef.current.position
    followPosition.x = THREE.MathUtils.damp(followPosition.x, pointer.x * MAX_OFFSET_X, FOLLOW_DAMP, delta)
    followPosition.y = THREE.MathUtils.damp(followPosition.y, -pointer.y * MAX_OFFSET_Y, FOLLOW_DAMP, delta)
  })

  return (
    <group position={position}>
      <group ref={followRef}>
        <pointLight color="#FF741F" intensity={4} distance={3} decay={2} />

        <mesh>
          <torusGeometry args={[radius, radius * 0.18, 16, 48]} />
          <meshStandardMaterial
            color="#FF741F"
            emissive="#FF741F"
            emissiveIntensity={2.2}
            roughness={0.35}
            metalness={0.25}
            toneMapped={false}
          />
        </mesh>

        <mesh>
          <circleGeometry args={[radius * 0.68, 32]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      </group>
    </group>
  )
}

export default BlackHole
