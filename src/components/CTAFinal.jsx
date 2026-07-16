import { motion } from 'motion/react'
import Logo from './Logo'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

function CTAFinal() {
  return (
    <section id="cta" className="bg-prometeo-red py-24 text-white sm:py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={container}
        className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center"
      >
        <motion.div variants={fadeUp}>
          <Logo className="h-16 w-16" tone="onDark" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="font-heading text-4xl uppercase leading-[0.95] sm:text-5xl"
          style={{ textShadow: '4px 4px 0 #1B2D7C' }}
        >
          El fuego no espera. Tu negocio tampoco debería.
        </motion.h2>

        <motion.p variants={fadeUp} className="max-w-2xl text-lg text-white/90">
          Agenda tu diagnóstico Prometeo y descubre en qué punto exacto se está apagando tu
          negocio, y qué sistema necesita para volver a arder.
        </motion.p>

        <motion.a
          variants={fadeUp}
          href="#"
          className="inline-flex items-center justify-center rounded-md bg-white px-10 py-5 font-heading text-lg uppercase tracking-wide text-prometeo-red shadow-[6px_6px_0_0_#1B2D7C] transition-transform hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#1B2D7C] active:translate-y-0 active:shadow-[3px_3px_0_0_#1B2D7C]"
        >
          Quiero mi diagnóstico
        </motion.a>

        <motion.p variants={fadeUp} className="mt-8 text-xs uppercase tracking-[0.3em] text-white/60">
          Sistema Prometeo
        </motion.p>
      </motion.div>
    </section>
  )
}

export default CTAFinal
