// Small pure modules: dates, IDs, permissions, stopwatch, calendar, storage and seed.

import { afterEach, describe, expect, it, vi } from "vitest";

import { generarCalendarioRoundRobin } from "../calendario";
import { fechaHoy, fechaISOLocal, parsearFechaLocal, sumarDiasISO } from "../fechas";
import { crearGeneradorSecuencial, crearIdAleatorio } from "../ids";
import { ajustarMinuto, minutoActual, obtenerMesa, pausarCronometro, reanudarCronometro, ESTADO_MESA_INICIAL } from "../mesa";
import {
  puedeAccederRuta,
  puedeActuarPorEquipo,
  puedeOperarMesa,
  puedeResolverProtesta,
  puedeVerPlantel,
  seccionDeRuta,
} from "../permisos";
import { esMenorDeEdad } from "../rules";
import { cargarEstado, guardarEstado, limpiarEstado, VERSION_ESQUEMA } from "../storage";
import { HOY, semilla } from "./helpers";

describe("fechas e IDs", () => {
  it("usa fecha local, no UTC", () => {
    expect(fechaISOLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(parsearFechaLocal("2026-03-01").getDate()).toBe(1);
    expect(sumarDiasISO("2026-02-27", 2)).toBe("2026-03-01");
    expect(fechaHoy(HOY)).toBe("2026-11-04");
  });
  it("genera IDs secuenciales por prefijo y aleatorios únicos", () => {
    const id = crearGeneradorSecuencial();
    expect([id("a"), id("a"), id("b")]).toEqual(["a-1", "a-2", "b-1"]);
    expect(crearIdAleatorio("x")).not.toBe(crearIdAleatorio("x"));
  });
});

describe("permisos por rol (RNF-09)", () => {
  it("protege cada ruta también por URL directa", () => {
    expect(seccionDeRuta("/equipos/equipo-3")).toBe("/equipos");
    expect(seccionDeRuta("/")).toBe("/");
    expect(puedeAccederRuta("publico", "/equipos/equipo-1")).toBe(false);
    expect(puedeAccederRuta("publico", "/privacidad")).toBe(true);
    expect(puedeAccederRuta("delegado", "/bitacora")).toBe(false);
    expect(puedeAccederRuta("delegado", "/cuenta")).toBe(true);
    expect(puedeAccederRuta("delegado", "/licencia")).toBe(false);
    expect(puedeAccederRuta("publico", "/ruta-inexistente")).toBe(true);
  });
  it("el plantel de menores solo lo ven el administrador y su delegado", () => {
    expect(puedeVerPlantel("administrador", null, "equipo-4")).toBe(true);
    expect(puedeVerPlantel("delegado", "equipo-4", "equipo-4")).toBe(true);
    expect(puedeVerPlantel("delegado", "equipo-1", "equipo-4")).toBe(false);
    expect(puedeVerPlantel("publico", null, "equipo-4")).toBe(false);
    expect(puedeActuarPorEquipo("delegado", "equipo-1", "equipo-1")).toBe(true);
    expect(puedeActuarPorEquipo("publico", null, "equipo-1")).toBe(false);
    expect(puedeOperarMesa("delegado")).toBe(false);
    expect(puedeResolverProtesta("administrador")).toBe(true);
  });
});

describe("cronómetro de la mesa", () => {
  it("corre un minuto por segundo, pausa, reanuda y se limita a 0–130", () => {
    expect(obtenerMesa({}, "p")).toEqual(ESTADO_MESA_INICIAL);
    const corriendo = { ...ESTADO_MESA_INICIAL, cronometroDesde: 0 };
    expect(minutoActual(corriendo, 45_000)).toBe(45);
    expect(minutoActual(corriendo, 999_000)).toBe(130);
    const pausada = pausarCronometro(corriendo, 10_000);
    expect(pausada).toMatchObject({ minutoBase: 10, cronometroDesde: null });
    expect(pausarCronometro(pausada, 50_000)).toEqual(pausada);
    expect(reanudarCronometro(pausada, 20_000).cronometroDesde).toBe(20_000);
    expect(reanudarCronometro(corriendo, 20_000)).toBe(corriendo);
    expect(ajustarMinuto(pausada, -50, 0).minutoBase).toBe(0);
    expect(ajustarMinuto(corriendo, 5, 10_000)).toMatchObject({ minutoBase: 15, cronometroDesde: 10_000 });
  });
});

describe("calendario todos contra todos", () => {
  const base = { categoriaId: "c", fechaInicio: "2026-11-07", diasEntreJornadas: 7, horaDefault: "10:00", sedes: ["A", "B"] };
  it("con número impar de equipos, uno descansa cada jornada y nadie repite rival", () => {
    let n = 0;
    const partidos = generarCalendarioRoundRobin({ ...base, equipoIds: ["1", "2", "3"], crearId: () => `p${++n}` });
    expect(partidos).toHaveLength(3);
    expect(new Set(partidos.map((p) => p.jornada)).size).toBe(3);
    const pares = partidos.map((p) => [p.equipoLocalId, p.equipoVisitanteId].sort().join("-"));
    expect(new Set(pares).size).toBe(3);
    expect(partidos.map((p) => p.fecha)).toEqual(["2026-11-07", "2026-11-14", "2026-11-21"]);
  });
  it("con 4 equipos: 3 jornadas de 2 partidos", () => {
    let n = 0;
    const partidos = generarCalendarioRoundRobin({ ...base, equipoIds: ["1", "2", "3", "4"], crearId: () => `p${++n}`, sedes: [] });
    expect(partidos).toHaveLength(6);
    expect(partidos.every((p) => p.estado === "programado")).toBe(true);
    // DEF-02: sin sedes configuradas, cada partido queda "Sede por definir" (antes: undefined).
    expect(partidos.every((p) => p.sede === "Sede por definir")).toBe(true);
  });
  it("con menos de 2 equipos no genera nada", () => {
    expect(generarCalendarioRoundRobin({ ...base, equipoIds: ["1"], crearId: () => "x" })).toEqual([]);
  });
});

describe("persistencia local", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("sin navegador no lee ni escribe", () => {
    expect(cargarEstado()).toBeNull();
    expect(() => guardarEstado(semilla())).not.toThrow();
    expect(() => limpiarEstado()).not.toThrow();
  });
  it("guarda con versión de esquema y descarta versiones viejas o corruptas", () => {
    const mapa = new Map<string, string>();
    const localStorage = {
      getItem: (k: string) => mapa.get(k) ?? null,
      setItem: (k: string, v: string) => void mapa.set(k, v),
      removeItem: (k: string) => void mapa.delete(k),
    };
    vi.stubGlobal("window", { localStorage });
    const e = semilla();
    guardarEstado(e);
    expect(JSON.parse(mapa.get("liga-simulador:estado")!).version).toBe(VERSION_ESQUEMA);
    expect(cargarEstado()?.liga.nombre).toBe(e.liga.nombre);
    mapa.set("liga-simulador:estado", JSON.stringify({ version: 1, estado: e }));
    expect(cargarEstado()).toBeNull();
    expect(mapa.has("liga-simulador:estado")).toBe(false);
    mapa.set("liga-simulador:estado", "{no es json");
    expect(cargarEstado()).toBeNull();
    limpiarEstado();
    expect(cargarEstado()).toBeNull();
  });
  it("si el almacenamiento falla, no rompe la app", () => {
    const roto = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("lleno"); }, removeItem: () => { throw new Error("x"); } };
    vi.stubGlobal("window", { localStorage: roto });
    expect(cargarEstado()).toBeNull();
    expect(() => guardarEstado(semilla())).not.toThrow();
    expect(() => limpiarEstado()).not.toThrow();
  });
});

describe("datos semilla", () => {
  it("son deterministas y consistentes", () => {
    const a = semilla();
    const b = semilla();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.equipos).toHaveLength(6);
    expect(a.jugadores).toHaveLength(72);
    const menores = a.jugadores.filter((j) => esMenorDeEdad(j.fechaNacimiento, HOY));
    expect(menores.length).toBeGreaterThan(0);
    expect(menores.every((j) => j.tutor?.consentimiento && j.tutor.declaracion)).toBe(true);
    expect(a.jugadores.filter((j) => j.estadoElegibilidad === "Requiere revisión manual").map((j) => j.id)).toEqual(["jugador-29"]);
    expect(a.legal.licencia.estado).toBe("pendiente");
    expect(a.partidos.find((p) => p.id === "partido-2")?.fecha).toBe("2026-11-04");
  });
});
