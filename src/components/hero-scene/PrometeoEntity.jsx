import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { usePointerTracking } from './usePointerTracking'

const DARK_PRIMARY = '#14161a'
const DARK_SECONDARY = '#2b2f36'

// Torso and head rotate around off-center pivots (hip / neck) instead of
// their own mesh center. A symmetric sphere or a cylinder spinning on its
// own vertical axis shows no visible change — pivoting from below turns
// the same rotation into a visible lean/swing, like a real neck joint.
const TORSO_PIVOT = [0, 0.25, 0]
const TORSO_LOCAL_CENTER = [0, 0.65, 0] // absolute y 0.9, unchanged from Phase 2
const NECK_PIVOT = [0, 1.3, 0] // relative to TORSO_PIVOT -> absolute y 1.55
const HEAD_LOCAL_CENTER = [0, 0.3, 0] // absolute y 1.85, unchanged from Phase 2

const SHOULDER_R = [0.5, 1.45, 0]
const ELBOW_R = [0.95, 1.3, 0.4]
// Exported so BlackHole.jsx and HeroScene's frame-fit math can reference
// the open palm without duplicating the arm's geometry. Stays absolute
// and unchanged from Phase 2 at rest (pointer at rotation 0).
export const HAND_TIP_POSITION = [1.3, 1.05, 0.85]

const ARM_ORIGIN = [0, 0, 0]
const ARM_LOCAL_ELBOW = [
  ELBOW_R[0] - SHOULDER_R[0],
  ELBOW_R[1] - SHOULDER_R[1],
  ELBOW_R[2] - SHOULDER_R[2],
]
const ARM_LOCAL_HAND = [
  HAND_TIP_POSITION[0] - SHOULDER_R[0],
  HAND_TIP_POSITION[1] - SHOULDER_R[1],
  HAND_TIP_POSITION[2] - SHOULDER_R[2],
]

const SHOULDER_L = [-0.55, 1.5, 0]
const ELBOW_L = [-0.6, 0.82, 0.05]
const HAND_L = [-0.58, 0.3, 0.05]

const HIP_R = [0.22, 0, 0]
const FOOT_R = [0.24, -1.6, 0.1]
const HIP_L = [-0.22, 0, 0]
const FOOT_L = [-0.24, -1.6, 0.1]

// THREE.MathUtils.damp speeds: higher = snappier/lighter, lower = slower
// and heavier. The head is intentionally the slowest of the three so it
// reads as "settling into" the look instead of snapping to the cursor.
const HEAD_DAMP = 2.4
const TORSO_DAMP = 3.6
const ARM_DAMP = 6.5

const HEAD_MAX_PITCH = 0.12
const HEAD_MAX_ROLL = 0.16
const TORSO_MAX_PITCH = 0.05
const TORSO_MAX_ROLL = 0.07
const ARM_MAX_PITCH = 0.12
const ARM_MAX_YAW = 0.16

function limbSegment(start, end, radius, segments = 10) {
  const startVector = new THREE.Vector3(...start)
  const endVector = new THREE.Vector3(...end)
  const direction = new THREE.Vector3().subVectors(endVector, startVector)
  const length = direction.length()
  const position = new THREE.Vector3().addVectors(startVector, endVector).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  )

  return { position: position.toArray(), quaternion, args: [radius, radius, length, segments] }
}

function Limb({ start, end, radius, color = DARK_SECONDARY }) {
  const segment = limbSegment(start, end, radius)
  return (
    <mesh position={segment.position} quaternion={segment.quaternion}>
      <cylinderGeometry args={segment.args} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.15} />
    </mesh>
  )
}

function PrometeoEntity() {
  const pointer = usePointerTracking()
  const torsoRef = useRef(null)
  const headRef = useRef(null)
  const armRef = useRef(null)

  useFrame((_, delta) => {
    if (torsoRef.current) {
      const rotation = torsoRef.current.rotation
      rotation.x = THREE.MathUtils.damp(rotation.x, -pointer.y * TORSO_MAX_PITCH, TORSO_DAMP, delta)
      rotation.z = THREE.MathUtils.damp(rotation.z, pointer.x * TORSO_MAX_ROLL, TORSO_DAMP, delta)
    }
    if (headRef.current) {
      const rotation = headRef.current.rotation
      rotation.x = THREE.MathUtils.damp(rotation.x, -pointer.y * HEAD_MAX_PITCH, HEAD_DAMP, delta)
      rotation.z = THREE.MathUtils.damp(rotation.z, pointer.x * HEAD_MAX_ROLL, HEAD_DAMP, delta)
    }
    if (armRef.current) {
      const rotation = armRef.current.rotation
      rotation.x = THREE.MathUtils.damp(rotation.x, -pointer.y * ARM_MAX_PITCH, ARM_DAMP, delta)
      rotation.y = THREE.MathUtils.damp(rotation.y, pointer.x * ARM_MAX_YAW, ARM_DAMP, delta)
    }
  })

  return (
    <group>
      <group ref={torsoRef} position={TORSO_PIVOT}>
        <mesh position={TORSO_LOCAL_CENTER}>
          <cylinderGeometry args={[0.42, 0.5, 1.3, 16]} />
          <meshStandardMaterial color={DARK_PRIMARY} roughness={0.6} metalness={0.15} />
        </mesh>

        <group ref={headRef} position={NECK_PIVOT}>
          <mesh position={HEAD_LOCAL_CENTER}>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial color={DARK_SECONDARY} roughness={0.5} metalness={0.1} />
          </mesh>
        </group>
      </group>

      <Limb start={HIP_R} end={FOOT_R} radius={0.19} color={DARK_PRIMARY} />
      <Limb start={HIP_L} end={FOOT_L} radius={0.19} color={DARK_PRIMARY} />

      <Limb start={SHOULDER_L} end={ELBOW_L} radius={0.15} />
      <Limb start={ELBOW_L} end={HAND_L} radius={0.13} />
      <mesh position={HAND_L} scale={[1.2, 0.55, 1]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={DARK_SECONDARY} roughness={0.5} metalness={0.1} />
      </mesh>

      <group ref={armRef} position={SHOULDER_R}>
        <Limb start={ARM_ORIGIN} end={ARM_LOCAL_ELBOW} radius={0.16} />
        <Limb start={ARM_LOCAL_ELBOW} end={ARM_LOCAL_HAND} radius={0.14} />
        <mesh position={ARM_LOCAL_HAND} scale={[1.35, 0.5, 1.1]}>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial color={DARK_SECONDARY} roughness={0.45} metalness={0.15} />
        </mesh>
      </group>
    </group>
  )
}

export default PrometeoEntity
