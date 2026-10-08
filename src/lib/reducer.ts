// Pure state machine of the simulator: simuladorReducer(estado, accion, entorno).
//
// - Pure: no React, no localStorage, no Date.now()/Math.random(). IDs and the
//   current time come from `entorno`, so the same inputs always produce the
//   same output and the reducer can be exercised without mounting React.
// - Defensive: every action is checked with validarAccion first; an invalid
//   action returns the same state object untouched.
// - Auditable: every meaningful change appends a BitacoraEntry with the
//   acting role and references to the affected entities.

import type { AccionSimulador, EntornoReducer } from "./acciones";
import { calcularElegibilidad, esMenorDeEdad, estadoRegistro, recalcularMarcador } from "./rules";
import { generarCalendarioRoundRobin } from "./calendario";
import { ETIQUETA_EVENTO } from "./eventos";
import { fechaISOLocal } from "./fechas";
import {
  ajustarMinuto,
  obtenerMesa,
  pausarCronometro,
  reanudarCronometro,
} from "./mesa";
import {
  MAX_TITULARES,
  convocadosDelLado,
  titularesDelLado,
  validarAccion,
} from "./validaciones";
import type {
  BitacoraEntry,
  Categoria,
  EstadoMesa,
  EventoPartido,
  Jugador,
  Lado,
  Partido,
  ReferenciasBitacora,
  SimuladorState,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function conBitacora(
  estado: SimuladorState,
  entorno: EntornoReducer,
  accion: string,
  detalle?: string,
  referencias?: ReferenciasBitacora
): SimuladorState {
  const entrada: BitacoraEntry = {
    id: entorno.crearId("bitacora"),
    fecha: entorno.ahora.toISOString(),
    rol: estado.rolActual,
    accion,
    detalle,
    referencias,
  };
  return { ...estado, bitacora: [...estado.bitacora, entrada] };
}

function conPartido(
  estado: SimuladorState,
  partidoId: string,
  cambio: (partido: Partido) => Partido
): SimuladorState {
  return {
    ...estado,
    partidos: estado.partidos.map((p) => (p.id === partidoId ? cambio(p) : p)),
  };
}

function conMesa(
  estado: SimuladorState,
  partidoId: string,
  cambio: (mesa: EstadoMesa) => EstadoMesa
): SimuladorState {
  return {
    ...estado,
    mesas: { ...estado.mesas, [partidoId]: cambio(obtenerMesa(estado.mesas, partidoId)) },
  };
}

function nombreEquipo(estado: SimuladorState, equipoId: string): string {
  return estado.equipos.find((e) => e.id === equipoId)?.nombre ?? "Equipo";
}

function nombreJugador(estado: SimuladorState, jugadorId?: string): string | undefined {
  return jugadorId ? estado.jugadores.find((j) => j.id === jugadorId)?.nombreCompleto : undefined;
}

function nombreCategoria(estado: SimuladorState, categoriaId: string): string {
  return estado.categorias.find((c) => c.id === categoriaId)?.nombre ?? "Categoría";
}

function buscarPartido(estado: SimuladorState, partidoId: string): Partido {
  // validarAccion already guaranteed it exists.
  return estado.partidos.find((p) => p.id === partidoId)!;
}

/**
 * Replaces a match's events, recomputes the score and, if the acta content
 * changed, clears both confirmations so delegates must review it again.
 */
function conEventos(partido: Partido, eventos: EventoPartido[]): Partido {
  const marcador = recalcularMarcador(eventos, partido.equipoLocalId, partido.equipoVisitanteId);
  return {
    ...partido,
    eventos,
    ...marcador,
    confirmacionDelegadoLocal: false,
    confirmacionDelegadoVisitante: false,
  };
}

function habiaConfirmaciones(partido: Partido): boolean {
  return partido.confirmacionDelegadoLocal || partido.confirmacionDelegadoVisitante;
}

const AVISO_CONFIRMACIONES = " (se reiniciaron las confirmaciones de los delegados)";

function describirEvento(estado: SimuladorState, evento: Omit<EventoPartido, "id" | "partidoId">) {
  const jugador = nombreJugador(estado, evento.jugadorId);
  const base = `${ETIQUETA_EVENTO[evento.tipo]} — min ${evento.minuto}`;
  if (evento.tipo === "sustitucion") {
    return `${base} — sale ${jugador ?? "?"}, entra ${nombreJugador(estado, evento.jugadorEntraId) ?? "?"}`;
  }
  return jugador ? `${base} — ${jugador}` : `${base} — ${nombreEquipo(estado, evento.equipoId)}`;
}

function conLado(partido: Partido, lado: Lado, campos: { convocados?: string[]; titulares?: string[] }) {
  if (lado === "local") {
    return {
      ...partido,
      ...(campos.convocados && { convocadosLocal: campos.convocados }),
      ...(campos.titulares && { titularesLocal: campos.titulares }),
    };
  }
  return {
    ...partido,
    ...(campos.convocados && { convocadosVisitante: campos.convocados }),
    ...(campos.titulares && { titularesVisitante: campos.titulares }),
  };
}

const ETIQUETA_LADO: Record<Lado, string> = { local: "local", visitante: "visitante" };

function recalcularElegibilidadCategoria(
  jugadores: Jugador[],
  equipoIds: string[],
  categoria: Categoria
): { jugadores: Jugador[]; cambios: number } {
  let cambios = 0;
  const actualizados = jugadores.map((jugador) => {
    if (!equipoIds.includes(jugador.equipoId)) return jugador;
    const { estado, motivoRevision } = calcularElegibilidad(
      jugador.fechaNacimiento,
      jugador.curp,
      categoria
    );
    if (estado === jugador.estadoElegibilidad && motivoRevision === jugador.motivoRevision) {
      return jugador;
    }
    cambios += 1;
    return { ...jugador, estadoElegibilidad: estado, motivoRevision };
  });
  return { jugadores: actualizados, cambios };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function simuladorReducer(
  estado: SimuladorState,
  accion: AccionSimulador,
  entorno: EntornoReducer
): SimuladorState {
  if (!validarAccion(estado, accion, entorno).ok) return estado;

  const ahoraMs = entorno.ahora.getTime();
  const hoy = fechaISOLocal(entorno.ahora);

  switch (accion.tipo) {
    case "cambiarRol": {
      const equipoDelegadoId =
        accion.rol === "delegado" && !estado.equipoDelegadoId
          ? (estado.equipos[0]?.id ?? null)
          : estado.equipoDelegadoId;
      return { ...estado, rolActual: accion.rol, equipoDelegadoId };
    }

    case "seleccionarEquipoDelegado":
      return { ...estado, equipoDelegadoId: accion.equipoId };

    case "actualizarConfiguracionLiga": {
      const siguiente: SimuladorState = {
        ...estado,
        liga: { ...estado.liga, nombre: accion.nombreLiga.trim() },
        temporadas: estado.temporadas.map((t) =>
          t.id === estado.liga.temporadaActivaId
            ? { ...t, nombre: accion.nombreTemporada.trim() }
            : t
        ),
      };
      return conBitacora(
        siguiente,
        entorno,
        "Actualización de configuración de liga",
        `${accion.nombreLiga.trim()} — ${accion.nombreTemporada.trim()}`
      );
    }

    case "crearCategoria": {
      const nueva: Categoria = {
        ...accion.datos,
        nombre: accion.datos.nombre.trim(),
        id: entorno.crearId("cat"),
        temporadaId: estado.liga.temporadaActivaId,
        registroCerrado: false,
      };
      return conBitacora(
        { ...estado, categorias: [...estado.categorias, nueva] },
        entorno,
        "Creación de categoría",
        nueva.nombre,
        { categoriaId: nueva.id }
      );
    }

    case "actualizarCategoria": {
      const anterior = estado.categorias.find((c) => c.id === accion.categoriaId)!;
      const actualizada: Categoria = {
        ...anterior,
        ...accion.datos,
        nombre: accion.datos.nombre.trim(),
      };
      const equipoIds = estado.equipos
        .filter((e) => e.categoriaId === actualizada.id)
        .map((e) => e.id);
      const { jugadores, cambios } = recalcularElegibilidadCategoria(
        estado.jugadores,
        equipoIds,
        actualizada
      );
      return conBitacora(
        {
          ...estado,
          categorias: estado.categorias.map((c) => (c.id === actualizada.id ? actualizada : c)),
          jugadores,
        },
        entorno,
        "Actualización de categoría",
        cambios > 0
          ? `${actualizada.nombre} — ${cambios} jugador(es) cambiaron de estado de elegibilidad`
          : actualizada.nombre,
        { categoriaId: actualizada.id }
      );
    }

    case "cerrarRegistroCategoria": {
      const siguiente: SimuladorState = {
        ...estado,
        categorias: estado.categorias.map((c) =>
          c.id === accion.categoriaId
            ? {
                ...c,
                registroCerrado: true,
                fechaCierreRegistro: accion.fecha,
                ventanaExtemporanea: undefined,
              }
            : c
        ),
      };
      return conBitacora(
        siguiente,
        entorno,
        "Cierre de registro de categoría",
        `${nombreCategoria(estado, accion.categoriaId)} — congelado al ${accion.fecha}`,
        { categoriaId: accion.categoriaId }
      );
    }

    case "abrirVentanaExtemporanea": {
      const siguiente: SimuladorState = {
        ...estado,
        categorias: estado.categorias.map((c) =>
          c.id === accion.categoriaId
            ? {
                ...c,
                ventanaExtemporanea: {
                  abiertaEl: hoy,
                  hasta: accion.hasta,
                  motivo: accion.motivo.trim(),
                },
              }
            : c
        ),
      };
      return conBitacora(
        siguiente,
        entorno,
        "Apertura de ventana de altas extemporáneas",
        `${nombreCategoria(estado, accion.categoriaId)} — hasta el ${accion.hasta}: ${accion.motivo.trim()}`,
        { categoriaId: accion.categoriaId }
      );
    }

    case "cerrarVentanaExtemporanea": {
      const siguiente: SimuladorState = {
        ...estado,
        categorias: estado.categorias.map((c) =>
          c.id === accion.categoriaId ? { ...c, ventanaExtemporanea: undefined } : c
        ),
      };
      return conBitacora(
        siguiente,
        entorno,
        "Cierre de ventana de altas extemporáneas",
        nombreCategoria(estado, accion.categoriaId),
        { categoriaId: accion.categoriaId }
      );
    }

    case "crearEquipo": {
      const { datos } = accion;
      const nuevo = {
        id: entorno.crearId("equipo"),
        categoriaId: datos.categoriaId,
        nombre: datos.nombre.trim(),
        delegado: { nombre: datos.delegado.nombre.trim(), telefono: datos.delegado.telefono.trim() },
      };
      return conBitacora(
        { ...estado, equipos: [...estado.equipos, nuevo] },
        entorno,
        "Registro de equipo",
        `${nuevo.nombre} — ${nombreCategoria(estado, nuevo.categoriaId)}`,
        { equipoId: nuevo.id, categoriaId: nuevo.categoriaId }
      );
    }

    case "crearJugador": {
      const { datos } = accion;
      const equipo = estado.equipos.find((e) => e.id === datos.equipoId)!;
      const categoria = estado.categorias.find((c) => c.id === equipo.categoriaId)!;
      const curp = datos.curp.trim().toUpperCase();
      const { estado: estadoElegibilidad, motivoRevision } = calcularElegibilidad(
        datos.fechaNacimiento,
        curp,
        categoria
      );
      const extemporanea = estadoRegistro(categoria, hoy) === "extemporaneo";
      const menor = esMenorDeEdad(datos.fechaNacimiento, entorno.ahora);

      const nuevo: Jugador = {
        id: entorno.crearId("jugador"),
        equipoId: equipo.id,
        nombreCompleto: datos.nombreCompleto.trim(),
        fechaNacimiento: datos.fechaNacimiento,
        curp,
        numero: datos.numero,
        fotoUrl: datos.fotoUrl,
        estadoElegibilidad,
        motivoRevision,
        tutor: menor ? datos.tutor : undefined,
        ...(extemporanea && { altaExtemporanea: true }),
      };

      return conBitacora(
        { ...estado, jugadores: [...estado.jugadores, nuevo] },
        entorno,
        extemporanea ? "Inscripción extemporánea de jugador" : "Inscripción de jugador",
        `${nuevo.nombreCompleto} — ${equipo.nombre} (${estadoElegibilidad})`,
        { jugadorId: nuevo.id, equipoId: equipo.id }
      );
    }

    case "establecerOverrideAdmin": {
      const jugador = estado.jugadores.find((j) => j.id === accion.jugadorId)!;
      return conBitacora(
        {
          ...estado,
          jugadores: estado.jugadores.map((j) =>
            j.id === accion.jugadorId ? { ...j, overrideAdmin: accion.override } : j
          ),
        },
        entorno,
        "Anulación manual de elegibilidad",
        accion.override
          ? `${jugador.nombreCompleto} — ${accion.override.motivo}`
          : `${jugador.nombreCompleto} — anulación retirada`,
        { jugadorId: jugador.id, equipoId: jugador.equipoId }
      );
    }

    case "generarCalendario": {
      const equipoIds = estado.equipos
        .filter((e) => e.categoriaId === accion.categoriaId)
        .map((e) => e.id);
      const conservados = estado.partidos.filter(
        (p) => p.categoriaId !== accion.categoriaId || p.estado !== "programado"
      );
      const nuevos = generarCalendarioRoundRobin({
        categoriaId: accion.categoriaId,
        equipoIds,
        ...accion.opciones,
        crearId: () => entorno.crearId("partido"),
      });
      return conBitacora(
        { ...estado, partidos: [...conservados, ...nuevos] },
        entorno,
        "Generación de calendario",
        `${nombreCategoria(estado, accion.categoriaId)} — ${nuevos.length} partido(s)`,
        { categoriaId: accion.categoriaId }
      );
    }

    case "actualizarConvocados": {
      const partido = buscarPartido(estado, accion.partidoId);
      const anteriores = convocadosDelLado(partido, accion.lado);
      const convocados = Array.from(new Set(accion.jugadorIds));
      // Keep starters still called up, then promote new call-ups to starters
      // until the starting eleven is full.
      const titulares = titularesDelLado(partido, accion.lado).filter((id) =>
        convocados.includes(id)
      );
      for (const id of convocados) {
        if (!anteriores.includes(id) && titulares.length < MAX_TITULARES) titulares.push(id);
      }
      const equipoId = accion.lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
      return conBitacora(
        conPartido(estado, partido.id, (p) => conLado(p, accion.lado, { convocados, titulares })),
        entorno,
        "Actualización de convocados",
        `${nombreEquipo(estado, equipoId)} — ${convocados.length} convocado(s), ${titulares.length} titular(es)`,
        { partidoId: partido.id, equipoId }
      );
    }

    case "alternarTitular": {
      const partido = buscarPartido(estado, accion.partidoId);
      const actuales = titularesDelLado(partido, accion.lado);
      const titulares = actuales.includes(accion.jugadorId)
        ? actuales.filter((id) => id !== accion.jugadorId)
        : [...actuales, accion.jugadorId];
      return conPartido(estado, partido.id, (p) => conLado(p, accion.lado, { titulares }));
    }

    case "iniciarPartido": {
      const siguiente = conMesa(
        conPartido(estado, accion.partidoId, (p) => ({ ...p, estado: "en_curso" })),
        accion.partidoId,
        (mesa) => ({ ...mesa, minutoBase: 0, cronometroDesde: ahoraMs })
      );
      return conBitacora(siguiente, entorno, "Inicio de partido", undefined, {
        partidoId: accion.partidoId,
      });
    }

    case "alternarCronometro":
      return conMesa(estado, accion.partidoId, (mesa) =>
        mesa.cronometroDesde === null
          ? reanudarCronometro(mesa, ahoraMs)
          : pausarCronometro(mesa, ahoraMs)
      );

    case "ajustarMinuto":
      return conMesa(estado, accion.partidoId, (mesa) => ajustarMinuto(mesa, accion.delta, ahoraMs));

    case "agregarEvento": {
      const partido = buscarPartido(estado, accion.partidoId);
      const evento: EventoPartido = {
        ...accion.evento,
        id: entorno.crearId("evento"),
        partidoId: partido.id,
      };
      return conBitacora(
        conPartido(estado, partido.id, (p) => conEventos(p, [...p.eventos, evento])),
        entorno,
        "Registro de evento de partido",
        describirEvento(estado, evento) + (habiaConfirmaciones(partido) ? AVISO_CONFIRMACIONES : ""),
        { partidoId: partido.id, jugadorId: evento.jugadorId }
      );
    }

    case "eliminarEvento": {
      const partido = buscarPartido(estado, accion.partidoId);
      const evento = partido.eventos.find((e) => e.id === accion.eventoId)!;
      return conBitacora(
        conPartido(estado, partido.id, (p) =>
          conEventos(
            p,
            p.eventos.filter((e) => e.id !== accion.eventoId)
          )
        ),
        entorno,
        "Eliminación de evento de partido",
        describirEvento(estado, evento) + (habiaConfirmaciones(partido) ? AVISO_CONFIRMACIONES : ""),
        { partidoId: partido.id, jugadorId: evento.jugadorId }
      );
    }

    case "establecerModoOffline":
      return conMesa(estado, accion.partidoId, (mesa) => ({ ...mesa, modoOffline: accion.activo }));

    case "encolarEventoOffline": {
      const pendiente: EventoPartido = {
        ...accion.evento,
        id: entorno.crearId("pendiente"),
        partidoId: accion.partidoId,
        registradoOffline: true,
      };
      return conMesa(estado, accion.partidoId, (mesa) => ({
        ...mesa,
        colaPendiente: [...mesa.colaPendiente, pendiente],
      }));
    }

    case "descartarEventoOffline":
      return conMesa(estado, accion.partidoId, (mesa) => ({
        ...mesa,
        colaPendiente: mesa.colaPendiente.filter((e) => e.id !== accion.eventoId),
      }));

    case "sincronizarColaOffline": {
      const partido = buscarPartido(estado, accion.partidoId);
      const cola = obtenerMesa(estado.mesas, partido.id).colaPendiente;
      const sinCola = conMesa(estado, partido.id, (mesa) => ({
        ...mesa,
        colaPendiente: [],
        modoOffline: false,
      }));
      if (cola.length === 0) return sinCola;
      const sincronizados = cola.map((e) => ({
        ...e,
        id: entorno.crearId("evento"),
        registradoOffline: true,
      }));
      return conBitacora(
        conPartido(sinCola, partido.id, (p) => conEventos(p, [...p.eventos, ...sincronizados])),
        entorno,
        "Sincronización de eventos capturados sin conexión",
        `${sincronizados.length} evento(s)` +
          (habiaConfirmaciones(partido) ? AVISO_CONFIRMACIONES : ""),
        { partidoId: partido.id }
      );
    }

    case "establecerConfirmacion": {
      const partido = buscarPartido(estado, accion.partidoId);
      const equipoId = accion.lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
      return conBitacora(
        conPartido(estado, partido.id, (p) =>
          accion.lado === "local"
            ? { ...p, confirmacionDelegadoLocal: accion.confirmado }
            : { ...p, confirmacionDelegadoVisitante: accion.confirmado }
        ),
        entorno,
        accion.confirmado ? "Confirmación de delegado" : "Confirmación de delegado retirada",
        `${nombreEquipo(estado, equipoId)} (${ETIQUETA_LADO[accion.lado]})`,
        { partidoId: partido.id, equipoId }
      );
    }

    case "registrarProtesta": {
      const partido = buscarPartido(estado, accion.partidoId);
      const equipoId = accion.lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
      const protesta = { motivo: accion.motivo.trim(), fecha: entorno.ahora.toISOString() };
      return conBitacora(
        conPartido(estado, partido.id, (p) =>
          accion.lado === "local"
            ? { ...p, protestaLocal: protesta, confirmacionDelegadoLocal: false }
            : { ...p, protestaVisitante: protesta, confirmacionDelegadoVisitante: false }
        ),
        entorno,
        "Protesta de delegado",
        `${nombreEquipo(estado, equipoId)}: ${protesta.motivo}`,
        { partidoId: partido.id, equipoId }
      );
    }

    case "retirarProtesta": {
      const partido = buscarPartido(estado, accion.partidoId);
      const equipoId = accion.lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
      return conBitacora(
        conPartido(estado, partido.id, (p) =>
          accion.lado === "local"
            ? { ...p, protestaLocal: undefined }
            : { ...p, protestaVisitante: undefined }
        ),
        entorno,
        "Protesta retirada",
        nombreEquipo(estado, equipoId),
        { partidoId: partido.id, equipoId }
      );
    }

    case "cerrarActa": {
      const partido = buscarPartido(estado, accion.partidoId);
      const siguiente = conMesa(
        conPartido(estado, partido.id, (p) => ({ ...p, actaCerrada: true, estado: "finalizado" })),
        partido.id,
        (mesa) => pausarCronometro(mesa, ahoraMs)
      );
      const conProtesta = partido.protestaLocal || partido.protestaVisitante;
      return conBitacora(
        siguiente,
        entorno,
        conProtesta ? "Cierre de acta con protesta" : "Cierre de acta",
        `${nombreEquipo(estado, partido.equipoLocalId)} ${partido.golesLocal} - ${partido.golesVisitante} ${nombreEquipo(estado, partido.equipoVisitanteId)}`,
        { partidoId: partido.id }
      );
    }

    case "resolverProtesta": {
      const partido = buscarPartido(estado, accion.partidoId);
      const resolucion = { texto: accion.texto.trim(), fecha: entorno.ahora.toISOString() };
      const equipoId = accion.lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
      return conBitacora(
        conPartido(estado, partido.id, (p) =>
          accion.lado === "local"
            ? { ...p, protestaLocal: { ...p.protestaLocal!, resolucion } }
            : { ...p, protestaVisitante: { ...p.protestaVisitante!, resolucion } }
        ),
        entorno,
        "Resolución de protesta",
        `${nombreEquipo(estado, equipoId)}: ${resolucion.texto}`,
        { partidoId: partido.id, equipoId }
      );
    }
  }
}
