import { useEffect } from 'react'

// Shared across every consumer so we attach a single window listener
// instead of one per component, and so React state/re-renders never
// enter the animation loop — consumers read this mutable object inside
// useFrame instead of subscribing to it.
const pointer = { x: 0, y: 0 }
let listenerCount = 0

function handlePointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1
}

const finePointerQuery = () => window.matchMedia('(hover: hover) and (pointer: fine)')

// Devices without a real mouse (touch-only) never get the listener
// attached, so `pointer` stays at (0, 0) and every damped target stays
// at rest — this is what disables the interaction on touch.
export function usePointerTracking() {
  useEffect(() => {
    const mediaQuery = finePointerQuery()
    let attached = false

    const attach = () => {
      if (listenerCount === 0) {
        window.addEventListener('pointermove', handlePointerMove, { passive: true })
      }
      listenerCount += 1
      attached = true
    }

    const detach = () => {
      if (!attached) return
      listenerCount = Math.max(0, listenerCount - 1)
      attached = false
      if (listenerCount === 0) {
        window.removeEventListener('pointermove', handlePointerMove)
        pointer.x = 0
        pointer.y = 0
      }
    }

    const sync = () => (mediaQuery.matches ? attach() : detach())
    sync()
    mediaQuery.addEventListener('change', sync)

    return () => {
      mediaQuery.removeEventListener('change', sync)
      detach()
    }
  }, [])

  return pointer
}
