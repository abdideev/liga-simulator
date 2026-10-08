"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "motion/react";

import { SimuladorProvider, useSimulador } from "@/context/SimuladorContext";
import { puedeAccederRuta } from "@/lib/permisos";
import { APARECER } from "@/components/ui/movimiento";

import AccesoRestringido from "./AccesoRestringido";
import Header from "./Header";
import NavSidebar from "./NavSidebar";

/** Blocks any route the simulated role may not open, even via a typed URL. */
function ProteccionRuta({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { estado } = useSimulador();
  // Keyed by route so each page fades/slides in when navigating.
  return (
    <motion.div key={pathname} {...APARECER}>
      {puedeAccederRuta(estado.rolActual, pathname) ? children : <AccesoRestringido />}
    </motion.div>
  );
}

export default function InnerApp({ children }: { children: ReactNode }) {
  const [navAbierto, setNavAbierto] = useState(false);

  return (
    // reducedMotion="user": respects the OS "reduce motion" accessibility setting.
    <MotionConfig reducedMotion="user">
      <SimuladorProvider>
        <Header onAbrirMenu={() => setNavAbierto(true)} />
        <div className="md:flex">
          <NavSidebar abierto={navAbierto} onCerrar={() => setNavAbierto(false)} />
          <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
            <ProteccionRuta>{children}</ProteccionRuta>
          </main>
        </div>
      </SimuladorProvider>
    </MotionConfig>
  );
}
