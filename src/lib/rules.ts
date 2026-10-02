// Pure, testable business rules: eligibility, standings, suspensions.
// No React, no localStorage, no side effects.

import type {
  Categoria,
  Equipo,
  EstadisticaJugador,
  EstadoElegibilidad,
  EventoPartido,
  Jugador,
  Partido,
  TablaPosicion,
} from "./types";

// ---------------------------------------------------------------------------
// CURP structural validation (NOT a real government lookup)
// ---------------------------------------------------------------------------

const CURP_PATTERN =
  /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;

export interface ResultadoValidacionCurp {
  valida: boolean;
  motivo?: string;
}

/**
 * Validates only the structure of a CURP and whether its embedded date
 * segment (YYMMDD) is consistent with the stated birth date. Does not
 * contact any external registry.
 */
export function validarEstructuraCurp(
  curp: string,
  fechaNacimiento: string
): ResultadoValidacionCurp {
  const valor = (curp ?? "").trim().toUpperCase();

  if (!valor) {
    return { valida: false, motivo: "CURP no capturada" };
  }
  if (valor.length !== 18) {
    return { valida: false, motivo: "La CURP debe tener 18 caracteres" };
  }
  if (!CURP_PATTERN.test(valor)) {
    return { valida: false, motivo: "El formato de la CURP no es válido" };
  }

  const fecha = new Date(`${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return { valida: false, motivo: "Fecha de nacimiento inválida" };
  }

  const yy = valor.slice(4, 6);
  const mm = valor.slice(6, 8);
  const dd = valor.slice(8, 10);

  const anioCompleto = fecha.getFullYear().toString().slice(-2);
  const mesEsperado = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const diaEsperado = fecha.getDate().toString().padStart(2, "0");

  if (yy !== anioCompleto || mm !== mesEsperado || dd !== diaEsperado) {
    return {
      valida: false,
      motivo: "La fecha dentro de la CURP no coincide con la fecha de nacimiento",
    };
  }

  return { valida: true };
}

// ---------------------------------------------------------------------------
// Age / eligibility
// ---------------------------------------------------------------------------

export function calcularEdad(fechaNacimiento: string, referencia: Date = new Date()): number {
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const cumplioEsteAnio =
    referencia.getMonth() > nacimiento.getMonth() ||
    (referencia.getMonth() === nacimiento.getMonth() &&
      referencia.getDate() >= nacimiento.getDate());
  if (!cumplioEsteAnio) edad -= 1;
  return edad;
}

export function esMenorDeEdad(fechaNacimiento: string): boolean {
  return calcularEdad(fechaNacimiento) < 18;
}

export interface ResultadoElegibilidad {
  estado: EstadoElegibilidad;
  motivoRevision?: string;
}

/**
 * Determines eligibility status. CURP inconsistencies always take
 * precedence and route to manual review, since age cannot be trusted
 * from a self-reported date alone.
 */
export function calcularElegibilidad(
  fechaNacimiento: string,
  curp: string,
  categoria: Pick<Categoria, "anioNacimientoMin" | "anioNacimientoMax">
): ResultadoElegibilidad {
  const validacionCurp = validarEstructuraCurp(curp, fechaNacimiento);
  if (!validacionCurp.valida) {
    return {
      estado: "Requiere revisión manual",
      motivoRevision: validacionCurp.motivo,
    };
  }

  const anioNacimiento = new Date(`${fechaNacimiento}T00:00:00`).getFullYear();
  if (
    anioNacimiento < categoria.anioNacimientoMin ||
    anioNacimiento > categoria.anioNacimientoMax
  ) {
    return { estado: "No elegible por edad" };
  }

  return { estado: "Elegible" };
}

/** Effective status a screen should display, honoring an admin override if present. */
export function estadoEfectivo(jugador: Jugador): EstadoElegibilidad {
  if (jugador.overrideAdmin) {
    return jugador.overrideAdmin.elegibleForzado ? "Elegible" : jugador.estadoElegibilidad;
  }
  return jugador.estadoElegibilidad;
}

// ---------------------------------------------------------------------------
// Live scoreboard
// ---------------------------------------------------------------------------

/**
 * Recomputes the scoreboard from the event list. An "autogol" is logged
 * against the scoring player's own team but counts for the opponent.
 */
export function recalcularMarcador(
  eventos: EventoPartido[],
  equipoLocalId: string,
  equipoVisitanteId: string
): { golesLocal: number; golesVisitante: number } {
  let golesLocal = 0;
  let golesVisitante = 0;
  for (const evento of eventos) {
    if (evento.tipo === "gol") {
      if (evento.equipoId === equipoLocalId) golesLocal += 1;
      else if (evento.equipoId === equipoVisitanteId) golesVisitante += 1;
    } else if (evento.tipo === "autogol") {
      if (evento.equipoId === equipoLocalId) golesVisitante += 1;
      else if (evento.equipoId === equipoVisitanteId) golesLocal += 1;
    }
  }
  return { golesLocal, golesVisitante };
}

// ---------------------------------------------------------------------------
// Standings (tabla de posiciones)
// ---------------------------------------------------------------------------

interface StatsBase {
  equipoId: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
}

function statsDesdePartidos(equipoIds: string[], partidos: Partido[]): StatsBase[] {
  const mapa = new Map<string, StatsBase>();
  for (const id of equipoIds) {
    mapa.set(id, {
      equipoId: id,
      partidosJugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
    });
  }

  for (const partido of partidos) {
    if (partido.estado !== "finalizado") continue;
    const local = mapa.get(partido.equipoLocalId);
    const visitante = mapa.get(partido.equipoVisitanteId);
    if (!local || !visitante) continue;

    local.partidosJugados += 1;
    visitante.partidosJugados += 1;
    local.golesFavor += partido.golesLocal;
    local.golesContra += partido.golesVisitante;
    visitante.golesFavor += partido.golesVisitante;
    visitante.golesContra += partido.golesLocal;

    if (partido.golesLocal > partido.golesVisitante) {
      local.ganados += 1;
      visitante.perdidos += 1;
    } else if (partido.golesLocal < partido.golesVisitante) {
      visitante.ganados += 1;
      local.perdidos += 1;
    } else {
      local.empatados += 1;
      visitante.empatados += 1;
    }
  }

  return Array.from(mapa.values());
}

function aTablaPosicion(stats: StatsBase): TablaPosicion {
  return {
    ...stats,
    diferenciaGoles: stats.golesFavor - stats.golesContra,
    puntos: stats.ganados * 3 + stats.empatados * 1,
  };
}

function empatadosEn(a: TablaPosicion, b: TablaPosicion): boolean {
  return (
    a.puntos === b.puntos &&
    a.diferenciaGoles === b.diferenciaGoles &&
    a.golesFavor === b.golesFavor
  );
}

/**
 * Standings for one category. Tie-break order: points -> goal difference
 * -> goals for -> head-to-head (mini-table among the still-tied teams).
 */
export function calcularTabla(
  equipoIds: string[],
  partidos: Partido[],
  categoriaId: string
): TablaPosicion[] {
  const partidosCategoria = partidos.filter((p) => p.categoriaId === categoriaId);
  const base = statsDesdePartidos(equipoIds, partidosCategoria).map(aTablaPosicion);

  base.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      b.diferenciaGoles - a.diferenciaGoles ||
      b.golesFavor - a.golesFavor
  );

  const resultado: TablaPosicion[] = [];
  let i = 0;
  while (i < base.length) {
    let j = i + 1;
    while (j < base.length && empatadosEn(base[i], base[j])) j++;
    const grupo = base.slice(i, j);

    if (grupo.length === 1) {
      resultado.push(grupo[0]);
    } else {
      const idsGrupo = grupo.map((g) => g.equipoId);
      const partidosEntreEllos = partidosCategoria.filter(
        (p) =>
          idsGrupo.includes(p.equipoLocalId) &&
          idsGrupo.includes(p.equipoVisitanteId)
      );
      const miniTabla = statsDesdePartidos(idsGrupo, partidosEntreEllos)
        .map(aTablaPosicion)
        .sort(
          (a, b) =>
            b.puntos - a.puntos ||
            b.diferenciaGoles - a.diferenciaGoles ||
            b.golesFavor - a.golesFavor
        );
      for (const mini of miniTabla) {
        const original = grupo.find((g) => g.equipoId === mini.equipoId);
        if (original) resultado.push(original);
      }
    }
    i = j;
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// Player statistics and suspensions
// ---------------------------------------------------------------------------

function eventosDeJugador(eventos: EventoPartido[], jugadorId: string): EventoPartido[] {
  return eventos.filter((e) => e.jugadorId === jugadorId);
}

export function calcularEstadisticasJugadores(
  jugadores: Jugador[],
  partidos: Partido[],
  equipos: Equipo[]
): EstadisticaJugador[] {
  const categoriaPorEquipo = new Map(equipos.map((e) => [e.id, e.categoriaId]));

  return jugadores.map((jugador) => {
    let goles = 0;
    let autogoles = 0;
    let amarillas = 0;
    let rojas = 0;
    let partidosJugados = 0;

    for (const partido of partidos) {
      if (partido.estado === "programado") continue;
      const convocado =
        partido.convocadosLocal.includes(jugador.id) ||
        partido.convocadosVisitante.includes(jugador.id);
      if (!convocado) continue;

      partidosJugados += 1;
      const eventosJugador = eventosDeJugador(partido.eventos, jugador.id);
      for (const evento of eventosJugador) {
        if (evento.tipo === "gol") goles += 1;
        if (evento.tipo === "autogol") autogoles += 1;
        if (evento.tipo === "tarjeta_amarilla") amarillas += 1;
        if (evento.tipo === "tarjeta_roja") rojas += 1;
      }
    }

    const categoriaId = categoriaPorEquipo.get(jugador.equipoId);
    const proximaJornada = categoriaId
      ? obtenerProximaJornada(categoriaId, partidos)
      : 1;
    const suspension = categoriaId
      ? calcularSuspensionParaJornada(jugador.id, categoriaId, proximaJornada, partidos)
      : { suspendido: false as const };

    return {
      jugadorId: jugador.id,
      goles,
      autogoles,
      tarjetasAmarillas: amarillas,
      tarjetasRojas: rojas,
      partidosJugados,
      suspendido: suspension.suspendido,
      motivoSuspension: suspension.motivo,
    };
  });
}

export interface ResultadoSuspension {
  suspendido: boolean;
  motivo?: string;
}

/**
 * A player is suspended for `jornadaObjetivo` when, in the immediately
 * preceding jornada of the same category, they received a red card or
 * their accumulated yellow-card count (since the last suspension served)
 * reached a multiple of 5.
 */
export function calcularSuspensionParaJornada(
  jugadorId: string,
  categoriaId: string,
  jornadaObjetivo: number,
  partidos: Partido[]
): ResultadoSuspension {
  const partidosPrevios = partidos
    .filter(
      (p) =>
        p.categoriaId === categoriaId &&
        p.estado === "finalizado" &&
        p.jornada < jornadaObjetivo
    )
    .sort((a, b) => a.jornada - b.jornada);

  let amarillasAcumuladas = 0;
  let jornadaDisparo: number | null = null;
  let motivoDisparo = "";

  for (const partido of partidosPrevios) {
    const eventosJugador = eventosDeJugador(partido.eventos, jugadorId);
    const tieneRoja = eventosJugador.some((e) => e.tipo === "tarjeta_roja");
    const amarillasPartido = eventosJugador.filter(
      (e) => e.tipo === "tarjeta_amarilla"
    ).length;

    if (tieneRoja) {
      jornadaDisparo = partido.jornada;
      motivoDisparo = "Tarjeta roja directa";
      amarillasAcumuladas = 0;
      continue;
    }

    amarillasAcumuladas += amarillasPartido;
    if (amarillasAcumuladas >= 5) {
      jornadaDisparo = partido.jornada;
      motivoDisparo = "Acumulación de 5 tarjetas amarillas";
      amarillasAcumuladas = 0;
    }
  }

  if (jornadaDisparo !== null && jornadaDisparo + 1 === jornadaObjetivo) {
    return { suspendido: true, motivo: motivoDisparo };
  }
  return { suspendido: false };
}

/** Next jornada number for a category: last finalized + 1, or 1 if none played. */
export function obtenerProximaJornada(categoriaId: string, partidos: Partido[]): number {
  const jornadasFinalizadas = partidos
    .filter((p) => p.categoriaId === categoriaId && p.estado === "finalizado")
    .map((p) => p.jornada);
  if (jornadasFinalizadas.length === 0) {
    const jornadas = partidos
      .filter((p) => p.categoriaId === categoriaId)
      .map((p) => p.jornada);
    return jornadas.length > 0 ? Math.min(...jornadas) : 1;
  }
  return Math.max(...jornadasFinalizadas) + 1;
}
