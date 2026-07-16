import { motion } from 'motion/react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const pillars = [
  {
    title: 'Fuerza',
    text: 'Diagnóstico brutalmente honesto de tu negocio: números, procesos y decisiones sin maquillaje.',
  },
  {
    title: 'Fuego',
    text: 'Estrategia que enciende a todo el equipo y convierte la visión en acción todos los días.',
  },
  {
    title: 'Rebeldía',
    text: 'Rompemos con el "siempre se hizo así" para construir un negocio que juega bajo sus propias reglas.',
  },
]

function QueEsPrometeo() {
  return (
    <section id="prometeo" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          className="text-center font-heading text-3xl uppercase leading-none text-prometeo-navy sm:text-4xl"
        >
          Del caos al sistema
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={container}
          className="mt-16 grid gap-16 lg:grid-cols-2 lg:items-center"
        >
          <motion.div variants={fadeUp}>
            <span className="font-heading text-sm uppercase tracking-[0.35em] text-prometeo-red">
              Qué es Prometeo
            </span>
            <h2 className="mt-4 font-heading text-4xl uppercase leading-[0.95] text-prometeo-navy sm:text-5xl">
              El sistema que le roba el fuego a la mediocridad
            </h2>
            <p className="mt-6 text-lg text-prometeo-navy/70">
              Prometeo no es un curso ni una consultoría más. Es una metodología de negocios
              diseñada para dueños que están cansados de improvisar: un sistema que ordena la
              estrategia, enciende la ejecución y sostiene los resultados en el tiempo.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="grid gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-lg border-2 border-prometeo-navy bg-white p-6 shadow-[6px_6px_0_0_#1B2D7C]"
              >
                <h3 className="font-heading text-2xl uppercase text-prometeo-red">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-prometeo-navy/80">{pillar.text}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default QueEsPrometeo
