import { useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import PrometeoEntity, { HAND_TIP_POSITION } from './PrometeoEntity'
import BlackHole from './BlackHole'
import { prefersFinePointer } from './usePointerTracking'

const CAMERA_Z = 7.5
const CAMERA_FOV = 36

const BLACKHOLE_FORWARD_OFFSET = 0.3
const BLACKHOLE_RADIUS = 0.5

const DESIRED_SCALE = 1
const DESIRED_OFFSET_X = 1.5
const MIN_OFFSET_X = 0.15
const EDGE_MARGIN = 0.25

// The hand + energy orb are the closest and right-most points of the
// composition, so perspective foreshortens them the most. Solve for the
// largest scale/offset that still keeps that point inside the camera
// frustum, for the frame's actual aspect ratio, instead of guessing fixed
// numbers that only work at one viewport size.
function useFrameFit() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  return useMemo(() => {
    const aspect = size.width / size.height
    const halfFovRad = ((camera.fov ?? CAMERA_FOV) * Math.PI) / 360
    const k = Math.tan(halfFovRad) * aspect

    const nearZLocal = HAND_TIP_POSITION[2] + BLACKHOLE_FORWARD_OFFSET
    const rightXLocal = HAND_TIP_POSITION[0] + BLACKHOLE_RADIUS

    const maxScale = (k * CAMERA_Z - MIN_OFFSET_X - EDGE_MARGIN) / (rightXLocal + k * nearZLocal)
    const scale = Math.min(DESIRED_SCALE, Math.max(0.3, maxScale))

    const halfWidthAtNearest = k * (CAMERA_Z - nearZLocal * scale)
    const offsetX = Math.min(DESIRED_OFFSET_X, halfWidthAtNearest - rightXLocal * scale - EDGE_MARGIN)

    return { offsetX: Math.max(MIN_OFFSET_X, offsetX), scale }
  }, [camera, size])
}

function Composition() {
  const { offsetX, scale } = useFrameFit()

  return (
    <group position={[offsetX, -0.3, 0]} scale={scale}>
      <PrometeoEntity />
      <BlackHole
        position={[
          HAND_TIP_POSITION[0],
          HAND_TIP_POSITION[1] + 0.12,
          HAND_TIP_POSITION[2] + BLACKHOLE_FORWARD_OFFSET,
        ]}
      />
    </group>
  )
}

function HeroScene() {
  // Continuous rendering is needed for the cursor-follow damping in
  // PrometeoEntity/BlackHole, but only where that interaction is actually
  // active. Touch-only devices keep "demand" (Phase 1 default) since
  // nothing animates on them, saving battery.
  const [frameloop] = useState(() => (prefersFinePointer() ? 'always' : 'demand'))

  return (
    <Canvas
      className="h-full w-full"
      style={{ pointerEvents: 'none' }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
      frameloop={frameloop}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#1B2D7C" />
      <Composition />
    </Canvas>
  )
}

export default HeroScene
