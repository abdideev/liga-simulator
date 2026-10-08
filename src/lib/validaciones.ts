// Pure validation of every action against the current state. The context
// runs it BEFORE calling setEstado (so it can return the result
// synchronously), and the reducer runs it again defensively.

import type { AccionSimulador, DatosCategoria, DatosEvento, EntornoReducer } from "./acciones";
import { fechaISOLocal } from "./fechas";
import { obtenerMesa } from "./mesa";
import { puedeActuarPorEquipo, puedeInscribirEn, puedeOperarMesa, puedeResolverProtesta } from "./permisos";
import { TIPOS_QUE_REQUIEREN_JUGADOR } from "./eventos";
import {
  esMenorDeEdad,
  estadoRegistro,
  ladoFirmoActa,
  puedeSerConvocado,
  validarNumeroPlayera,
} from "./rules";
import type { Lado, Partido, ResultadoOperacion, SimuladorState } from "./types";

export const MAX_TITULARES = 11;

const OK: ResultadoOperacion = { ok: true };

function error(motivo: string): ResultadoOperacion {
  return { ok: false, motivo };
}

const SIN_PERMISO = error("Tu rol no tiene permiso para realizar esta acción");

export function equipoDelLado(partido: Partido, lado: Lado): string {
  return lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
}

export function convocadosDelLado(partido: Partido, lado: Lado): string[] {
  return lado === "local" ? partido.convocadosLocal : partido.convocadosVisitante;
}

export function titularesDelLado(partido: Partido, lado: Lado): string[] {
  return lado === "local" ? partido.titularesLocal : partido.titularesVisitante;
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

function validarEvento(partido: Partido, evento: DatosEvento): ResultadoOperacion {
  const lado: Lado | null =
    evento.equipoId === partido.equipoLocalId
      ? "local"
      : evento.equipoId === partido.equipoVisitanteId
        ? "visitante"
        : null;
  if (!lado) return error("El equipo del evento no juega este partido");
  if (!Number.isInteger(evento.minuto) || evento.minuto < 0 || evento.minuto > 130) {
    return error("El minuto debe estar entre 0 y 130");
  }

  const convocados = convocadosDelLado(partido, lado);
  if (TIPOS_QUE_REQUIEREN_JUGADOR.includes(evento.tipo) && !evento.jugadorId) {
    return error("Este tipo de evento requiere seleccionar un jugador");
  }
  if (evento.jugadorId && !convocados.includes(evento.jugadorId)) {
    return error("El jugador no está convocado para este partido");
  }
  if (evento.tipo === "sustitucion") {
    if (!evento.jugadorId || !evento.jugadorEntraId) {
      return error("La sustitución requiere el jugador que sale y el que entra");
    }
    if (evento.jugadorId === evento.jugadorEntraId) {
      return error("El jugador que sale y el que entra deben ser distintos");
    }
    if (!convocados.includes(evento.jugadorEntraId)) {
      return error("El jugador que entra no está convocado para este partido");
    }
  }
  return OK;
}

/** Returns whether `accion` can be applied to `estado`, and why not. */
export function validarAccion(
  estado: SimuladorState,
  accion: AccionSimulador,
  entorno: Pick<EntornoReducer, "ahora">
): ResultadoOperacion {
  const { rolActual: rol, equipoDelegadoId } = estado;
  const esAdmin = rol === "administrador";
  const hoy = fechaISOLocal(entorno.ahora);

  const partidoDe = (partidoId: string) => estado.partidos.find((p) => p.id === partidoId);

  switch (accion.tipo) {
    case "cambiarRol":
      return OK;

    case "seleccionarEquipoDelegado":
      return estado.equipos.some((e) => e.id === accion.equipoId)
        ? OK
        : error("Equipo no encontrado");

    case "actualizarConfiguracionLiga":
      if (!esAdmin) return SIN_PERMISO;
      if (!accion.nombreLiga.trim() || !accion.nombreTemporada.trim()) {
        return error("El nombre de la liga y de la temporada son obligatorios");
      }
      return OK;

    case "crearCategoria":
      if (!esAdmin) return SIN_PERMISO;
      return validarDatosCategoria(accion.datos);

    case "actualizarCategoria": {
      if (!esAdmin) return SIN_PERMISO;
      const validacion = validarDatosCategoria(accion.datos);
      if (!validacion.ok) return validacion;
      const equiposRegistrados = estado.equipos.filter(
        (e) => e.categoriaId === accion.categoriaId
      ).length;
      if (accion.datos.cupoEquipos < equiposRegistrados) {
        return error(
          `El cupo no puede ser menor que los ${equiposRegistrados} equipos ya registrados`
        );
      }
      return OK;
    }

    case "cerrarRegistroCategoria": {
      if (!esAdmin) return SIN_PERMISO;
      const categoria = estado.categorias.find((c) => c.id === accion.categoriaId);
      if (!categoria) return error("Categoría no encontrada");
      if (categoria.registroCerrado) return error("El registro de esta categoría ya está cerrado");
      if (!accion.fecha) return error("Indica la fecha de cierre");
      return OK;
    }

    case "abrirVentanaExtemporanea": {
      if (!esAdmin) return SIN_PERMISO;
      const categoria = estado.categorias.find((c) => c.id === accion.categoriaId);
      if (!categoria) return error("Categoría no encontrada");
      if (!categoria.registroCerrado) {
        return error("Solo se puede abrir una ventana extemporánea sobre un registro cerrado");
      }
      if (!accion.motivo.trim()) return error("El motivo de la ventana extemporánea es obligatorio");
      if (!accion.hasta || accion.hasta < hoy) {
        return error("La fecha límite de la ventana no puede ser anterior a hoy");
      }
      return OK;
    }

    case "cerrarVentanaExtemporanea": {
      if (!esAdmin) return SIN_PERMISO;
      const categoria = estado.categorias.find((c) => c.id === accion.categoriaId);
      if (!categoria?.ventanaExtemporanea) return error("No hay una ventana extemporánea abierta");
      return OK;
    }

    case "crearEquipo": {
      if (!esAdmin) return SIN_PERMISO;
      const { datos } = accion;
      if (!datos.nombre.trim() || !datos.delegado.nombre.trim() || !datos.delegado.telefono.trim()) {
        return error("Todos los campos son obligatorios");
      }
      const categoria = estado.categorias.find((c) => c.id === datos.categoriaId);
      if (!categoria) return error("Categoría no encontrada");
      const equiposCategoria = estado.equipos.filter((e) => e.categoriaId === categoria.id);
      if (equiposCategoria.length >= categoria.cupoEquipos) {
        return error(
          `La categoría ${categoria.nombre} ya alcanzó su cupo de ${categoria.cupoEquipos} equipos`
        );
      }
      const nombre = datos.nombre.trim().toLowerCase();
      if (equiposCategoria.some((e) => e.nombre.toLowerCase() === nombre)) {
        return error(`Ya existe un equipo llamado ${datos.nombre.trim()} en ${categoria.nombre}`);
      }
      return OK;
    }

    case "crearJugador": {
      const { datos } = accion;
      const equipo = estado.equipos.find((e) => e.id === datos.equipoId);
      const categoria = equipo
        ? estado.categorias.find((c) => c.id === equipo.categoriaId)
        : undefined;
      if (!equipo || !categoria) return error("Equipo o categoría no encontrados");
      if (!puedeInscribirEn(rol, equipoDelegadoId, equipo.id)) return SIN_PERMISO;
      if (estadoRegistro(categoria, hoy) === "cerrado") {
        return error("El registro de esta categoría está cerrado");
      }
      if (!datos.nombreCompleto.trim() || !datos.fechaNacimiento || !datos.curp.trim()) {
        return error("Nombre, fecha de nacimiento y CURP son obligatorios");
      }
      const plantel = estado.jugadores.filter((j) => j.equipoId === equipo.id);
      if (plantel.length >= categoria.limiteJugadoresPorPlantel) {
        return error(
          `El plantel ya tiene el máximo de ${categoria.limiteJugadoresPorPlantel} jugadores`
        );
      }
      const numero = validarNumeroPlayera(datos.numero, plantel);
      if (!numero.ok) return numero;
      if (
        esMenorDeEdad(datos.fechaNacimiento, entorno.ahora) &&
        (!datos.tutor?.consentimiento || !datos.tutor.nombre.trim())
      ) {
        return error(
          "Para jugadores menores de edad se requiere el nombre del tutor y su consentimiento"
        );
      }
      return OK;
    }

    case "establecerOverrideAdmin": {
      if (!esAdmin) return SIN_PERMISO;
      if (!estado.jugadores.some((j) => j.id === accion.jugadorId)) {
        return error("Jugador no encontrado");
      }
      if (accion.override && !accion.override.motivo.trim()) {
        return error("El motivo de la anulación manual es obligatorio");
      }
      return OK;
    }

    case "generarCalendario": {
      if (!esAdmin) return SIN_PERMISO;
      const equipos = estado.equipos.filter((e) => e.categoriaId === accion.categoriaId);
      if (equipos.length < 2) {
        return error("Se necesitan al menos 2 equipos registrados en esta categoría");
      }
      if (!accion.opciones.fechaInicio) return error("Indica la fecha de la jornada 1");
      return OK;
    }

    case "actualizarConvocados": {
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.actaCerrada) return error("El acta ya está cerrada");
      const equipoId = equipoDelLado(partido, accion.lado);
      if (!puedeActuarPorEquipo(rol, equipoDelegadoId, equipoId)) return SIN_PERMISO;
      const anteriores = convocadosDelLado(partido, accion.lado);
      for (const jugadorId of accion.jugadorIds) {
        if (anteriores.includes(jugadorId)) continue;
        const jugador = estado.jugadores.find((j) => j.id === jugadorId);
        if (!jugador || jugador.equipoId !== equipoId) {
          return error("El jugador no pertenece a este equipo");
        }
        const convocable = puedeSerConvocado(jugador, partido, estado.partidos);
        if (!convocable.ok) {
          return error(`${jugador.nombreCompleto} no puede ser convocado: ${convocable.motivo}`);
        }
      }
      return OK;
    }

    case "alternarTitular": {
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.actaCerrada) return error("El acta ya está cerrada");
      if (!puedeActuarPorEquipo(rol, equipoDelegadoId, equipoDelLado(partido, accion.lado))) {
        return SIN_PERMISO;
      }
      if (!convocadosDelLado(partido, accion.lado).includes(accion.jugadorId)) {
        return error("Solo un jugador convocado puede ser titular");
      }
      const titulares = titularesDelLado(partido, accion.lado);
      if (!titulares.includes(accion.jugadorId) && titulares.length >= MAX_TITULARES) {
        return error(`Ya hay ${MAX_TITULARES} titulares`);
      }
      return OK;
    }

    case "iniciarPartido": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.estado !== "programado") return error("El partido ya fue iniciado");
      if (partido.titularesLocal.length === 0 || partido.titularesVisitante.length === 0) {
        return error("Cada equipo necesita al menos un titular convocado para iniciar");
      }
      return OK;
    }

    case "alternarCronometro":
    case "ajustarMinuto": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.estado !== "en_curso") return error("El partido no está en curso");
      return OK;
    }

    case "agregarEvento":
    case "encolarEventoOffline": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.estado !== "en_curso") {
        return error("Solo se registran eventos con el partido en curso");
      }
      const enOffline = obtenerMesa(estado.mesas, partido.id).modoOffline;
      if (accion.tipo === "agregarEvento" && enOffline) {
        return error("El modo sin conexión está activo: el evento debe ir a la cola");
      }
      if (accion.tipo === "encolarEventoOffline" && !enOffline) {
        return error("El modo sin conexión no está activo");
      }
      return validarEvento(partido, accion.evento);
    }

    case "eliminarEvento": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.actaCerrada) return error("El acta ya está cerrada");
      if (!partido.eventos.some((e) => e.id === accion.eventoId)) {
        return error("Evento no encontrado");
      }
      return OK;
    }

    case "establecerModoOffline":
    case "sincronizarColaOffline": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.actaCerrada) return error("El acta ya está cerrada");
      if (
        accion.tipo === "establecerModoOffline" &&
        !accion.activo &&
        obtenerMesa(estado.mesas, partido.id).colaPendiente.length > 0
      ) {
        return error("Hay eventos pendientes: sincronízalos para salir del modo sin conexión");
      }
      return OK;
    }

    case "descartarEventoOffline": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const mesa = obtenerMesa(estado.mesas, accion.partidoId);
      return mesa.colaPendiente.some((e) => e.id === accion.eventoId)
        ? OK
        : error("Evento pendiente no encontrado");
    }

    case "establecerConfirmacion":
    case "registrarProtesta":
    case "retirarProtesta": {
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (!puedeActuarPorEquipo(rol, equipoDelegadoId, equipoDelLado(partido, accion.lado))) {
        return SIN_PERMISO;
      }
      if (partido.actaCerrada) return error("El acta ya está cerrada");
      if (partido.estado !== "en_curso") {
        return error("El acta solo se firma con el partido en curso");
      }
      const protesta = accion.lado === "local" ? partido.protestaLocal : partido.protestaVisitante;
      const confirmado =
        accion.lado === "local"
          ? partido.confirmacionDelegadoLocal
          : partido.confirmacionDelegadoVisitante;
      if (accion.tipo === "establecerConfirmacion" && accion.confirmado && protesta) {
        return error("Retira la protesta antes de confirmar el acta");
      }
      if (accion.tipo === "registrarProtesta") {
        if (confirmado) return error("Quita la confirmación antes de registrar una protesta");
        if (protesta) return error("Este delegado ya registró una protesta");
        if (!accion.motivo.trim()) return error("El motivo de la protesta es obligatorio");
      }
      if (accion.tipo === "retirarProtesta" && !protesta) {
        return error("No hay protesta que retirar");
      }
      return OK;
    }

    case "cerrarActa": {
      if (!puedeOperarMesa(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (partido.actaCerrada) return error("El acta ya está cerrada");
      if (partido.estado !== "en_curso") {
        return error("No se puede cerrar el acta de un partido que no se ha iniciado");
      }
      if (!ladoFirmoActa(partido, "local") || !ladoFirmoActa(partido, "visitante")) {
        return error("Ambos delegados deben confirmar o protestar antes de cerrar el acta");
      }
      if (obtenerMesa(estado.mesas, partido.id).colaPendiente.length > 0) {
        return error("Hay eventos sin sincronizar; desactiva el modo sin conexión primero");
      }
      return OK;
    }

    case "resolverProtesta": {
      if (!puedeResolverProtesta(rol)) return SIN_PERMISO;
      const partido = partidoDe(accion.partidoId);
      if (!partido) return error("Partido no encontrado");
      if (!partido.actaCerrada) return error("La protesta se resuelve después de cerrar el acta");
      const protesta = accion.lado === "local" ? partido.protestaLocal : partido.protestaVisitante;
      if (!protesta) return error("No hay protesta registrada");
      if (protesta.resolucion) return error("La protesta ya fue resuelta");
      if (!accion.texto.trim()) return error("Describe la resolución");
      return OK;
    }
  }
}
