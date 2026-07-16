import { motion } from 'motion/react'

const steps = [
  {
    number: '01',
    title: 'Diagnóstico',
    text: 'Auditamos tu negocio sin filtros: finanzas, operación, equipo y oferta. La verdad antes que nada.',
  },
  {
    number: '02',
    title: 'Estrategia',
    text: 'Diseñamos el plan que conecta tu visión con metas medibles y decisiones concretas.',
  },
  {
    number: '03',
    title: 'Ejecución',
    text: 'Instalamos rutinas, indicadores y responsables. La disciplina que sostiene el fuego encendido.',
  },
  {
    number: '04',
    title: 'Escala',
    text: 'Sistematizamos lo que funciona para crecer sin que el negocio dependa de ti todo el tiempo.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

function Metodologia() {
  return (
    <section id="metodologia" className="bg-prometeo-navy py-24 text-white sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={container}
          className="text-center"
        >
          <motion.span
            variants={fadeUp}
            className="font-heading text-sm uppercase tracking-[0.35em] text-prometeo-red"
          >
            Metodología
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mx-auto mt-4 max-w-3xl font-heading text-4xl uppercase leading-[0.95] sm:text-5xl"
          >
            Cuatro pasos para encender tu negocio
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="rounded-lg bg-white/5 p-6 ring-1 ring-white/15 transition-colors hover:bg-white/10"
            >
              <span className="font-heading text-5xl text-prometeo-red">{step.number}</span>
              <h3 className="mt-4 font-heading text-xl uppercase">{step.title}</h3>
              <p className="mt-2 text-sm text-white/70">{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Metodologia
