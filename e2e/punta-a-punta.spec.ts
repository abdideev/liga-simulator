// Pruebas de punta a punta del Entregable 7 (TC-E2E), automatizadas.
import { expect, test } from "@playwright/test";

import { abrir, cambiarRol, convocar, EQUIPO, registrarEvento } from "./utils";

test.describe("Punta a punta", () => {
  test("TC-E2E-01 · CRÍTICO · jornada completa: del calendario al público", async ({ page }) => {
    await abrir(page, "/calendario");
    await expect(page.getByText("Hoy").first()).toBeVisible();

    await cambiarRol(page, "delegado", EQUIPO.real);
    await abrir(page, "/partidos/partido-2");
    await convocar(page, "local");
    await expect(page.getByTestId("convocatoria-visitante").locator('input[type="checkbox"]:not([disabled])')).toHaveCount(0);
    await cambiarRol(page, "delegado", EQUIPO.minero);
    await convocar(page, "visitante");
    await expect(page.getByTestId("convocable-jugador-31")).toHaveAttribute("data-bloqueado", "true");

    await cambiarRol(page, "administrador");
    await page.getByTestId("boton-iniciar-partido").click();
    await page.getByTestId("toggle-modo-offline").click();
    await registrarEvento(page, "gol", "local", 9);
    await registrarEvento(page, "gol", "local", 10);
    await registrarEvento(page, "gol", "visitante", 9);
    await registrarEvento(page, "tarjeta_amarilla", "visitante", 0);
    await page.getByTestId("toggle-modo-offline").click();
    await expect(page.getByTestId("toast")).toContainText("sincronizado(s) correctamente", { timeout: 5000 });

    await cambiarRol(page, "delegado", EQUIPO.real);
    await page.getByTestId("confirmacion-local").check();
    await cambiarRol(page, "delegado", EQUIPO.minero);
    await page.getByTestId("confirmacion-visitante").check();
    await cambiarRol(page, "administrador");
    await page.getByTestId("boton-cerrar-acta").click();
    await expect(page.getByTestId("estado-partido")).toContainText("Finalizado");
    await expect(page.getByTestId("marcador")).toContainText("2");

    await cambiarRol(page, "publico");
    await abrir(page, "/publico");
    await page.getByTestId("pestana-resultados").click();
    await expect(page.getByTestId("vista-publica")).toContainText("Real Tulancingo FC");
    await expect(page.getByTestId("vista-publica")).toContainText("2 - 1");
    for (const ruta of ["/estadisticas", "/equipos/equipo-1"]) {
      await abrir(page, ruta);
      await expect(page.getByTestId("acceso-restringido")).toBeVisible();
    }
    const html = await page.content();
    expect(html).not.toMatch(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/); // ninguna CURP
  });

  test("TC-E2E-02 · CRÍTICO · inscripción de un menor y protección de sus datos", async ({ page }) => {
    await abrir(page, "/");
    await cambiarRol(page, "delegado", EQUIPO.halcones);
    await abrir(page, "/equipos/equipo-4");
    await page.getByTestId("campo-nombre-jugador").fill("Menor Prueba");
    await page.getByTestId("campo-fecha-nacimiento").fill("2011-05-05");
    await page.getByTestId("campo-numero").fill("13");
    await page.getByTestId("campo-curp").fill("HEGL110505HHGRRSA1");
    await page.getByTestId("boton-inscribir-jugador").click();
    await expect(page.getByTestId("error-inscripcion")).toContainText("se requieren el nombre del tutor");
    await page.getByTestId("campo-nombre-tutor").fill("Tutor Prueba");
    await page.getByTestId("casilla-declaracion").check();
    await page.getByTestId("casilla-consentimiento").check();
    await page.getByTestId("boton-inscribir-jugador").click();
    const fila = page.locator('[data-testid^="fila-jugador-"]', { hasText: "Menor Prueba" });
    await expect(fila).toHaveAttribute("data-estado", "Elegible");
    await expect(fila).toContainText("Menor de edad");
    await expect(fila).toContainText("En público: solo dorsal");

    await abrir(page, "/partidos/partido-5");
    await expect(page.getByTestId("convocatoria-local")).toContainText("Menor Prueba");

    await cambiarRol(page, "delegado", EQUIPO.real);
    await abrir(page, "/equipos/equipo-4");
    await expect(page.getByTestId("acceso-restringido")).toBeVisible();
    await cambiarRol(page, "publico");
    await abrir(page, "/equipos/equipo-4");
    await expect(page.getByTestId("acceso-restringido")).toBeVisible();
    await abrir(page, "/publico");
    await expect(page.getByTestId("vista-publica")).not.toContainText("Tutor Prueba");
    await expect(page.getByTestId("vista-publica")).not.toContainText("2011-05-05");
  });

  test("TC-E2E-03 · MEDIO · protesta de acta registrada y resuelta", async ({ page }) => {
    await abrir(page, "/partidos/partido-2");
    await convocar(page, "local");
    await convocar(page, "visitante");
    await page.getByTestId("boton-iniciar-partido").click();
    await registrarEvento(page, "gol", "local", 9);
    await registrarEvento(page, "gol", "visitante", 9);

    await cambiarRol(page, "delegado", EQUIPO.real);
    await page.getByTestId("confirmacion-local").check();
    await cambiarRol(page, "delegado", EQUIPO.minero);
    await page.getByTestId("boton-protestar-visitante").click();
    await page.getByTestId("boton-registrar-protesta-visitante").click();
    await expect(page.getByTestId("firma-visitante")).toContainText("El motivo de la protesta es obligatorio");
    await page.getByTestId("motivo-protesta-visitante").fill("Gol de Real en fuera de juego");
    await page.getByTestId("boton-registrar-protesta-visitante").click();
    await expect(page.getByTestId("firma-visitante")).toContainText("Protestó");
    await expect(page.getByTestId("boton-retirar-protesta-visitante")).toBeVisible();

    await cambiarRol(page, "administrador");
    await page.getByTestId("boton-cerrar-acta").click();
    await expect(page.getByTestId("estado-partido")).toContainText("Finalizado");
    await page.getByTestId("campo-resolucion-visitante").fill("Improcedente: el árbitro confirmó la jugada");
    await page.getByTestId("boton-resolver-protesta-visitante").click();
    await expect(page.getByTestId("firma-visitante")).toContainText("Resolución: Improcedente");

    await abrir(page, "/partidos");
    await expect(page.getByTestId("partido-partido-2")).toContainText("Con protesta");
    await abrir(page, "/bitacora");
    await expect(page.getByTestId("lista-bitacora")).toContainText("Gol de Real en fuera de juego");
  });
});
