import { expect, type Page } from "@playwright/test";

export type Rol = "administrador" | "delegado" | "publico";

export const EQUIPO = {
  real: "equipo-1",
  cuauhtemoc: "equipo-2",
  minero: "equipo-3",
  halcones: "equipo-4",
  tigres: "equipo-5",
  aguilas: "equipo-6",
} as const;

/** Opens a route and waits until the client-only app has mounted. */
export async function abrir(page: Page, ruta: string) {
  await page.goto(ruta);
  await expect(page.getByTestId("selector-rol")).toBeVisible();
  await crearCuentaSiHaceFalta(page);
}

/** First sign-in gate (Capa 3): accepts the Términos de uso if the gate is shown. */
export async function crearCuentaSiHaceFalta(page: Page) {
  const gate = page.getByTestId("registro-inicial");
  // Give the gate a moment to render after a role change.
  await page.waitForTimeout(150);
  if (!(await gate.isVisible())) return;
  await page.getByTestId("campo-contrasena").fill("Liga2026!seguro");
  await page.getByTestId("casilla-terminos").check();
  await page.getByTestId("casilla-aviso").check();
  await expect(page.getByTestId("boton-crear-cuenta")).toBeEnabled();
  await page.getByTestId("boton-crear-cuenta").click();
  await expect(gate).toBeHidden();
}

export async function cambiarRol(page: Page, rol: Rol, equipoId?: string) {
  await page.getByTestId("selector-rol").selectOption(rol);
  if (rol === "delegado" && equipoId) {
    await page.getByTestId("selector-equipo-delegado").selectOption(equipoId);
  }
  await crearCuentaSiHaceFalta(page);
}

/** Calls up the first `n` callable players of one side (unchecked, not blocked). */
export async function convocar(page: Page, lado: "local" | "visitante", n = 11) {
  const panel = page.getByTestId(`convocatoria-${lado}`);
  const casillas = panel.locator('input[type="checkbox"]:not([disabled])');
  for (let i = 0, marcadas = 0; marcadas < n && i < (await casillas.count()); i++) {
    const c = casillas.nth(i);
    if (!(await c.isChecked())) {
      await c.check();
      marcadas++;
    }
  }
}

/** Registers an event from the mesa de control panel. */
export async function registrarEvento(
  page: Page,
  tipo: "gol" | "tarjeta_amarilla" | "tarjeta_roja" | "falta" | "tiro_esquina",
  lado: "local" | "visitante",
  jugadorIndice?: number
) {
  await page.getByTestId(`tipo-evento-${tipo}`).click();
  await page.getByTestId(`evento-equipo-${lado}`).click();
  if (jugadorIndice !== undefined) {
    const opciones = page.getByTestId("evento-jugador").locator("option");
    const valor = await opciones.nth(jugadorIndice + 1).getAttribute("value");
    await page.getByTestId("evento-jugador").selectOption(valor!);
  }
  await page.getByTestId("boton-registrar-evento").click();
}

/** Signs both sides of the acta as administrator and closes it. */
export async function cerrarActaComoAdmin(page: Page) {
  await page.getByTestId("confirmacion-local").check();
  await page.getByTestId("confirmacion-visitante").check();
  await page.getByTestId("boton-cerrar-acta").click();
}

export async function nombreDelEvento(page: Page): Promise<string> {
  const sel = page.getByTestId("evento-jugador");
  return (await sel.locator("option:checked").textContent()) ?? "";
}
