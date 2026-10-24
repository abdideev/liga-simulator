"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "motion/react";

import { SimuladorProvider, useSimulador } from "@/context/SimuladorContext";
import { puedeAccederRuta } from "@/lib/permisos";
import { TERMINOS_USO } from "@/lib/legal/documentos";
import { usuarioActual, yaAceptoTerminos } from "@/lib/legal/reglas";
import { APARECER } from "@/components/ui/movimiento";

import AccesoRestringido from "./AccesoRestringido";
import Header from "./Header";
import NavSidebar from "./NavSidebar";
import PieLegal from "./legal/PieLegal";
import RegistroInicial from "./legal/RegistroInicial";

/** Legal texts stay readable before signing up (the notice must be visible BEFORE registering). */
const RUTAS_SIN_REGISTRO = ["/privacidad", "/legal"];

/** Blocks any route the simulated role may not open, even via a typed URL. */
function ProteccionRuta({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { estado } = useSimulador();
  const usuario = usuarioActual(estado);
  // First sign-in: an admin or delegate must create the account and accept
  // the Términos de uso before using the platform (Capa 3).
  const requiereRegistro =
    usuario !== null &&
    !yaAceptoTerminos(estado, usuario.clave, TERMINOS_USO.version) &&
    !RUTAS_SIN_REGISTRO.includes(pathname);
  // Keyed by route so each page fades/slides in when navigating.
  return (
    <motion.div key={requiereRegistro && usuario ? `registro-${usuario.clave}` : pathname} {...APARECER}>
      {requiereRegistro && usuario ? (
        <RegistroInicial usuario={usuario} />
      ) : puedeAccederRuta(estado.rolActual, pathname) ? (
        children
      ) : (
        <AccesoRestringido />
      )}
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
            <PieLegal />
          </main>
        </div>
      </SimuladorProvider>
    </MotionConfig>
  );
}
