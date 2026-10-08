import { Minus, Pause, Play, Plus } from "lucide-react";

import Boton from "@/components/ui/Boton";

export default function Marcador({
  nombreLocal,
  nombreVisitante,
  golesLocal,
  golesVisitante,
  minuto,
  cronometroActivo,
  fijo,
  mostrarMinuto,
  puedeControlarCronometro,
  onAlternarCronometro,
  onAjustarMinuto,
}: {
  nombreLocal: string;
  nombreVisitante: string;
  golesLocal: number;
  golesVisitante: number;
  minuto: number;
  cronometroActivo: boolean;
  /** Pin below the header while scrolling (the header is one row tall for the mesa operator). */
  fijo: boolean;
  mostrarMinuto: boolean;
  puedeControlarCronometro: boolean;
  onAlternarCronometro: () => void;
  onAjustarMinuto: (delta: number) => void;
}) {
  return (
    <div
      className={`${fijo ? "sticky top-[60px] z-20" : ""} rounded-3xl bg-paper/95 p-5 shadow-suave backdrop-blur`}
      data-testid="marcador"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {nombreLocal}
        </span>
        <div
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-ink px-5 py-2 text-3xl font-semibold tabular-nums text-paper"
          data-testid="marcador-goles"
        >
          <span>{golesLocal}</span>
          <span className="text-paper/50">-</span>
          <span>{golesVisitante}</span>
        </div>
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-ink">
          {nombreVisitante}
        </span>
      </div>

      {mostrarMinuto && (
        <div className="mt-3 flex items-center justify-center gap-3">
          {puedeControlarCronometro && (
            <button
              type="button"
              onClick={() => onAjustarMinuto(-1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-muted hover:bg-control"
              aria-label="Restar un minuto"
            >
              <Minus size={16} />
            </button>
          )}
          <span
            className="w-16 text-center text-lg font-semibold tabular-nums text-ink"
            data-testid="cronometro-minuto"
          >
            {minuto}&apos;
          </span>
          {puedeControlarCronometro && (
            <>
              <Boton
                intencion={cronometroActivo ? "neutral" : "accent"}
                variante={cronometroActivo ? "contorno" : "solido"}
                onClick={onAlternarCronometro}
                className="px-3"
                data-testid="boton-cronometro"
              >
                {cronometroActivo ? <Pause size={16} /> : <Play size={16} />}
                {cronometroActivo ? "Pausar" : "Reanudar"}
              </Boton>
              <button
                type="button"
                onClick={() => onAjustarMinuto(1)}
                className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-muted hover:bg-control"
                aria-label="Sumar un minuto"
              >
                <Plus size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
