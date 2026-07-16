import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Logo from './Logo'
import SceneFallback from './hero-scene/SceneFallback'

const HeroScene = lazy(() => import('./hero-scene/HeroScene'))

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const handleChange = (event) => setReduced(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

function Hero() {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <section className="relative overflow-hidden bg-prometeo-red text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-10 [background:radial-gradient(circle_at_20%_20%,#1B2D7C_0,transparent_45%),radial-gradient(circle_at_80%_75%,#1B2D7C_0,transparent_40%)]"
      />

      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {prefersReducedMotion ? (
          <SceneFallback />
        ) : (
          <Suspense fallback={<SceneFallback />}>
            <HeroScene />
          </Suspense>
        )}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex min-h-[92svh] max-w-6xl flex-col items-center justify-center gap-8 px-6 py-24 text-center"
      >
        <motion.div variants={item}>
          <Logo className="h-20 w-20 sm:h-24 sm:w-24" tone="onDark" />
        </motion.div>

        <motion.p
          variants={item}
          className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80"
        >
          Sistema Prometeo
        </motion.p>

        <motion.h1
          variants={item}
          className="max-w-4xl font-heading text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-7xl"
          style={{ textShadow: '4px 4px 0 #1B2D7C' }}
        >
          Roba el fuego.
          <br />
          Lidera la rebelión.
        </motion.h1>

        <motion.p variants={item} className="max-w-2xl text-lg text-white/90 sm:text-xl">
          Prometeo es la metodología que convierte negocios estancados en organizaciones
          imparables: estrategia con fuerza, ejecución con fuego.
        </motion.p>

        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row">
          <a
            href="#metodologia"
            className="inline-flex items-center justify-center rounded-md bg-white px-8 py-4 font-heading text-lg uppercase tracking-wide text-prometeo-red shadow-[6px_6px_0_0_#1B2D7C] transition-transform hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#1B2D7C] active:translate-y-0 active:shadow-[3px_3px_0_0_#1B2D7C]"
          >
            Conocer la metodología
          </a>
          <a
            href="#cta"
            className="inline-flex items-center justify-center rounded-md border-2 border-white px-8 py-4 font-heading text-lg uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-prometeo-red"
          >
            Quiero mi diagnóstico
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Hero
