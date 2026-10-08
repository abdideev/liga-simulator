// Pure, testable business rules: eligibility, standings, suspensions.
// No React, no localStorage, no side effects. Anything time-dependent takes
// an injectable `referencia` date.

import type {
  Categoria,
  EstadisticaJugador,
  EstadoElegibilidad,
  EventoPartido,
  Jugador,
  Lado,
  Partido,
  ResultadoOperacion,
  TablaPosicion,
} from "./types";
import { parsearFechaLocal } from "./fechas";

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

  const fecha = parsearFechaLocal(fechaNacimiento);
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
  const nacimiento = parsearFechaLocal(fechaNacimiento);
  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const cumplioEsteAnio =
    referencia.getMonth() > nacimiento.getMonth() ||
    (referencia.getMonth() === nacimiento.getMonth() &&
      referencia.getDate() >= nacimiento.getDate());
  if (!cumplioEsteAnio) edad -= 1;
  return edad;
}

/** Derived on every read so a player stops being a minor on their 18th birthday. */
export function esMenorDeEdad(fechaNacimiento: string, referencia: Date = new Date()): boolean {
  return calcularEdad(fechaNacimiento, referencia) < 18;
}

export interface ResultadoElegibilidad {
  estado: EstadoElegibilidad;
  motivoRevision?: string;
}

/**
 * Determines eligibility status. CURP inconsistencies always take
 * precedence and route to manual review, since age cannot be trusted
 * from a self-reported date alone.
 *
 * Eligibility compares the birth YEAR only, not the exact date. This is a
 * business decision pending confirmation with the client's regulations.
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

  const anioNacimiento = parsearFechaLocal(fechaNacimiento).getFullYear();
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
  if (jugador.overrideAdmin?.elegibleForzado) return "Elegible";
  return jugador.estadoElegibilidad;
}

export const NUMERO_PLAYERA_MIN = 1;
export const NUMERO_PLAYERA_MAX = 99;

/** Shirt numbers are optional, but when present must be 1–99 and unique within the roster. */
export function validarNumeroPlayera(
  numero: number | undefined,
  plantel: Jugador[],
  excluirJugadorId?: string
): ResultadoOperacion {
  if (numero === undefined) return { ok: true };
  if (!Number.isInteger(numero) || numero < NUMERO_PLAYERA_MIN || numero > NUMERO_PLAYERA_MAX) {
    return {
      ok: false,
      motivo: `El número debe ser un entero entre ${NUMERO_PLAYERA_MIN} y ${NUMERO_PLAYERA_MAX}`,
    };
  }
  const repetido = plantel.find((j) => j.numero === numero && j.id !== excluirJugadorId);
  if (repetido) {
    return { ok: false, motivo: `El número ${numero} ya lo usa ${repetido.nombreCompleto}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Registration window
// ---------------------------------------------------------------------------

export type EstadoRegistro = "abierto" | "extemporaneo" | "cerrado";

/**
 * Whether a category accepts new players on `hoy` (YYYY-MM-DD). After the
 * regular close, an admin-approved late window can reopen it until `hasta`.
 */
export function estadoRegistro(categoria: Categoria, hoy: string): EstadoRegistro {
  if (!categoria.registroCerrado) return "abierto";
  const ventana = categoria.ventanaExtemporanea;
  if (ventana && hoy >= ventana.abiertaEl && hoy <= ventana.hasta) return "extemporaneo";
  return "cerrado";
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
// Acta (match report) sign-off
// ---------------------------------------------------------------------------

/** A side has signed the acta when its delegate either confirmed or filed a protest. */
export function ladoFirmoActa(partido: Partido, lado: Lado): boolean {
  return lado === "local"
    ? partido.confirmacionDelegadoLocal || !!partido.protestaLocal
    : partido.confirmacionDelegadoVisitante || !!partido.protestaVisitante;
}

export function tieneProtesta(partido: Partido): boolean {
  return !!partido.protestaLocal || !!partido.protestaVisitante;
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
// Suspensions
// ---------------------------------------------------------------------------

export const AMARILLAS_PARA_SUSPENSION = 5;

export interface ResultadoSuspension {
  suspendido: boolean;
  motivo?: string;
}

function eventosDeJugador(eventos: EventoPartido[], jugadorId: string): EventoPartido[] {
  return eventos.filter((e) => e.jugadorId === jugadorId);
}

/** A team's matches in playing order (jornada, then date). */
export function partidosDelEquipo(equipoId: string, partidos: Partido[]): Partido[] {
  return partidos
    .filter((p) => p.equipoLocalId === equipoId || p.equipoVisitanteId === equipoId)
    .sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha));
}

/**
 * Whether a player still owes a suspension after the team's finalized
 * matches played before `antesDeJornada` (all of them by default).
 *
 * A red card, or reaching 5 accumulated yellow cards, suspends the player
 * for the TEAM's next match — not for the next jornada number of the
 * category. A jornada where the team rests (bye) does not count as served.
 */
export function calcularSuspension(
  jugadorId: string,
  equipoId: string,
  partidos: Partido[],
  antesDeJornada: number = Number.POSITIVE_INFINITY
): ResultadoSuspension {
  const previos = partidosDelEquipo(equipoId, partidos).filter(
    (p) => p.estado === "finalizado" && p.jornada < antesDeJornada
  );

  let partidosPorCumplir = 0;
  let motivo = "";
  let amarillasAcumuladas = 0;

  for (const partido of previos) {
    if (partidosPorCumplir > 0) {
      // The player sat out this team match: suspension served.
      partidosPorCumplir -= 1;
      continue;
    }

    const eventosJugador = eventosDeJugador(partido.eventos, jugadorId);
    if (eventosJugador.some((e) => e.tipo === "tarjeta_roja")) {
      partidosPorCumplir = 1;
      motivo = "Tarjeta roja directa";
      continue;
    }

    amarillasAcumuladas += eventosJugador.filter((e) => e.tipo === "tarjeta_amarilla").length;
    if (amarillasAcumuladas >= AMARILLAS_PARA_SUSPENSION) {
      partidosPorCumplir = 1;
      motivo = `Acumulación de ${AMARILLAS_PARA_SUSPENSION} tarjetas amarillas`;
      amarillasAcumuladas -= AMARILLAS_PARA_SUSPENSION;
    }
  }

  return partidosPorCumplir > 0 ? { suspendido: true, motivo } : { suspendido: false };
}

/** Single criterion used everywhere: is the player suspended for this specific match? */
export function calcularSuspensionParaPartido(
  jugadorId: string,
  equipoId: string,
  partido: Partido,
  partidos: Partido[]
): ResultadoSuspension {
  return calcularSuspension(jugadorId, equipoId, partidos, partido.jornada);
}

/**
 * Whether a player may be called up for a match: they must be effectively
 * eligible (or admin-overridden) and not serving a suspension.
 */
export function puedeSerConvocado(
  jugador: Jugador,
  partido: Partido,
  partidos: Partido[]
): ResultadoOperacion {
  const estado = estadoEfectivo(jugador);
  if (estado !== "Elegible") {
    return { ok: false, motivo: estado };
  }
  const suspension = calcularSuspensionParaPartido(jugador.id, jugador.equipoId, partido, partidos);
  if (suspension.suspendido) {
    return { ok: false, motivo: `Suspendido — ${suspension.motivo}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Player statistics
// ---------------------------------------------------------------------------

/** Real participation: started the match or came on as a substitute. */
export function participoEnPartido(jugadorId: string, partido: Partido): boolean {
  const titular =
    partido.titularesLocal.includes(jugadorId) || partido.titularesVisitante.includes(jugadorId);
  const entroDeCambio = partido.eventos.some(
    (e) => e.tipo === "sustitucion" && e.jugadorEntraId === jugadorId
  );
  return titular || entroDeCambio;
}

/** Stats count only finalized matches; suspension is for the team's next match. */
export function calcularEstadisticasJugadores(
  jugadores: Jugador[],
  partidos: Partido[]
): EstadisticaJugador[] {
  const finalizados = partidos.filter((p) => p.estado === "finalizado");

  return jugadores.map((jugador) => {
    let goles = 0;
    let autogoles = 0;
    let amarillas = 0;
    let rojas = 0;
    let partidosJugados = 0;

    for (const partido of finalizados) {
      if (participoEnPartido(jugador.id, partido)) partidosJugados += 1;
      for (const evento of eventosDeJugador(partido.eventos, jugador.id)) {
        if (evento.tipo === "gol") goles += 1;
        if (evento.tipo === "autogol") autogoles += 1;
        if (evento.tipo === "tarjeta_amarilla") amarillas += 1;
        if (evento.tipo === "tarjeta_roja") rojas += 1;
      }
    }

    const suspension = calcularSuspension(jugador.id, jugador.equipoId, partidos);

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
