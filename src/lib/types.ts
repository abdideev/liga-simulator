// Domain model for the Liga Simulator prototype.
// Sport-agnostic where reasonable; football-specific fields are noted.

export type RolSimulado = "administrador" | "delegado" | "publico";

/** Side of a match, used for convocatoria, confirmations and protests. */
export type Lado = "local" | "visitante";

export interface Liga {
  id: string;
  nombre: string;
  temporadaActivaId: string;
}

export interface Temporada {
  id: string;
  ligaId: string;
  nombre: string;
}

/**
 * Late-registration window opened by the administrator on a category whose
 * registration is already closed (Entregable 3, etapa E, punto 16).
 */
export interface VentanaExtemporanea {
  abiertaEl: string; // ISO date
  hasta: string; // ISO date, inclusive
  motivo: string;
}

export interface Categoria {
  id: string;
  temporadaId: string;
  nombre: string;
  anioNacimientoMin: number; // oldest allowed birth year (defines max age)
  anioNacimientoMax: number; // most recent allowed birth year (defines min age)
  cupoEquipos: number;
  limiteJugadoresPorPlantel: number;
  registroCerrado: boolean;
  fechaCierreRegistro?: string; // ISO date
  ventanaExtemporanea?: VentanaExtemporanea;
}

export interface Delegado {
  nombre: string;
  telefono: string;
}

export interface Equipo {
  id: string;
  categoriaId: string;
  nombre: string;
  delegado: Delegado;
}

export type EstadoElegibilidad =
  | "Elegible"
  | "No elegible por edad"
  | "Requiere revisión manual";

export interface OverrideAdmin {
  elegibleForzado: boolean;
  motivo: string;
  fecha: string; // ISO datetime
}

export interface TutorInfo {
  nombre: string;
  consentimiento: boolean;
}

export interface Jugador {
  id: string;
  equipoId: string;
  nombreCompleto: string;
  fechaNacimiento: string; // ISO date (YYYY-MM-DD)
  curp: string;
  numero?: number;
  fotoUrl?: string; // placeholder only
  estadoElegibilidad: EstadoElegibilidad;
  motivoRevision?: string;
  overrideAdmin?: OverrideAdmin;
  tutor?: TutorInfo;
  // Minority is derived from fechaNacimiento (see esMenorDeEdad); it is not
  // stored so it stays correct as time passes.
  altaExtemporanea?: boolean;
}

export type TipoEvento =
  | "gol"
  | "autogol"
  | "tarjeta_amarilla"
  | "tarjeta_roja"
  | "falta"
  | "tiro_esquina"
  | "sustitucion";

export interface EventoPartido {
  id: string;
  partidoId: string;
  minuto: number;
  tipo: TipoEvento;
  equipoId: string;
  jugadorId?: string; // player primarily involved (scorer, carded, fouler, subbed out)
  jugadorEntraId?: string; // for sustitucion
  registradoOffline?: boolean;
}

export type EstadoPartido =
  | "programado"
  | "en_curso"
  | "finalizado";

export interface ResolucionProtesta {
  texto: string;
  fecha: string; // ISO datetime
}

/** A delegate's formal objection to the acta, instead of confirming it (RF-15). */
export interface Protesta {
  motivo: string;
  fecha: string; // ISO datetime
  resolucion?: ResolucionProtesta;
}

export interface Partido {
  id: string;
  categoriaId: string;
  jornada: number;
  equipoLocalId: string;
  equipoVisitanteId: string;
  fecha: string; // ISO date
  hora: string; // HH:mm
  sede: string;
  estado: EstadoPartido;
  convocadosLocal: string[]; // jugadorId[]
  convocadosVisitante: string[];
  titularesLocal: string[]; // subset of convocados that started the match
  titularesVisitante: string[];
  eventos: EventoPartido[];
  golesLocal: number;
  golesVisitante: number;
  actaCerrada: boolean;
  confirmacionDelegadoLocal: boolean;
  confirmacionDelegadoVisitante: boolean;
  protestaLocal?: Protesta;
  protestaVisitante?: Protesta;
}

/**
 * Live state of the mesa de control for one match. Kept in the global state
 * (and therefore in localStorage) so leaving the page does not lose it.
 */
export interface EstadoMesa {
  minutoBase: number; // minutes accumulated before the current run
  cronometroDesde: number | null; // epoch ms when the stopwatch was started, null if paused
  modoOffline: boolean;
  colaPendiente: EventoPartido[];
}

export interface ReferenciasBitacora {
  categoriaId?: string;
  equipoId?: string;
  jugadorId?: string;
  partidoId?: string;
}

export interface BitacoraEntry {
  id: string;
  fecha: string; // ISO datetime
  rol: RolSimulado;
  accion: string;
  detalle?: string;
  referencias?: ReferenciasBitacora;
}

export interface SimuladorState {
  liga: Liga;
  temporadas: Temporada[];
  categorias: Categoria[];
  equipos: Equipo[];
  jugadores: Jugador[];
  partidos: Partido[];
  bitacora: BitacoraEntry[];
  rolActual: RolSimulado;
  /** Team the simulated delegate represents; only meaningful when rolActual is "delegado". */
  equipoDelegadoId: string | null;
  mesas: Record<string, EstadoMesa>;
}

export interface EstadisticaJugador {
  jugadorId: string;
  goles: number;
  autogoles: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  partidosJugados: number;
  suspendido: boolean;
  motivoSuspension?: string;
}

export interface TablaPosicion {
  equipoId: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
}

/** Uniform result for operations that can be rejected by a business rule. */
export interface ResultadoOperacion {
  ok: boolean;
  motivo?: string;
}
