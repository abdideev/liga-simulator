// Pure role-based permission rules. Roles are simulated (no login), but the
// rules are enforced on every screen and route, not only in the menu, so a
// role cannot reach data it should not see by typing a URL.

import type { RolSimulado } from "./types";

const TODOS: RolSimulado[] = ["administrador", "delegado", "publico"];

/** Roles allowed per top-level section of the app. */
export const ROLES_POR_SECCION: Record<string, RolSimulado[]> = {
  "/": TODOS,
  "/configuracion": ["administrador"],
  "/equipos": ["administrador", "delegado"],
  "/registro": ["administrador"],
  "/calendario": ["administrador", "delegado"],
  "/partidos": ["administrador", "delegado"],
  "/estadisticas": ["administrador", "delegado"],
  "/bitacora": ["administrador"],
  "/publico": TODOS,
};

/** "/equipos/equipo-3" → "/equipos". */
export function seccionDeRuta(pathname: string): string {
  const primerSegmento = pathname.split("/").filter(Boolean)[0];
  return primerSegmento ? `/${primerSegmento}` : "/";
}

export function puedeAccederRuta(rol: RolSimulado, pathname: string): boolean {
  const roles = ROLES_POR_SECCION[seccionDeRuta(pathname)];
  // Unknown routes are left to Next.js (404).
  return roles ? roles.includes(rol) : true;
}

/**
 * A roster contains minors' ages and eligibility (RNF-08). Only the
 * administrator and the delegate of THAT team may see it.
 */
export function puedeVerPlantel(
  rol: RolSimulado,
  equipoDelegadoId: string | null,
  equipoId: string
): boolean {
  if (rol === "administrador") return true;
  if (rol === "delegado") return equipoDelegadoId === equipoId;
  return false;
}

/** Same audience as the roster: admin, or the team's own delegate. */
export const puedeInscribirEn = puedeVerPlantel;

/** Running the match (stopwatch, events, offline mode, closing the acta) belongs to the mesa (admin). */
export function puedeOperarMesa(rol: RolSimulado): boolean {
  return rol === "administrador";
}

/** Call-ups and acta sign-off for one side: admin, or that side's delegate. */
export function puedeActuarPorEquipo(
  rol: RolSimulado,
  equipoDelegadoId: string | null,
  equipoId: string
): boolean {
  if (rol === "administrador") return true;
  return rol === "delegado" && equipoDelegadoId === equipoId;
}

/** Only the administrator resolves a protest once the acta is closed. */
export function puedeResolverProtesta(rol: RolSimulado): boolean {
  return rol === "administrador";
}
