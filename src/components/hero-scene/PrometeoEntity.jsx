import * as THREE from 'three'

const DARK_PRIMARY = '#14161a'
const DARK_SECONDARY = '#2b2f36'

const SHOULDER_R = [0.5, 1.45, 0]
const ELBOW_R = [0.95, 1.3, 0.4]
// Exported so BlackHole.jsx and HeroScene's frame-fit math can reference
// the open palm without duplicating the arm's geometry.
export const HAND_TIP_POSITION = [1.3, 1.05, 0.85]

const SHOULDER_L = [-0.55, 1.5, 0]
const ELBOW_L = [-0.6, 0.82, 0.05]
const HAND_L = [-0.58, 0.3, 0.05]

const HIP_R = [0.22, 0, 0]
const FOOT_R = [0.24, -1.6, 0.1]
const HIP_L = [-0.22, 0, 0]
const FOOT_L = [-0.24, -1.6, 0.1]

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
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 1.3, 16]} />
        <meshStandardMaterial color={DARK_PRIMARY} roughness={0.6} metalness={0.15} />
      </mesh>

      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color={DARK_SECONDARY} roughness={0.5} metalness={0.1} />
      </mesh>

      <Limb start={HIP_R} end={FOOT_R} radius={0.19} color={DARK_PRIMARY} />
      <Limb start={HIP_L} end={FOOT_L} radius={0.19} color={DARK_PRIMARY} />

      <Limb start={SHOULDER_L} end={ELBOW_L} radius={0.15} />
      <Limb start={ELBOW_L} end={HAND_L} radius={0.13} />
      <mesh position={HAND_L} scale={[1.2, 0.55, 1]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={DARK_SECONDARY} roughness={0.5} metalness={0.1} />
      </mesh>

      <Limb start={SHOULDER_R} end={ELBOW_R} radius={0.16} />
      <Limb start={ELBOW_R} end={HAND_TIP_POSITION} radius={0.14} />
      <mesh position={HAND_TIP_POSITION} scale={[1.35, 0.5, 1.1]}>
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshStandardMaterial color={DARK_SECONDARY} roughness={0.45} metalness={0.15} />
      </mesh>
    </group>
  )
}

export default PrometeoEntity
