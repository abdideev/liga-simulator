"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RotateCcw, X, type LucideIcon } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { puedeAccederRuta, seccionDeRuta } from "@/lib/permisos";

import { ICONO_SECCION } from "./iconosSeccion";

interface ItemNav {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Shown in the menu only for these roles (access itself is decided by permisos.ts). */
  soloEnMenuPara?: Array<"administrador" | "delegado" | "publico">;
}

const ITEMS: ItemNav[] = [
  { href: "/", etiqueta: "Inicio", icono: ICONO_SECCION.inicio },
  { href: "/configuracion", etiqueta: "Configuración de liga", icono: ICONO_SECCION.configuracion },
  { href: "/equipos", etiqueta: "Equipos", icono: ICONO_SECCION.equipos },
  { href: "/registro", etiqueta: "Cierre de registro", icono: ICONO_SECCION.registro },
  { href: "/calendario", etiqueta: "Calendario", icono: ICONO_SECCION.calendario },
  { href: "/partidos", etiqueta: "Partidos", icono: ICONO_SECCION.partidos },
  { href: "/estadisticas", etiqueta: "Tabla y estadísticas", icono: ICONO_SECCION.estadisticas },
  { href: "/bitacora", etiqueta: "Bitácora", icono: ICONO_SECCION.bitacora },
  {
    href: "/publico",
    etiqueta: "Vista pública",
    icono: ICONO_SECCION.publico,
    soloEnMenuPara: ["publico"],
  },
];

export default function NavSidebar({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const pathname = usePathname();
  const { estado, reiniciarSimulacion } = useSimulador();
  const items = ITEMS.filter(
    (item) =>
      puedeAccederRuta(estado.rolActual, item.href) &&
      (!item.soloEnMenuPara || item.soloEnMenuPara.includes(estado.rolActual))
  );
  const seccionActual = seccionDeRuta(pathname);

  function manejarReinicio() {
    const confirmado = window.confirm(
      "¿Reiniciar la simulación? Se perderá todo el progreso capturado y se restaurarán los datos de ejemplo."
    );
    if (confirmado) {
      reiniciarSimulacion();
      onCerrar();
    }
  }

  return (
    <>
      {abierto && (
        <button
          aria-label="Cerrar menú"
          onClick={onCerrar}
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm md:hidden"
        />
      )}
      <nav
        aria-label="Menú principal"
        className={`fixed inset-y-0 left-0 z-50 w-72 transform rounded-r-3xl bg-paper p-3 shadow-elevada transition-transform duration-200 md:sticky md:top-[60px] md:z-0 md:h-[calc(100vh-60px)] md:w-60 md:translate-x-0 md:rounded-none md:bg-transparent md:p-4 md:shadow-none ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-muted">Menú</span>
          <button
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-control"
          >
            <X size={20} />
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const activo = seccionActual === item.href;
            const Icono = item.icono;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCerrar}
                  data-testid={`nav-${item.href === "/" ? "inicio" : item.href.slice(1)}`}
                  aria-current={activo ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${
                    activo
                      ? "bg-paper text-ink shadow-control"
                      : "text-muted hover:bg-control/70 hover:text-ink"
                  }`}
                >
                  <Icono size={18} className={activo ? "text-accent" : ""} />
                  {item.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={manejarReinicio}
          className="mt-4 flex min-h-11 w-full items-center gap-2 rounded-full bg-control px-4 py-2 text-sm font-medium text-ink hover:bg-[#e0e0e2] sm:hidden"
        >
          <RotateCcw size={16} />
          Reiniciar simulación
        </button>
      </nav>
    </>
  );
}
