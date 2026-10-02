"use client";

import { ShieldAlert } from "lucide-react";

import type { Jugador } from "@/lib/types";

function ListaConvocatoria({
  titulo,
  plantel,
  seleccionados,
  soloLectura,
  suspendido,
  onCambiar,
}: {
  titulo: string;
  plantel: Jugador[];
  seleccionados: string[];
  soloLectura: boolean;
  suspendido: (jugadorId: string) => { suspendido: boolean; motivo?: string };
  onCambiar: (ids: string[]) => void;
}) {
  function alternar(jugadorId: string) {
    if (seleccionados.includes(jugadorId)) {
      onCambiar(seleccionados.filter((id) => id !== jugadorId));
    } else {
      onCambiar([...seleccionados, jugadorId]);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
        <span className="text-xs text-gray-500">{seleccionados.length} convocados</span>
      </div>
      <div className="space-y-1.5">
        {plantel.map((jugador) => {
          const info = suspendido(jugador.id);
          const marcado = seleccionados.includes(jugador.id);
          return (
            <div key={jugador.id}>
              <label
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${
                  info.suspendido
                    ? "border-(--color-danger-light) bg-(--color-danger-light)/40 text-gray-400"
                    : marcado
                    ? "border-(--color-primary) bg-(--color-primary-light)"
                    : "border-(--color-border) bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={soloLectura || info.suspendido}
                  onChange={() => alternar(jugador.id)}
                />
                <span className="w-7 shrink-0 text-xs font-bold text-gray-500">
                  {jugador.numero ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                  {jugador.nombreCompleto}
                </span>
              </label>
              {info.suspendido && (
                <p className="mt-0.5 flex items-center gap-1 pl-2 text-xs font-medium text-(--color-danger)">
                  <ShieldAlert size={12} />
                  Suspendido — {info.motivo}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PanelConvocatoria({
  nombreLocal,
  nombreVisitante,
  plantelLocal,
  plantelVisitante,
  convocadosLocal,
  convocadosVisitante,
  soloLectura,
  suspendido,
  onCambiarLocal,
  onCambiarVisitante,
}: {
  nombreLocal: string;
  nombreVisitante: string;
  plantelLocal: Jugador[];
  plantelVisitante: Jugador[];
  convocadosLocal: string[];
  convocadosVisitante: string[];
  soloLectura: boolean;
  suspendido: (jugadorId: string) => { suspendido: boolean; motivo?: string };
  onCambiarLocal: (ids: string[]) => void;
  onCambiarVisitante: (ids: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <ListaConvocatoria
        titulo={nombreLocal}
        plantel={plantelLocal}
        seleccionados={convocadosLocal}
        soloLectura={soloLectura}
        suspendido={suspendido}
        onCambiar={onCambiarLocal}
      />
      <ListaConvocatoria
        titulo={nombreVisitante}
        plantel={plantelVisitante}
        seleccionados={convocadosVisitante}
        soloLectura={soloLectura}
        suspendido={suspendido}
        onCambiar={onCambiarVisitante}
      />
    </div>
  );
}
