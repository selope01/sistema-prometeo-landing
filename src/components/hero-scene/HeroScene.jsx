import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import PrometeoEntity, { HAND_TIP_POSITION } from './PrometeoEntity'
import BlackHole from './BlackHole'
import AmbientParticles from './AmbientParticles'

const CAMERA_Z = 7.5
const CAMERA_FOV = 36

const BLACKHOLE_FORWARD_OFFSET = 0.3
const BLACKHOLE_RADIUS = 0.5

const DESIRED_SCALE = 1
const DESIRED_OFFSET_X = 1.5
const MIN_OFFSET_X = 0.15
const EDGE_MARGIN = 0.25

// State 5 (0.75-1.00): the scene recedes as the HTML text/CTA take over.
// It shrinks and drifts further right/up (clear of the headline's right
// edge) in the last stretch, but never disappears entirely.
const RECEDE_START = 0.75
const RECEDE_END = 1.0
const RECEDE_AMOUNT = 0.4

const LATE_DRIFT_START = 0.8
const LATE_DRIFT_END = 1.0
const LATE_DRIFT_X = 0.9
const LATE_DRIFT_Y = 0.3

const AMBIENT_PARTICLES_FULL = 160
const AMBIENT_PARTICLES_REDUCED = 70
const ORBITAL_PARTICLES_FULL = 40
const ORBITAL_PARTICLES_REDUCED = 18

// Pauses the render loop while the tab is in the background -- without
// this, frameloop="always" keeps driving useFrame (and the GPU) forever
// even when nobody can see the canvas.
function useVisibilityFrameloop() {
  const [isVisible, setIsVisible] = useState(() => document.visibilityState !== 'hidden')

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return isVisible
}

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

function Composition({ scrollProgress, orbitalParticleCount }) {
  const { offsetX, scale: baseScale } = useFrameFit()
  const groupRef = useRef(null)

  useFrame(() => {
    if (!groupRef.current) return
    const progress = scrollProgress ? scrollProgress.get() : 1
    const recede = 1 - RECEDE_AMOUNT * THREE.MathUtils.smoothstep(progress, RECEDE_START, RECEDE_END)
    groupRef.current.scale.setScalar(baseScale * recede)

    const drift = THREE.MathUtils.smoothstep(progress, LATE_DRIFT_START, LATE_DRIFT_END)
    groupRef.current.position.x = offsetX + LATE_DRIFT_X * drift
    groupRef.current.position.y = -0.3 + LATE_DRIFT_Y * drift
  })

  return (
    <group ref={groupRef} position={[offsetX, -0.3, 0]}>
      <PrometeoEntity scrollProgress={scrollProgress} />
      <BlackHole
        scrollProgress={scrollProgress}
        particleCount={orbitalParticleCount}
        position={[
          HAND_TIP_POSITION[0],
          HAND_TIP_POSITION[1] + 0.12,
          HAND_TIP_POSITION[2] + BLACKHOLE_FORWARD_OFFSET,
        ]}
      />
    </group>
  )
}

function HeroScene({ scrollProgress }) {
  // Bloom adds several extra render passes per frame, and dense particle
  // fields add draw calls -- worth it for the black hole's glow on
  // desktop, but reduced/skipped on touch/coarse-pointer devices
  // (typically weaker GPUs) to keep the narrative animation smooth there.
  const [highPerformance] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const isVisible = useVisibilityFrameloop()

  return (
    <Canvas
      className="h-full w-full"
      style={{ pointerEvents: 'none' }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
      frameloop={isVisible ? 'always' : 'never'}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#1B2D7C" />
      <AmbientParticles
        scrollProgress={scrollProgress}
        count={highPerformance ? AMBIENT_PARTICLES_FULL : AMBIENT_PARTICLES_REDUCED}
      />
      <Composition
        scrollProgress={scrollProgress}
        orbitalParticleCount={highPerformance ? ORBITAL_PARTICLES_FULL : ORBITAL_PARTICLES_REDUCED}
      />
      {highPerformance && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.7} luminanceSmoothing={0.25} mipmapBlur radius={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  )
}

export default HeroScene
