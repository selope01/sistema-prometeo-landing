// Static stand-in shown while HeroScene's chunk loads, and permanently when
// prefers-reduced-motion is on. Swap the gradient for an <img> once a real
// hero illustration/render exists.
function SceneFallback() {
  return (
    <div
      aria-hidden="true"
      className="h-full w-full opacity-20 [background:radial-gradient(circle_at_50%_45%,#1B2D7C_0,transparent_55%)]"
    />
  )
}

export default SceneFallback
