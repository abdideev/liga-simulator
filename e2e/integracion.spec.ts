// Pruebas de integración del Entregable 7 (TC-INT), automatizadas.
import { expect, test } from "@playwright/test";

import { abrir, convocar, cerrarActaComoAdmin, registrarEvento } from "./utils";

test.describe("Integración", () => {
  test("TC-INT-01 · CRÍTICO · la cola sin conexión se sincroniza íntegra", async ({ page }) => {
    await abrir(page, "/partidos/partido-2");
    await convocar(page, "local");
    await convocar(page, "visitante");
    await page.getByTestId("boton-iniciar-partido").click();
    await page.getByTestId("toggle-modo-offline").click();
    await expect(page.getByTestId("aviso-modo-offline")).toBeVisible();

    await registrarEvento(page, "gol", "local", 9);
    await registrarEvento(page, "tarjeta_amarilla", "visitante", 0);
    await registrarEvento(page, "falta", "local");
    await expect(page.getByTestId("contador-pendientes")).toContainText("3 evento(s) pendientes");

    // Navegar y recargar no pierde la cola.
    await page.getByTestId("nav-partidos").click();
    await abrir(page, "/partidos/partido-2");
    await page.reload();
    await expect(page.getByTestId("contador-pendientes")).toContainText("3 evento(s) pendientes");

    await page.getByTestId("toggle-modo-offline").click();
    await expect(page.getByTestId("toast")).toContainText("3 evento(s) sincronizado(s) correctamente", { timeout: 5000 });
    await expect(page.getByTestId("contador-pendientes")).toHaveCount(0);
    await expect(page.getByTestId("feed-eventos").getByTestId("evento-partido")).toHaveCount(3);
    await expect(page.getByTestId("marcador-goles")).toContainText("1");
  });

  test("TC-INT-02 · ALTO · la CURP regresa la elegibilidad correcta", async ({ page }) => {
    await abrir(page, "/equipos/equipo-4");
    const inscribir = async (nombre: string, fecha: string, numero: string, curp: string, tutor: boolean) => {
      await page.getByTestId("campo-nombre-jugador").fill(nombre);
      await page.getByTestId("campo-fecha-nacimiento").fill(fecha);
      await page.getByTestId("campo-numero").fill(numero);
      await page.getByTestId("campo-curp").fill(curp);
      if (tutor) {
        await page.getByTestId("campo-nombre-tutor").fill("Tutor Prueba");
        await page.getByTestId("casilla-declaracion").check();
        await page.getByTestId("casilla-consentimiento").check();
      }
      await page.getByTestId("boton-inscribir-jugador").click();
    };
    await inscribir("Prueba Uno", "2011-05-05", "13", "HEGL110505HHGRRSA1", true);
    await inscribir("Prueba Dos", "2005-05-05", "14", "HEGL050505HHGRRSA1", false);
    await inscribir("Prueba Tres", "2011-05-05", "15", "HEGL110505HHGRRSA", true);

    const fila = (nombre: string) => page.locator('[data-testid^="fila-jugador-"]', { hasText: nombre });
    await expect(fila("Prueba Uno")).toHaveAttribute("data-estado", "Elegible");
    await expect(fila("Prueba Dos")).toHaveAttribute("data-estado", "No elegible por edad");
    await expect(fila("Prueba Tres")).toHaveAttribute("data-estado", "Requiere revisión manual");

    await page.getByTestId("nav-inicio").click();
    await expect(page.getByTestId("tarjeta-inicio-revisión-manual")).toContainText("2");
  });

  test("TC-INT-03 · ALTO · al cerrar el acta la tabla se recalcula sola", async ({ page }) => {
    await abrir(page, "/partidos/partido-2");
    await convocar(page, "local");
    await convocar(page, "visitante");
    await page.getByTestId("boton-iniciar-partido").click();
    await registrarEvento(page, "gol", "local", 9);
    await registrarEvento(page, "gol", "local", 10);
    await registrarEvento(page, "gol", "visitante", 9);
    await cerrarActaComoAdmin(page);
    await expect(page.getByTestId("toast")).toContainText("Acta cerrada");
    await expect(page.getByTestId("estado-partido")).toContainText("Finalizado");

    await page.getByTestId("nav-estadisticas").click();
    const tabla = page.getByTestId("tabla-posiciones");
    const filas = tabla.locator("tbody tr");
    await expect(filas.nth(0)).toContainText("Deportivo Cuauhtémoc");
    await expect(filas.nth(1)).toContainText("Real Tulancingo FC");
    await expect(filas.nth(2)).toContainText("Atlético Minero");
  });
});
