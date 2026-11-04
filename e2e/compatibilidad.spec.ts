// Portabilidad y usabilidad en celular (Pixel 7): la mesa de control se usa en la cancha.
import { expect, test } from "@playwright/test";

import { abrir, convocar, registrarEvento } from "./utils";

test("en celular no hay desplazamiento horizontal en las pantallas principales", async ({ page }) => {
  for (const ruta of ["/", "/equipos/equipo-4", "/partidos/partido-2", "/estadisticas", "/cuenta", "/privacidad"]) {
    await abrir(page, ruta);
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde, ruta).toBeLessThanOrEqual(1);
  }
});

test("en celular los controles de la mesa miden al menos 44 px (uso con una mano)", async ({ page }) => {
  await abrir(page, "/partidos/partido-2");
  await convocar(page, "local");
  await convocar(page, "visitante");
  await page.getByTestId("boton-iniciar-partido").click();
  await page.getByTestId("tipo-evento-gol").click();
  await page.waitForTimeout(500); // el panel entra con animación de escala
  // El interruptor mide 28 px, pero toda su fila (label) es el área táctil.
  const areaInterruptor = page.locator("label", { has: page.getByTestId("toggle-modo-offline") });
  const controles = [areaInterruptor, page.getByTestId("tipo-evento-gol"), page.getByTestId("evento-equipo-local"), page.getByTestId("boton-registrar-evento")];
  for (const control of controles) {
    const caja = await control.boundingBox();
    expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await registrarEvento(page, "gol", "local", 9);
  await expect(page.getByTestId("marcador-goles")).toContainText("1");
});
