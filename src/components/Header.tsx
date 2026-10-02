"use client";

import { Menu, RotateCcw } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import type { RolSimulado } from "@/lib/types";

const ROLES: { value: RolSimulado; label: string }[] = [
  { value: "administrador", label: "Administrador de liga" },
  { value: "delegado", label: "Delegado de equipo" },
  { value: "publico", label: "Vista pública" },
];

export default function Header({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { estado, cambiarRol, reiniciarSimulacion } = useSimulador();

  function manejarReinicio() {
    const confirmado = window.confirm(
      "¿Reiniciar la simulación? Se perderá todo el progreso capturado y se restaurarán los datos de ejemplo."
    );
    if (confirmado) reiniciarSimulacion();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-surface)">
      <div className="flex items-center gap-2 px-3 py-2 md:px-4">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-bold text-(--color-primary-dark) md:text-base">
            {estado.liga.nombre}
          </span>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-(--color-warning-light) px-2 py-0.5 text-[11px] font-medium text-(--color-warning)">
            Prototipo — datos simulados
          </span>
        </div>

        <select
          value={estado.rolActual}
          onChange={(e) => cambiarRol(e.target.value as RolSimulado)}
          className="max-w-[9.5rem] rounded-lg border border-(--color-border) bg-white px-2 py-2 text-sm font-medium text-gray-800 sm:max-w-none"
          aria-label="Cambiar rol simulado"
        >
          {ROLES.map((rol) => (
            <option key={rol.value} value={rol.value}>
              {rol.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={manejarReinicio}
          className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-(--color-border) px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex"
        >
          <RotateCcw size={16} />
          Reiniciar
        </button>
      </div>
    </header>
  );
}
