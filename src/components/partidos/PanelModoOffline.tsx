"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";

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
    <div className="space-y-2">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-(--color-border) bg-white px-3">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          {activo ? (
            <WifiOff size={16} className="text-(--color-warning)" />
          ) : (
            <Wifi size={16} className="text-(--color-primary)" />
          )}
          Modo sin conexión
        </span>
        <input
          type="checkbox"
          checked={activo}
          disabled={sincronizando}
          onChange={onAlternar}
          className="h-6 w-6"
        />
      </label>

      {activo && (
        <div className="rounded-lg border border-(--color-warning) bg-(--color-warning-light) px-3 py-2 text-sm font-medium text-(--color-warning)">
          Estás capturando sin conexión a internet. Los eventos se guardan en este dispositivo.
          {pendientes > 0 && (
            <span className="mt-1 block font-bold">{pendientes} evento(s) pendientes de sincronizar</span>
          )}
        </div>
      )}

      {sincronizando && (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
          <Loader2 size={16} className="animate-spin" />
          Sincronizando…
        </div>
      )}
    </div>
  );
}
