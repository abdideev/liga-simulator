"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";

import Aviso from "@/components/ui/Aviso";

export default function PanelModoOffline({
  activo,
  sincronizando,
  pendientes,
  onAlternar,
}: {
  activo: boolean;
  sincronizando: boolean;
  pendientes: number;
  onAlternar: () => void;
}) {
  return (
    <div className="space-y-3">
      <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {activo ? (
            <WifiOff size={18} className="text-warn-ink" />
          ) : (
            <Wifi size={18} className="text-ok-ink" />
          )}
          Modo sin conexión (simulado)
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={activo}
          disabled={sincronizando}
          onChange={onAlternar}
          className="h-6 w-6"
          aria-label="Modo sin conexión"
          data-testid="toggle-modo-offline"
        />
      </label>

      {activo && (
        <Aviso intencion="warn" icono={WifiOff} data-testid="aviso-modo-offline">
          Estás capturando sin conexión a internet. Los eventos se guardan en este dispositivo.
          {pendientes > 0 && (
            <span className="mt-1 block font-semibold" data-testid="contador-pendientes">
              {pendientes} evento(s) pendientes de sincronizar
            </span>
          )}
        </Aviso>
      )}

      {sincronizando && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-muted">
          <Loader2 size={16} className="animate-spin" />
          Sincronizando…
        </div>
      )}
    </div>
  );
}
