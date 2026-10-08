// Every state transition of the simulator, as plain serializable objects.
// The SimuladorContext only dispatches these; simuladorReducer applies them.

import type {
  EventoPartido,
  Lado,
  OverrideAdmin,
  RolSimulado,
  TutorInfo,
} from "./types";

export interface DatosCategoria {
  nombre: string;
  anioNacimientoMin: number;
  anioNacimientoMax: number;
  cupoEquipos: number;
  limiteJugadoresPorPlantel: number;
}

export interface DatosNuevoEquipo {
  categoriaId: string;
  nombre: string;
  delegado: { nombre: string; telefono: string };
}

export interface DatosNuevoJugador {
  equipoId: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  curp: string;
  numero?: number;
  fotoUrl?: string;
  tutor?: TutorInfo;
}

export interface OpcionesGenerarCalendario {
  fechaInicio: string;
  diasEntreJornadas: number;
  horaDefault: string;
  sedes: string[];
}

export type DatosEvento = Omit<EventoPartido, "id" | "partidoId">;

export type AccionSimulador =
  // Simulated session
  | { tipo: "cambiarRol"; rol: RolSimulado }
  | { tipo: "seleccionarEquipoDelegado"; equipoId: string }
  // League configuration
  | { tipo: "actualizarConfiguracionLiga"; nombreLiga: string; nombreTemporada: string }
  | { tipo: "crearCategoria"; datos: DatosCategoria }
  | { tipo: "actualizarCategoria"; categoriaId: string; datos: DatosCategoria }
  // Registration
  | { tipo: "cerrarRegistroCategoria"; categoriaId: string; fecha: string }
  | { tipo: "abrirVentanaExtemporanea"; categoriaId: string; hasta: string; motivo: string }
  | { tipo: "cerrarVentanaExtemporanea"; categoriaId: string }
  | { tipo: "crearEquipo"; datos: DatosNuevoEquipo }
  | { tipo: "crearJugador"; datos: DatosNuevoJugador }
  | { tipo: "establecerOverrideAdmin"; jugadorId: string; override: OverrideAdmin | undefined }
  // Schedule
  | { tipo: "generarCalendario"; categoriaId: string; opciones: OpcionesGenerarCalendario }
  // Match: call-up
  | { tipo: "actualizarConvocados"; partidoId: string; lado: Lado; jugadorIds: string[] }
  | { tipo: "alternarTitular"; partidoId: string; lado: Lado; jugadorId: string }
  // Match: live capture
  | { tipo: "iniciarPartido"; partidoId: string }
  | { tipo: "alternarCronometro"; partidoId: string }
  | { tipo: "ajustarMinuto"; partidoId: string; delta: number }
  | { tipo: "agregarEvento"; partidoId: string; evento: DatosEvento }
  | { tipo: "eliminarEvento"; partidoId: string; eventoId: string }
  // Match: simulated offline mode
  | { tipo: "establecerModoOffline"; partidoId: string; activo: boolean }
  | { tipo: "encolarEventoOffline"; partidoId: string; evento: DatosEvento }
  | { tipo: "descartarEventoOffline"; partidoId: string; eventoId: string }
  | { tipo: "sincronizarColaOffline"; partidoId: string }
  // Match: acta sign-off (RF-15)
  | { tipo: "establecerConfirmacion"; partidoId: string; lado: Lado; confirmado: boolean }
  | { tipo: "registrarProtesta"; partidoId: string; lado: Lado; motivo: string }
  | { tipo: "retirarProtesta"; partidoId: string; lado: Lado }
  | { tipo: "cerrarActa"; partidoId: string }
  | { tipo: "resolverProtesta"; partidoId: string; lado: Lado; texto: string };

/**
 * Side effects the reducer needs, injected so it stays deterministic:
 * the ID generator and "now".
 */
export interface EntornoReducer {
  crearId: (prefijo: string) => string;
  ahora: Date;
}
