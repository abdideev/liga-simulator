import type { SimuladorState } from "./types";

const STORAGE_KEY = "liga-simulador:estado";

/**
 * Bump whenever the shape of SimuladorState or the seed changes. A saved
 * state with a different version is discarded and the app starts from the
 * fresh seed instead of loading data it no longer understands.
 */
export const VERSION_ESQUEMA = 3;

interface EstadoGuardado {
  version: number;
  estado: SimuladorState;
}

export function cargarEstado(): SimuladorState | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(STORAGE_KEY);
    if (!crudo) return null;
    const guardado = JSON.parse(crudo) as Partial<EstadoGuardado>;
    if (guardado.version !== VERSION_ESQUEMA || !guardado.estado) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return guardado.estado;
  } catch {
    return null;
  }
}

export function guardarEstado(estado: SimuladorState): void {
  if (typeof window === "undefined") return;
  try {
    const guardado: EstadoGuardado = { version: VERSION_ESQUEMA, estado };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guardado));
  } catch {
    // Storage full or unavailable: fail silently, this is a local prototype.
  }
}

export function limpiarEstado(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
