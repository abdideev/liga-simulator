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

export const ETIQUETA_EVENTO: Record<TipoEvento, string> = {
  gol: "Gol",
  autogol: "Autogol",
  tarjeta_amarilla: "Tarjeta amarilla",
  tarjeta_roja: "Tarjeta roja",
  falta: "Falta",
  tiro_esquina: "Tiro de esquina",
  sustitucion: "Sustitución",
};

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
  gol: "text-(--color-primary-dark)",
  autogol: "text-(--color-danger)",
  tarjeta_amarilla: "text-amber-500",
  tarjeta_roja: "text-(--color-danger)",
  falta: "text-gray-500",
  tiro_esquina: "text-gray-500",
  sustitucion: "text-blue-600",
};

export const TIPOS_EVENTO: TipoEvento[] = [
  "gol",
  "autogol",
  "tarjeta_amarilla",
  "tarjeta_roja",
  "falta",
  "tiro_esquina",
  "sustitucion",
];

export const TIPOS_QUE_REQUIEREN_JUGADOR: TipoEvento[] = [
  "gol",
  "autogol",
  "tarjeta_amarilla",
  "tarjeta_roja",
];
