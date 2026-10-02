"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { generarCalendarioRoundRobin } from "@/lib/calendario";
import {
  calcularElegibilidad,
  calcularSuspensionParaJornada,
  esMenorDeEdad,
  obtenerProximaJornada,
  recalcularMarcador,
} from "@/lib/rules";
import { crearEstadoInicial } from "@/lib/seed";
import { cargarEstado, guardarEstado, limpiarEstado } from "@/lib/storage";
import type {
  BitacoraEntry,
  Categoria,
  Equipo,
  EstadoPartido,
  EventoPartido,
  Jugador,
  OverrideAdmin,
  RolSimulado,
  SimuladorState,
  TutorInfo,
} from "@/lib/types";

function idUnico(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface DatosNuevoJugador {
  equipoId: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  curp: string;
  numero?: number;
  fotoUrl?: string;
  tutor?: TutorInfo;
}

interface DatosNuevoEquipo {
  categoriaId: string;
  nombre: string;
  delegado: { nombre: string; telefono: string };
}

interface OpcionesGenerarCalendario {
  fechaInicio: string;
  diasEntreJornadas: number;
  horaDefault: string;
  sedes: string[];
}

interface SimuladorContextValue {
  estado: SimuladorState;
  cambiarRol: (rol: RolSimulado) => void;
  reiniciarSimulacion: () => void;
  actualizarConfiguracionLiga: (nombreLiga: string, nombreTemporada: string) => void;
  crearCategoria: (
    datos: Omit<Categoria, "id" | "temporadaId" | "registroCerrado" | "fechaCierreRegistro">
  ) => void;
  actualizarCategoria: (categoriaId: string, cambios: Partial<Categoria>) => void;
  cerrarRegistroCategoria: (categoriaId: string, fecha: string) => void;
  crearEquipo: (datos: DatosNuevoEquipo) => void;
  actualizarEquipo: (equipoId: string, cambios: Partial<Omit<Equipo, "id">>) => void;
  crearJugador: (datos: DatosNuevoJugador) => { ok: boolean; motivo?: string };
  actualizarJugador: (jugadorId: string, cambios: Partial<Jugador>) => void;
  establecerOverrideAdmin: (jugadorId: string, override: OverrideAdmin | undefined) => void;
  generarCalendarioCategoria: (categoriaId: string, opciones: OpcionesGenerarCalendario) => void;
  actualizarConvocados: (
    partidoId: string,
    lado: "local" | "visitante",
    jugadorIds: string[]
  ) => void;
  cambiarEstadoPartido: (partidoId: string, estado: EstadoPartido) => void;
  agregarEvento: (
    partidoId: string,
    evento: Omit<EventoPartido, "id" | "partidoId">
  ) => void;
  eliminarEvento: (partidoId: string, eventoId: string) => void;
  confirmarDelegado: (partidoId: string, lado: "local" | "visitante") => void;
  cerrarActa: (partidoId: string) => { ok: boolean; motivo?: string };
  jugadorSuspendidoParaProximaJornada: (jugadorId: string) => { suspendido: boolean; motivo?: string };
  registrarBitacora: (accion: string, detalle?: string) => void;
}

const SimuladorContext = createContext<SimuladorContextValue | null>(null);

function agregarBitacora(
  estado: SimuladorState,
  accion: string,
  detalle?: string
): BitacoraEntry[] {
  const entrada: BitacoraEntry = {
    id: idUnico("bitacora"),
    fecha: new Date().toISOString(),
    rol: estado.rolActual,
    accion,
    detalle,
  };
  return [...estado.bitacora, entrada];
}

export function SimuladorProvider({ children }: { children: ReactNode }) {
  // Lazy init reads any previously saved state synchronously. This provider
  // is meant to be mounted client-only (see layout.tsx, dynamic ssr:false)
  // so there is no hydration mismatch from reading localStorage here.
  const [estado, setEstado] = useState<SimuladorState>(
    () => cargarEstado() ?? crearEstadoInicial()
  );

  useEffect(() => {
    guardarEstado(estado);
  }, [estado]);

  const cambiarRol = useCallback((rol: RolSimulado) => {
    setEstado((prev) => ({ ...prev, rolActual: rol }));
  }, []);

  const reiniciarSimulacion = useCallback(() => {
    limpiarEstado();
    setEstado(crearEstadoInicial());
  }, []);

  const registrarBitacora = useCallback((accion: string, detalle?: string) => {
    setEstado((prev) => ({ ...prev, bitacora: agregarBitacora(prev, accion, detalle) }));
  }, []);

  const actualizarConfiguracionLiga = useCallback(
    (nombreLiga: string, nombreTemporada: string) => {
      setEstado((prev) => ({
        ...prev,
        liga: { ...prev.liga, nombre: nombreLiga },
        temporadas: prev.temporadas.map((t) =>
          t.id === prev.liga.temporadaActivaId ? { ...t, nombre: nombreTemporada } : t
        ),
        bitacora: agregarBitacora(prev, "Actualización de configuración de liga", nombreLiga),
      }));
    },
    []
  );

  const crearCategoria = useCallback(
    (datos: Omit<Categoria, "id" | "temporadaId" | "registroCerrado" | "fechaCierreRegistro">) => {
      setEstado((prev) => {
        const nueva: Categoria = {
          ...datos,
          id: idUnico("cat"),
          temporadaId: prev.liga.temporadaActivaId,
          registroCerrado: false,
        };
        return {
          ...prev,
          categorias: [...prev.categorias, nueva],
          bitacora: agregarBitacora(prev, "Creación de categoría", nueva.nombre),
        };
      });
    },
    []
  );

  const actualizarCategoria = useCallback(
    (categoriaId: string, cambios: Partial<Categoria>) => {
      setEstado((prev) => ({
        ...prev,
        categorias: prev.categorias.map((c) =>
          c.id === categoriaId ? { ...c, ...cambios } : c
        ),
        bitacora: agregarBitacora(prev, "Actualización de categoría", categoriaId),
      }));
    },
    []
  );

  const cerrarRegistroCategoria = useCallback((categoriaId: string, fecha: string) => {
    setEstado((prev) => {
      const categoria = prev.categorias.find((c) => c.id === categoriaId);
      return {
        ...prev,
        categorias: prev.categorias.map((c) =>
          c.id === categoriaId
            ? { ...c, registroCerrado: true, fechaCierreRegistro: fecha }
            : c
        ),
        bitacora: agregarBitacora(
          prev,
          "Cierre de registro de categoría",
          `${categoria?.nombre ?? categoriaId} — congelado al ${fecha}`
        ),
      };
    });
  }, []);

  const crearEquipo = useCallback((datos: DatosNuevoEquipo) => {
    setEstado((prev) => {
      const nuevo: Equipo = { ...datos, id: idUnico("equipo") };
      return {
        ...prev,
        equipos: [...prev.equipos, nuevo],
        bitacora: agregarBitacora(prev, "Registro de equipo", nuevo.nombre),
      };
    });
  }, []);

  const actualizarEquipo = useCallback(
    (equipoId: string, cambios: Partial<Omit<Equipo, "id">>) => {
      setEstado((prev) => ({
        ...prev,
        equipos: prev.equipos.map((e) => (e.id === equipoId ? { ...e, ...cambios } : e)),
        bitacora: agregarBitacora(prev, "Actualización de equipo", equipoId),
      }));
    },
    []
  );

  const crearJugador = useCallback((datos: DatosNuevoJugador): { ok: boolean; motivo?: string } => {
    let resultado: { ok: boolean; motivo?: string } = { ok: true };
    setEstado((prev) => {
      const equipo = prev.equipos.find((e) => e.id === datos.equipoId);
      const categoria = equipo
        ? prev.categorias.find((c) => c.id === equipo.categoriaId)
        : undefined;

      if (!equipo || !categoria) {
        resultado = { ok: false, motivo: "Equipo o categoría no encontrados" };
        return prev;
      }
      if (categoria.registroCerrado) {
        resultado = { ok: false, motivo: "El registro de esta categoría está cerrado" };
        return prev;
      }

      const menor = esMenorDeEdad(datos.fechaNacimiento);
      if (menor && !datos.tutor?.consentimiento) {
        resultado = {
          ok: false,
          motivo: "Se requiere el consentimiento del tutor para jugadores menores de edad",
        };
        return prev;
      }

      const { estado: estadoElegibilidad, motivoRevision } = calcularElegibilidad(
        datos.fechaNacimiento,
        datos.curp,
        categoria
      );

      const nuevo: Jugador = {
        id: idUnico("jugador"),
        equipoId: datos.equipoId,
        nombreCompleto: datos.nombreCompleto,
        fechaNacimiento: datos.fechaNacimiento,
        curp: datos.curp,
        numero: datos.numero,
        fotoUrl: datos.fotoUrl,
        estadoElegibilidad,
        motivoRevision,
        esMenorDeEdad: menor,
        tutor: datos.tutor,
      };

      return {
        ...prev,
        jugadores: [...prev.jugadores, nuevo],
        bitacora: agregarBitacora(
          prev,
          "Inscripción de jugador",
          `${nuevo.nombreCompleto} — ${equipo.nombre} (${estadoElegibilidad})`
        ),
      };
    });
    return resultado;
  }, []);

  const actualizarJugador = useCallback((jugadorId: string, cambios: Partial<Jugador>) => {
    setEstado((prev) => ({
      ...prev,
      jugadores: prev.jugadores.map((j) => {
        if (j.id !== jugadorId) return j;
        const actualizado = { ...j, ...cambios };
        const equipo = prev.equipos.find((e) => e.id === actualizado.equipoId);
        const categoria = equipo
          ? prev.categorias.find((c) => c.id === equipo.categoriaId)
          : undefined;
        if (categoria && (cambios.fechaNacimiento || cambios.curp)) {
          const { estado: estadoElegibilidad, motivoRevision } = calcularElegibilidad(
            actualizado.fechaNacimiento,
            actualizado.curp,
            categoria
          );
          actualizado.estadoElegibilidad = estadoElegibilidad;
          actualizado.motivoRevision = motivoRevision;
          actualizado.esMenorDeEdad = esMenorDeEdad(actualizado.fechaNacimiento);
        }
        return actualizado;
      }),
      bitacora: agregarBitacora(prev, "Actualización de jugador", jugadorId),
    }));
  }, []);

  const establecerOverrideAdmin = useCallback(
    (jugadorId: string, override: OverrideAdmin | undefined) => {
      setEstado((prev) => ({
        ...prev,
        jugadores: prev.jugadores.map((j) =>
          j.id === jugadorId ? { ...j, overrideAdmin: override } : j
        ),
        bitacora: agregarBitacora(
          prev,
          "Anulación manual de elegibilidad",
          override ? `${jugadorId} — ${override.motivo}` : `${jugadorId} — override removido`
        ),
      }));
    },
    []
  );

  const generarCalendarioCategoria = useCallback(
    (categoriaId: string, opciones: OpcionesGenerarCalendario) => {
      setEstado((prev) => {
        const equipoIds = prev.equipos
          .filter((e) => e.categoriaId === categoriaId)
          .map((e) => e.id);
        const conservados = prev.partidos.filter(
          (p) => p.categoriaId !== categoriaId || p.estado !== "programado"
        );
        const nuevos = generarCalendarioRoundRobin({
          categoriaId,
          equipoIds,
          fechaInicio: opciones.fechaInicio,
          diasEntreJornadas: opciones.diasEntreJornadas,
          horaDefault: opciones.horaDefault,
          sedes: opciones.sedes,
          crearId: () => idUnico("partido"),
        });
        const categoria = prev.categorias.find((c) => c.id === categoriaId);
        return {
          ...prev,
          partidos: [...conservados, ...nuevos],
          bitacora: agregarBitacora(
            prev,
            "Generación de calendario",
            `${categoria?.nombre ?? categoriaId} — ${nuevos.length} partido(s)`
          ),
        };
      });
    },
    []
  );

  const jugadorSuspendidoParaProximaJornada = useCallback(
    (jugadorId: string): { suspendido: boolean; motivo?: string } => {
      const jugador = estado.jugadores.find((j) => j.id === jugadorId);
      const equipo = jugador ? estado.equipos.find((e) => e.id === jugador.equipoId) : undefined;
      if (!equipo) return { suspendido: false };
      const proximaJornada = obtenerProximaJornada(equipo.categoriaId, estado.partidos);
      return calcularSuspensionParaJornada(
        jugadorId,
        equipo.categoriaId,
        proximaJornada,
        estado.partidos
      );
    },
    [estado.jugadores, estado.equipos, estado.partidos]
  );

  const actualizarConvocados = useCallback(
    (partidoId: string, lado: "local" | "visitante", jugadorIds: string[]) => {
      setEstado((prev) => {
        const partido = prev.partidos.find((p) => p.id === partidoId);
        if (!partido) return prev;
        const equipoId = lado === "local" ? partido.equipoLocalId : partido.equipoVisitanteId;
        const equipo = prev.equipos.find((e) => e.id === equipoId);
        const proximaJornada = equipo
          ? obtenerProximaJornada(equipo.categoriaId, prev.partidos)
          : partido.jornada;
        const idsPermitidos = equipo
          ? jugadorIds.filter(
              (id) =>
                !calcularSuspensionParaJornada(id, equipo.categoriaId, proximaJornada, prev.partidos)
                  .suspendido
            )
          : jugadorIds;

        return {
          ...prev,
          partidos: prev.partidos.map((p) =>
            p.id === partidoId
              ? {
                  ...p,
                  ...(lado === "local"
                    ? { convocadosLocal: idsPermitidos }
                    : { convocadosVisitante: idsPermitidos }),
                }
              : p
          ),
          bitacora: agregarBitacora(prev, "Actualización de convocados", partidoId),
        };
      });
    },
    []
  );

  const cambiarEstadoPartido = useCallback((partidoId: string, nuevoEstado: EstadoPartido) => {
    setEstado((prev) => ({
      ...prev,
      partidos: prev.partidos.map((p) =>
        p.id === partidoId ? { ...p, estado: nuevoEstado } : p
      ),
      bitacora: agregarBitacora(prev, "Cambio de estado de partido", `${partidoId} → ${nuevoEstado}`),
    }));
  }, []);

  const agregarEvento = useCallback(
    (partidoId: string, evento: Omit<EventoPartido, "id" | "partidoId">) => {
      setEstado((prev) => ({
        ...prev,
        partidos: prev.partidos.map((p) => {
          if (p.id !== partidoId) return p;
          const eventos = [...p.eventos, { ...evento, id: idUnico("evento"), partidoId }];
          const marcador = recalcularMarcador(eventos, p.equipoLocalId, p.equipoVisitanteId);
          return { ...p, eventos, ...marcador };
        }),
        bitacora: agregarBitacora(prev, "Registro de evento de partido", `${evento.tipo} — min ${evento.minuto}`),
      }));
    },
    []
  );

  const eliminarEvento = useCallback((partidoId: string, eventoId: string) => {
    setEstado((prev) => ({
      ...prev,
      partidos: prev.partidos.map((p) => {
        if (p.id !== partidoId) return p;
        const eventos = p.eventos.filter((e) => e.id !== eventoId);
        const marcador = recalcularMarcador(eventos, p.equipoLocalId, p.equipoVisitanteId);
        return { ...p, eventos, ...marcador };
      }),
      bitacora: agregarBitacora(prev, "Eliminación de evento de partido", eventoId),
    }));
  }, []);

  const confirmarDelegado = useCallback((partidoId: string, lado: "local" | "visitante") => {
    setEstado((prev) => ({
      ...prev,
      partidos: prev.partidos.map((p) =>
        p.id === partidoId
          ? {
              ...p,
              ...(lado === "local"
                ? { confirmacionDelegadoLocal: true }
                : { confirmacionDelegadoVisitante: true }),
            }
          : p
      ),
      bitacora: agregarBitacora(prev, "Confirmación de delegado", `${partidoId} — ${lado}`),
    }));
  }, []);

  const cerrarActa = useCallback((partidoId: string): { ok: boolean; motivo?: string } => {
    let resultado: { ok: boolean; motivo?: string } = { ok: true };
    setEstado((prev) => {
      const partido = prev.partidos.find((p) => p.id === partidoId);
      if (!partido) {
        resultado = { ok: false, motivo: "Partido no encontrado" };
        return prev;
      }
      if (!partido.confirmacionDelegadoLocal || !partido.confirmacionDelegadoVisitante) {
        resultado = {
          ok: false,
          motivo: "Ambos delegados deben confirmar antes de cerrar el acta",
        };
        return prev;
      }
      return {
        ...prev,
        partidos: prev.partidos.map((p) =>
          p.id === partidoId ? { ...p, actaCerrada: true, estado: "finalizado" } : p
        ),
        bitacora: agregarBitacora(
          prev,
          "Cierre de acta",
          `${partido.golesLocal} - ${partido.golesVisitante}`
        ),
      };
    });
    return resultado;
  }, []);

  const value: SimuladorContextValue = {
    estado,
    cambiarRol,
    reiniciarSimulacion,
    actualizarConfiguracionLiga,
    crearCategoria,
    actualizarCategoria,
    cerrarRegistroCategoria,
    crearEquipo,
    actualizarEquipo,
    crearJugador,
    actualizarJugador,
    establecerOverrideAdmin,
    generarCalendarioCategoria,
    actualizarConvocados,
    cambiarEstadoPartido,
    agregarEvento,
    eliminarEvento,
    confirmarDelegado,
    cerrarActa,
    jugadorSuspendidoParaProximaJornada,
    registrarBitacora,
  };

  return <SimuladorContext.Provider value={value}>{children}</SimuladorContext.Provider>;
}

export function useSimulador(): SimuladorContextValue {
  const ctx = useContext(SimuladorContext);
  if (!ctx) throw new Error("useSimulador debe usarse dentro de SimuladorProvider");
  return ctx;
}
