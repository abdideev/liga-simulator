// Behaviour of the simulator through its public contract: validarAccion +
// simuladorReducer, exactly as the React context runs them.

import { describe, expect, it } from "vitest";

import { obtenerMesa } from "../mesa";
import { calcularEstadisticasJugadores, calcularTabla } from "../rules";
import { simuladorReducer } from "../reducer";
import { ADULTO, HOY, MENOR, TUTOR, expectOk, iniciarPartido, partido, semilla, simulador } from "./helpers";

const SIN_PERMISO = "Tu rol no tiene permiso para realizar esta acción";
const CATEGORIA = { nombre: "Sub-15", anioNacimientoMin: 2011, anioNacimientoMax: 2013, cupoEquipos: 10, limiteJugadoresPorPlantel: 18 };

describe("sesión simulada", () => {
  it("al cambiar a delegado conserva el equipo y valida el equipo elegido", () => {
    const s = simulador();
    expectOk(s.d({ tipo: "cambiarRol", rol: "delegado" }));
    expect(s.estado.equipoDelegadoId).toBe("equipo-1");
    expect(s.d({ tipo: "seleccionarEquipoDelegado", equipoId: "no-existe" })).toEqual({ ok: false, motivo: "Equipo no encontrado" });
    expectOk(s.d({ tipo: "seleccionarEquipoDelegado", equipoId: "equipo-4" }));
    expect(s.estado.equipoDelegadoId).toBe("equipo-4");
  });
  it("un delegado sin equipo previo recibe el primero", () => {
    const s = simulador({ ...semilla(), equipoDelegadoId: null });
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.estado.equipoDelegadoId).toBe("equipo-1");
  });
  it("una acción inválida deja el estado intacto (reducer defensivo)", () => {
    const e = semilla();
    const r = simuladorReducer(e, { tipo: "crearCategoria", datos: { ...CATEGORIA, nombre: " " } }, { crearId: () => "x", ahora: HOY });
    expect(r).toBe(e);
  });
});

describe("configuración de liga (RF-04, RF-05)", () => {
  it("solo el administrador configura y cada cambio queda en bitácora", () => {
    const s = simulador();
    expect(s.d({ tipo: "actualizarConfiguracionLiga", nombreLiga: " ", nombreTemporada: "T" }).motivo).toBe(
      "El nombre de la liga y de la temporada son obligatorios"
    );
    expectOk(s.d({ tipo: "actualizarConfiguracionLiga", nombreLiga: "Liga X ", nombreTemporada: " Clausura" }));
    expect(s.estado.liga.nombre).toBe("Liga X");
    expect(s.estado.temporadas[0].nombre).toBe("Clausura");
    expectOk(s.d({ tipo: "crearCategoria", datos: CATEGORIA }));
    expect(s.estado.categorias.at(-1)).toMatchObject({ nombre: "Sub-15", registroCerrado: false });
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Creación de categoría");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "crearCategoria", datos: CATEGORIA }).motivo).toBe(SIN_PERMISO);
    expect(s.d({ tipo: "actualizarConfiguracionLiga", nombreLiga: "a", nombreTemporada: "b" }).motivo).toBe(SIN_PERMISO);
  });
  it.each([
    [{ ...CATEGORIA, nombre: "" }, "El nombre de la categoría es obligatorio"],
    [{ ...CATEGORIA, anioNacimientoMin: 2014 }, "El año mínimo no puede ser mayor que el año máximo"],
    [{ ...CATEGORIA, cupoEquipos: 0 }, "El cupo de equipos y el límite de plantel deben ser mayores a 0"],
  ])("valida los datos de la categoría", (datos, motivo) => {
    expect(simulador().d({ tipo: "crearCategoria", datos }).motivo).toBe(motivo);
  });
  it("editar el rango recalcula la elegibilidad y no permite cupo menor a lo registrado", () => {
    const s = simulador();
    const libre = s.estado.categorias[0];
    const datos = { nombre: libre.nombre, anioNacimientoMin: 1970, anioNacimientoMax: 1995, cupoEquipos: 3, limiteJugadoresPorPlantel: 20 };
    expect(s.d({ tipo: "actualizarCategoria", categoriaId: "cat-1", datos: { ...datos, cupoEquipos: 2 } }).motivo).toBe(
      "El cupo no puede ser menor que los 3 equipos ya registrados"
    );
    expectOk(s.d({ tipo: "actualizarCategoria", categoriaId: "cat-1", datos }));
    expect(s.estado.bitacora.at(-1)?.detalle).toMatch(/jugador\(es\) cambiaron de estado/);
    expect(s.estado.jugadores.find((j) => j.id === "jugador-7")?.estadoElegibilidad).toBe("No elegible por edad");
    expect(s.d({ tipo: "actualizarCategoria", categoriaId: "cat-1", datos: { ...datos, nombre: "" } }).ok).toBe(false);
    expectOk(s.d({ tipo: "actualizarCategoria", categoriaId: "cat-1", datos }));
    expect(s.estado.bitacora.at(-1)?.detalle).toBe("Libre");
  });
});

describe("equipos (RF-06)", () => {
  const nuevo = { categoriaId: "cat-1", nombre: "Club Prueba FC", delegado: { nombre: "D", telefono: "1" } };
  it("respeta el cupo y no repite nombres en la categoría", () => {
    const s = simulador();
    expect(s.d({ tipo: "crearEquipo", datos: nuevo }).motivo).toBe("La categoría Libre ya alcanzó su cupo de 3 equipos");
    const libre = s.estado.categorias[0];
    expectOk(s.d({ tipo: "actualizarCategoria", categoriaId: "cat-1", datos: { nombre: libre.nombre, anioNacimientoMin: 1970, anioNacimientoMax: 2007, cupoEquipos: 5, limiteJugadoresPorPlantel: 20 } }));
    expectOk(s.d({ tipo: "crearEquipo", datos: nuevo }));
    expect(s.d({ tipo: "crearEquipo", datos: { ...nuevo, nombre: "club prueba fc" } }).motivo).toBe("Ya existe un equipo llamado club prueba fc en Libre");
    expect(s.d({ tipo: "crearEquipo", datos: { ...nuevo, nombre: "" } }).motivo).toBe("Todos los campos son obligatorios");
    expect(s.d({ tipo: "crearEquipo", datos: { ...nuevo, categoriaId: "x" } }).motivo).toBe("Categoría no encontrada");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "crearEquipo", datos: nuevo }).motivo).toBe(SIN_PERMISO);
  });
});

describe("inscripción de jugadores (RF-08, RF-09, RF-20)", () => {
  const base = { equipoId: "equipo-4", nombreCompleto: "Menor Prueba", numero: 13, ...MENOR };
  it("un menor requiere tutor, declaración y consentimiento 1", () => {
    const s = simulador();
    expect(s.d({ tipo: "crearJugador", datos: base }).motivo).toMatch(/se requieren el nombre del tutor/);
    expect(s.d({ tipo: "crearJugador", datos: { ...base, tutor: { ...TUTOR, declaracion: false } } }).ok).toBe(false);
    expectOk(s.d({ tipo: "crearJugador", datos: { ...base, tutor: TUTOR } }));
    const j = s.estado.jugadores.at(-1)!;
    expect(j).toMatchObject({ estadoElegibilidad: "Elegible", tutor: { publicarNombre: false, fecha: HOY.toISOString() } });
    expect(s.estado.bitacora.at(-1)?.detalle).toMatch(/nombre público: no, solo dorsal/);
  });
  it("un adulto no guarda tutor aunque se envíe", () => {
    const s = simulador();
    expectOk(s.d({ tipo: "crearJugador", datos: { equipoId: "equipo-1", nombreCompleto: "Adulto", numero: 13, ...ADULTO, tutor: TUTOR } }));
    expect(s.estado.jugadores.at(-1)?.tutor).toBeUndefined();
  });
  it("valida obligatorios, número, plantel lleno, permisos y equipo", () => {
    const s = simulador();
    expect(s.d({ tipo: "crearJugador", datos: { ...base, curp: " ", tutor: TUTOR } }).motivo).toBe("Nombre, fecha de nacimiento y CURP son obligatorios");
    expect(s.d({ tipo: "crearJugador", datos: { ...base, numero: 1, tutor: TUTOR } }).motivo).toMatch(/El número 1 ya lo usa/);
    expect(s.d({ tipo: "crearJugador", datos: { ...base, equipoId: "x" } }).motivo).toBe("Equipo o categoría no encontrados");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "crearJugador", datos: { ...base, tutor: TUTOR } }).motivo).toBe(SIN_PERMISO);
    s.d({ tipo: "seleccionarEquipoDelegado", equipoId: "equipo-4" });
    for (let n = 13; n <= 18; n++) expectOk(s.d({ tipo: "crearJugador", datos: { ...base, numero: n, tutor: TUTOR } }));
    expect(s.d({ tipo: "crearJugador", datos: { ...base, numero: 19, tutor: TUTOR } }).motivo).toBe("El plantel ya tiene el máximo de 18 jugadores");
  });
  it("anulación manual con motivo obligatorio, solo administrador", () => {
    const s = simulador();
    const override = { elegibleForzado: true, motivo: "", fecha: HOY.toISOString() };
    expect(s.d({ tipo: "establecerOverrideAdmin", jugadorId: "jugador-29", override }).motivo).toBe("El motivo de la anulación manual es obligatorio");
    expect(s.d({ tipo: "establecerOverrideAdmin", jugadorId: "nadie", override }).motivo).toBe("Jugador no encontrado");
    expectOk(s.d({ tipo: "establecerOverrideAdmin", jugadorId: "jugador-29", override: { ...override, motivo: "Acta de nacimiento revisada" } }));
    expect(s.estado.bitacora.at(-1)?.detalle).toBe("Axel Rojas Díaz — Acta de nacimiento revisada");
    expectOk(s.d({ tipo: "establecerOverrideAdmin", jugadorId: "jugador-29", override: undefined }));
    expect(s.estado.bitacora.at(-1)?.detalle).toMatch(/anulación retirada/);
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "establecerOverrideAdmin", jugadorId: "jugador-29", override: undefined }).motivo).toBe(SIN_PERMISO);
  });
});

describe("cierre de registro y altas extemporáneas (RF-10)", () => {
  it("congela el plantel y solo reabre con motivo y fecha válida", () => {
    const s = simulador();
    const alta = { equipoId: "equipo-1", nombreCompleto: "Tardío", numero: 14, ...ADULTO };
    expect(s.d({ tipo: "cerrarRegistroCategoria", categoriaId: "cat-1", fecha: "" }).motivo).toBe("Indica la fecha de cierre");
    expect(s.d({ tipo: "abrirVentanaExtemporanea", categoriaId: "cat-1", hasta: "2026-11-30", motivo: "m" }).motivo).toMatch(/sobre un registro cerrado/);
    expectOk(s.d({ tipo: "cerrarRegistroCategoria", categoriaId: "cat-1", fecha: "2026-11-04" }));
    expect(s.d({ tipo: "cerrarRegistroCategoria", categoriaId: "cat-1", fecha: "2026-11-04" }).motivo).toBe("El registro de esta categoría ya está cerrado");
    expect(s.d({ tipo: "crearJugador", datos: alta }).motivo).toBe("El registro de esta categoría está cerrado");
    expect(s.d({ tipo: "abrirVentanaExtemporanea", categoriaId: "cat-1", hasta: "2026-11-30", motivo: " " }).motivo).toBe("El motivo de la ventana extemporánea es obligatorio");
    expect(s.d({ tipo: "abrirVentanaExtemporanea", categoriaId: "cat-1", hasta: "2026-11-01", motivo: "m" }).motivo).toBe("La fecha límite de la ventana no puede ser anterior a hoy");
    expectOk(s.d({ tipo: "abrirVentanaExtemporanea", categoriaId: "cat-1", hasta: "2026-11-30", motivo: "Alta por traspaso" }));
    expectOk(s.d({ tipo: "crearJugador", datos: alta }));
    expect(s.estado.jugadores.at(-1)?.altaExtemporanea).toBe(true);
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Inscripción extemporánea de jugador");
    expectOk(s.d({ tipo: "cerrarVentanaExtemporanea", categoriaId: "cat-1" }));
    expect(s.d({ tipo: "cerrarVentanaExtemporanea", categoriaId: "cat-1" }).motivo).toBe("No hay una ventana extemporánea abierta");
    expect(s.d({ tipo: "cerrarRegistroCategoria", categoriaId: "x", fecha: "2026-11-04" }).motivo).toBe("Categoría no encontrada");
    expect(s.d({ tipo: "abrirVentanaExtemporanea", categoriaId: "x", hasta: "2026-11-30", motivo: "m" }).motivo).toBe("Categoría no encontrada");
  });
});

describe("calendario", () => {
  it("regenera solo los partidos programados de la categoría", () => {
    const s = simulador();
    const opciones = { fechaInicio: "2026-11-07", diasEntreJornadas: 7, horaDefault: "10:00", sedes: ["A", "B"] };
    expect(s.d({ tipo: "generarCalendario", categoriaId: "cat-1", opciones: { ...opciones, fechaInicio: "" } }).motivo).toBe("Indica la fecha de la jornada 1");
    expectOk(s.d({ tipo: "generarCalendario", categoriaId: "cat-1", opciones }));
    const libre = s.estado.partidos.filter((p) => p.categoriaId === "cat-1");
    expect(libre.filter((p) => p.estado === "finalizado")).toHaveLength(1);
    expect(libre.filter((p) => p.estado === "programado")).toHaveLength(3);
    expectOk(s.d({ tipo: "crearCategoria", datos: CATEGORIA }));
    expect(s.d({ tipo: "generarCalendario", categoriaId: s.estado.categorias.at(-1)!.id, opciones }).motivo).toBe("Se necesitan al menos 2 equipos registrados en esta categoría");
  });
});

describe("partido: convocatoria y mesa de control (RF-12, RF-13)", () => {
  it("bloquea suspendidos y jugadores en revisión, con su motivo", () => {
    const s = simulador();
    expect(s.d({ tipo: "actualizarConvocados", partidoId: "partido-2", lado: "visitante", jugadorIds: ["jugador-31"] }).motivo).toBe(
      "Brandon Martínez Castillo no puede ser convocado: Suspendido — Tarjeta roja directa"
    );
    expect(s.d({ tipo: "actualizarConvocados", partidoId: "partido-2", lado: "visitante", jugadorIds: ["jugador-29"] }).motivo).toMatch(/Requiere revisión manual/);
    expect(s.d({ tipo: "actualizarConvocados", partidoId: "partido-2", lado: "visitante", jugadorIds: ["jugador-1"] }).motivo).toBe("El jugador no pertenece a este equipo");
    expect(s.d({ tipo: "actualizarConvocados", partidoId: "x", lado: "local", jugadorIds: [] }).motivo).toBe("Partido no encontrado");
  });
  it("un delegado solo convoca su lado y no opera la mesa", () => {
    const s = simulador();
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expectOk(s.d({ tipo: "actualizarConvocados", partidoId: "partido-2", lado: "local", jugadorIds: ["jugador-1"] }));
    expect(s.d({ tipo: "actualizarConvocados", partidoId: "partido-2", lado: "visitante", jugadorIds: ["jugador-25"] }).motivo).toBe(SIN_PERMISO);
    expect(s.d({ tipo: "iniciarPartido", partidoId: "partido-2" }).motivo).toBe(SIN_PERMISO);
  });
  it("los primeros 11 son titulares y hay máximo 11", () => {
    const s = simulador();
    const ids = s.estado.jugadores.filter((j) => j.equipoId === "equipo-1").map((j) => j.id);
    expectOk(s.d({ tipo: "actualizarConvocados", partidoId: "partido-2", lado: "local", jugadorIds: ids }));
    expect(partido(s, "partido-2").titularesLocal).toHaveLength(11);
    expect(s.d({ tipo: "alternarTitular", partidoId: "partido-2", lado: "local", jugadorId: ids[11] }).motivo).toBe("Ya hay 11 titulares");
    expectOk(s.d({ tipo: "alternarTitular", partidoId: "partido-2", lado: "local", jugadorId: ids[0] }));
    expectOk(s.d({ tipo: "alternarTitular", partidoId: "partido-2", lado: "local", jugadorId: ids[11] }));
    expect(s.d({ tipo: "alternarTitular", partidoId: "partido-2", lado: "local", jugadorId: "jugador-25" }).motivo).toBe("Solo un jugador convocado puede ser titular");
    expect(s.d({ tipo: "alternarTitular", partidoId: "x", lado: "local", jugadorId: ids[0] }).motivo).toBe("Partido no encontrado");
  });
  it("no inicia sin titulares en ambos lados ni dos veces", () => {
    const s = simulador();
    expect(s.d({ tipo: "iniciarPartido", partidoId: "partido-2" }).motivo).toBe("Cada equipo necesita al menos un titular convocado para iniciar");
    iniciarPartido(s, "partido-2");
    expect(s.d({ tipo: "iniciarPartido", partidoId: "partido-2" }).motivo).toBe("El partido ya fue iniciado");
    expect(s.d({ tipo: "iniciarPartido", partidoId: "x" }).motivo).toBe("Partido no encontrado");
  });
  it("cronómetro: pausa, reanuda y ajusta; solo en curso", () => {
    const s = simulador();
    expect(s.d({ tipo: "alternarCronometro", partidoId: "partido-2" }).motivo).toBe("El partido no está en curso");
    iniciarPartido(s, "partido-2");
    expectOk(s.d({ tipo: "alternarCronometro", partidoId: "partido-2" }, new Date(HOY.getTime() + 5000)));
    expect(obtenerMesa(s.estado.mesas, "partido-2")).toMatchObject({ minutoBase: 5, cronometroDesde: null });
    expectOk(s.d({ tipo: "ajustarMinuto", partidoId: "partido-2", delta: -10 }));
    expect(obtenerMesa(s.estado.mesas, "partido-2").minutoBase).toBe(0);
    expectOk(s.d({ tipo: "alternarCronometro", partidoId: "partido-2" }));
    expect(obtenerMesa(s.estado.mesas, "partido-2").cronometroDesde).not.toBeNull();
    expect(s.d({ tipo: "ajustarMinuto", partidoId: "x", delta: 1 }).motivo).toBe("Partido no encontrado");
  });
});

describe("eventos y modo sin conexión (RF-14, RNF-01, RNF-02)", () => {
  it("valida cada evento antes de registrarlo", () => {
    const s = simulador();
    iniciarPartido(s, "partido-2");
    const p = partido(s, "partido-2");
    const titular = p.titularesLocal[0];
    const bad = (evento: object) => s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 10, tipo: "gol", equipoId: "equipo-1", jugadorId: titular, ...evento } as never }).motivo;
    expect(bad({ equipoId: "equipo-5" })).toBe("El equipo del evento no juega este partido");
    expect(bad({ minuto: 131 })).toBe("El minuto debe estar entre 0 y 130");
    expect(bad({ jugadorId: undefined })).toBe("Este tipo de evento requiere seleccionar un jugador");
    expect(bad({ jugadorId: "jugador-12" })).toBe("El jugador no está convocado para este partido");
    expect(bad({ tipo: "sustitucion", jugadorEntraId: undefined })).toBe("La sustitución requiere el jugador que sale y el que entra");
    expect(bad({ tipo: "sustitucion", jugadorEntraId: titular })).toBe("El jugador que sale y el que entra deben ser distintos");
    expect(bad({ tipo: "sustitucion", jugadorEntraId: "jugador-12" })).toBe("El jugador que entra no está convocado para este partido");
    expectOk(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 10, tipo: "falta", equipoId: "equipo-3" } }));
    expect(s.estado.bitacora.at(-1)?.detalle).toBe("Falta — min 10 — Atlético Minero");
  });
  it("la cola sin conexión se sincroniza completa, sin duplicados y en el orden capturado", () => {
    const s = simulador();
    iniciarPartido(s, "partido-2");
    const p = partido(s, "partido-2");
    const gol = { minuto: 12, tipo: "gol" as const, equipoId: "equipo-1", jugadorId: p.titularesLocal[9] };
    expect(s.d({ tipo: "encolarEventoOffline", partidoId: "partido-2", evento: gol }).motivo).toBe("El modo sin conexión no está activo");
    expectOk(s.d({ tipo: "establecerModoOffline", partidoId: "partido-2", activo: true }));
    expect(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: gol }).motivo).toBe("El modo sin conexión está activo: el evento debe ir a la cola");
    expectOk(s.d({ tipo: "encolarEventoOffline", partidoId: "partido-2", evento: gol }));
    expectOk(s.d({ tipo: "encolarEventoOffline", partidoId: "partido-2", evento: { minuto: 20, tipo: "tarjeta_amarilla", equipoId: "equipo-3", jugadorId: p.titularesVisitante[0] } }));
    expectOk(s.d({ tipo: "encolarEventoOffline", partidoId: "partido-2", evento: { minuto: 25, tipo: "falta", equipoId: "equipo-1" } }));
    const cola = obtenerMesa(s.estado.mesas, "partido-2").colaPendiente;
    expect(cola).toHaveLength(3);
    expect(s.d({ tipo: "establecerModoOffline", partidoId: "partido-2", activo: false }).motivo).toBe("Hay eventos pendientes: sincronízalos para salir del modo sin conexión");
    expectOk(s.d({ tipo: "descartarEventoOffline", partidoId: "partido-2", eventoId: cola[2].id }));
    expect(s.d({ tipo: "descartarEventoOffline", partidoId: "partido-2", eventoId: cola[2].id }).motivo).toBe("Evento pendiente no encontrado");
    expectOk(s.d({ tipo: "sincronizarColaOffline", partidoId: "partido-2" }));
    const final = partido(s, "partido-2");
    expect(final.eventos.map((e) => e.minuto)).toEqual([12, 20]);
    expect(final.eventos.every((e) => e.registradoOffline)).toBe(true);
    expect(new Set(final.eventos.map((e) => e.id)).size).toBe(2);
    expect(final.golesLocal).toBe(1);
    expect(obtenerMesa(s.estado.mesas, "partido-2")).toMatchObject({ colaPendiente: [], modoOffline: false });
    expect(s.estado.bitacora.at(-1)?.detalle).toBe("2 evento(s)");
    expectOk(s.d({ tipo: "sincronizarColaOffline", partidoId: "partido-2" }));
    expect(partido(s, "partido-2").eventos).toHaveLength(2);
  });
  it("eliminar un evento recalcula el marcador", () => {
    const s = simulador();
    iniciarPartido(s, "partido-2");
    const t = partido(s, "partido-2").titularesLocal[9];
    expectOk(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 5, tipo: "gol", equipoId: "equipo-1", jugadorId: t } }));
    const id = partido(s, "partido-2").eventos[0].id;
    expectOk(s.d({ tipo: "eliminarEvento", partidoId: "partido-2", eventoId: id }));
    expect(partido(s, "partido-2").golesLocal).toBe(0);
    expect(s.d({ tipo: "eliminarEvento", partidoId: "partido-2", eventoId: id }).motivo).toBe("Evento no encontrado");
  });
});

describe("acta: confirmación, protesta y cierre (RF-15, RF-16, RF-18)", () => {
  it("cerrar el acta recalcula la tabla y la suspensión", () => {
    const s = simulador();
    iniciarPartido(s, "partido-2");
    const p = partido(s, "partido-2");
    expect(s.d({ tipo: "cerrarActa", partidoId: "partido-2" }).motivo).toBe("Ambos delegados deben confirmar o protestar antes de cerrar el acta");
    expectOk(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 5, tipo: "gol", equipoId: "equipo-1", jugadorId: p.titularesLocal[9] } }));
    expectOk(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 50, tipo: "tarjeta_roja", equipoId: "equipo-1", jugadorId: p.titularesLocal[0] } }));
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "local", confirmado: true }));
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: true }));
    expectOk(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 60, tipo: "tiro_esquina", equipoId: "equipo-3" } }));
    expect(partido(s, "partido-2").confirmacionDelegadoLocal).toBe(false);
    expect(s.estado.bitacora.at(-1)?.detalle).toMatch(/se reiniciaron las confirmaciones/);
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "local", confirmado: true }));
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: true }));
    expectOk(s.d({ tipo: "cerrarActa", partidoId: "partido-2" }));
    expect(partido(s, "partido-2")).toMatchObject({ estado: "finalizado", actaCerrada: true });
    expect(s.estado.bitacora.at(-1)).toMatchObject({ accion: "Cierre de acta", detalle: "Real Tulancingo FC 1 - 0 Atlético Minero" });
    const tabla = calcularTabla(["equipo-1", "equipo-2", "equipo-3"], s.estado.partidos, "cat-1");
    expect(tabla.map((t) => [t.equipoId, t.puntos])).toEqual([["equipo-2", 3], ["equipo-1", 3], ["equipo-3", 0]]);
    const stats = calcularEstadisticasJugadores(s.estado.jugadores, s.estado.partidos);
    expect(stats.find((x) => x.jugadorId === p.titularesLocal[0])?.suspendido).toBe(true);
    expect(stats.find((x) => x.jugadorId === "jugador-31")?.suspendido).toBe(false);
    for (const accion of [
      { tipo: "cerrarActa", partidoId: "partido-2" },
      { tipo: "eliminarEvento", partidoId: "partido-2", eventoId: "x" },
      { tipo: "establecerModoOffline", partidoId: "partido-2", activo: true },
      { tipo: "actualizarConvocados", partidoId: "partido-2", lado: "local", jugadorIds: [] },
      { tipo: "alternarTitular", partidoId: "partido-2", lado: "local", jugadorId: "jugador-1" },
      { tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "local", confirmado: false },
    ] as const) {
      expect(s.d(accion as never).motivo).toBe("El acta ya está cerrada");
    }
    expect(s.d({ tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 70, tipo: "falta", equipoId: "equipo-1" } }).motivo).toBe(
      "Solo se registran eventos con el partido en curso"
    );
  });
  it("la protesta exige motivo, excluye la confirmación y se resuelve tras cerrar", () => {
    const s = simulador();
    expect(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "local", confirmado: true }).motivo).toBe("El acta solo se firma con el partido en curso");
    expect(s.d({ tipo: "cerrarActa", partidoId: "partido-2" }).motivo).toBe("No se puede cerrar el acta de un partido que no se ha iniciado");
    iniciarPartido(s, "partido-2");
    expect(s.d({ tipo: "registrarProtesta", partidoId: "partido-2", lado: "visitante", motivo: " " }).motivo).toBe("El motivo de la protesta es obligatorio");
    expect(s.d({ tipo: "retirarProtesta", partidoId: "partido-2", lado: "visitante" }).motivo).toBe("No hay protesta que retirar");
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: true }));
    expect(s.d({ tipo: "registrarProtesta", partidoId: "partido-2", lado: "visitante", motivo: "Fuera de juego" }).motivo).toBe("Quita la confirmación antes de registrar una protesta");
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: false }));
    expectOk(s.d({ tipo: "registrarProtesta", partidoId: "partido-2", lado: "visitante", motivo: "Fuera de juego" }));
    expect(s.d({ tipo: "registrarProtesta", partidoId: "partido-2", lado: "visitante", motivo: "otra" }).motivo).toBe("Este delegado ya registró una protesta");
    expect(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: true }).motivo).toBe("Retira la protesta antes de confirmar el acta");
    expectOk(s.d({ tipo: "retirarProtesta", partidoId: "partido-2", lado: "visitante" }));
    expectOk(s.d({ tipo: "registrarProtesta", partidoId: "partido-2", lado: "visitante", motivo: "Fuera de juego" }));
    expectOk(s.d({ tipo: "registrarProtesta", partidoId: "partido-2", lado: "local", motivo: "Árbitro" }));
    expect(s.d({ tipo: "resolverProtesta", partidoId: "partido-2", lado: "visitante", texto: "x" }).motivo).toBe("La protesta se resuelve después de cerrar el acta");
    expectOk(s.d({ tipo: "cerrarActa", partidoId: "partido-2" }));
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Cierre de acta con protesta");
    expect(s.d({ tipo: "resolverProtesta", partidoId: "partido-2", lado: "visitante", texto: " " }).motivo).toBe("Describe la resolución");
    expectOk(s.d({ tipo: "resolverProtesta", partidoId: "partido-2", lado: "visitante", texto: "Improcedente" }));
    expectOk(s.d({ tipo: "resolverProtesta", partidoId: "partido-2", lado: "local", texto: "Procedente" }));
    expect(s.d({ tipo: "resolverProtesta", partidoId: "partido-2", lado: "visitante", texto: "otra vez" }).motivo).toBe("La protesta ya fue resuelta");
    expect(partido(s, "partido-2").protestaVisitante?.resolucion?.texto).toBe("Improcedente");
    expect(s.d({ tipo: "resolverProtesta", partidoId: "partido-3", lado: "visitante", texto: "x" }).motivo).toBe("La protesta se resuelve después de cerrar el acta");
    expect(s.d({ tipo: "resolverProtesta", partidoId: "partido-1", lado: "visitante", texto: "x" }).motivo).toBe("No hay protesta registrada");
    expect(s.d({ tipo: "resolverProtesta", partidoId: "x", lado: "local", texto: "x" }).motivo).toBe("Partido no encontrado");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "resolverProtesta", partidoId: "partido-2", lado: "local", texto: "x" }).motivo).toBe(SIN_PERMISO);
  });
  it("no se cierra el acta con eventos sin sincronizar", () => {
    const s = simulador();
    iniciarPartido(s, "partido-2");
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "local", confirmado: true }));
    expectOk(s.d({ tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: true }));
    expectOk(s.d({ tipo: "establecerModoOffline", partidoId: "partido-2", activo: true }));
    expectOk(s.d({ tipo: "encolarEventoOffline", partidoId: "partido-2", evento: { minuto: 1, tipo: "falta", equipoId: "equipo-1" } }));
    expect(s.d({ tipo: "cerrarActa", partidoId: "partido-2" }).motivo).toBe("Hay eventos sin sincronizar; desactiva el modo sin conexión primero");
  });
  it("la mesa rechaza partidos inexistentes", () => {
    const s = simulador();
    for (const accion of [
      { tipo: "agregarEvento", partidoId: "x", evento: { minuto: 1, tipo: "falta", equipoId: "equipo-1" } },
      { tipo: "eliminarEvento", partidoId: "x", eventoId: "e" },
      { tipo: "sincronizarColaOffline", partidoId: "x" },
      { tipo: "establecerConfirmacion", partidoId: "x", lado: "local", confirmado: true },
      { tipo: "cerrarActa", partidoId: "x" },
    ]) {
      expect(s.d(accion as never).motivo).toBe("Partido no encontrado");
    }
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    for (const accion of [
      { tipo: "agregarEvento", partidoId: "partido-2", evento: { minuto: 1, tipo: "falta", equipoId: "equipo-1" } },
      { tipo: "eliminarEvento", partidoId: "partido-2", eventoId: "e" },
      { tipo: "establecerModoOffline", partidoId: "partido-2", activo: true },
      { tipo: "descartarEventoOffline", partidoId: "partido-2", eventoId: "e" },
      { tipo: "alternarCronometro", partidoId: "partido-2" },
      { tipo: "cerrarActa", partidoId: "partido-2" },
      { tipo: "establecerConfirmacion", partidoId: "partido-2", lado: "visitante", confirmado: true },
      { tipo: "alternarTitular", partidoId: "partido-2", lado: "visitante", jugadorId: "jugador-25" },
    ]) {
      expect(s.d(accion as never).motivo).toBe(SIN_PERMISO);
    }
  });
});
