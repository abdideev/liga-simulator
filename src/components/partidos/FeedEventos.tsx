"use client";

import { Trash2, WifiOff } from "lucide-react";

import { CLASE_COLOR_EVENTO, ETIQUETA_EVENTO, ICONO_EVENTO } from "@/lib/eventosUtil";
import type { EventoPartido, Jugador } from "@/lib/types";

export default function FeedEventos({
  eventos,
  jugadores,
  nombreEquipo,
  puedeEliminar,
  onEliminar,
}: {
  eventos: EventoPartido[];
  jugadores: Jugador[];
  nombreEquipo: (equipoId: string) => string;
  puedeEliminar: boolean;
  onEliminar: (eventoId: string) => void;
}) {
  const nombreJugador = (id?: string) =>
    id ? jugadores.find((j) => j.id === id)?.nombreCompleto ?? "Jugador" : undefined;

  if (eventos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--color-border) px-3 py-6 text-center text-sm text-gray-500">
        Todavía no se han registrado eventos en este partido.
      </p>
    );
  }

  const ordenados = [...eventos].sort((a, b) => b.minuto - a.minuto);

  return (
    <ul className="space-y-2">
      {ordenados.map((evento) => {
        const Icono = ICONO_EVENTO[evento.tipo];
        return (
          <li
            key={evento.id}
            className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-white px-3 py-2"
          >
            <span className="w-9 shrink-0 text-center text-sm font-bold tabular-nums text-gray-500">
              {evento.minuto}&apos;
            </span>
            <Icono size={18} className={`shrink-0 ${CLASE_COLOR_EVENTO[evento.tipo]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {ETIQUETA_EVENTO[evento.tipo]}
                {evento.tipo === "sustitucion"
                  ? ` — sale ${nombreJugador(evento.jugadorId)}, entra ${nombreJugador(evento.jugadorEntraId)}`
                  : nombreJugador(evento.jugadorId)
                  ? ` — ${nombreJugador(evento.jugadorId)}`
                  : ""}
              </p>
              <p className="truncate text-xs text-gray-500">{nombreEquipo(evento.equipoId)}</p>
            </div>
            {evento.registradoOffline && (
              <WifiOff size={14} className="shrink-0 text-(--color-warning)" />
            )}
            {puedeEliminar && (
              <button
                type="button"
                aria-label="Eliminar evento"
                onClick={() => onEliminar(evento.id)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-(--color-danger)"
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
