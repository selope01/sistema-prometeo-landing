import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import PrometeoModel, { CHEST_ANCHOR, WAIST_ANCHOR_Y, BODY_RIGHT_X } from './PrometeoModel'
import BlackHole from './BlackHole'
import AmbientParticles from './AmbientParticles'
import { heroTextBounds } from './heroTextBounds'

const CAMERA_Z = 7.5
const CAMERA_FOV = 36

const BLACKHOLE_FORWARD_OFFSET = 0.3
const BLACKHOLE_RADIUS = 0.4

// Cinematic bust shot: big on wide viewports, tapering down modestly on
// narrow ones. Deliberately NOT clamped by "does the body fit beside the
// text at this width" (that used to collapse the scale on narrow
// viewports and undercut the close-up) -- horizontal text clearance is
// handled separately below, by pushing the figure right (and letting it
// bleed off the edge) instead of shrinking it.
const SCALE_AT_WIDE = 2.35
const SCALE_AT_NARROW = 2.0
const SCALE_WIDE_BREAKPOINT = 1440
const SCALE_NARROW_BREAKPOINT = 768

function scaleForWidth(width) {
  const t = THREE.MathUtils.clamp(
    (width - SCALE_NARROW_BREAKPOINT) / (SCALE_WIDE_BREAKPOINT - SCALE_NARROW_BREAKPOINT),
    0,
    1,
  )
  return THREE.MathUtils.lerp(SCALE_AT_NARROW, SCALE_AT_WIDE, t)
}

// Where the crop's bottom edge (the hips) sits, as a fraction of the
// camera's vertical half-height at the composition's depth -- negative is
// below the viewport's vertical center. -1.05 puts the hip line just past
// the bottom edge of the frustum, so nothing below the hip renders at all
// -- solved together with SCALE_AT_WIDE so the head clears the top with
// headroom to spare (see the framing derivation this replaced).
const WAIST_TARGET_Y = -1.05

const TEXT_SAFETY_GAP_PX = 40
const MIN_OFFSET_X = 0.1

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

// Horizontal placement is driven by the REAL rendered text edge
// (heroTextBounds, measured live in Hero.jsx) converted into world units
// at the composition's depth, not by keeping the body inside the
// frustum -- that's what let the figure shrink itself down on narrow
// viewports instead of just sliding right. The body is allowed to bleed
// off the right edge (capped so its center stays on-screen) rather than
// shrink, so the close-up stays close regardless of viewport width.
function computeFit(camera, size, scale) {
  const aspect = size.width / size.height
  const halfFovRad = ((camera.fov ?? CAMERA_FOV) * Math.PI) / 360
  const k = Math.tan(halfFovRad) * aspect
  const halfHeight = Math.tan(halfFovRad) * CAMERA_Z
  const worldHalfWidth = k * CAMERA_Z

  const pxToWorld = worldHalfWidth / (size.width / 2)
  const textRightWorld = (heroTextBounds.rightEdgePx - size.width / 2) * pxToWorld
  const safetyGapWorld = TEXT_SAFETY_GAP_PX * pxToWorld
  const bodyHalfWidth = BODY_RIGHT_X * scale

  let offsetX = textRightWorld + safetyGapWorld + bodyHalfWidth
  offsetX = Math.max(MIN_OFFSET_X, offsetX)
  offsetX = Math.min(offsetX, worldHalfWidth) // keep at least the body's center on-screen

  const offsetY = WAIST_TARGET_Y * halfHeight - WAIST_ANCHOR_Y * scale

  return { offsetX, offsetY }
}

function Composition({ scrollProgress, orbitalParticleCount }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const groupRef = useRef(null)

  useFrame(() => {
    if (!groupRef.current) return
    const progress = scrollProgress ? scrollProgress.get() : 1

    const baseScale = scaleForWidth(size.width)
    const { offsetX, offsetY } = computeFit(camera, size, baseScale)

    const recede = 1 - RECEDE_AMOUNT * THREE.MathUtils.smoothstep(progress, RECEDE_START, RECEDE_END)
    groupRef.current.scale.setScalar(baseScale * recede)

    const drift = THREE.MathUtils.smoothstep(progress, LATE_DRIFT_START, LATE_DRIFT_END)
    groupRef.current.position.x = offsetX + LATE_DRIFT_X * drift
    groupRef.current.position.y = offsetY + LATE_DRIFT_Y * drift
  })

  return (
    <group ref={groupRef}>
      <PrometeoModel scrollProgress={scrollProgress} />
      <BlackHole
        scrollProgress={scrollProgress}
        particleCount={orbitalParticleCount}
        position={[CHEST_ANCHOR[0], CHEST_ANCHOR[1], CHEST_ANCHOR[2] + BLACKHOLE_FORWARD_OFFSET]}
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
