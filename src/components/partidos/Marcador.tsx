import { Pause, Play, TimerReset } from "lucide-react";

import Boton from "@/components/ui/Boton";

export default function Marcador({
  nombreLocal,
  nombreVisitante,
  golesLocal,
  golesVisitante,
  minuto,
  cronometroActivo,
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
  puedeControlarCronometro: boolean;
  onAlternarCronometro: () => void;
  onAjustarMinuto: (delta: number) => void;
}) {
  return (
    <div className="sticky top-[57px] z-20 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {nombreLocal}
        </span>
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xl font-extrabold text-white tabular-nums">
          <span>{golesLocal}</span>
          <span className="text-gray-400">-</span>
          <span>{golesVisitante}</span>
        </div>
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-gray-900">
          {nombreVisitante}
        </span>
      </div>

      {puedeControlarCronometro && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onAjustarMinuto(-1)}
            className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Restar un minuto"
          >
            <TimerReset size={16} />
          </button>
          <span className="w-16 text-center text-lg font-bold tabular-nums text-gray-900">
            {minuto}&apos;
          </span>
          <Boton
            variante={cronometroActivo ? "secundario" : "primario"}
            onClick={onAlternarCronometro}
            className="px-3"
          >
            {cronometroActivo ? <Pause size={16} /> : <Play size={16} />}
            {cronometroActivo ? "Pausar" : "Iniciar"}
          </Boton>
          <button
            type="button"
            onClick={() => onAjustarMinuto(1)}
            className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Sumar un minuto"
          >
            +1&apos;
          </button>
        </div>
      )}
    </div>
  );
}
