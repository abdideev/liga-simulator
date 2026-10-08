"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Etiqueta from "@/components/ui/Etiqueta";
import InsigniaElegibilidad from "@/components/ui/InsigniaElegibilidad";
import { calcularEdad, esMenorDeEdad, estadoEfectivo } from "@/lib/rules";
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
  const menor = esMenorDeEdad(jugador.fechaNacimiento);
  const estado = estadoEfectivo(jugador);
  const necesitaRevision = jugador.estadoElegibilidad === "Requiere revisión manual";

  return (
    <div
      className="rounded-2xl bg-paper shadow-suave transition-shadow hover:shadow-elevada"
      data-testid={`fila-jugador-${jugador.id}`}
      data-estado={estado}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas text-sm font-semibold text-muted">
          {jugador.numero ?? "—"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{jugador.nombreCompleto}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            {edad} años
            {menor && <span>· Menor de edad</span>}
            {jugador.altaExtemporanea && <span>· Alta extemporánea</span>}
          </p>
        </div>
        <InsigniaElegibilidad estado={estado} />
        {esAdministrador && necesitaRevision && (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Revisar elegibilidad"
            aria-expanded={abierto}
            data-testid={`boton-revisar-${jugador.id}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-control"
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${abierto ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {esAdministrador && necesitaRevision && abierto && (
        <div className="mx-3 mb-3 space-y-3 rounded-2xl bg-canvas p-4" data-testid={`panel-anulacion-${jugador.id}`}>
          <p className="text-sm text-muted">
            Motivo de revisión: {jugador.motivoRevision ?? "CURP inconsistente o incompleta"}
          </p>
          <p className="text-xs text-muted">CURP capturada: {jugador.curp || "(vacía)"}</p>
          <Campo etiqueta="Motivo de la anulación manual">
            <input
              className={claseCampo}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. CURP verificada en documento físico presentado por el delegado"
              data-testid={`motivo-anulacion-${jugador.id}`}
            />
          </Campo>
          <div className="flex flex-wrap gap-2">
            <Boton
              intencion="ok"
              disabled={!motivo.trim()}
              onClick={() => onGuardarOverride(true, motivo.trim())}
              data-testid={`boton-marcar-elegible-${jugador.id}`}
            >
              <ShieldCheck size={16} />
              Marcar como elegible
            </Boton>
            {jugador.overrideAdmin && (
              <Boton intencion="neutral" variante="contorno" onClick={() => onGuardarOverride(false, "")}>
                Quitar anulación
              </Boton>
            )}
          </div>
          {jugador.overrideAdmin?.elegibleForzado && (
            <Etiqueta intencion="ok" icono={ShieldCheck}>
              Anulado manualmente: {jugador.overrideAdmin.motivo}
            </Etiqueta>
          )}
        </div>
      )}
    </div>
  );
}
