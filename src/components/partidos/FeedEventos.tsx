"use client";

import { Trash2, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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
  onEliminar: (evento: EventoPartido) => void;
}) {
  const nombreJugador = (id?: string) =>
    id ? (jugadores.find((j) => j.id === id)?.nombreCompleto ?? "Jugador") : undefined;

  if (eventos.length === 0) {
    return (
      <p className="rounded-2xl bg-canvas px-3 py-8 text-center text-sm text-muted">
        Todavía no se han registrado eventos en este partido.
      </p>
    );
  }

  const ordenados = [...eventos].sort((a, b) => b.minuto - a.minuto);

  return (
    <ul className="space-y-2" data-testid="feed-eventos">
      <AnimatePresence initial={false}>
      {ordenados.map((evento) => {
        const Icono = ICONO_EVENTO[evento.tipo];
        return (
          <motion.li
            key={evento.id}
            layout
            initial={{ opacity: 0, x: -16, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            data-testid="evento-partido"
            data-tipo={evento.tipo}
            className="flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2"
          >
            <span className="w-9 shrink-0 text-center text-sm font-semibold tabular-nums text-muted">
              {evento.minuto}&apos;
            </span>
            <Icono size={18} className={`shrink-0 ${CLASE_COLOR_EVENTO[evento.tipo]}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {ETIQUETA_EVENTO[evento.tipo]}
                {evento.tipo === "sustitucion"
                  ? ` — sale ${nombreJugador(evento.jugadorId)}, entra ${nombreJugador(evento.jugadorEntraId)}`
                  : nombreJugador(evento.jugadorId)
                    ? ` — ${nombreJugador(evento.jugadorId)}`
                    : ""}
              </p>
              <p className="truncate text-xs text-muted">{nombreEquipo(evento.equipoId)}</p>
            </div>
            {evento.registradoOffline && (
              <WifiOff size={14} className="shrink-0 text-warn-ink" aria-label="Capturado sin conexión" />
            )}
            {puedeEliminar && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                aria-label="Eliminar evento"
                onClick={() => onEliminar(evento)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger-ink"
              >
                <Trash2 size={16} />
              </motion.button>
            )}
          </motion.li>
        );
      })}
      </AnimatePresence>
    </ul>
  );
}
