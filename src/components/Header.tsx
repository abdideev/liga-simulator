"use client";

import { Menu, RotateCcw, Trophy } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import type { RolSimulado } from "@/lib/types";

import Boton from "./ui/Boton";
import Etiqueta from "./ui/Etiqueta";

const ROLES: { value: RolSimulado; label: string }[] = [
  { value: "administrador", label: "Administrador de liga" },
  { value: "delegado", label: "Delegado de equipo" },
  { value: "publico", label: "Vista pública" },
];

const claseSelector =
  "min-w-0 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm font-medium text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft";

export default function Header({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { estado, despachar, reiniciarSimulacion } = useSimulador();

  function manejarReinicio() {
    const confirmado = window.confirm(
      "¿Reiniciar la simulación? Se perderá todo el progreso capturado y se restaurarán los datos de ejemplo."
    );
    if (confirmado) reiniciarSimulacion();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/90 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 md:px-5">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink hover:bg-surface md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-white md:grid">
          <Trophy size={18} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
          <span className="truncate text-sm font-semibold text-ink md:text-base">
            {estado.liga.nombre}
          </span>
          <Etiqueta intencion="warn" className="whitespace-nowrap px-2 py-0.5 text-[11px]">
            Prototipo<span className="hidden sm:inline">— datos simulados</span>
          </Etiqueta>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <select
            value={estado.rolActual}
            onChange={(e) => despachar({ tipo: "cambiarRol", rol: e.target.value as RolSimulado })}
            className={`${claseSelector} max-w-[9.5rem] sm:max-w-none`}
            aria-label="Cambiar rol simulado"
            data-testid="selector-rol"
          >
            {ROLES.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </select>

          <span className="hidden shrink-0 sm:block">
            <Boton
              intencion="neutral"
              variante="contorno"
              onClick={manejarReinicio}
              data-testid="boton-reiniciar"
            >
              <RotateCcw size={16} />
              Reiniciar
            </Boton>
          </span>
        </div>

        {estado.rolActual === "delegado" && (
          <label className="flex w-full items-center gap-2 text-sm text-muted sm:w-auto">
            <span className="shrink-0">Delegado de</span>
            <select
              value={estado.equipoDelegadoId ?? ""}
              onChange={(e) =>
                despachar({ tipo: "seleccionarEquipoDelegado", equipoId: e.target.value })
              }
              className={`${claseSelector} flex-1 sm:flex-none`}
              aria-label="Equipo que representa el delegado"
              data-testid="selector-equipo-delegado"
            >
              {estado.equipos.map((equipo) => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  );
}
