// UI-free event metadata, safe to import from pure business logic.
// Icons and colors live in eventosUtil.ts.

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
