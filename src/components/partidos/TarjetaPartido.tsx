import { MapPin } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import Etiqueta from "@/components/ui/Etiqueta";
import Tarjeta from "@/components/ui/Tarjeta";
import type { Intencion } from "@/components/ui/estilos";
import { tieneProtesta } from "@/lib/rules";
import type { EstadoPartido, Partido } from "@/lib/types";

export const ESTADO_PARTIDO: Record<EstadoPartido, { texto: string; intencion: Intencion }> = {
  programado: { texto: "Programado", intencion: "neutral" },
  en_curso: { texto: "En curso", intencion: "warn" },
  finalizado: { texto: "Finalizado", intencion: "ok" },
};

export default function TarjetaPartido({
  partido,
  nombreEquipo,
  hoy,
  mostrarJornada = false,
  mostrarProtesta = true,
  interactiva = false,
}: {
  partido: Partido;
  nombreEquipo: (equipoId: string) => string;
  hoy: string;
  mostrarJornada?: boolean;
  mostrarProtesta?: boolean;
  interactiva?: boolean;
}) {
  const estado = ESTADO_PARTIDO[partido.estado];
  return (
    <Tarjeta
      className={interactiva ? "transition-shadow hover:shadow-elevada" : ""}
      data-testid={`partido-${partido.id}`}
      data-estado={partido.estado}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {mostrarJornada && `Jornada ${partido.jornada} · `}
          {partido.fecha} · {partido.hora}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {partido.fecha === hoy && partido.estado !== "finalizado" && (
            <Etiqueta intencion="accent">Hoy</Etiqueta>
          )}
          {mostrarProtesta && tieneProtesta(partido) && (
            <Etiqueta intencion="danger">Con protesta</Etiqueta>
          )}
          <Etiqueta intencion={estado.intencion}>{estado.texto}</Etiqueta>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar nombre={nombreEquipo(partido.equipoLocalId)} tamano="sm" />
          <span className="truncate font-medium text-ink">{nombreEquipo(partido.equipoLocalId)}</span>
        </span>
        <span className="shrink-0 rounded-xl bg-canvas px-3 py-1 text-sm font-semibold tabular-nums text-ink">
          {partido.estado === "programado"
            ? "vs"
            : `${partido.golesLocal} - ${partido.golesVisitante}`}
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <span className="truncate text-right font-medium text-ink">
            {nombreEquipo(partido.equipoVisitanteId)}
          </span>
          <Avatar nombre={nombreEquipo(partido.equipoVisitanteId)} tamano="sm" />
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted">
        <MapPin size={12} />
        {partido.sede}
      </p>
    </Tarjeta>
  );
}
