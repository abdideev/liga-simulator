// Domain model for the Liga Simulator prototype.
// Sport-agnostic where reasonable; football-specific fields are noted.

export type RolSimulado = "administrador" | "delegado" | "publico";

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
  esMenorDeEdad: boolean;
  tutor?: TutorInfo;
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
  eventos: EventoPartido[];
  golesLocal: number;
  golesVisitante: number;
  actaCerrada: boolean;
  confirmacionDelegadoLocal: boolean;
  confirmacionDelegadoVisitante: boolean;
}

export interface BitacoraEntry {
  id: string;
  fecha: string; // ISO datetime
  rol: RolSimulado;
  accion: string;
  detalle?: string;
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
