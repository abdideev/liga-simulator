// Pruebas funcionales del Entregable 7 (TC-FUN), automatizadas.
import { expect, test } from "@playwright/test";

import { abrir, cambiarRol, cerrarActaComoAdmin, convocar, registrarEvento } from "./utils";

test.describe("Funcionales", () => {
  test("TC-FUN-01 · MEDIO · registrar un equipo respeta el cupo y no repite nombre", async ({ page }) => {
    await abrir(page, "/equipos");
    const crear = async (nombre: string) => {
      await page.getByTestId("boton-nuevo-equipo").click();
      const form = page.getByTestId("formulario-equipo");
      await form.getByLabel("Nombre del equipo").fill(nombre);
      await form.getByLabel("Categoría").selectOption({ label: "Libre" });
      await form.getByLabel("Nombre del delegado").fill("Delegado Prueba");
      await form.getByLabel("Teléfono del delegado").fill("775 000 0000");
      await form.getByRole("button", { name: "Registrar equipo" }).click();
    };
    await crear("Club Prueba FC");
    await expect(page.getByTestId("formulario-equipo")).toContainText("La categoría Libre ya alcanzó su cupo de 3 equipos");

    await abrir(page, "/configuracion");
    await page.getByTestId("boton-editar-categoria-cat-1").click();
    await page.getByTestId("formulario-categoria").getByLabel("Cupo de equipos").fill("4");
    await page.getByTestId("formulario-categoria").getByRole("button", { name: "Guardar cambios" }).click();

    await abrir(page, "/equipos");
    await crear("Club Prueba FC");
    await expect(page.getByText("Club Prueba FC")).toBeVisible();
    await crear("Club Prueba FC");
    await expect(page.getByTestId("formulario-equipo")).toContainText("Ya existe un equipo llamado Club Prueba FC en Libre");

    await cambiarRol(page, "delegado");
    await expect(page.getByTestId("selector-equipo-delegado").locator("option", { hasText: "Club Prueba FC" })).toHaveCount(1);
  });

  test("TC-FUN-02 · ALTO · plantilla congelada tras el cierre y ventana extemporánea", async ({ page }) => {
    await abrir(page, "/equipos/equipo-1");
    await page.getByTestId("campo-nombre-jugador").fill("Prueba Uno");
    await page.getByTestId("campo-fecha-nacimiento").fill("2000-01-01");
    await page.getByTestId("campo-numero").fill("13");
    await page.getByTestId("campo-curp").fill("TATA000101HHGRRSA1");
    await page.getByTestId("boton-inscribir-jugador").click();
    await expect(page.locator('[data-testid^="fila-jugador-"]', { hasText: "Prueba Uno" })).toHaveAttribute("data-estado", "Elegible");

    await abrir(page, "/registro");
    await page.getByTestId("boton-cerrar-registro-cat-1").click();
    await page.getByTestId("campo-fecha-registro").fill("2026-11-04");
    await page.getByTestId("boton-confirmar-cierre").click();
    await abrir(page, "/equipos/equipo-1");
    await expect(page.getByTestId("formulario-jugador")).toHaveCount(0);

    await abrir(page, "/registro");
    await page.getByTestId("boton-abrir-ventana-cat-1").click();
    const manana = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    await page.getByTestId("campo-fecha-registro").fill(manana);
    await page.getByTestId("boton-confirmar-ventana").click();
    await expect(page.getByTestId("registro-cat-1")).toContainText("El motivo de la ventana extemporánea es obligatorio");
    await page.getByTestId("campo-motivo-ventana").fill("Alta por traspaso");
    await page.getByTestId("campo-fecha-registro").fill("2020-01-01");
    await page.getByTestId("boton-confirmar-ventana").click();
    await expect(page.getByTestId("registro-cat-1")).toContainText("La fecha límite de la ventana no puede ser anterior a hoy");
    await page.getByTestId("campo-fecha-registro").fill(manana);
    await page.getByTestId("boton-confirmar-ventana").click();
    await expect(page.getByTestId("registro-cat-1")).toContainText("Ventana extemporánea");

    await abrir(page, "/equipos/equipo-1");
    await expect(page.getByTestId("aviso-ventana-extemporanea")).toBeVisible();
    await page.getByTestId("campo-nombre-jugador").fill("Prueba Dos");
    await page.getByTestId("campo-fecha-nacimiento").fill("1995-03-15");
    await page.getByTestId("campo-numero").fill("14");
    await page.getByTestId("campo-curp").fill("LOGA950315HHGRRSA1");
    await page.getByTestId("boton-inscribir-jugador").click();
    await expect(page.locator('[data-testid^="fila-jugador-"]', { hasText: "Prueba Dos" })).toContainText("Alta extemporánea");
  });

  test("TC-FUN-03 · ALTO · suspensión automática y bloqueo de la convocatoria", async ({ page }) => {
    await abrir(page, "/estadisticas");
    await page.getByTestId("pestana-suspendidos").click();
    const suspendidos = page.getByTestId("lista-suspendidos");
    await expect(suspendidos).toContainText("Brandon Martínez Castillo");

    await abrir(page, "/partidos/partido-2");
    await expect(page.getByTestId("convocable-jugador-31")).toHaveAttribute("data-bloqueado", "true");
    await expect(page.getByTestId("convocable-jugador-31")).toContainText("Suspendido — Tarjeta roja directa");
    await convocar(page, "local");
    await convocar(page, "visitante");
    await page.getByTestId("boton-iniciar-partido").click();
    await registrarEvento(page, "tarjeta_roja", "local", 0);
    await cerrarActaComoAdmin(page);
    await expect(page.getByTestId("estado-partido")).toContainText("Finalizado");

    await abrir(page, "/estadisticas");
    await page.getByTestId("pestana-suspendidos").click();
    await expect(suspendidos).not.toContainText("Brandon Martínez Castillo");
    // En Libre solo queda el recién expulsado (Alejandro, de Juvenil, se ve en su categoría).
    await expect(suspendidos.getByText("cumple en el siguiente partido de su equipo")).toHaveCount(1);

    // La sanción se cumple en el siguiente partido del EQUIPO, aunque descanse una jornada.
    await abrir(page, "/partidos/partido-6");
    await expect(page.getByTestId("convocable-jugador-53")).toHaveAttribute("data-bloqueado", "true");
    await abrir(page, "/partidos/partido-3");
    await expect(page.locator('[data-testid^="convocable-"][data-bloqueado="true"]').first()).toContainText("Suspendido — Tarjeta roja directa");
  });
});
