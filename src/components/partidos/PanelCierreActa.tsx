"use client";

import { CheckCircle2, Lock } from "lucide-react";

import Boton from "@/components/ui/Boton";

export default function PanelCierreActa({
  nombreLocal,
  nombreVisitante,
  confirmadoLocal,
  confirmadoVisitante,
  actaCerrada,
  pendientesOffline,
  onConfirmarLocal,
  onConfirmarVisitante,
  onCerrarActa,
}: {
  nombreLocal: string;
  nombreVisitante: string;
  confirmadoLocal: boolean;
  confirmadoVisitante: boolean;
  actaCerrada: boolean;
  pendientesOffline: number;
  onConfirmarLocal: () => void;
  onConfirmarVisitante: () => void;
  onCerrarActa: () => void;
}) {
  if (actaCerrada) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-(--color-primary) bg-(--color-primary-light) px-3 py-3 text-sm font-semibold text-(--color-primary-dark)">
        <CheckCircle2 size={18} />
        Acta cerrada. El partido quedó finalizado y contabilizado en la tabla de posiciones.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-gray-800">
        <input type="checkbox" checked={confirmadoLocal} onChange={onConfirmarLocal} />
        El delegado de {nombreLocal} confirma el resultado y los eventos capturados
      </label>
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-gray-800">
        <input type="checkbox" checked={confirmadoVisitante} onChange={onConfirmarVisitante} />
        El delegado de {nombreVisitante} confirma el resultado y los eventos capturados
      </label>

      {pendientesOffline > 0 && (
        <p className="text-xs font-medium text-(--color-warning)">
          Hay {pendientesOffline} evento(s) sin sincronizar. Desactiva el modo sin conexión antes
          de cerrar el acta.
        </p>
      )}

      <Boton
        variante="peligro"
        disabled={!confirmadoLocal || !confirmadoVisitante || pendientesOffline > 0}
        onClick={onCerrarActa}
      >
        <Lock size={16} />
        Cerrar acta
      </Boton>
    </div>
  );
}
