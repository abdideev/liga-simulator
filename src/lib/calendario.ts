// Round-robin schedule generation (circle method). Pure function, reused by
// both the seed data and the "Generar calendario" action in the Calendario screen.

import { sumarDiasISO } from "./fechas";
import type { Partido } from "./types";

const BYE = "__DESCANSO__";

export interface OpcionesCalendario {
  categoriaId: string;
  equipoIds: string[];
  fechaInicio: string; // ISO date for jornada 1
  diasEntreJornadas: number;
  horaDefault: string; // "HH:mm"
  sedes: string[]; // cycled across matches
  crearId: () => string;
}

/**
 * Generates a single round-robin (each team plays every other team once)
 * using the circle method. Handles an odd number of teams via a bye.
 */
export function generarCalendarioRoundRobin(opciones: OpcionesCalendario): Partido[] {
  const { categoriaId, equipoIds, fechaInicio, diasEntreJornadas, horaDefault, sedes, crearId } =
    opciones;

  const equipos = [...equipoIds];
  if (equipos.length < 2) return [];
  if (equipos.length % 2 !== 0) equipos.push(BYE);

  const n = equipos.length;
  const numRondas = n - 1;
  const mitad = n / 2;
  const partidos: Partido[] = [];
  let sedeIndice = 0;

  const rotacion = [...equipos];
  for (let ronda = 0; ronda < numRondas; ronda++) {
    for (let i = 0; i < mitad; i++) {
      const local = rotacion[i];
      const visitante = rotacion[n - 1 - i];
      if (local !== BYE && visitante !== BYE) {
        partidos.push({
          id: crearId(),
          categoriaId,
          jornada: ronda + 1,
          equipoLocalId: local,
          equipoVisitanteId: visitante,
          fecha: sumarDiasISO(fechaInicio, ronda * diasEntreJornadas),
          hora: horaDefault,
          sede: sedes[sedeIndice % sedes.length],
          estado: "programado",
          convocadosLocal: [],
          convocadosVisitante: [],
          titularesLocal: [],
          titularesVisitante: [],
          eventos: [],
          golesLocal: 0,
          golesVisitante: 0,
          actaCerrada: false,
          confirmacionDelegadoLocal: false,
          confirmacionDelegadoVisitante: false,
        });
        sedeIndice++;
      }
    }
    // Fix first element, rotate the rest.
    const fijo = rotacion[0];
    const resto = rotacion.slice(1);
    resto.unshift(resto.pop() as string);
    rotacion.splice(0, rotacion.length, fijo, ...resto);
  }

  return partidos;
}
