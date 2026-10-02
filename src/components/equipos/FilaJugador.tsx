"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import InsigniaElegibilidad from "@/components/ui/InsigniaElegibilidad";
import { calcularEdad, estadoEfectivo } from "@/lib/rules";
import type { Jugador } from "@/lib/types";

export default function FilaJugador({
  jugador,
  esAdministrador,
  onGuardarOverride,
}: {
  jugador: Jugador;
  esAdministrador: boolean;
  onGuardarOverride: (elegibleForzado: boolean, motivo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState(jugador.overrideAdmin?.motivo ?? "");
  const edad = calcularEdad(jugador.fechaNacimiento);
  const estado = estadoEfectivo(jugador);
  const necesitaRevision = jugador.estadoElegibilidad === "Requiere revisión manual";

  return (
    <div className="rounded-lg border border-(--color-border) bg-white">
      <div className="flex items-center gap-3 p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
          {jugador.numero ?? "—"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">{jugador.nombreCompleto}</p>
          <p className="text-xs text-gray-500">
            {edad} años {jugador.esMenorDeEdad && "· Menor de edad"}
          </p>
        </div>
        <InsigniaElegibilidad estado={estado} />
        {esAdministrador && necesitaRevision && (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Revisar elegibilidad"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${abierto ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {esAdministrador && necesitaRevision && abierto && (
        <div className="space-y-3 border-t border-(--color-border) p-3">
          <p className="text-sm text-gray-600">
            Motivo de revisión: {jugador.motivoRevision ?? "CURP inconsistente o incompleta"}
          </p>
          <p className="text-xs text-gray-500">CURP capturada: {jugador.curp || "(vacía)"}</p>
          <Campo etiqueta="Motivo de la anulación manual">
            <input
              className={claseCampo}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. CURP verificada en documento físico presentado por el delegado"
            />
          </Campo>
          <div className="flex flex-wrap gap-2">
            <Boton
              variante="primario"
              disabled={!motivo.trim()}
              onClick={() => onGuardarOverride(true, motivo.trim())}
            >
              <ShieldCheck size={16} />
              Marcar como elegible
            </Boton>
            {jugador.overrideAdmin && (
              <Boton variante="secundario" onClick={() => onGuardarOverride(false, "")}>
                Quitar anulación
              </Boton>
            )}
          </div>
          {jugador.overrideAdmin?.elegibleForzado && (
            <p className="text-xs font-medium text-(--color-primary-dark)">
              Anulado manualmente: {jugador.overrideAdmin.motivo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
