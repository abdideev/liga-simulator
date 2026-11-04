import { describe, expect, it } from "vitest";

import {
  AMARILLAS_PARA_SUSPENSION,
  calcularEdad,
  calcularElegibilidad,
  calcularEstadisticasJugadores,
  calcularSuspension,
  calcularTabla,
  esMenorDeEdad,
  estadoEfectivo,
  estadoRegistro,
  ladoFirmoActa,
  participoEnPartido,
  puedeSerConvocado,
  recalcularMarcador,
  tieneProtesta,
  validarEstructuraCurp,
  validarNumeroPlayera,
} from "../rules";
import type { Categoria, EventoPartido, Jugador, Partido } from "../types";
import { ADULTO, MENOR, semilla } from "./helpers";

const JUVENIL = { anioNacimientoMin: 2009, anioNacimientoMax: 2013 };

function partidoBase(over: Partial<Partido> = {}): Partido {
  return {
    id: "p",
    categoriaId: "c",
    jornada: 1,
    equipoLocalId: "A",
    equipoVisitanteId: "B",
    fecha: "2026-01-01",
    hora: "10:00",
    sede: "Unidad",
    estado: "finalizado",
    convocadosLocal: [],
    convocadosVisitante: [],
    titularesLocal: [],
    titularesVisitante: [],
    eventos: [],
    golesLocal: 0,
    golesVisitante: 0,
    actaCerrada: true,
    confirmacionDelegadoLocal: false,
    confirmacionDelegadoVisitante: false,
    ...over,
  };
}

function ev(tipo: EventoPartido["tipo"], equipoId: string, jugadorId?: string): EventoPartido {
  return { id: `${tipo}-${jugadorId}`, partidoId: "p", minuto: 10, tipo, equipoId, jugadorId };
}

describe("validarEstructuraCurp", () => {
  it("acepta una CURP bien formada y consistente con la fecha", () => {
    expect(validarEstructuraCurp(MENOR.curp, MENOR.fechaNacimiento)).toEqual({ valida: true });
  });
  it.each([
    ["", "2011-05-05", "CURP no capturada"],
    ["HEGL110505HHGRRSA", "2011-05-05", "La CURP debe tener 18 caracteres"],
    ["1EGL110505HHGRRSA1", "2011-05-05", "El formato de la CURP no es válido"],
    ["HEGL110505HHGRRSA1", "fecha-mala", "Fecha de nacimiento inválida"],
    ["HEGL110505HHGRRSA1", "2011-05-06", "La fecha dentro de la CURP no coincide con la fecha de nacimiento"],
  ])("rechaza %s / %s", (curp, fecha, motivo) => {
    expect(validarEstructuraCurp(curp, fecha)).toEqual({ valida: false, motivo });
  });
  it("normaliza minúsculas y espacios", () => {
    expect(validarEstructuraCurp(`  ${MENOR.curp.toLowerCase()} `, MENOR.fechaNacimiento).valida).toBe(true);
  });
});

describe("edad y minoría de edad", () => {
  const ref = new Date("2029-05-05T12:00:00");
  it("cumple 18 exactamente el día de su cumpleaños", () => {
    expect(calcularEdad("2011-05-05", ref)).toBe(18);
    expect(esMenorDeEdad("2011-05-05", ref)).toBe(false);
  });
  it("un día antes sigue siendo menor", () => {
    const antes = new Date("2029-05-04T12:00:00");
    expect(calcularEdad("2011-05-05", antes)).toBe(17);
    expect(esMenorDeEdad("2011-05-05", antes)).toBe(true);
  });
});

describe("calcularElegibilidad (RF-08, RF-09)", () => {
  it("elegible dentro del rango de años", () => {
    expect(calcularElegibilidad(MENOR.fechaNacimiento, MENOR.curp, JUVENIL)).toEqual({ estado: "Elegible" });
  });
  it("no elegible fuera del rango", () => {
    expect(calcularElegibilidad(ADULTO.fechaNacimiento, ADULTO.curp, JUVENIL).estado).toBe("No elegible por edad");
    expect(calcularElegibilidad("2014-01-01", "HEGL140101HHGRRSA1", JUVENIL).estado).toBe("No elegible por edad");
  });
  it("una CURP inconsistente nunca rechaza: manda a revisión manual", () => {
    const r = calcularElegibilidad("2011-05-05", "HEGL110505HHGRRSA", JUVENIL);
    expect(r.estado).toBe("Requiere revisión manual");
    expect(r.motivoRevision).toBe("La CURP debe tener 18 caracteres");
  });
  it("la anulación del administrador prevalece en el estado efectivo", () => {
    const j = { estadoElegibilidad: "Requiere revisión manual", overrideAdmin: { elegibleForzado: true, motivo: "x", fecha: "" } } as Jugador;
    expect(estadoEfectivo(j)).toBe("Elegible");
    expect(estadoEfectivo({ ...j, overrideAdmin: undefined })).toBe("Requiere revisión manual");
  });
});

describe("validarNumeroPlayera", () => {
  const plantel = [{ id: "j1", numero: 7, nombreCompleto: "Siete" }] as Jugador[];
  it("es opcional", () => expect(validarNumeroPlayera(undefined, plantel).ok).toBe(true));
  it.each([0, 100, 2.5])("rechaza %s fuera de 1–99", (n) => expect(validarNumeroPlayera(n, plantel).ok).toBe(false));
  it("no permite repetir en el plantel, salvo el propio jugador", () => {
    expect(validarNumeroPlayera(7, plantel)).toEqual({ ok: false, motivo: "El número 7 ya lo usa Siete" });
    expect(validarNumeroPlayera(7, plantel, "j1").ok).toBe(true);
  });
});

describe("estadoRegistro (RF-10)", () => {
  const cat = { registroCerrado: false } as Categoria;
  it("abierto, cerrado y ventana extemporánea con límites inclusivos", () => {
    expect(estadoRegistro(cat, "2026-11-04")).toBe("abierto");
    const cerrada = { ...cat, registroCerrado: true };
    expect(estadoRegistro(cerrada, "2026-11-04")).toBe("cerrado");
    const ventana = { ...cerrada, ventanaExtemporanea: { abiertaEl: "2026-11-01", hasta: "2026-11-04", motivo: "m" } };
    expect(estadoRegistro(ventana, "2026-11-04")).toBe("extemporaneo");
    expect(estadoRegistro(ventana, "2026-11-05")).toBe("cerrado");
    expect(estadoRegistro(ventana, "2026-10-31")).toBe("cerrado");
  });
});

describe("marcador y acta", () => {
  it("un autogol cuenta para el rival", () => {
    const eventos = [ev("gol", "A"), ev("autogol", "A"), ev("autogol", "B"), ev("gol", "B"), ev("gol", "X")];
    expect(recalcularMarcador(eventos, "A", "B")).toEqual({ golesLocal: 2, golesVisitante: 2 });
  });
  it("un lado firma con confirmación o con protesta", () => {
    const p = partidoBase();
    expect(ladoFirmoActa(p, "local")).toBe(false);
    expect(ladoFirmoActa({ ...p, confirmacionDelegadoLocal: true }, "local")).toBe(true);
    const conProtesta = { ...p, protestaVisitante: { motivo: "m", fecha: "" } };
    expect(ladoFirmoActa(conProtesta, "visitante")).toBe(true);
    expect(tieneProtesta(conProtesta)).toBe(true);
    expect(tieneProtesta(p)).toBe(false);
  });
});

describe("calcularTabla (RF-16, RF-02)", () => {
  it("ordena por puntos, diferencia, goles a favor y resultado directo", () => {
    const partidos = [
      partidoBase({ id: "1", equipoLocalId: "A", equipoVisitanteId: "B", golesLocal: 1, golesVisitante: 0, categoriaId: "c" }),
      partidoBase({ id: "2", equipoLocalId: "B", equipoVisitanteId: "C", golesLocal: 1, golesVisitante: 0, categoriaId: "c" }),
      partidoBase({ id: "3", equipoLocalId: "C", equipoVisitanteId: "A", golesLocal: 1, golesVisitante: 0, categoriaId: "c" }),
      partidoBase({ id: "4", equipoLocalId: "D", equipoVisitanteId: "E", golesLocal: 2, golesVisitante: 2, categoriaId: "c" }),
      partidoBase({ id: "5", equipoLocalId: "A", equipoVisitanteId: "B", estado: "programado", golesLocal: 9, categoriaId: "c" }),
      partidoBase({ id: "6", equipoLocalId: "A", equipoVisitanteId: "B", golesLocal: 9, categoriaId: "otra" }),
    ];
    const tabla = calcularTabla(["A", "B", "C", "D", "E"], partidos, "c");
    expect(tabla.slice(0, 3).map((t) => t.puntos)).toEqual([3, 3, 3]);
    expect(tabla.find((t) => t.equipoId === "D")).toMatchObject({ puntos: 1, empatados: 1, golesFavor: 2, diferenciaGoles: 0 });
    expect(tabla).toHaveLength(5);
  });
  it("desempata por resultado directo cuando todo lo demás es igual", () => {
    const partidos = [
      partidoBase({ id: "1", equipoLocalId: "A", equipoVisitanteId: "D", golesLocal: 3, golesVisitante: 0 }),
      partidoBase({ id: "2", equipoLocalId: "C", equipoVisitanteId: "E", golesLocal: 2, golesVisitante: 1 }),
      partidoBase({ id: "3", equipoLocalId: "A", equipoVisitanteId: "C", golesLocal: 0, golesVisitante: 1 }),
    ].map((p) => ({ ...p, categoriaId: "c" }));
    // A and C: 3 pts, GF 3, GC 1 → fully tied; C beat A head-to-head.
    const tabla = calcularTabla(["A", "C", "D", "E"], partidos, "c");
    expect(tabla.slice(0, 2).map((t) => t.equipoId)).toEqual(["C", "A"]);
  });
});

describe("suspensiones (RF-18)", () => {
  const roja = (jornada: number, extra: Partial<Partido> = {}) =>
    partidoBase({ id: `r${jornada}`, jornada, eventos: [ev("tarjeta_roja", "A", "j")], ...extra });
  it("la roja suspende el siguiente partido del equipo y se cumple al jugarlo", () => {
    expect(calcularSuspension("j", "A", [roja(1)])).toMatchObject({ suspendido: true, motivo: "Tarjeta roja directa" });
    const cumplida = [roja(1), partidoBase({ id: "x", jornada: 3 })];
    expect(calcularSuspension("j", "A", cumplida).suspendido).toBe(false);
  });
  it("un descanso del equipo no cuenta como partido cumplido", () => {
    const otroEquipo = partidoBase({ id: "bye", jornada: 2, equipoLocalId: "C", equipoVisitanteId: "D" });
    expect(calcularSuspension("j", "A", [roja(1), otroEquipo]).suspendido).toBe(true);
  });
  it(`${AMARILLAS_PARA_SUSPENSION} amarillas acumuladas suspenden`, () => {
    const partidos = [1, 2, 3, 4, 5].map((n) =>
      partidoBase({ id: `a${n}`, jornada: n, eventos: [ev("tarjeta_amarilla", "A", "j")] })
    );
    expect(calcularSuspension("j", "A", partidos)).toMatchObject({ suspendido: true, motivo: "Acumulación de 5 tarjetas amarillas" });
    expect(calcularSuspension("j", "A", partidos.slice(0, 4)).suspendido).toBe(false);
  });
  it("puedeSerConvocado bloquea suspendidos y no elegibles con su motivo", () => {
    const j = { id: "j", equipoId: "A", estadoElegibilidad: "Elegible" } as Jugador;
    const siguiente = partidoBase({ id: "n", jornada: 2, estado: "programado" });
    expect(puedeSerConvocado(j, siguiente, [roja(1), siguiente])).toEqual({ ok: false, motivo: "Suspendido — Tarjeta roja directa" });
    expect(puedeSerConvocado({ ...j, estadoElegibilidad: "No elegible por edad" }, siguiente, [])).toEqual({ ok: false, motivo: "No elegible por edad" });
    expect(puedeSerConvocado(j, siguiente, []).ok).toBe(true);
  });
});

describe("estadísticas de jugadores", () => {
  it("cuenta participación real y solo partidos finalizados", () => {
    const p = partidoBase({
      titularesLocal: ["j"],
      eventos: [ev("gol", "A", "j"), ev("autogol", "A", "j"), ev("tarjeta_amarilla", "A", "j"), { ...ev("sustitucion", "A", "x"), jugadorEntraId: "k" }],
    });
    const pendiente = partidoBase({ id: "q", estado: "programado", titularesLocal: ["j"], eventos: [ev("gol", "A", "j")] });
    expect(participoEnPartido("k", p)).toBe(true);
    expect(participoEnPartido("z", p)).toBe(false);
    const [stats] = calcularEstadisticasJugadores([{ id: "j", equipoId: "A" } as Jugador], [p, pendiente]);
    expect(stats).toMatchObject({ goles: 1, autogoles: 1, tarjetasAmarillas: 1, tarjetasRojas: 0, partidosJugados: 1 });
  });
  it("la semilla tiene a Brandon (Minero #7) y a Alejandro (Tigres #5) suspendidos", () => {
    const e = semilla();
    const suspendidos = calcularEstadisticasJugadores(e.jugadores, e.partidos).filter((s) => s.suspendido);
    expect(suspendidos.map((s) => s.jugadorId).sort()).toEqual(["jugador-31", "jugador-53"]);
  });
});
