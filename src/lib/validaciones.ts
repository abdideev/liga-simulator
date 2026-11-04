// Pure validation of every action against the current state. The context
// runs it BEFORE calling setEstado (so it can return the result
// synchronously), and the reducer runs it again defensively.
//
// One small validator per action type, registered in VALIDADORES. This keeps
// each rule readable on its own and every function under the cyclomatic
// complexity limit of the quality plan (V(G) < 10; Entregable 9).

import type { AccionSimulador, DatosCategoria, DatosEvento, EntornoReducer } from "./acciones";
import { fechaISOLocal } from "./fechas";
import { MINUTO_MAXIMO, obtenerMesa } from "./mesa";
import { puedeActuarPorEquipo, puedeInscribirEn, puedeOperarMesa, puedeResolverProtesta } from "./permisos";
import { TIPOS_QUE_REQUIEREN_JUGADOR } from "./eventos";
import {
  esMenorDeEdad,
  estadoRegistro,
  ladoFirmoActa,
  puedeSerConvocado,
  validarNumeroPlayera,
} from "./rules";
import type { Lado, Partido, ResultadoOperacion, RolSimulado, SimuladorState, TutorInfo } from "./types";

export const MAX_TITULARES = 11;

const OK: ResultadoOperacion = { ok: true };

function error(motivo: string): ResultadoOperacion {
  return { ok: false, motivo };
}

const SIN_PERMISO = error("Tu rol no tiene permiso para realizar esta acción");
const PARTIDO_NO_ENCONTRADO = error("Partido no encontrado");
const ACTA_CERRADA = error("El acta ya está cerrada");

/** Simple and linear (no backtracking): something@something.tld, no spaces. */
export function esCorreoValido(correo: string): boolean {
  const valor = correo.trim();
  const arroba = valor.indexOf("@");
  if (arroba < 1 || arroba !== valor.lastIndexOf("@") || /\s/.test(valor)) return false;
  const dominio = valor.slice(arroba + 1);
  const punto = dominio.lastIndexOf(".");
  return punto > 0 && punto < dominio.length - 1;
}

export function equipoDelLado(partido: Partido, lado: Lado): string {
  return lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
}

export function convocadosDelLado(partido: Partido, lado: Lado): string[] {
  return lado === "local" ? partido.convocadosLocal : partido.convocadosVisitante;
}

export function titularesDelLado(partido: Partido, lado: Lado): string[] {
  return lado === "local" ? partido.titularesLocal : partido.titularesVisitante;
}

// ---------------------------------------------------------------------------
// Shared context and small reusable checks
// ---------------------------------------------------------------------------

interface Contexto {
  estado: SimuladorState;
  rol: RolSimulado;
  equipoDelegadoId: string | null;
  esAdmin: boolean;
  hoy: string;
  ahora: Date;
}

type Accion<T extends AccionSimulador["tipo"]> = Extract<AccionSimulador, { tipo: T }>;
type Validador<T extends AccionSimulador["tipo"]> = (accion: Accion<T>, ctx: Contexto) => ResultadoOperacion;

/** Runs checks in order and returns the first failure (or OK). */
function primeroQueFalle(...checks: Array<() => ResultadoOperacion | null>): ResultadoOperacion {
  for (const check of checks) {
    const resultado = check();
    if (resultado && !resultado.ok) return resultado;
  }
  return OK;
}

const soloAdmin = (ctx: Contexto) => (ctx.esAdmin ? null : SIN_PERMISO);
const soloMesa = (ctx: Contexto) => (puedeOperarMesa(ctx.rol) ? null : SIN_PERMISO);
const noPublico = (ctx: Contexto) => (ctx.rol === "publico" ? SIN_PERMISO : null);

function buscarPartido(ctx: Contexto, partidoId: string): Partido | undefined {
  return ctx.estado.partidos.find((p) => p.id === partidoId);
}

/** Validates against a match that must exist; `reglas` receive it. */
function conPartido(
  ctx: Contexto,
  partidoId: string,
  reglas: (partido: Partido) => ResultadoOperacion
): ResultadoOperacion {
  const partido = buscarPartido(ctx, partidoId);
  return partido ? reglas(partido) : PARTIDO_NO_ENCONTRADO;
}

function validarDatosCategoria(datos: DatosCategoria): ResultadoOperacion {
  if (!datos.nombre.trim()) return error("El nombre de la categoría es obligatorio");
  if (datos.anioNacimientoMin > datos.anioNacimientoMax) {
    return error("El año mínimo no puede ser mayor que el año máximo");
  }
  if (datos.cupoEquipos < 1 || datos.limiteJugadoresPorPlantel < 1) {
    return error("El cupo de equipos y el límite de plantel deben ser mayores a 0");
  }
  return OK;
}

function ladoDelEquipo(partido: Partido, equipoId: string): Lado | null {
  if (equipoId === partido.equipoLocalId) return "local";
  if (equipoId === partido.equipoVisitanteId) return "visitante";
  return null;
}

function validarSustitucion(evento: DatosEvento, convocados: string[]): ResultadoOperacion {
  if (!evento.jugadorId || !evento.jugadorEntraId) {
    return error("La sustitución requiere el jugador que sale y el que entra");
  }
  if (evento.jugadorId === evento.jugadorEntraId) {
    return error("El jugador que sale y el que entra deben ser distintos");
  }
  if (!convocados.includes(evento.jugadorEntraId)) {
    return error("El jugador que entra no está convocado para este partido");
  }
  return OK;
}

function validarEvento(partido: Partido, evento: DatosEvento): ResultadoOperacion {
  const lado = ladoDelEquipo(partido, evento.equipoId);
  if (!lado) return error("El equipo del evento no juega este partido");
  if (!Number.isInteger(evento.minuto) || evento.minuto < 0 || evento.minuto > MINUTO_MAXIMO) {
    return error(`El minuto debe estar entre 0 y ${MINUTO_MAXIMO}`);
  }
  const convocados = convocadosDelLado(partido, lado);
  if (TIPOS_QUE_REQUIEREN_JUGADOR.includes(evento.tipo) && !evento.jugadorId) {
    return error("Este tipo de evento requiere seleccionar un jugador");
  }
  if (evento.jugadorId && !convocados.includes(evento.jugadorId)) {
    return error("El jugador no está convocado para este partido");
  }
  return evento.tipo === "sustitucion" ? validarSustitucion(evento, convocados) : OK;
}

function tutorCompleto(tutor: TutorInfo | undefined): boolean {
  return !!tutor && tutor.consentimiento && !!tutor.nombre.trim() && !!tutor.declaracion;
}

// ---------------------------------------------------------------------------
// Validators by area
// ---------------------------------------------------------------------------

const categoria = (ctx: Contexto, id: string) => ctx.estado.categorias.find((c) => c.id === id);

const configuracion = {
  cambiarRol: () => OK,

  seleccionarEquipoDelegado: (accion, ctx) =>
    ctx.estado.equipos.some((e) => e.id === accion.equipoId) ? OK : error("Equipo no encontrado"),

  actualizarConfiguracionLiga: (accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () =>
        !accion.nombreLiga.trim() || !accion.nombreTemporada.trim()
          ? error("El nombre de la liga y de la temporada son obligatorios")
          : null
    ),

  crearCategoria: (accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () => validarDatosCategoria(accion.datos)
    ),

  actualizarCategoria: (accion, ctx) => {
    const registrados = ctx.estado.equipos.filter((e) => e.categoriaId === accion.categoriaId).length;
    return primeroQueFalle(
      () => soloAdmin(ctx),
      () => validarDatosCategoria(accion.datos),
      () =>
        accion.datos.cupoEquipos < registrados
          ? error(`El cupo no puede ser menor que los ${registrados} equipos ya registrados`)
          : null
    );
  },
} satisfies { [T in "cambiarRol" | "seleccionarEquipoDelegado" | "actualizarConfiguracionLiga" | "crearCategoria" | "actualizarCategoria"]: Validador<T> };

const registro = {
  cerrarRegistroCategoria: (accion, ctx) => {
    const cat = categoria(ctx, accion.categoriaId);
    return primeroQueFalle(
      () => soloAdmin(ctx),
      () => (cat ? null : error("Categoría no encontrada")),
      () => (cat?.registroCerrado ? error("El registro de esta categoría ya está cerrado") : null),
      () => (accion.fecha ? null : error("Indica la fecha de cierre"))
    );
  },

  abrirVentanaExtemporanea: (accion, ctx) => {
    const cat = categoria(ctx, accion.categoriaId);
    return primeroQueFalle(
      () => soloAdmin(ctx),
      () => (cat ? null : error("Categoría no encontrada")),
      () =>
        cat?.registroCerrado
          ? null
          : error("Solo se puede abrir una ventana extemporánea sobre un registro cerrado"),
      () => (accion.motivo.trim() ? null : error("El motivo de la ventana extemporánea es obligatorio")),
      () =>
        !accion.hasta || accion.hasta < ctx.hoy
          ? error("La fecha límite de la ventana no puede ser anterior a hoy")
          : null
    );
  },

  cerrarVentanaExtemporanea: (accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () =>
        categoria(ctx, accion.categoriaId)?.ventanaExtemporanea
          ? null
          : error("No hay una ventana extemporánea abierta")
    ),

  crearEquipo: (accion, ctx) => {
    const { datos } = accion;
    const cat = categoria(ctx, datos.categoriaId);
    const equiposCategoria = ctx.estado.equipos.filter((e) => e.categoriaId === datos.categoriaId);
    const nombre = datos.nombre.trim();
    return primeroQueFalle(
      () => soloAdmin(ctx),
      () =>
        !nombre || !datos.delegado.nombre.trim() || !datos.delegado.telefono.trim()
          ? error("Todos los campos son obligatorios")
          : null,
      () => (cat ? null : error("Categoría no encontrada")),
      // DEF-03: the more specific error (duplicate name) goes before the quota.
      () =>
        equiposCategoria.some((e) => e.nombre.toLowerCase() === nombre.toLowerCase())
          ? error(`Ya existe un equipo llamado ${nombre} en ${cat?.nombre}`)
          : null,
      () =>
        cat && equiposCategoria.length >= cat.cupoEquipos
          ? error(`La categoría ${cat.nombre} ya alcanzó su cupo de ${cat.cupoEquipos} equipos`)
          : null
    );
  },

  crearJugador: (accion, ctx) => {
    const { datos } = accion;
    const equipo = ctx.estado.equipos.find((e) => e.id === datos.equipoId);
    const cat = equipo ? categoria(ctx, equipo.categoriaId) : undefined;
    if (!equipo || !cat) return error("Equipo o categoría no encontrados");
    const plantel = ctx.estado.jugadores.filter((j) => j.equipoId === equipo.id);
    return primeroQueFalle(
      () => (puedeInscribirEn(ctx.rol, ctx.equipoDelegadoId, equipo.id) ? null : SIN_PERMISO),
      () => (estadoRegistro(cat, ctx.hoy) === "cerrado" ? error("El registro de esta categoría está cerrado") : null),
      () =>
        !datos.nombreCompleto.trim() || !datos.fechaNacimiento || !datos.curp.trim()
          ? error("Nombre, fecha de nacimiento y CURP son obligatorios")
          : null,
      () =>
        plantel.length >= cat.limiteJugadoresPorPlantel
          ? error(`El plantel ya tiene el máximo de ${cat.limiteJugadoresPorPlantel} jugadores`)
          : null,
      () => validarNumeroPlayera(datos.numero, plantel),
      () =>
        esMenorDeEdad(datos.fechaNacimiento, ctx.ahora) && !tutorCompleto(datos.tutor)
          ? error(
              "Para jugadores menores de edad se requieren el nombre del tutor, su declaración de patria potestad y el consentimiento 1"
            )
          : null
    );
  },

  establecerOverrideAdmin: (accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () => (ctx.estado.jugadores.some((j) => j.id === accion.jugadorId) ? null : error("Jugador no encontrado")),
      () =>
        accion.override && !accion.override.motivo.trim()
          ? error("El motivo de la anulación manual es obligatorio")
          : null
    ),

  generarCalendario: (accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () =>
        ctx.estado.equipos.filter((e) => e.categoriaId === accion.categoriaId).length < 2
          ? error("Se necesitan al menos 2 equipos registrados en esta categoría")
          : null,
      () => (accion.opciones.fechaInicio ? null : error("Indica la fecha de la jornada 1"))
    ),
} satisfies { [T in "cerrarRegistroCategoria" | "abrirVentanaExtemporanea" | "cerrarVentanaExtemporanea" | "crearEquipo" | "crearJugador" | "establecerOverrideAdmin" | "generarCalendario"]: Validador<T> };

function validarNuevosConvocados(
  ctx: Contexto,
  partido: Partido,
  lado: Lado,
  jugadorIds: string[]
): ResultadoOperacion {
  const equipoId = equipoDelLado(partido, lado);
  const anteriores = convocadosDelLado(partido, lado);
  for (const jugadorId of jugadorIds.filter((id) => !anteriores.includes(id))) {
    const jugador = ctx.estado.jugadores.find((j) => j.id === jugadorId);
    if (!jugador || jugador.equipoId !== equipoId) return error("El jugador no pertenece a este equipo");
    const convocable = puedeSerConvocado(jugador, partido, ctx.estado.partidos);
    if (!convocable.ok) return error(`${jugador.nombreCompleto} no puede ser convocado: ${convocable.motivo}`);
  }
  return OK;
}

const actuaPorLado = (ctx: Contexto, partido: Partido, lado: Lado) =>
  puedeActuarPorEquipo(ctx.rol, ctx.equipoDelegadoId, equipoDelLado(partido, lado)) ? null : SIN_PERMISO;
const actaAbierta = (partido: Partido) => (partido.actaCerrada ? ACTA_CERRADA : null);
const enCurso = (partido: Partido, motivo: string) => (partido.estado === "en_curso" ? null : error(motivo));

const convocatoria = {
  actualizarConvocados: (accion, ctx) =>
    conPartido(ctx, accion.partidoId, (partido) =>
      primeroQueFalle(
        () => actaAbierta(partido),
        () => actuaPorLado(ctx, partido, accion.lado),
        () => validarNuevosConvocados(ctx, partido, accion.lado, accion.jugadorIds)
      )
    ),

  alternarTitular: (accion, ctx) =>
    conPartido(ctx, accion.partidoId, (partido) => {
      const titulares = titularesDelLado(partido, accion.lado);
      return primeroQueFalle(
        () => actaAbierta(partido),
        () => actuaPorLado(ctx, partido, accion.lado),
        () =>
          convocadosDelLado(partido, accion.lado).includes(accion.jugadorId)
            ? null
            : error("Solo un jugador convocado puede ser titular"),
        () =>
          !titulares.includes(accion.jugadorId) && titulares.length >= MAX_TITULARES
            ? error(`Ya hay ${MAX_TITULARES} titulares`)
            : null
      );
    }),
} satisfies { [T in "actualizarConvocados" | "alternarTitular"]: Validador<T> };

function validarMesaEnCurso(
  ctx: Contexto,
  partidoId: string,
  motivo = "El partido no está en curso"
): ResultadoOperacion {
  return primeroQueFalle(
    () => soloMesa(ctx),
    () => conPartido(ctx, partidoId, (partido) => primeroQueFalle(() => enCurso(partido, motivo)))
  );
}

function validarCaptura(accion: Accion<"agregarEvento" | "encolarEventoOffline">, ctx: Contexto) {
  const enOffline = obtenerMesa(ctx.estado.mesas, accion.partidoId).modoOffline;
  return primeroQueFalle(
    () => validarMesaEnCurso(ctx, accion.partidoId, "Solo se registran eventos con el partido en curso"),
    () =>
      accion.tipo === "agregarEvento" && enOffline
        ? error("El modo sin conexión está activo: el evento debe ir a la cola")
        : null,
    () =>
      accion.tipo === "encolarEventoOffline" && !enOffline ? error("El modo sin conexión no está activo") : null,
    () => validarEvento(buscarPartido(ctx, accion.partidoId)!, accion.evento)
  );
}

function validarModoOffline(accion: Accion<"establecerModoOffline" | "sincronizarColaOffline">, ctx: Contexto) {
  const pendientes = obtenerMesa(ctx.estado.mesas, accion.partidoId).colaPendiente.length;
  return primeroQueFalle(
    () => soloMesa(ctx),
    () => conPartido(ctx, accion.partidoId, (partido) => primeroQueFalle(() => actaAbierta(partido))),
    () =>
      accion.tipo === "establecerModoOffline" && !accion.activo && pendientes > 0
        ? error("Hay eventos pendientes: sincronízalos para salir del modo sin conexión")
        : null
  );
}

const mesa = {
  iniciarPartido: (accion, ctx) =>
    primeroQueFalle(
      () => soloMesa(ctx),
      () =>
        conPartido(ctx, accion.partidoId, (partido) =>
          primeroQueFalle(
            () => (partido.estado === "programado" ? null : error("El partido ya fue iniciado")),
            () =>
              partido.titularesLocal.length === 0 || partido.titularesVisitante.length === 0
                ? error("Cada equipo necesita al menos un titular convocado para iniciar")
                : null
          )
        )
    ),
  alternarCronometro: (accion, ctx) => validarMesaEnCurso(ctx, accion.partidoId),
  ajustarMinuto: (accion, ctx) => validarMesaEnCurso(ctx, accion.partidoId),
  agregarEvento: validarCaptura,
  encolarEventoOffline: validarCaptura,
  eliminarEvento: (accion, ctx) =>
    primeroQueFalle(
      () => soloMesa(ctx),
      () =>
        conPartido(ctx, accion.partidoId, (partido) =>
          primeroQueFalle(
            () => actaAbierta(partido),
            () => (partido.eventos.some((e) => e.id === accion.eventoId) ? null : error("Evento no encontrado"))
          )
        )
    ),
  establecerModoOffline: validarModoOffline,
  sincronizarColaOffline: validarModoOffline,
  descartarEventoOffline: (accion, ctx) =>
    primeroQueFalle(
      () => soloMesa(ctx),
      () =>
        obtenerMesa(ctx.estado.mesas, accion.partidoId).colaPendiente.some((e) => e.id === accion.eventoId)
          ? null
          : error("Evento pendiente no encontrado")
    ),
} satisfies { [T in "iniciarPartido" | "alternarCronometro" | "ajustarMinuto" | "agregarEvento" | "encolarEventoOffline" | "eliminarEvento" | "establecerModoOffline" | "sincronizarColaOffline" | "descartarEventoOffline"]: Validador<T> };

type AccionFirma = Accion<"establecerConfirmacion" | "registrarProtesta" | "retirarProtesta">;

function firmaDelLado(partido: Partido, lado: Lado) {
  return lado === "local"
    ? { protesta: partido.protestaLocal, confirmado: partido.confirmacionDelegadoLocal }
    : { protesta: partido.protestaVisitante, confirmado: partido.confirmacionDelegadoVisitante };
}

function reglaDeProtesta(accion: Accion<"registrarProtesta">, partido: Partido): ResultadoOperacion | null {
  const { protesta, confirmado } = firmaDelLado(partido, accion.lado);
  if (confirmado) return error("Quita la confirmación antes de registrar una protesta");
  if (protesta) return error("Este delegado ya registró una protesta");
  return accion.motivo.trim() ? null : error("El motivo de la protesta es obligatorio");
}

function reglaDeFirma(accion: AccionFirma, partido: Partido): ResultadoOperacion | null {
  const { protesta } = firmaDelLado(partido, accion.lado);
  if (accion.tipo === "registrarProtesta") return reglaDeProtesta(accion, partido);
  if (accion.tipo === "retirarProtesta") return protesta ? null : error("No hay protesta que retirar");
  return accion.confirmado && protesta ? error("Retira la protesta antes de confirmar el acta") : null;
}

function validarFirma(accion: AccionFirma, ctx: Contexto): ResultadoOperacion {
  return conPartido(ctx, accion.partidoId, (partido) =>
    primeroQueFalle(
      () => actuaPorLado(ctx, partido, accion.lado),
      () => actaAbierta(partido),
      () => enCurso(partido, "El acta solo se firma con el partido en curso"),
      () => reglaDeFirma(accion, partido)
    )
  );
}

const acta = {
  establecerConfirmacion: validarFirma,
  registrarProtesta: validarFirma,
  retirarProtesta: validarFirma,

  cerrarActa: (accion, ctx) =>
    primeroQueFalle(
      () => soloMesa(ctx),
      () =>
        conPartido(ctx, accion.partidoId, (partido) =>
          primeroQueFalle(
            () => actaAbierta(partido),
            () => enCurso(partido, "No se puede cerrar el acta de un partido que no se ha iniciado"),
            () =>
              ladoFirmoActa(partido, "local") && ladoFirmoActa(partido, "visitante")
                ? null
                : error("Ambos delegados deben confirmar o protestar antes de cerrar el acta"),
            () =>
              obtenerMesa(ctx.estado.mesas, partido.id).colaPendiente.length > 0
                ? error("Hay eventos sin sincronizar; desactiva el modo sin conexión primero")
                : null
          )
        )
    ),

  resolverProtesta: (accion, ctx) =>
    primeroQueFalle(
      () => (puedeResolverProtesta(ctx.rol) ? null : SIN_PERMISO),
      () =>
        conPartido(ctx, accion.partidoId, (partido) => {
          const protesta = accion.lado === "local" ? partido.protestaLocal : partido.protestaVisitante;
          return primeroQueFalle(
            () => (partido.actaCerrada ? null : error("La protesta se resuelve después de cerrar el acta")),
            () => (protesta ? null : error("No hay protesta registrada")),
            () => (protesta?.resolucion ? error("La protesta ya fue resuelta") : null),
            () => (accion.texto.trim() ? null : error("Describe la resolución"))
          );
        })
    ),
} satisfies { [T in "establecerConfirmacion" | "registrarProtesta" | "retirarProtesta" | "cerrarActa" | "resolverProtesta"]: Validador<T> };

const legal = {
  aceptarTerminos: ({ aceptacion: a }, ctx) =>
    primeroQueFalle(
      () => noPublico(ctx),
      () => (!a.nombre.trim() || !a.correo.trim() ? error("Nombre y correo son obligatorios") : null),
      () => (esCorreoValido(a.correo) ? null : error("Escribe un correo válido")),
      () =>
        !a.huellaTerminos || !a.huellaAviso ? error("Aún se calcula la huella del texto; intenta de nuevo") : null,
      () =>
        a.casillas.length < 2 ? error("Debes aceptar los Términos de uso y confirmar que leíste el aviso") : null
    ),

  registrarConstancia: ({ constancia: c }, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () => (ctx.estado.legal.constancias.some((x) => x.folio === c.folio) ? error("El folio ya existe") : null),
      () => (c.casillas.length < 2 ? error("Faltan casillas por aceptar") : null),
      () => (!c.huellaTexto || !c.huellaConstancia ? error("Falta la huella digital") : null)
    ),

  cancelarPlan: (accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () => (ctx.estado.legal.licencia.estado === "activa" ? null : error("Solo se puede cancelar un plan activo")),
      () => (accion.efectivaEl ? null : error("No hay fin de temporada para programar la cancelación")),
      () => (accion.motivo === "otro" && !accion.detalle?.trim() ? error("Describe el motivo") : null)
    ),

  revertirCancelacionPlan: (_accion, ctx) =>
    primeroQueFalle(
      () => soloAdmin(ctx),
      () =>
        ctx.estado.legal.licencia.estado === "cancelacion_programada"
          ? null
          : error("No hay una cancelación programada")
    ),

  registrarDescargaDatos: (_accion, ctx) => primeroQueFalle(() => soloAdmin(ctx)),

  crearSolicitudArco: ({ solicitud }, ctx) =>
    primeroQueFalle(
      () => noPublico(ctx),
      () =>
        solicitud.descripcion.trim().length < 10 ? error("Describe tu solicitud (al menos 10 caracteres)") : null,
      () => (esCorreoValido(solicitud.medio) ? null : error("Escribe un correo válido para recibir la respuesta"))
    ),

  turnarSolicitudArco: (accion, ctx) => {
    const solicitud = ctx.estado.legal.solicitudesArco.find((x) => x.folio === accion.folio);
    return primeroQueFalle(
      () => soloAdmin(ctx),
      () => (solicitud ? null : error("Solicitud no encontrada")),
      () => (solicitud?.estado === "recibida" ? null : error("La solicitud ya fue turnada"))
    );
  },

  cambiarPublicacionNombre: (accion, ctx) => {
    const jugador = ctx.estado.jugadores.find((j) => j.id === accion.jugadorId);
    if (!jugador) return error("Jugador no encontrado");
    return primeroQueFalle(
      () => (puedeInscribirEn(ctx.rol, ctx.equipoDelegadoId, jugador.equipoId) ? null : SIN_PERMISO),
      () => (jugador.tutor ? null : error("Solo aplica a jugadores menores de edad"))
    );
  },
} satisfies { [T in "aceptarTerminos" | "registrarConstancia" | "cancelarPlan" | "revertirCancelacionPlan" | "registrarDescargaDatos" | "crearSolicitudArco" | "turnarSolicitudArco" | "cambiarPublicacionNombre"]: Validador<T> };

/** Every action type must have exactly one validator (checked by the compiler). */
const VALIDADORES: { [T in AccionSimulador["tipo"]]: Validador<T> } = {
  ...configuracion,
  ...registro,
  ...convocatoria,
  ...mesa,
  ...acta,
  ...legal,
};

/** Returns whether `accion` can be applied to `estado`, and why not. */
export function validarAccion(
  estado: SimuladorState,
  accion: AccionSimulador,
  entorno: Pick<EntornoReducer, "ahora">
): ResultadoOperacion {
  const ctx: Contexto = {
    estado,
    rol: estado.rolActual,
    equipoDelegadoId: estado.equipoDelegadoId,
    esAdmin: estado.rolActual === "administrador",
    hoy: fechaISOLocal(entorno.ahora),
    ahora: entorno.ahora,
  };
  const validador = VALIDADORES[accion.tipo] as Validador<AccionSimulador["tipo"]>;
  return validador(accion as never, ctx);
}
