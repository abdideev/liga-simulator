// Seed data for the Liga Simulator prototype. Everything here is fictional
// and generated deterministically so "Reiniciar simulación" always restores
// the exact same starting point.

import { generarCalendarioRoundRobin } from "./calendario";
import type {
  BitacoraEntry,
  Categoria,
  Equipo,
  Jugador,
  Liga,
  Partido,
  SimuladorState,
  Temporada,
} from "./types";
import { calcularElegibilidad, esMenorDeEdad } from "./rules";

const NOMBRES = [
  "José Luis", "Carlos", "Miguel Ángel", "Juan Pablo", "Alejandro",
  "Francisco", "Jesús", "Antonio", "Manuel", "Ricardo",
  "Fernando", "Roberto", "Eduardo", "Daniel", "Jorge",
  "Iván", "Diego", "Emiliano", "Santiago", "Mateo",
  "Sebastián", "Ángel", "Rodrigo", "Gael", "Leonardo",
  "Axel", "Kevin", "Brandon", "Uriel", "Josué",
  "Omar", "Erick", "Christian", "Luis Fernando", "Adrián",
];

const APELLIDOS = [
  "Hernández", "García", "Martínez", "López", "González",
  "Pérez", "Sánchez", "Ramírez", "Torres", "Flores",
  "Rivera", "Gómez", "Díaz", "Cruz", "Morales",
  "Reyes", "Jiménez", "Ortiz", "Gutiérrez", "Chávez",
  "Ramos", "Vargas", "Castillo", "Mendoza", "Aguilar",
  "Vázquez", "Contreras", "Silva", "Delgado", "Guerrero",
  "Medina", "Herrera", "Núñez", "Estrada", "Salazar",
  "Peña", "Rojas", "Cabrera", "Cervantes", "Islas",
];

const NOMBRES_TUTORES = [
  "María Elena", "Rosa Isela", "Guadalupe", "Patricia", "Leticia",
  "Verónica", "Alberto", "Raúl", "Gerardo", "Martín",
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function consonanteValida(letra: string | undefined): string {
  const permitidas = "BCDFGHJKLMNPQRSTVWXYZ";
  const upper = (letra ?? "X").toUpperCase();
  return permitidas.includes(upper) ? upper : "X";
}

/** Strips accents, matching how the real CURP algorithm normalizes names. */
function quitarAcentos(texto: string): string {
  const normalizado = texto.normalize("NFD");
  let resultado = "";
  for (const caracter of normalizado) {
    const codigo = caracter.codePointAt(0) ?? 0;
    const esMarcaCombinada = codigo >= 0x0300 && codigo <= 0x036f;
    if (!esMarcaCombinada) resultado += caracter;
  }
  return resultado;
}

/**
 * Builds a CURP that is structurally valid against our regex and consistent
 * with the given birth date. This is NOT the real CURP algorithm (no true
 * homoclave / verification digit) — it only needs to satisfy structural
 * validation for the prototype, matching the product's stated scope.
 */
function construirCurp(
  paternoConAcentos: string,
  maternoConAcentos: string,
  nombreConAcentos: string,
  fechaNacimiento: string,
  sexo: "H" | "M"
): string {
  const paterno = quitarAcentos(paternoConAcentos);
  const materno = quitarAcentos(maternoConAcentos);
  const nombre = quitarAcentos(nombreConAcentos);
  const fecha = new Date(`${fechaNacimiento}T00:00:00`);
  const yy = fecha.getFullYear().toString().slice(-2);
  const mm = pad2(fecha.getMonth() + 1);
  const dd = pad2(fecha.getDate());
  const vocalMatch = paterno.slice(1).match(/[aeiouAEIOU]/);
  const vocal = vocalMatch ? vocalMatch[0].toUpperCase() : "X";
  const c1 = consonanteValida(paterno[1]);
  const c2 = consonanteValida(materno[1]);
  const c3 = consonanteValida(nombre[1]);
  const diferenciador = fecha.getFullYear() >= 2000 ? "A" : "0";
  const digitoVerificador = ((mm.charCodeAt(0) + dd.charCodeAt(0)) % 10).toString();
  return (
    `${paterno[0]}${vocal}${materno[0]}${nombre[0]}${yy}${mm}${dd}${sexo}HG` +
    `${c1}${c2}${c3}${diferenciador}${digitoVerificador}`
  ).toUpperCase();
}

interface EspecificacionJugador {
  nombreCompleto: string;
  fechaNacimiento: string;
  curp: string;
  numero: number;
}

function generarEspecificacionesJugadores(
  cantidad: number,
  aniosDisponibles: number[],
  semilla: number
): EspecificacionJugador[] {
  const resultado: EspecificacionJugador[] = [];
  for (let i = 0; i < cantidad; i++) {
    const indice = semilla * 7 + i;
    const nombre = NOMBRES[indice % NOMBRES.length];
    const paterno = APELLIDOS[(indice * 3 + 1) % APELLIDOS.length];
    const materno = APELLIDOS[(indice * 5 + 7) % APELLIDOS.length];
    const anio = aniosDisponibles[i % aniosDisponibles.length];
    const mes = 1 + ((indice * 3) % 12);
    const dia = 1 + ((indice * 11) % 27);
    const fechaNacimiento = `${anio}-${pad2(mes)}-${pad2(dia)}`;
    const curp = construirCurp(paterno, materno, nombre, fechaNacimiento, "H");
    resultado.push({
      nombreCompleto: `${nombre} ${paterno} ${materno}`,
      fechaNacimiento,
      curp,
      numero: i + 1,
    });
  }
  return resultado;
}

interface FabricaIds {
  liga: () => string;
  temporada: () => string;
  categoria: () => string;
  equipo: () => string;
  jugador: () => string;
  partido: () => string;
  evento: () => string;
  bitacora: () => string;
}

function crearFabricaIds(): FabricaIds {
  const contadores: Record<string, number> = {};
  const fabrica =
    (prefijo: string) =>
    (): string => {
      contadores[prefijo] = (contadores[prefijo] ?? 0) + 1;
      return `${prefijo}-${contadores[prefijo]}`;
    };
  return {
    liga: fabrica("liga"),
    temporada: fabrica("temp"),
    categoria: fabrica("cat"),
    equipo: fabrica("equipo"),
    jugador: fabrica("jugador"),
    partido: fabrica("partido"),
    evento: fabrica("evento"),
    bitacora: fabrica("bitacora"),
  };
}

function crearJugador(
  ids: FabricaIds,
  equipoId: string,
  categoria: Categoria,
  spec: EspecificacionJugador,
  opciones?: { curpForzada?: string; tutorForzado?: { nombre: string; consentimiento: boolean } }
): Jugador {
  const curp = opciones?.curpForzada ?? spec.curp;
  const { estado, motivoRevision } = calcularElegibilidad(spec.fechaNacimiento, curp, categoria);
  const esMenor = esMenorDeEdad(spec.fechaNacimiento);

  return {
    id: ids.jugador(),
    equipoId,
    nombreCompleto: spec.nombreCompleto,
    fechaNacimiento: spec.fechaNacimiento,
    curp,
    numero: spec.numero,
    estadoElegibilidad: estado,
    motivoRevision,
    esMenorDeEdad: esMenor,
    tutor:
      opciones?.tutorForzado ??
      (esMenor
        ? {
            nombre: `${NOMBRES_TUTORES[spec.numero % NOMBRES_TUTORES.length]} ${
              APELLIDOS[(spec.numero * 2 + 3) % APELLIDOS.length]
            }`,
            consentimiento: true,
          }
        : undefined),
  };
}

function bitacoraSeed(ids: FabricaIds, entradas: Array<Omit<BitacoraEntry, "id">>): BitacoraEntry[] {
  return entradas.map((entrada) => ({ id: ids.bitacora(), ...entrada }));
}

export function crearEstadoInicial(): SimuladorState {
  const ids = crearFabricaIds();

  const liga: Liga = {
    id: ids.liga(),
    nombre: "Liga Municipal de Tlahuelilpan",
    temporadaActivaId: "",
  };

  const temporada: Temporada = {
    id: ids.temporada(),
    ligaId: liga.id,
    nombre: "Temporada Apertura 2026",
  };
  liga.temporadaActivaId = temporada.id;

  const categoriaLibre: Categoria = {
    id: ids.categoria(),
    temporadaId: temporada.id,
    nombre: "Libre",
    anioNacimientoMin: 1970,
    anioNacimientoMax: 2007,
    cupoEquipos: 3,
    limiteJugadoresPorPlantel: 20,
    registroCerrado: false,
  };

  const categoriaJuvenil: Categoria = {
    id: ids.categoria(),
    temporadaId: temporada.id,
    nombre: "Juvenil Sub-17",
    anioNacimientoMin: 2009,
    anioNacimientoMax: 2013,
    cupoEquipos: 3,
    limiteJugadoresPorPlantel: 18,
    registroCerrado: false,
  };

  const categorias: Categoria[] = [categoriaLibre, categoriaJuvenil];

  const equipoRealTlahuelilpan: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaLibre.id,
    nombre: "Real Tlahuelilpan FC",
    delegado: { nombre: "Javier Hernández Soto", telefono: "771 123 4567" },
  };
  const equipoCuauhtemoc: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaLibre.id,
    nombre: "Deportivo Cuauhtémoc",
    delegado: { nombre: "Miguel Ángel Reyes Cruz", telefono: "771 234 5678" },
  };
  const equipoAtleticoMinero: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaLibre.id,
    nombre: "Atlético Minero",
    delegado: { nombre: "Roberto Carlos Mendoza", telefono: "772 345 6789" },
  };
  const equipoHalcones: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaJuvenil.id,
    nombre: "Halcones de Tlahuelilpan",
    delegado: { nombre: "Laura Patricia Gómez", telefono: "771 456 7890" },
  };
  const equipoTigres: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaJuvenil.id,
    nombre: "Tigres del Valle",
    delegado: { nombre: "Fernando Islas Ramírez", telefono: "771 567 8901" },
  };
  const equipoAguilas: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaJuvenil.id,
    nombre: "Águilas Doradas",
    delegado: { nombre: "Sandra Luz Martínez", telefono: "772 678 9012" },
  };

  const equipos: Equipo[] = [
    equipoRealTlahuelilpan,
    equipoCuauhtemoc,
    equipoAtleticoMinero,
    equipoHalcones,
    equipoTigres,
    equipoAguilas,
  ];

  // --- Players: 12 per team -------------------------------------------------
  const aniosLibre = [1988, 1991, 1993, 1995, 1997, 1999, 2000, 2001, 2002, 2003, 2004, 1996];
  const aniosJuvenil = [2009, 2010, 2010, 2011, 2011, 2012, 2012, 2013, 2013, 2010, 2011, 2012];

  const jugadores: Jugador[] = [];

  const equiposLibre: Array<[Equipo, number]> = [
    [equipoRealTlahuelilpan, 1],
    [equipoCuauhtemoc, 2],
    [equipoAtleticoMinero, 3],
  ];
  const rosterPorEquipo = new Map<string, Jugador[]>();

  for (const [equipo, semilla] of equiposLibre) {
    const specs = generarEspecificacionesJugadores(12, aniosLibre, semilla);
    const roster = specs.map((spec) => crearJugador(ids, equipo.id, categoriaLibre, spec));
    rosterPorEquipo.set(equipo.id, roster);
    jugadores.push(...roster);
  }

  const equiposJuvenil: Array<[Equipo, number]> = [
    [equipoHalcones, 4],
    [equipoTigres, 5],
    [equipoAguilas, 6],
  ];
  for (const [equipo, semilla] of equiposJuvenil) {
    const specs = generarEspecificacionesJugadores(12, aniosJuvenil, semilla);
    const roster = specs.map((spec) => crearJugador(ids, equipo.id, categoriaJuvenil, spec));
    rosterPorEquipo.set(equipo.id, roster);
    jugadores.push(...roster);
  }

  // Demonstrate the "Requiere revisión manual" path with a deliberately
  // malformed CURP (too short) on one Atlético Minero player.
  const plantelMinero = rosterPorEquipo.get(equipoAtleticoMinero.id)!;
  const jugadorCurpInvalida = plantelMinero[4];
  jugadorCurpInvalida.curp = jugadorCurpInvalida.curp.slice(0, 16);
  const revisionInvalida = calcularElegibilidad(
    jugadorCurpInvalida.fechaNacimiento,
    jugadorCurpInvalida.curp,
    categoriaLibre
  );
  jugadorCurpInvalida.estadoElegibilidad = revisionInvalida.estado;
  jugadorCurpInvalida.motivoRevision = revisionInvalida.motivoRevision;

  // --- Calendar: single round-robin per category ----------------------------
  const sedes = [
    "Unidad Deportiva Tlahuelilpan",
    "Campo Municipal No. 2",
    "Cancha Ejido La Providencia",
  ];

  const partidosLibre = generarCalendarioRoundRobin({
    categoriaId: categoriaLibre.id,
    equipoIds: [equipoRealTlahuelilpan.id, equipoCuauhtemoc.id, equipoAtleticoMinero.id],
    fechaInicio: "2026-08-06",
    diasEntreJornadas: 14,
    horaDefault: "17:00",
    sedes,
    crearId: ids.partido,
  });

  const partidosJuvenil = generarCalendarioRoundRobin({
    categoriaId: categoriaJuvenil.id,
    equipoIds: [equipoHalcones.id, equipoTigres.id, equipoAguilas.id],
    fechaInicio: "2026-08-06",
    diasEntreJornadas: 14,
    horaDefault: "11:00",
    sedes,
    crearId: ids.partido,
  });

  const partidos: Partido[] = [...partidosLibre, ...partidosJuvenil];

  // --- Finalize jornada 1 of each category so standings aren't empty --------
  const jornada1Libre = partidos.find(
    (p) => p.categoriaId === categoriaLibre.id && p.jornada === 1
  )!;
  const localesLibre = rosterPorEquipo.get(jornada1Libre.equipoLocalId)!;
  const visitantesLibre = rosterPorEquipo.get(jornada1Libre.equipoVisitanteId)!;

  jornada1Libre.estado = "finalizado";
  jornada1Libre.convocadosLocal = localesLibre.slice(0, 11).map((j) => j.id);
  jornada1Libre.convocadosVisitante = visitantesLibre.slice(0, 11).map((j) => j.id);
  jornada1Libre.eventos = [
    {
      id: ids.evento(),
      partidoId: jornada1Libre.id,
      minuto: 12,
      tipo: "gol",
      equipoId: jornada1Libre.equipoLocalId,
      jugadorId: localesLibre[8].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Libre.id,
      minuto: 34,
      tipo: "tarjeta_amarilla",
      equipoId: jornada1Libre.equipoVisitanteId,
      jugadorId: visitantesLibre[3].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Libre.id,
      minuto: 45,
      tipo: "gol",
      equipoId: jornada1Libre.equipoLocalId,
      jugadorId: localesLibre[9].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Libre.id,
      minuto: 58,
      tipo: "gol",
      equipoId: jornada1Libre.equipoVisitanteId,
      jugadorId: visitantesLibre[8].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Libre.id,
      minuto: 70,
      tipo: "tarjeta_amarilla",
      equipoId: jornada1Libre.equipoLocalId,
      jugadorId: localesLibre[2].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Libre.id,
      minuto: 82,
      tipo: "gol",
      equipoId: jornada1Libre.equipoLocalId,
      jugadorId: localesLibre[10].id,
    },
  ];
  jornada1Libre.golesLocal = 3;
  jornada1Libre.golesVisitante = 1;
  jornada1Libre.actaCerrada = true;
  jornada1Libre.confirmacionDelegadoLocal = true;
  jornada1Libre.confirmacionDelegadoVisitante = true;

  const jornada1Juvenil = partidos.find(
    (p) => p.categoriaId === categoriaJuvenil.id && p.jornada === 1
  )!;
  const localesJuvenil = rosterPorEquipo.get(jornada1Juvenil.equipoLocalId)!;
  const visitantesJuvenil = rosterPorEquipo.get(jornada1Juvenil.equipoVisitanteId)!;

  jornada1Juvenil.estado = "finalizado";
  jornada1Juvenil.convocadosLocal = localesJuvenil.slice(0, 11).map((j) => j.id);
  jornada1Juvenil.convocadosVisitante = visitantesJuvenil.slice(0, 11).map((j) => j.id);
  jornada1Juvenil.eventos = [
    {
      id: ids.evento(),
      partidoId: jornada1Juvenil.id,
      minuto: 8,
      tipo: "gol",
      equipoId: jornada1Juvenil.equipoLocalId,
      jugadorId: localesJuvenil[7].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Juvenil.id,
      minuto: 20,
      tipo: "tarjeta_amarilla",
      equipoId: jornada1Juvenil.equipoVisitanteId,
      jugadorId: visitantesJuvenil[5].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Juvenil.id,
      minuto: 33,
      tipo: "autogol",
      equipoId: jornada1Juvenil.equipoLocalId,
      jugadorId: localesJuvenil[1].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Juvenil.id,
      minuto: 50,
      tipo: "gol",
      equipoId: jornada1Juvenil.equipoVisitanteId,
      jugadorId: visitantesJuvenil[9].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Juvenil.id,
      minuto: 65,
      tipo: "tarjeta_roja",
      equipoId: jornada1Juvenil.equipoLocalId,
      jugadorId: localesJuvenil[4].id,
    },
    {
      id: ids.evento(),
      partidoId: jornada1Juvenil.id,
      minuto: 77,
      tipo: "gol",
      equipoId: jornada1Juvenil.equipoLocalId,
      jugadorId: localesJuvenil[7].id,
    },
  ];
  jornada1Juvenil.golesLocal = 2;
  jornada1Juvenil.golesVisitante = 2;
  jornada1Juvenil.actaCerrada = true;
  jornada1Juvenil.confirmacionDelegadoLocal = true;
  jornada1Juvenil.confirmacionDelegadoVisitante = true;

  // --- Audit trail seed -------------------------------------------------------
  const bitacora = bitacoraSeed(ids, [
    {
      fecha: "2026-07-15T09:00:00.000Z",
      rol: "administrador",
      accion: "Creación de liga y temporada",
      detalle: "Liga Municipal de Tlahuelilpan — Temporada Apertura 2026",
    },
    {
      fecha: "2026-07-16T10:30:00.000Z",
      rol: "administrador",
      accion: "Registro de equipos",
      detalle: "6 equipos registrados en las categorías Libre y Juvenil Sub-17",
    },
    {
      fecha: "2026-07-20T12:00:00.000Z",
      rol: "administrador",
      accion: "Inscripción de jugadores",
      detalle: "72 jugadores inscritos en total",
    },
    {
      fecha: "2026-07-25T15:00:00.000Z",
      rol: "administrador",
      accion: "Generación de calendario",
      detalle: "Calendario round-robin generado para ambas categorías",
    },
    {
      fecha: "2026-08-06T23:10:00.000Z",
      rol: "administrador",
      accion: "Cierre de acta — Jornada 1 (Libre)",
      detalle: `${equipoRealTlahuelilpan.nombre} 3 - 1 ${equipoCuauhtemoc.nombre}`,
    },
    {
      fecha: "2026-08-06T21:40:00.000Z",
      rol: "administrador",
      accion: "Cierre de acta — Jornada 1 (Juvenil Sub-17)",
      detalle: `${equipoHalcones.nombre} 2 - 2 ${equipoTigres.nombre}`,
    },
  ]);

  return {
    liga,
    temporadas: [temporada],
    categorias,
    equipos,
    jugadores,
    partidos,
    bitacora,
    rolActual: "administrador",
  };
}
