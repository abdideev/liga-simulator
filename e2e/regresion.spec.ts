// Pruebas de regresión del Entregable 7 (TC-REG), automatizadas.
import { expect, test } from "@playwright/test";

import { abrir, cerrarActaComoAdmin, convocar, registrarEvento } from "./utils";

test.describe("Regresión", () => {
  test("TC-REG-01 · ALTO · la tabla y el historial no se alteran al aplicar sanciones", async ({ page }) => {
    await abrir(page, "/estadisticas");
    const cuauhtemoc = page.getByTestId("tabla-posiciones").locator("tbody tr", { hasText: "Deportivo Cuauhtémoc" });
    const celdas = async () => (await cuauhtemoc.locator("td").allInnerTexts()).slice(1).join(" | ");
    const antes = await celdas();

    await abrir(page, "/partidos/partido-2");
    await convocar(page, "local");
    await convocar(page, "visitante");
    await page.getByTestId("boton-iniciar-partido").click();
    await registrarEvento(page, "tarjeta_roja", "local", 0);
    await cerrarActaComoAdmin(page);
    await expect(page.getByTestId("estado-partido")).toContainText("Finalizado");

    await abrir(page, "/estadisticas");
    await expect.poll(celdas).toBe(antes);

    // El partido de la J1 conserva su marcador y la roja de Brandon.
    await abrir(page, "/partidos/partido-1");
    await expect(page.getByTestId("marcador")).toContainText("3");
    await expect(page.getByTestId("feed-eventos")).toContainText("Brandon Martínez Castillo");

    // RNF-05: la tabla se ve en menos de 3 s, tres veces.
    for (let i = 0; i < 3; i++) {
      await abrir(page, "/");
      const inicio = Date.now();
      await page.getByTestId("nav-estadisticas").click();
      await expect(page.getByTestId("tabla-posiciones")).toBeVisible();
      expect(Date.now() - inicio).toBeLessThan(3000);
    }
  });

  test("TC-REG-02 · MEDIO · la verificación de CURP no se degrada", async ({ page }) => {
    await abrir(page, "/equipos/equipo-1");
    await page.getByTestId("campo-nombre-jugador").fill("Adulto Válido");
    await page.getByTestId("campo-fecha-nacimiento").fill("2000-01-01");
    await page.getByTestId("campo-numero").fill("13");
    await page.getByTestId("campo-curp").fill("TATA000101HHGRRSA1");
    await page.getByTestId("boton-inscribir-jugador").click();
    await expect(page.locator('[data-testid^="fila-jugador-"]', { hasText: "Adulto Válido" })).toHaveAttribute("data-estado", "Elegible");

    await abrir(page, "/equipos/equipo-3");
    await page.getByTestId("boton-revisar-jugador-29").click();
    await page.getByTestId("motivo-anulacion-jugador-29").fill("Acta de nacimiento revisada en ventanilla");
    await page.getByTestId("boton-marcar-elegible-jugador-29").click();
    await expect(page.getByTestId("fila-jugador-jugador-29")).toHaveAttribute("data-estado", "Elegible");

    await page.getByTestId("nav-inicio").click();
    await expect(page.getByTestId("tarjeta-inicio-revisión-manual")).toContainText("0");
    await abrir(page, "/bitacora");
    await expect(page.getByTestId("lista-bitacora")).toContainText("Acta de nacimiento revisada en ventanilla");
  });

  test("TC-REG-03 · CRÍTICO · la convocatoria no rompe la cola sin conexión", async ({ page }) => {
    await abrir(page, "/partidos/partido-2");
    await convocar(page, "local", 12);
    await convocar(page, "visitante");
    await page.getByTestId("convocatoria-local").locator('[data-testid^="titular-"]').first().click();
    await page.getByTestId("boton-iniciar-partido").click();
    await page.getByTestId("toggle-modo-offline").click();
    await registrarEvento(page, "falta", "local");
    await registrarEvento(page, "tiro_esquina", "visitante");
    await expect(page.getByTestId("contador-pendientes")).toContainText("2 evento(s) pendientes");

    await page.reload();
    await expect(page.getByTestId("contador-pendientes")).toContainText("2 evento(s) pendientes");
    await expect(page.getByTestId("convocatoria-local")).toContainText("12 convocados · 10/11 titulares");
    const esquema = await page.evaluate(() => JSON.parse(localStorage.getItem("liga-simulador:estado")!).version);
    expect(esquema).toBe(4);

    await page.getByTestId("toggle-modo-offline").click();
    await expect(page.getByTestId("toast")).toContainText("2 evento(s) sincronizado(s) correctamente", { timeout: 5000 });
    await expect(page.getByTestId("feed-eventos").getByTestId("evento-partido")).toHaveCount(2);
    await expect(page.getByTestId("convocatoria-local")).toContainText("12 convocados · 10/11 titulares");
  });
});
