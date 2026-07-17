import { useEffect } from 'react'

// Shared mutable value, written by Hero.jsx (which measures the actual
// rendered right edge of the headline + CTA row via ResizeObserver) and
// read every frame by HeroScene's Composition. The 3D figure's horizontal
// placement reacts to the REAL text width instead of a guessed constant --
// Tailwind's max-w-* is an upper bound the text rarely fills (center-aligned
// text hugs its own glyphs), and the gap between headline/body copy widths
// shifts across the sm/md breakpoints, so a hardcoded pixel table would
// either overlap the real text or push the figure needlessly far off-frame.
export const heroTextBounds = {
  rightEdgePx: typeof window !== 'undefined' ? window.innerWidth * 0.65 : 800,
}

export function useHeroTextBoundsTracking(headlineRef, ctaRowRef) {
  useEffect(() => {
    const elements = [headlineRef.current, ctaRowRef.current].filter(Boolean)
    if (elements.length === 0) return undefined

    const update = () => {
      heroTextBounds.rightEdgePx = Math.max(...elements.map((el) => el.getBoundingClientRect().right))
    }

    update()
    const observer = new ResizeObserver(update)
    elements.forEach((el) => observer.observe(el))
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [headlineRef, ctaRowRef])
}
