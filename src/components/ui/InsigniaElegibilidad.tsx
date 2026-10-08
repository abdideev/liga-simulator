import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

import type { EstadoElegibilidad } from "@/lib/types";

import Etiqueta from "./Etiqueta";
import type { Intencion } from "./estilos";

const ESTILOS: Record<EstadoElegibilidad, { intencion: Intencion; icono: LucideIcon }> = {
  Elegible: { intencion: "ok", icono: CheckCircle2 },
  "No elegible por edad": { intencion: "danger", icono: XCircle },
  "Requiere revisión manual": { intencion: "warn", icono: AlertTriangle },
};

export default function InsigniaElegibilidad({ estado }: { estado: EstadoElegibilidad }) {
  const { intencion, icono } = ESTILOS[estado];
  return (
    <Etiqueta intencion={intencion} icono={icono} data-testid="insignia-elegibilidad" data-estado={estado}>
      {estado}
    </Etiqueta>
  );
}
