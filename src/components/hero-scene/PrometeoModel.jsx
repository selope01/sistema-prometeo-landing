import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import PrometeoEntity from './PrometeoEntity'
import { usePointerTracking } from './usePointerTracking'
import modelUrl from '../../assets/models/prometeo-entity.glb'

// This asset is a single static (unrigged, no skeleton/animations) mesh --
// confirmed via `gltf-transform inspect`: one mesh, one material, no
// JOINTS_0/WEIGHTS_0 attributes, "No animations found". Unlike
// PrometeoEntity's primitives (independent head/torso/arm groups), there
// are no separate parts to move here, so the cursor look and the scroll
// narrative both act on the WHOLE model instead of individual limbs:
//  - cursor (Phase 3): the whole figure leans/turns toward the cursor,
//    at the same subtlety the torso used to.
//  - scroll (Phase 4): opacity fade stands in for "the entity appears";
//    a whole-body emissive pulse stands in for "energy travels through
//    the arm" (there's no separate arm material/UV region to mask).
//
// bbox (gltf-transform inspect): X [-0.312, 0.312], Y [-1, 1], Z [-0.18, 0.18]
// -- a ~2 unit tall figure centered on its own origin, standing with arms
// at its sides (confirmed visually). SCALE/Y_OFFSET re-derive the same
// visual height/footing the old primitive figure had.
const SCALE = 1.9
const Y_OFFSET = 0.3

// The body's own half-width in Composition-local space (mesh half-width
// converted through SCALE), used by HeroScene to know how far left the
// figure's shoulder/arm actually reaches when placing it clear of the
// hero text.
export const BODY_RIGHT_X = 0.312 * SCALE

// Confirmed geometrically (not guessed) via two independent signals on
// the source mesh: the chest/belly's outward normal points almost purely
// +Z (0.996), and below the knee the -Z side bulges much more than +Z
// (calf muscle at the back, flat shin at the front) -- so +Z is the
// model's front, matching the camera by default. rotation.y=0 is
// therefore already front-on; this is just a *subtle* turn so the
// hand-side isn't perfectly flat-on, not a reveal of the back. Negative
// rotation.y moves the +X side (screen-right, where the orb sits) toward
// +Z (camera) -- kept small on purpose after the first attempt (-0.32)
// turned too far.
const BASE_ROTATION_Y = -0.12

// Where the energy orb floats, in the same local space BlackHole and
// HeroScene's computeFit use (already scaled by SCALE and offset by
// Y_OFFSET, but not yet by the outer per-viewport fit scale).
//
// The hero is now framed as a medium/waist-up shot (see HeroScene.jsx),
// which crops out the hand hanging near hip height -- so the orb anchors
// beside the chest/shoulder instead, where it stays inside frame. X sits
// just outside the shoulder's own extent (~0.312 * SCALE) so the orb
// reads as floating beside the body rather than inside it; Y sits
// between the neck (~0.8 * SCALE + Y_OFFSET) and the torso; Z is pulled
// in closer to the body than the old outstretched-hand anchor.
export const CHEST_ANCHOR = [0.62, 1.35, 0.2]

// Composition-local Y of the hip line -- HeroScene's computeFit anchors
// the medium-shot crop's bottom edge here so it stays put regardless of
// the per-viewport fit scale. Hips sit very close to the vertical
// midpoint of standing height (legs are close to half of total height),
// slightly below it: meshY=-0.05 out of the [-1, 1] bbox, converted
// through SCALE/Y_OFFSET like any other point in this space.
const WAIST_MESH_Y = -0.05
export const WAIST_ANCHOR_Y = WAIST_MESH_Y * SCALE + Y_OFFSET

const HEAD_MAX_PITCH = 0.1
const HEAD_MAX_ROLL = 0.14
const HEAD_DAMP = 2.8

const VISIBILITY_START = 0.05
const VISIBILITY_END = 0.35
const SCALE_GROW_START = 0.1
const SCALE_GROW_END = 0.35
const SCALE_GROW_FROM = 0.85

const ENERGY_RISE_START = 0.55
const ENERGY_RISE_PEAK = 0.63
const ENERGY_FALL_START = 0.68
const ENERGY_FALL_END = 0.8
const ENERGY_MAX_EMISSIVE = 0.9
const ENERGY_PULSE_SPEED = 6
const ENERGY_COLOR = '#FF741F'

const LATE_FADE_START = 0.75
const LATE_FADE_END = 1.0
const LATE_FADE_AMOUNT = 0.3

function PrometeoModelView({ scene, scrollProgress }) {
  const pointer = usePointerTracking()
  const groupRef = useRef(null)
  const materialsRef = useRef([])

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    const materials = []
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const material = child.material.clone()
        material.transparent = true
        material.emissive = new THREE.Color(ENERGY_COLOR)
        material.emissiveIntensity = 0
        materials.push(material)
        child.material = material
      }
    })
    materialsRef.current = materials
    return clone
  }, [scene])

  useFrame((state, delta) => {
    const progress = scrollProgress ? scrollProgress.get() : 1

    if (groupRef.current) {
      const rotation = groupRef.current.rotation
      rotation.x = THREE.MathUtils.damp(rotation.x, -pointer.y * HEAD_MAX_PITCH, HEAD_DAMP, delta)
      rotation.z = THREE.MathUtils.damp(rotation.z, pointer.x * HEAD_MAX_ROLL, HEAD_DAMP, delta)

      const grow = THREE.MathUtils.smoothstep(progress, SCALE_GROW_START, SCALE_GROW_END)
      groupRef.current.scale.setScalar(SCALE * THREE.MathUtils.lerp(SCALE_GROW_FROM, 1, grow))
    }

    const visibility = THREE.MathUtils.smoothstep(progress, VISIBILITY_START, VISIBILITY_END)
    const lateFade = 1 - LATE_FADE_AMOUNT * THREE.MathUtils.smoothstep(progress, LATE_FADE_START, LATE_FADE_END)
    const opacity = visibility * lateFade

    const energyEnvelope =
      THREE.MathUtils.smoothstep(progress, ENERGY_RISE_START, ENERGY_RISE_PEAK) *
      (1 - THREE.MathUtils.smoothstep(progress, ENERGY_FALL_START, ENERGY_FALL_END))
    const pulse = 0.75 + 0.25 * Math.sin(state.clock.elapsedTime * ENERGY_PULSE_SPEED)

    for (const material of materialsRef.current) {
      material.opacity = opacity
      material.emissiveIntensity = energyEnvelope * pulse * ENERGY_MAX_EMISSIVE
    }
  })

  return (
    <group ref={groupRef} position={[0, Y_OFFSET, 0]} rotation={[0, BASE_ROTATION_Y, 0]} scale={SCALE}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Loads the GLB with a plain GLTFLoader + local state instead of drei's
// Suspense-based useGLTF -- wrapping a useFrame-driven child in a React
// <Suspense> boundary reproducibly broke that child's useFrame
// registration in this R3F/React version (confirmed while debugging this
// phase: removing the Suspense boundary was the only thing that fixed
// it). This sidesteps the interaction entirely and gives the same
// "PrometeoEntity while unavailable" fallback the phase asked for.
function PrometeoModel({ scrollProgress }) {
  const [scene, setScene] = useState(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()
    // The shipped .glb is gltf-transform's `optimize` output (quantized
    // geometry + WebP textures, 12.1MB -> ~1.7MB). Deliberately not using
    // EXT_meshopt_compression here: it needs a MeshoptDecoder wired in,
    // and while debugging this phase that decode path silently never
    // resolved (no onLoad, no onError) in this sandbox. Quantization +
    // WebP need no extra runtime decoder -- GLTFLoader handles both
    // natively -- and still cut the file by ~86%.
    loader.load(
      modelUrl,
      (gltf) => {
        if (!cancelled) setScene(gltf.scene)
      },
      undefined,
      (error) => {
        console.error('PrometeoModel failed to load, falling back to the primitive figure:', error)
        if (!cancelled) setHasError(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  if (hasError || !scene) {
    return <PrometeoEntity scrollProgress={scrollProgress} />
  }

  return <PrometeoModelView scene={scene} scrollProgress={scrollProgress} />
}

export default PrometeoModel
