// Pure helpers for the legal-compliance screens (no React, no clock).

import { fechaISOLocal, parsearFechaLocal } from "../fechas";
import type { SimuladorState, UsuarioSimulado } from "../types";

/** The person behind the current simulated role; null for the public view. */
export function usuarioActual(estado: SimuladorState): UsuarioSimulado | null {
  if (estado.rolActual === "administrador") {
    const a = estado.legal.administrador;
    return { clave: "admin", nombre: a.nombre, correo: a.correo, rol: "administrador", cargo: a.cargo };
  }
  if (estado.rolActual === "delegado") {
    const equipo = estado.equipos.find((e) => e.id === estado.equipoDelegadoId);
    if (!equipo) return null;
    return {
      clave: `delegado:${equipo.id}`,
      nombre: equipo.delegado.nombre,
      correo: correoDe(equipo.delegado.nombre),
      rol: "delegado",
      cargo: `Delegado de ${equipo.nombre}`,
    };
  }
  return null;
}

/** Fictitious, clearly non-real address for the seeded people. */
export function correoDe(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
  return `${base}@correo-ejemplo.mx`;
}

/** Whether this user already accepted the given version of the Términos de uso. */
export function yaAceptoTerminos(estado: SimuladorState, clave: string, version: string): boolean {
  return estado.legal.aceptaciones.some((a) => a.usuario === clave && a.versionTerminos === version);
}

/** Adds n business days (Mon–Fri) to an ISO date. Holidays are not modeled. */
export function sumarDiasHabiles(fechaISO: string, n: number): string {
  const fecha = parsearFechaLocal(fechaISO);
  let restantes = n;
  while (restantes > 0) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) restantes -= 1;
  }
  return fechaISOLocal(fecha);
}

/** Business days from `desde` (exclusive) to `hasta` (inclusive); negative if overdue. */
export function diasHabilesEntre(desde: string, hasta: string): number {
  if (hasta === desde) return 0;
  const signo = hasta > desde ? 1 : -1;
  const [a, b] = signo === 1 ? [desde, hasta] : [hasta, desde];
  const fecha = parsearFechaLocal(a);
  let cuenta = 0;
  while (fechaISOLocal(fecha) < b) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) cuenta += 1;
  }
  return signo * cuenta;
}

/** Last scheduled match date: the end of the current season (or null without a calendar). */
export function finDeTemporada(estado: SimuladorState): string | null {
  const fechas = estado.partidos.map((p) => p.fecha).sort();
  return fechas.length ? fechas[fechas.length - 1] : null;
}

export interface ResumenPlan {
  equipos: number;
  subtotal: number;
  iva: number;
  total: number;
}

export function resumenPlan(estado: SimuladorState): ResumenPlan {
  const { precioPorEquipo, tasaIva } = estado.legal.licencia;
  const equipos = estado.equipos.length;
  const subtotal = equipos * precioPorEquipo;
  const iva = Math.round(subtotal * tasaIva * 100) / 100;
  return { equipos, subtotal, iva, total: subtotal + iva };
}

export function siguienteFolioConstancia(estado: SimuladorState, anio: number): string {
  return `ACE-${anio}-${String(estado.legal.constancias.length + 1).padStart(6, "0")}`;
}

export function siguienteFolioArco(estado: SimuladorState, anio: number): string {
  return `ARCO-${anio}-${String(estado.legal.solicitudesArco.length + 1).padStart(4, "0")}`;
}

/** Whether a player's name may appear in the public view (minors: only with the tutor's consent 2). */
export function nombrePublicable(menor: boolean, publicarNombre: boolean | undefined): boolean {
  return !menor || publicarNombre === true;
}

export const ETIQUETA_MOTIVO_CANCELACION = {
  costo: "El costo no se ajusta al presupuesto",
  otro_sistema: "Cambiaremos a otro sistema",
  fin_liga: "La liga dejará de operar",
  insatisfecho: "El servicio no cumplió lo esperado",
  otro: "Otro motivo",
} as const;

export const ETIQUETA_ARCO = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  cancelacion: "Cancelación",
  oposicion: "Oposición",
  revocacion: "Revocación de consentimiento",
} as const;

export const ETIQUETA_ESTADO_LICENCIA = {
  pendiente: "Pendiente de aceptación",
  activa: "Activa",
  cancelacion_programada: "Cancelación programada",
} as const;
