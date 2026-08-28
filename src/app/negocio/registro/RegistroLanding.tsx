"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FAQ_ITEMS = [
  {
    q: "¿Cuánto tarda el alta?",
    a: "Unos minutos. Creás tu cuenta, completás los datos del local y elegís el Plan Inicial gratis. Después podés cargar tu carta desde el panel.",
  },
  {
    q: "¿Cuánto cobra BolivarPide a los negocios?",
    a: "El Plan Inicial no tiene costo fijo: pagás un 7% por compra realizada. Los planes Impulso (3,5%) y Líder (0%) estarán disponibles próximamente.",
  },
  {
    q: "¿En qué zonas operan?",
    a: "Por el momento operamos en San Carlos de Bolívar. Si tenés un local en otra zona, escribinos por WhatsApp para coordinar.",
  },
  {
    q: "¿Quién hace el delivery?",
    a: "Estamos ampliando una red de repartidores locales. También podés sumar repartidores de confianza para tu local.",
  },
  {
    q: "¿Puedo cambiar el perfil después?",
    a: "Sí. Desde el panel podés actualizar fotos, descripción, horarios, menú y precios cuando quieras.",
  },
];

export function RegistroLanding() {
  return (
    <>
      <AnimatedSection className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-12 md:px-10">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[#ddd4c8] bg-[#faf6f1] p-8 shadow-sm dark:border-[#3d3732] dark:bg-[#1c1917]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#9a0002]/20 bg-[#9a0002]/6 px-3.5 py-1.5 text-xs font-bold text-[#9a0002]">
              <MaterialSymbol icon="auto_awesome" size={11} />
              Plataforma de delivery local
            </div>
            <h1 className="mb-4 text-4xl font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white md:text-5xl">
              Sumá tu negocio
              <br />
              <span className="text-[#9a0002]">a BolivarPide</span>
              <br />
              en San Carlos de Bolívar.
            </h1>
            <p className="mb-8 max-w-[380px] text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
              Creá tu local en minutos con el Plan Inicial gratis. Sin tarjeta, sin revisión manual para
              empezar a cargar tu carta.
            </p>
            <a
              href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20registrar%20mi%20negocio%20en%20BolivarPide"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 transition hover:text-[#1a9e4c] dark:text-gray-400"
            >
              <MaterialSymbol icon="chat" size={16} className="text-[#25d366]" />
              ¿Preferís hablar? Escribinos por WhatsApp
            </a>
          </div>

          <div className="flex flex-col gap-4">
            {[
              {
                icon: "bolt",
                title: "Alta instantánea",
                desc: "Tu local queda creado al terminar el wizard. Entrás directo al panel.",
              },
              {
                icon: "trending_up",
                title: "Más visibilidad local",
                desc: "Aparecés frente a clientes que buscan delivery en San Carlos de Bolívar.",
              },
              {
                icon: "verified",
                title: "Plan Inicial $0",
                desc: "Empezá sin costo fijo. Solo pagás comisión cuando vendés (7%).",
              },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#9a0002]/12 bg-gradient-to-br from-[#9a0002]/10 to-[#9a0002]/5">
                  <MaterialSymbol icon={icon} size={17} className="text-[#9a0002]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight text-gray-800 dark:text-gray-100">
                    {title}
                  </h3>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="relative z-10 mx-auto w-full max-w-[1200px] px-6 py-16 md:px-10">
        <div className="relative overflow-hidden rounded-[28px] border border-[#ddd4c8]/70 bg-white/70 px-8 py-10 shadow-lg backdrop-blur-md dark:border-[#3d3732]/80 dark:bg-[#231f1c]/70">
          <div className="relative grid grid-cols-1 divide-y divide-[#ddd4c8]/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-gray-800/60">
            {[
              { value: "$0", label: "Costo fijo inicial" },
              { value: "7%", label: "Comisión Plan Inicial" },
              { value: "1 zona", label: "San Carlos de Bolívar" },
            ].map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="py-4 text-center sm:py-0"
              >
                <p className="text-3xl font-black leading-none text-[#9a0002]">{value}</p>
                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-16 md:px-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white md:text-3xl">
            Preguntas frecuentes
          </h2>
        </div>
        <FaqAccordion />
      </AnimatedSection>

      <footer className="relative z-10 border-t border-[#ddd4c8]/50 px-6 py-8 text-center dark:border-[#3d3732]/50">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} BolivarPide · Todos los derechos reservados
        </p>
      </footer>
    </>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={item.q}
          className="overflow-hidden rounded-[18px] border border-[#ddd4c8]/70 bg-white/60 backdrop-blur-sm dark:border-[#3d3732]/70 dark:bg-[#231f1c]/60"
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left"
          >
            <span className="text-sm font-bold leading-snug text-gray-800 dark:text-gray-100">
              {item.q}
            </span>
            <MaterialSymbol
              icon={open === i ? "remove" : "add"}
              size={13}
              className="shrink-0 text-[#9a0002]"
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="border-t border-[#ddd4c8]/40 px-6 pb-5 pt-3 text-[13px] leading-relaxed text-gray-500 dark:border-[#3d3732]/40 dark:text-gray-400">
                  {item.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
