// Seed data for the Liga Simulator prototype. Everything here is fictional
// and generated deterministically from a reference date: the calendar is
// anchored so that Jornada 1 was played two weeks ago and Jornada 2 is
// scheduled for the reference date ("today" in the running app).

import { generarCalendarioRoundRobin } from "./calendario";
import { fechaISOLocal, sumarDiasISO } from "./fechas";
import { crearGeneradorSecuencial, type CrearId } from "./ids";
import type {
  BitacoraEntry,
  Categoria,
  Equipo,
  EventoPartido,
  Jugador,
  Liga,
  Partido,
  SimuladorState,
  Temporada,
} from "./types";
import { calcularElegibilidad, esMenorDeEdad, estadoEfectivo, recalcularMarcador } from "./rules";

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

function crearFabricaIds(crearId: CrearId) {
  return {
    liga: () => crearId("liga"),
    temporada: () => crearId("temp"),
    categoria: () => crearId("cat"),
    equipo: () => crearId("equipo"),
    jugador: () => crearId("jugador"),
    partido: () => crearId("partido"),
    evento: () => crearId("evento"),
    bitacora: () => crearId("bitacora"),
  };
}

type FabricaIds = ReturnType<typeof crearFabricaIds>;

function crearJugador(
  ids: FabricaIds,
  equipoId: string,
  categoria: Categoria,
  spec: EspecificacionJugador,
  referencia: Date
): Jugador {
  const { estado, motivoRevision } = calcularElegibilidad(spec.fechaNacimiento, spec.curp, categoria);
  const esMenor = esMenorDeEdad(spec.fechaNacimiento, referencia);

  return {
    id: ids.jugador(),
    equipoId,
    nombreCompleto: spec.nombreCompleto,
    fechaNacimiento: spec.fechaNacimiento,
    curp: spec.curp,
    numero: spec.numero,
    estadoElegibilidad: estado,
    motivoRevision,
    tutor: esMenor
      ? {
          nombre: `${NOMBRES_TUTORES[spec.numero % NOMBRES_TUTORES.length]} ${
            APELLIDOS[(spec.numero * 2 + 3) % APELLIDOS.length]
          }`,
          consentimiento: true,
        }
      : undefined,
  };
}

function bitacoraSeed(ids: FabricaIds, entradas: Array<Omit<BitacoraEntry, "id">>): BitacoraEntry[] {
  return entradas.map((entrada) => ({ id: ids.bitacora(), ...entrada }));
}

/** Local datetime (YYYY-MM-DD + HH:mm) as an ISO instant, for seeded audit entries. */
function instante(fechaISO: string, hora: string): string {
  return new Date(`${fechaISO}T${hora}:00`).toISOString();
}

/**
 * Deterministic for a given `referencia` and ID generator: same inputs,
 * same league, players, calendar, results and audit trail.
 */
export function crearEstadoInicial(
  referencia: Date = new Date(),
  crearId: CrearId = crearGeneradorSecuencial()
): SimuladorState {
  const ids = crearFabricaIds(crearId);
  const hoy = fechaISOLocal(referencia);
  const fechaJornada1 = sumarDiasISO(hoy, -14);

  const liga: Liga = {
    id: ids.liga(),
    nombre: "Liga Municipal de Tulancingo",
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

  const equipoRealTulancingo: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaLibre.id,
    nombre: "Real Tulancingo FC",
    delegado: { nombre: "Javier Hernández Soto", telefono: "775 123 4567" },
  };
  const equipoCuauhtemoc: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaLibre.id,
    nombre: "Deportivo Cuauhtémoc",
    delegado: { nombre: "Miguel Ángel Reyes Cruz", telefono: "775 234 5678" },
  };
  const equipoAtleticoMinero: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaLibre.id,
    nombre: "Atlético Minero",
    delegado: { nombre: "Roberto Carlos Mendoza", telefono: "775 345 6789" },
  };
  const equipoHalcones: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaJuvenil.id,
    nombre: "Halcones de Tulancingo",
    delegado: { nombre: "Laura Patricia Gómez", telefono: "775 456 7890" },
  };
  const equipoTigres: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaJuvenil.id,
    nombre: "Tigres del Valle",
    delegado: { nombre: "Fernando Islas Ramírez", telefono: "775 567 8901" },
  };
  const equipoAguilas: Equipo = {
    id: ids.equipo(),
    categoriaId: categoriaJuvenil.id,
    nombre: "Águilas Doradas",
    delegado: { nombre: "Sandra Luz Martínez", telefono: "775 678 9012" },
  };

  const equipos: Equipo[] = [
    equipoRealTulancingo,
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
    [equipoRealTulancingo, 1],
    [equipoCuauhtemoc, 2],
    [equipoAtleticoMinero, 3],
  ];
  const rosterPorEquipo = new Map<string, Jugador[]>();

  for (const [equipo, semilla] of equiposLibre) {
    const specs = generarEspecificacionesJugadores(12, aniosLibre, semilla);
    const roster = specs.map((spec) => crearJugador(ids, equipo.id, categoriaLibre, spec, referencia));
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
    const roster = specs.map((spec) => crearJugador(ids, equipo.id, categoriaJuvenil, spec, referencia));
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
    "Unidad Deportiva Tulancingo",
    "Campo Municipal No. 2",
    "Cancha Ejido La Providencia",
  ];

  const partidosLibre = generarCalendarioRoundRobin({
    categoriaId: categoriaLibre.id,
    equipoIds: [equipoRealTulancingo.id, equipoCuauhtemoc.id, equipoAtleticoMinero.id],
    fechaInicio: fechaJornada1,
    diasEntreJornadas: 14,
    horaDefault: "17:00",
    sedes,
    crearId: ids.partido,
  });

  const partidosJuvenil = generarCalendarioRoundRobin({
    categoriaId: categoriaJuvenil.id,
    equipoIds: [equipoHalcones.id, equipoTigres.id, equipoAguilas.id],
    fechaInicio: fechaJornada1,
    diasEntreJornadas: 14,
    horaDefault: "11:00",
    sedes,
    crearId: ids.partido,
  });

  const partidos: Partido[] = [...partidosLibre, ...partidosJuvenil];

  // --- Finalize jornada 1 of each category so standings aren't empty --------
  // With three teams the round-robin gives jornada 1 to teams 2 and 3 (team 1
  // rests), so every name below is read from the generated match, never assumed.
  const convocarElegibles = (roster: Jugador[]) =>
    roster.filter((j) => estadoEfectivo(j) === "Elegible").slice(0, 11).map((j) => j.id);

  function cerrarJornada1(
    partido: Partido,
    eventos: Array<Omit<EventoPartido, "id" | "partidoId">>
  ): void {
    const convocadosLocal = convocarElegibles(rosterPorEquipo.get(partido.equipoLocalId)!);
    const convocadosVisitante = convocarElegibles(rosterPorEquipo.get(partido.equipoVisitanteId)!);
    partido.estado = "finalizado";
    partido.convocadosLocal = convocadosLocal;
    partido.convocadosVisitante = convocadosVisitante;
    partido.titularesLocal = [...convocadosLocal];
    partido.titularesVisitante = [...convocadosVisitante];
    partido.eventos = eventos.map((e) => ({ ...e, id: ids.evento(), partidoId: partido.id }));
    Object.assign(
      partido,
      recalcularMarcador(partido.eventos, partido.equipoLocalId, partido.equipoVisitanteId)
    );
    partido.actaCerrada = true;
    partido.confirmacionDelegadoLocal = true;
    partido.confirmacionDelegadoVisitante = true;
  }

  const jornada1Libre = partidos.find(
    (p) => p.categoriaId === categoriaLibre.id && p.jornada === 1
  )!;
  const localesLibre = rosterPorEquipo.get(jornada1Libre.equipoLocalId)!;
  const visitantesLibre = rosterPorEquipo.get(jornada1Libre.equipoVisitanteId)!;

  cerrarJornada1(jornada1Libre, [
    { minuto: 12, tipo: "gol", equipoId: jornada1Libre.equipoLocalId, jugadorId: localesLibre[8].id },
    { minuto: 34, tipo: "tarjeta_amarilla", equipoId: jornada1Libre.equipoVisitanteId, jugadorId: visitantesLibre[3].id },
    { minuto: 45, tipo: "gol", equipoId: jornada1Libre.equipoLocalId, jugadorId: localesLibre[9].id },
    { minuto: 58, tipo: "gol", equipoId: jornada1Libre.equipoVisitanteId, jugadorId: visitantesLibre[8].id },
    { minuto: 70, tipo: "tarjeta_amarilla", equipoId: jornada1Libre.equipoLocalId, jugadorId: localesLibre[2].id },
    { minuto: 82, tipo: "gol", equipoId: jornada1Libre.equipoLocalId, jugadorId: localesLibre[10].id },
    // The visiting team plays again in jornada 2 (today), so this player
    // shows up blocked in today's mesa de control.
    { minuto: 88, tipo: "tarjeta_roja", equipoId: jornada1Libre.equipoVisitanteId, jugadorId: visitantesLibre[6].id },
  ]);

  const jornada1Juvenil = partidos.find(
    (p) => p.categoriaId === categoriaJuvenil.id && p.jornada === 1
  )!;
  const localesJuvenil = rosterPorEquipo.get(jornada1Juvenil.equipoLocalId)!;
  const visitantesJuvenil = rosterPorEquipo.get(jornada1Juvenil.equipoVisitanteId)!;

  cerrarJornada1(jornada1Juvenil, [
    { minuto: 8, tipo: "gol", equipoId: jornada1Juvenil.equipoLocalId, jugadorId: localesJuvenil[7].id },
    { minuto: 20, tipo: "tarjeta_amarilla", equipoId: jornada1Juvenil.equipoVisitanteId, jugadorId: visitantesJuvenil[5].id },
    { minuto: 33, tipo: "autogol", equipoId: jornada1Juvenil.equipoLocalId, jugadorId: localesJuvenil[1].id },
    { minuto: 50, tipo: "gol", equipoId: jornada1Juvenil.equipoVisitanteId, jugadorId: visitantesJuvenil[9].id },
    // The local team rests in jornada 2: the suspension must carry over to
    // its next match (jornada 3), not expire with the jornada number.
    { minuto: 65, tipo: "tarjeta_roja", equipoId: jornada1Juvenil.equipoLocalId, jugadorId: localesJuvenil[4].id },
    { minuto: 77, tipo: "gol", equipoId: jornada1Juvenil.equipoLocalId, jugadorId: localesJuvenil[7].id },
  ]);

  // --- Audit trail seed -------------------------------------------------------
  const nombre = (equipoId: string) => equipos.find((e) => e.id === equipoId)!.nombre;
  const resumenActa = (p: Partido) =>
    `${nombre(p.equipoLocalId)} ${p.golesLocal} - ${p.golesVisitante} ${nombre(p.equipoVisitanteId)}`;

  const bitacora = bitacoraSeed(ids, [
    {
      fecha: instante(sumarDiasISO(hoy, -40), "09:00"),
      rol: "administrador",
      accion: "Creación de liga y temporada",
      detalle: `${liga.nombre} — ${temporada.nombre}`,
    },
    {
      fecha: instante(sumarDiasISO(hoy, -38), "10:30"),
      rol: "administrador",
      accion: "Registro de equipos",
      detalle: `${equipos.length} equipos registrados en las categorías ${categoriaLibre.nombre} y ${categoriaJuvenil.nombre}`,
    },
    {
      fecha: instante(sumarDiasISO(hoy, -30), "12:00"),
      rol: "administrador",
      accion: "Inscripción de jugadores",
      detalle: `${jugadores.length} jugadores inscritos en total`,
    },
    {
      fecha: instante(sumarDiasISO(hoy, -21), "15:00"),
      rol: "administrador",
      accion: "Generación de calendario",
      detalle: "Calendario todos contra todos generado para ambas categorías",
    },
    {
      fecha: instante(jornada1Juvenil.fecha, "12:40"),
      rol: "administrador",
      accion: `Cierre de acta — Jornada 1 (${categoriaJuvenil.nombre})`,
      detalle: resumenActa(jornada1Juvenil),
      referencias: { partidoId: jornada1Juvenil.id },
    },
    {
      fecha: instante(jornada1Libre.fecha, "18:50"),
      rol: "administrador",
      accion: `Cierre de acta — Jornada 1 (${categoriaLibre.nombre})`,
      detalle: resumenActa(jornada1Libre),
      referencias: { partidoId: jornada1Libre.id },
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
    equipoDelegadoId: equipos[0].id,
    mesas: {},
  };
}
