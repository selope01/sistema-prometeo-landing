import { Canvas } from '@react-three/fiber'

function HeroScene() {
  return (
    <Canvas
      className="h-full w-full"
      style={{ pointerEvents: 'none' }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 6], fov: 40 }}
      frameloop="demand"
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#1B2D7C" />
    </Canvas>
  )
}

export default HeroScene
