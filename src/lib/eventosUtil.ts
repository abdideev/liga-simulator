import {
  AlertTriangle,
  ArrowLeftRight,
  Flag,
  RotateCcw,
  Square,
  Target,
  type LucideIcon,
} from "lucide-react";

import type { TipoEvento } from "./types";

export { ETIQUETA_EVENTO, TIPOS_EVENTO, TIPOS_QUE_REQUIEREN_JUGADOR } from "./eventos";

export const ICONO_EVENTO: Record<TipoEvento, LucideIcon> = {
  gol: Target,
  autogol: RotateCcw,
  tarjeta_amarilla: Square,
  tarjeta_roja: Square,
  falta: AlertTriangle,
  tiro_esquina: Flag,
  sustitucion: ArrowLeftRight,
};

export const CLASE_COLOR_EVENTO: Record<TipoEvento, string> = {
  gol: "text-(--color-ok-ink)",
  autogol: "text-(--color-danger)",
  tarjeta_amarilla: "text-(--color-warn-ink)",
  tarjeta_roja: "text-(--color-danger)",
  falta: "text-(--color-muted)",
  tiro_esquina: "text-(--color-muted)",
  sustitucion: "text-(--color-accent)",
};
