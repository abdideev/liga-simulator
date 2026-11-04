// Legal compliance (Entregable 8): acceptances, constancias, plan cancellation,
// ARCO requests and the minor's public-name consent.

import { describe, expect, it } from "vitest";

import { AVISO_PRIVACIDAD, CASILLAS, CONDICIONES_LICENCIA, DOCUMENTOS, TERMINOS_USO, textoCanonico } from "../legal/documentos";
import { describirDispositivo, huellaCorta, sha256Hex } from "../legal/huella";
import {
  correoDe,
  diasHabilesEntre,
  finDeTemporada,
  nombrePublicable,
  resumenPlan,
  siguienteFolioArco,
  siguienteFolioConstancia,
  sumarDiasHabiles,
  usuarioActual,
  yaAceptoTerminos,
} from "../legal/reglas";
import type { ConstanciaAceptacion } from "../types";
import { expectOk, semilla, simulador } from "./helpers";

const SIN_PERMISO = "Tu rol no tiene permiso para realizar esta acción";

function aceptacion(over: object = {}) {
  return {
    usuario: "admin",
    nombre: "Mariana Ortiz Lara",
    correo: "enlace.liga@correo-ejemplo.mx",
    rol: "administrador" as const,
    versionTerminos: "1.0",
    huellaTerminos: "a".repeat(64),
    versionAviso: "1.0",
    huellaAviso: "b".repeat(64),
    casillas: [CASILLAS.terminos, CASILLAS.avisoLeido],
    dispositivo: "Chrome · Linux",
    ...over,
  };
}

function constancia(over: Partial<ConstanciaAceptacion> = {}): ConstanciaAceptacion {
  return {
    folio: "ACE-2026-000001",
    documento: CONDICIONES_LICENCIA.titulo,
    version: "1.0",
    huellaTexto: "c".repeat(64),
    cliente: "Municipio",
    representante: "Mariana Ortiz Lara",
    cargo: "Enlace",
    correo: "enlace.liga@correo-ejemplo.mx",
    casillas: [CASILLAS.condiciones, CASILLAS.facultades("Municipio")],
    codigoEnviadoEl: "2026-11-04T18:00:00.000Z",
    codigoConfirmadoEl: "2026-11-04T18:01:00.000Z",
    recibidaEl: "2026-11-04T18:01:01.000Z",
    ip: "No disponible",
    dispositivo: "Chrome · Linux",
    versionAviso: "1.0",
    huellaConstancia: "d".repeat(64),
    ...over,
  };
}

describe("documentos y huellas", () => {
  it("SHA-256 coincide con el vector de prueba estándar", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("cualquier cambio en el texto cambia la huella", async () => {
    const original = textoCanonico(TERMINOS_USO);
    const alterado = original.replace("personal e intransferible", "personal y transferible");
    expect(alterado).not.toBe(original);
    expect(await sha256Hex(alterado)).not.toBe(await sha256Hex(original));
  });
  it("cada documento tiene versión y texto canónico con secciones, listas y tablas", () => {
    for (const doc of Object.values(DOCUMENTOS)) {
      expect(doc.version).toMatch(/^\d+\.\d+$/);
      expect(textoCanonico(doc)).toContain(doc.titulo);
    }
    expect(textoCanonico(AVISO_PRIVACIDAD)).toContain("Categoría | Datos | De quién");
    expect(CASILLAS.facultades("Liga X")).toContain("Liga X");
    expect(huellaCorta("0123456789abcdef")).toBe("012345…cdef");
    expect(huellaCorta("")).toBe("calculando…");
  });
  it("describe el dispositivo sin exponer el user agent completo", () => {
    const original = globalThis.navigator;
    const casos: [string, string][] = [
      ["Mozilla/5.0 (Windows NT 10.0) Chrome/150 Safari/537", "Chrome · Windows"],
      ["Mozilla/5.0 (Linux; Android 14) Chrome/150 Mobile Safari/537", "Chrome · Android"],
      ["Mozilla/5.0 (iPhone; CPU iPhone OS 18) Version/18 Safari/605", "Safari · iOS"],
      ["Mozilla/5.0 (Macintosh; Mac OS X 14) Firefox/140", "Firefox · macOS"],
      ["Mozilla/5.0 (X11; Linux) Edg/150", "Edge · Linux"],
      ["Bot/1.0", "Navegador · otro sistema"],
    ];
    for (const [ua, esperado] of casos) {
      Object.defineProperty(globalThis, "navigator", { value: { userAgent: ua }, configurable: true });
      expect(describirDispositivo()).toBe(esperado);
    }
    Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
    expect(describirDispositivo()).toBe("Desconocido");
    Object.defineProperty(globalThis, "navigator", { value: original, configurable: true });
  });
});

describe("usuarios y registro inicial (Capa 3)", () => {
  it("identifica al usuario del rol simulado", () => {
    const e = semilla();
    expect(usuarioActual(e)).toMatchObject({ clave: "admin", nombre: "Mariana Ortiz Lara" });
    expect(usuarioActual({ ...e, rolActual: "delegado" })).toMatchObject({
      clave: "delegado:equipo-1",
      correo: "javier.hernandez@correo-ejemplo.mx",
      cargo: "Delegado de Real Tulancingo FC",
    });
    expect(usuarioActual({ ...e, rolActual: "delegado", equipoDelegadoId: "x" })).toBeNull();
    expect(usuarioActual({ ...e, rolActual: "publico" })).toBeNull();
    expect(correoDe("Ángel Núñez Peña")).toBe("angel.nunez@correo-ejemplo.mx");
  });
  it("registra la aceptación con versión, huellas y casillas", () => {
    const s = simulador();
    expect(yaAceptoTerminos(s.estado, "admin", "1.0")).toBe(false);
    expect(s.d({ tipo: "aceptarTerminos", aceptacion: aceptacion({ casillas: [CASILLAS.terminos] }) }).motivo).toBe(
      "Debes aceptar los Términos de uso y confirmar que leíste el aviso"
    );
    expect(s.d({ tipo: "aceptarTerminos", aceptacion: aceptacion({ correo: "sin-arroba" }) }).motivo).toBe("Escribe un correo válido");
    expect(s.d({ tipo: "aceptarTerminos", aceptacion: aceptacion({ nombre: " " }) }).motivo).toBe("Nombre y correo son obligatorios");
    expect(s.d({ tipo: "aceptarTerminos", aceptacion: aceptacion({ huellaAviso: "" }) }).motivo).toMatch(/huella/);
    expectOk(s.d({ tipo: "aceptarTerminos", aceptacion: aceptacion() }));
    expect(yaAceptoTerminos(s.estado, "admin", "1.0")).toBe(true);
    expect(yaAceptoTerminos(s.estado, "admin", "2.0")).toBe(false);
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Aceptación de Términos de uso v1.0");
    s.d({ tipo: "cambiarRol", rol: "publico" });
    expect(s.d({ tipo: "aceptarTerminos", aceptacion: aceptacion() }).motivo).toBe(SIN_PERMISO);
  });
});

describe("Condiciones de Uso y Licencia y constancia (Capa 2)", () => {
  it("la constancia activa la licencia; el folio no se repite", () => {
    const s = simulador();
    expect(siguienteFolioConstancia(s.estado, 2026)).toBe("ACE-2026-000001");
    expect(s.d({ tipo: "registrarConstancia", constancia: constancia({ casillas: [] }) }).motivo).toBe("Faltan casillas por aceptar");
    expect(s.d({ tipo: "registrarConstancia", constancia: constancia({ huellaConstancia: "" }) }).motivo).toBe("Falta la huella digital");
    expectOk(s.d({ tipo: "registrarConstancia", constancia: constancia() }));
    expect(s.estado.legal.licencia).toMatchObject({ estado: "activa", folioConstanciaVigente: "ACE-2026-000001" });
    expect(s.d({ tipo: "registrarConstancia", constancia: constancia() }).motivo).toBe("El folio ya existe");
    expect(siguienteFolioConstancia(s.estado, 2026)).toBe("ACE-2026-000002");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "registrarConstancia", constancia: constancia({ folio: "x" }) }).motivo).toBe(SIN_PERMISO);
  });
});

describe("plan y cancelación (cláusulas 16 y 17)", () => {
  it("calcula el costo de la temporada y el fin de temporada", () => {
    const e = semilla();
    expect(resumenPlan(e)).toEqual({ equipos: 6, subtotal: 3000, iva: 480, total: 3480 });
    expect(finDeTemporada(e)).toBe("2026-11-18");
    expect(finDeTemporada({ ...e, partidos: [] })).toBeNull();
  });
  it("solo cancela un plan activo, con motivo; es reversible y queda en bitácora", () => {
    const s = simulador();
    expect(s.d({ tipo: "cancelarPlan", motivo: "costo", efectivaEl: "2026-11-18" }).motivo).toBe("Solo se puede cancelar un plan activo");
    expectOk(s.d({ tipo: "registrarConstancia", constancia: constancia() }));
    expect(s.d({ tipo: "cancelarPlan", motivo: "otro", detalle: " ", efectivaEl: "2026-11-18" }).motivo).toBe("Describe el motivo");
    expect(s.d({ tipo: "cancelarPlan", motivo: "costo", efectivaEl: "" }).motivo).toMatch(/fin de temporada/);
    expect(s.d({ tipo: "revertirCancelacionPlan" }).motivo).toBe("No hay una cancelación programada");
    expectOk(s.d({ tipo: "cancelarPlan", motivo: "otro_sistema", efectivaEl: "2026-11-18" }));
    expect(s.estado.legal.licencia).toMatchObject({ estado: "cancelacion_programada", cancelacion: { efectivaEl: "2026-11-18", solicitadaPor: "Mariana Ortiz Lara" } });
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Cancelación del plan (aviso de no renovación)");
    expectOk(s.d({ tipo: "registrarDescargaDatos", formato: "JSON" }));
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Exportación de los datos de la liga");
    expectOk(s.d({ tipo: "revertirCancelacionPlan" }));
    expect(s.estado.legal.licencia.estado).toBe("activa");
    expect(s.estado.legal.licencia.cancelacion).toBeUndefined();
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "cancelarPlan", motivo: "costo", efectivaEl: "2026-11-18" }).motivo).toBe(SIN_PERMISO);
    expect(s.d({ tipo: "revertirCancelacionPlan" }).motivo).toBe(SIN_PERMISO);
    expect(s.d({ tipo: "registrarDescargaDatos", formato: "JSON" }).motivo).toBe(SIN_PERMISO);
  });
});

describe("derechos ARCO (RF-21)", () => {
  it("días hábiles: salta fines de semana", () => {
    expect(sumarDiasHabiles("2026-11-06", 1)).toBe("2026-11-09");
    expect(sumarDiasHabiles("2026-11-04", 20)).toBe("2026-12-02");
    expect(diasHabilesEntre("2026-11-04", "2026-12-02")).toBe(20);
    expect(diasHabilesEntre("2026-12-02", "2026-11-04")).toBe(-20);
    expect(diasHabilesEntre("2026-11-04", "2026-11-04")).toBe(0);
  });
  it("crea folio, plazo de 20 días hábiles y lo turna el administrador", () => {
    const s = simulador();
    const solicitud = { tipo: "acceso" as const, descripcion: "Quiero una copia de mis datos", medio: "a@b.mx", usuario: "admin", nombre: "Mariana" };
    expect(s.d({ tipo: "crearSolicitudArco", solicitud: { ...solicitud, descripcion: "corta" } }).motivo).toBe("Describe tu solicitud (al menos 10 caracteres)");
    expect(s.d({ tipo: "crearSolicitudArco", solicitud: { ...solicitud, medio: "x" } }).motivo).toBe("Escribe un correo válido para recibir la respuesta");
    expect(siguienteFolioArco(s.estado, 2026)).toBe("ARCO-2026-0001");
    expectOk(s.d({ tipo: "crearSolicitudArco", solicitud }));
    expect(s.estado.legal.solicitudesArco[0]).toMatchObject({ folio: "ARCO-2026-0001", venceEl: "2026-12-02", turnarAntesDe: "2026-11-06", estado: "recibida" });
    expect(s.d({ tipo: "turnarSolicitudArco", folio: "nada" }).motivo).toBe("Solicitud no encontrada");
    expectOk(s.d({ tipo: "turnarSolicitudArco", folio: "ARCO-2026-0001" }));
    expect(s.estado.legal.solicitudesArco[0].estado).toBe("turnada");
    expect(s.d({ tipo: "turnarSolicitudArco", folio: "ARCO-2026-0001" }).motivo).toBe("La solicitud ya fue turnada");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "turnarSolicitudArco", folio: "ARCO-2026-0001" }).motivo).toBe(SIN_PERMISO);
    expectOk(s.d({ tipo: "crearSolicitudArco", solicitud: { ...solicitud, usuario: "delegado:equipo-1" } }));
    s.d({ tipo: "cambiarRol", rol: "publico" });
    expect(s.d({ tipo: "crearSolicitudArco", solicitud }).motivo).toBe(SIN_PERMISO);
  });
});

describe("consentimiento 2 del tutor: nombre público (LEG-03, LEG-04)", () => {
  it("un menor sin consentimiento 2 se publica solo con su dorsal", () => {
    expect(nombrePublicable(true, false)).toBe(false);
    expect(nombrePublicable(true, undefined)).toBe(false);
    expect(nombrePublicable(true, true)).toBe(true);
    expect(nombrePublicable(false, undefined)).toBe(true);
  });
  it("otorgar y revocar queda en bitácora; solo para menores y por quien ve el plantel", () => {
    const s = simulador();
    expectOk(s.d({ tipo: "cambiarPublicacionNombre", jugadorId: "jugador-49", publicar: true }));
    expect(s.estado.jugadores.find((j) => j.id === "jugador-49")?.tutor?.publicarNombre).toBe(true);
    expectOk(s.d({ tipo: "cambiarPublicacionNombre", jugadorId: "jugador-49", publicar: false }));
    expect(s.estado.bitacora.at(-1)?.accion).toBe("Consentimiento 2 revocado (solo dorsal)");
    expect(s.d({ tipo: "cambiarPublicacionNombre", jugadorId: "jugador-1", publicar: true }).motivo).toBe("Solo aplica a jugadores menores de edad");
    expect(s.d({ tipo: "cambiarPublicacionNombre", jugadorId: "x", publicar: true }).motivo).toBe("Jugador no encontrado");
    s.d({ tipo: "cambiarRol", rol: "delegado" });
    expect(s.d({ tipo: "cambiarPublicacionNombre", jugadorId: "jugador-49", publicar: true }).motivo).toBe(SIN_PERMISO);
  });
});
