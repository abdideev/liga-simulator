// Shared fixtures: a deterministic seed and a dispatcher that behaves like the
// React context (validate first, then reduce) without mounting React.

import type { AccionSimulador } from "../acciones";
import { crearGeneradorSecuencial } from "../ids";
import { simuladorReducer } from "../reducer";
import { crearEstadoInicial } from "../seed";
import type { ResultadoOperacion, SimuladorState } from "../types";
import { validarAccion } from "../validaciones";

/** Wednesday 4 Nov 2026, noon local time: jornada 2 is "today". */
export const HOY = new Date("2026-11-04T12:00:00");

export function semilla(): SimuladorState {
  return crearEstadoInicial(HOY, crearGeneradorSecuencial());
}

export interface Simulador {
  estado: SimuladorState;
  ultimo: ResultadoOperacion;
  d: (accion: AccionSimulador, ahora?: Date) => ResultadoOperacion;
}

export function simulador(inicial: SimuladorState = semilla()): Simulador {
  const crearId = crearGeneradorSecuencial();
  const s: Simulador = {
    estado: inicial,
    ultimo: { ok: true },
    d(accion, ahora = HOY) {
      const entorno = { crearId: (p: string) => `t-${crearId(p)}`, ahora };
      const r = validarAccion(s.estado, accion, entorno);
      if (r.ok) s.estado = simuladorReducer(s.estado, accion, entorno);
      s.ultimo = r;
      return r;
    },
  };
  return s;
}

export const ADULTO = { fechaNacimiento: "2000-01-01", curp: "TATA000101HHGRRSA1" };
export const MENOR = { fechaNacimiento: "2011-05-05", curp: "HEGL110505HHGRRSA1" };
export const TUTOR = {
  nombre: "Tutor Prueba",
  consentimiento: true,
  declaracion: true,
  parentesco: "madre" as const,
  publicarNombre: false,
  versionAviso: "1.0",
};

/** Calls up the first 11 eligible players of each side and starts the match. */
export function iniciarPartido(s: Simulador, partidoId: string) {
  const p = s.estado.partidos.find((x) => x.id === partidoId)!;
  for (const [lado, equipoId] of [
    ["local", p.equipoLocalId],
    ["visitante", p.equipoVisitanteId],
  ] as const) {
    const ids = s.estado.jugadores
      .filter((j) => j.equipoId === equipoId && !["jugador-29", "jugador-31", "jugador-53"].includes(j.id))
      .slice(0, 11)
      .map((j) => j.id);
    expectOk(s.d({ tipo: "actualizarConvocados", partidoId, lado, jugadorIds: ids }));
  }
  expectOk(s.d({ tipo: "iniciarPartido", partidoId }));
}

export function expectOk(r: ResultadoOperacion) {
  if (!r.ok) throw new Error(`Se esperaba OK y se obtuvo: ${r.motivo}`);
}

export function partido(s: Simulador, id: string) {
  return s.estado.partidos.find((p) => p.id === id)!;
}
