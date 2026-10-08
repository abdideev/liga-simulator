// Pure helpers for the mesa de control's live state (stopwatch + offline queue).

import type { EstadoMesa } from "./types";

/**
 * Demo acceleration: one simulated match minute passes per real second, so a
 * full match can be shown in a short client meeting.
 */
export const MS_POR_MINUTO_SIMULADO = 1000;

export const ESTADO_MESA_INICIAL: EstadoMesa = {
  minutoBase: 0,
  cronometroDesde: null,
  modoOffline: false,
  colaPendiente: [],
};

export function obtenerMesa(mesas: Record<string, EstadoMesa>, partidoId: string): EstadoMesa {
  return mesas[partidoId] ?? ESTADO_MESA_INICIAL;
}

/** Current match minute, derived from timestamps so it survives navigation and reloads. */
export function minutoActual(mesa: EstadoMesa, ahoraMs: number): number {
  if (mesa.cronometroDesde === null) return mesa.minutoBase;
  const transcurridos = Math.floor((ahoraMs - mesa.cronometroDesde) / MS_POR_MINUTO_SIMULADO);
  return mesa.minutoBase + Math.max(0, transcurridos);
}

export function pausarCronometro(mesa: EstadoMesa, ahoraMs: number): EstadoMesa {
  return { ...mesa, minutoBase: minutoActual(mesa, ahoraMs), cronometroDesde: null };
}

export function reanudarCronometro(mesa: EstadoMesa, ahoraMs: number): EstadoMesa {
  if (mesa.cronometroDesde !== null) return mesa;
  return { ...mesa, cronometroDesde: ahoraMs };
}

export function ajustarMinuto(mesa: EstadoMesa, delta: number, ahoraMs: number): EstadoMesa {
  const actual = minutoActual(mesa, ahoraMs);
  const nuevo = Math.max(0, actual + delta);
  return {
    ...mesa,
    minutoBase: nuevo,
    cronometroDesde: mesa.cronometroDesde === null ? null : ahoraMs,
  };
}
