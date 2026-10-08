"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

import type { Jugador, ResultadoOperacion } from "@/lib/types";

interface PropsLista {
  titulo: string;
  plantel: Jugador[];
  convocados: string[];
  titulares: string[];
  maxTitulares: number;
  editable: boolean;
  convocable: (jugador: Jugador) => ResultadoOperacion;
  onCambiar: (ids: string[]) => void;
  onAlternarTitular: (jugadorId: string) => void;
  lado: "local" | "visitante";
}

function ListaConvocatoria({
  titulo,
  plantel,
  convocados,
  titulares,
  maxTitulares,
  editable,
  convocable,
  onCambiar,
  onAlternarTitular,
  lado,
}: PropsLista) {
  function alternar(jugadorId: string) {
    onCambiar(
      convocados.includes(jugadorId)
        ? convocados.filter((id) => id !== jugadorId)
        : [...convocados, jugadorId]
    );
  }

  return (
    <div data-testid={`convocatoria-${lado}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="truncate font-semibold text-ink">{titulo}</h3>
        <span className="shrink-0 text-xs text-muted">
          {convocados.length} convocados · {titulares.length}/{maxTitulares} titulares
        </span>
      </div>
      <div className="space-y-1.5">
        {plantel.map((jugador) => {
          const marcado = convocados.includes(jugador.id);
          const esTitular = titulares.includes(jugador.id);
          const permiso = convocable(jugador);
          const bloqueado = !permiso.ok && !marcado;
          const esSuspension = permiso.motivo?.startsWith("Suspendido");
          return (
            <div
              key={jugador.id}
              data-testid={`convocable-${jugador.id}`}
              data-bloqueado={!permiso.ok}
            >
              <div
                className={`flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  !permiso.ok
                    ? "border-border bg-surface"
                    : marcado
                      ? "border-accent/40 bg-accent-soft"
                      : "border-border bg-paper"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={!editable || bloqueado}
                  onChange={() => alternar(jugador.id)}
                  aria-label={`Convocar a ${jugador.nombreCompleto}`}
                />
                <span className="w-6 shrink-0 text-xs font-semibold text-muted">
                  {jugador.numero ?? "—"}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate font-medium ${
                    permiso.ok ? "text-ink" : "text-muted"
                  }`}
                >
                  {jugador.nombreCompleto}
                </span>
                {marcado && (
                  <button
                    type="button"
                    disabled={!editable || (!esTitular && titulares.length >= maxTitulares)}
                    onClick={() => onAlternarTitular(jugador.id)}
                    data-testid={`titular-${jugador.id}`}
                    className={`min-h-8 shrink-0 rounded-full px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      esTitular ? "bg-accent text-white" : "border border-border bg-paper text-muted"
                    }`}
                  >
                    {esTitular ? "Titular" : "Suplente"}
                  </button>
                )}
              </div>
              {!permiso.ok && (
                <p
                  className={`mt-0.5 flex items-center gap-1 pl-2 text-xs font-medium ${
                    esSuspension ? "text-danger-ink" : "text-warn-ink"
                  }`}
                >
                  {esSuspension ? <ShieldAlert size={12} /> : <AlertTriangle size={12} />}
                  {esSuspension ? permiso.motivo : `No convocable — ${permiso.motivo}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface LadoConvocatoria {
  nombre: string;
  plantel: Jugador[];
  convocados: string[];
  titulares: string[];
  editable: boolean;
  onCambiar: (ids: string[]) => void;
  onAlternarTitular: (jugadorId: string) => void;
}

export default function PanelConvocatoria({
  local,
  visitante,
  maxTitulares,
  convocable,
}: {
  local: LadoConvocatoria;
  visitante: LadoConvocatoria;
  maxTitulares: number;
  convocable: (jugador: Jugador) => ResultadoOperacion;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ListaConvocatoria
        lado="local"
        titulo={local.nombre}
        plantel={local.plantel}
        convocados={local.convocados}
        titulares={local.titulares}
        maxTitulares={maxTitulares}
        editable={local.editable}
        convocable={convocable}
        onCambiar={local.onCambiar}
        onAlternarTitular={local.onAlternarTitular}
      />
      <ListaConvocatoria
        lado="visitante"
        titulo={visitante.nombre}
        plantel={visitante.plantel}
        convocados={visitante.convocados}
        titulares={visitante.titulares}
        maxTitulares={maxTitulares}
        editable={visitante.editable}
        convocable={convocable}
        onCambiar={visitante.onCambiar}
        onAlternarTitular={visitante.onAlternarTitular}
      />
    </div>
  );
}
