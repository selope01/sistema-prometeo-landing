import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const PARTICLE_COUNT = 40

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

// Small swirl of embers orbiting inside the accretion disc's own radius
// band -- one BufferGeometry/Points draw call, positions recomputed on
// the CPU each frame (cheap at this count) instead of re-creating the
// geometry, so React never re-renders for it.
function OrbitalParticles({ opacityRef, innerRadius, outerRadius }) {
  const pointsRef = useRef(null)
  const materialRef = useRef(null)

  const { positions, particles } = useMemo(() => {
    const array = new Float32Array(PARTICLE_COUNT * 3)
    const data = Array.from({ length: PARTICLE_COUNT }, () => {
      const orbitRadius = randomBetween(innerRadius * 1.1, outerRadius * 0.95)
      return {
        radius: orbitRadius,
        angle: randomBetween(0, Math.PI * 2),
        // Inner orbits move faster, like real Keplerian motion.
        speed: randomBetween(0.5, 1.1) / orbitRadius,
        z: randomBetween(-0.05, 0.05),
      }
    })
    return { positions: array, particles: data }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    const geometry = pointsRef.current?.geometry
    if (geometry) {
      const array = geometry.attributes.position.array
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i]
        particle.angle += particle.speed * delta
        array[i * 3] = Math.cos(particle.angle) * particle.radius
        array[i * 3 + 1] = Math.sin(particle.angle) * particle.radius
        array[i * 3 + 2] = particle.z
      }
      geometry.attributes.position.needsUpdate = true
    }

    if (materialRef.current) {
      materialRef.current.opacity = (opacityRef?.current ?? 0) * 0.9
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#ffd37a"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default OrbitalParticles
