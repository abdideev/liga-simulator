"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Eye,
  Home,
  Lock,
  RotateCcw,
  ScrollText,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import type { RolSimulado } from "@/lib/types";

interface ItemNav {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  roles: RolSimulado[];
}

const ITEMS: ItemNav[] = [
  { href: "/", etiqueta: "Inicio", icono: Home, roles: ["administrador", "delegado", "publico"] },
  {
    href: "/configuracion",
    etiqueta: "Configuración de liga",
    icono: Settings,
    roles: ["administrador"],
  },
  { href: "/equipos", etiqueta: "Equipos", icono: Users, roles: ["administrador", "delegado"] },
  { href: "/registro", etiqueta: "Cierre de registro", icono: Lock, roles: ["administrador"] },
  {
    href: "/calendario",
    etiqueta: "Calendario",
    icono: CalendarDays,
    roles: ["administrador", "delegado"],
  },
  {
    href: "/partidos",
    etiqueta: "Partidos",
    icono: ClipboardList,
    roles: ["administrador", "delegado"],
  },
  {
    href: "/estadisticas",
    etiqueta: "Tabla y estadísticas",
    icono: BarChart3,
    roles: ["administrador", "delegado"],
  },
  { href: "/bitacora", etiqueta: "Bitácora", icono: ScrollText, roles: ["administrador"] },
  { href: "/publico", etiqueta: "Vista pública", icono: Eye, roles: ["publico"] },
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
  const items = ITEMS.filter((item) => item.roles.includes(estado.rolActual));

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
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-(--color-border) bg-(--color-surface) p-3 transition-transform duration-200 md:relative md:z-0 md:w-56 md:translate-x-0 md:border-r md:p-3 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-gray-500">Menú</span>
          <button
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="grid h-11 w-11 place-items-center rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const activo = pathname === item.href;
            const Icono = item.icono;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCerrar}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    activo
                      ? "bg-(--color-primary-light) text-(--color-primary-dark)"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icono size={18} />
                  {item.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={manejarReinicio}
          className="mt-4 flex min-h-11 w-full items-center gap-2 rounded-lg border border-(--color-border) px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:hidden"
        >
          <RotateCcw size={16} />
          Reiniciar simulación
        </button>
      </nav>
    </>
  );
}
