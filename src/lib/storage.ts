import type { SimuladorState } from "./types";

const STORAGE_KEY = "liga-simulador:estado";

export function cargarEstado(): SimuladorState | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(STORAGE_KEY);
    if (!crudo) return null;
    return JSON.parse(crudo) as SimuladorState;
  } catch {
    return null;
  }
}

export function guardarEstado(estado: SimuladorState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    // Storage full or unavailable: fail silently, this is a local prototype.
  }
}

export function limpiarEstado(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
