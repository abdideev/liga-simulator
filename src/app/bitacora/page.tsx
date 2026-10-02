"use client";

import { ScrollText } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";

const ETIQUETA_ROL: Record<string, string> = {
  administrador: "Administrador",
  delegado: "Delegado",
  publico: "Público",
};

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function BitacoraPage() {
  const { estado } = useSimulador();
  const entradas = [...estado.bitacora].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <ScrollText className="text-(--color-primary)" size={22} />
          Bitácora
        </h1>
        <p className="text-sm text-gray-600">
          Registro de auditoría de cambios en planteles, partidos y estadísticas.
        </p>
      </div>

      {entradas.length === 0 ? (
        <EstadoVacio
          icono={ScrollText}
          titulo="Sin actividad registrada"
          descripcion="Aquí aparecerán los cambios realizados en la liga a medida que ocurran."
        />
      ) : (
        <div className="space-y-2">
          {entradas.map((entrada) => (
            <Tarjeta key={entrada.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900">{entrada.accion}</span>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {ETIQUETA_ROL[entrada.rol] ?? entrada.rol}
                </span>
              </div>
              {entrada.detalle && <p className="mt-1 text-gray-600">{entrada.detalle}</p>}
              <p className="mt-1 text-xs text-gray-400">{formatearFecha(entrada.fecha)}</p>
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  );
}
