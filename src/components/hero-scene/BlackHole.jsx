function BlackHole({ position = [0, 0, 0], radius = 0.5 }) {
  return (
    <group position={position}>
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
  )
}

export default BlackHole
