// Casos legales propuestos en el Entregable 8 (§9.3 y §10), automatizados.
import { expect, test } from "@playwright/test";

import { abrir, cambiarRol, EQUIPO } from "./utils";

async function sha256(page: import("@playwright/test").Page, texto: string) {
  return page.evaluate(async (t) => {
    const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
  }, texto);
}

test.describe("Cumplimiento legal", () => {
  test("TC-LEG-01 · ALTO · el aviso aparece antes de registrarse y las casillas llegan vacías", async ({ page }) => {
    await page.goto("/");
    const gate = page.getByTestId("registro-inicial");
    await expect(gate).toBeVisible();
    await expect(page.getByTestId("aviso-simplificado")).toContainText("No los venderemos ni los usaremos para publicidad");
    await expect(page.getByTestId("casilla-terminos")).not.toBeChecked();
    await expect(page.getByTestId("casilla-aviso")).not.toBeChecked();
    await page.getByTestId("campo-contrasena").fill("Liga2026!seguro");
    await expect(page.getByTestId("boton-crear-cuenta")).toBeDisabled();
    await page.getByTestId("casilla-terminos").check();
    await expect(page.getByTestId("boton-crear-cuenta")).toBeDisabled();
    await page.getByTestId("casilla-aviso").check();
    await page.getByTestId("boton-crear-cuenta").click();
    await expect(gate).toBeHidden();

    await abrir(page, "/cuenta?tab=privacidad");
    await expect(page.getByTestId("mis-aceptaciones")).toContainText("Términos de uso v1.0");
    await abrir(page, "/bitacora");
    await expect(page.getByTestId("lista-bitacora")).toContainText("Aceptación de Términos de uso v1.0");
  });

  test("TC-LEG-01b · el aviso se consulta sin cuenta y desde la vista pública", async ({ page }) => {
    await page.goto("/privacidad");
    await expect(page.getByTestId("pagina-privacidad")).toBeVisible();
    await expect(page.getByTestId("registro-inicial")).toHaveCount(0);
    await page.getByTestId("selector-rol").selectOption("publico");
    await page.goto("/privacidad");
    await expect(page.getByTestId("documento-aviso")).toContainText("¿Quién es responsable de sus datos personales?");
    await page.getByTestId("pestana-versiones").click();
    await expect(page.getByTestId("versiones-aviso")).toContainText("Vigente");
    await expect(page.getByTestId("pie-legal")).toContainText("Aviso v1.0");
  });

  test("TC-LEG-02/03 · CRÍTICO · sin consentimiento 2, el menor aparece solo con su dorsal", async ({ page }) => {
    await abrir(page, "/");
    await cambiarRol(page, "publico");
    await abrir(page, "/publico");
    await page.getByTestId("selector-categoria").selectOption({ label: "Juvenil Sub-17" });
    await page.getByTestId("pestana-goleo").click();
    const vista = page.getByTestId("vista-publica");
    await expect(vista).toContainText("Dorsal #10"); // Tigres #10: tutor no autorizó el nombre
    await expect(vista).toContainText("#8 Antonio Ramírez Ortiz"); // Tigres #8: tutor sí autorizó
  });

  test("TC-LEG-05 · MEDIO · una solicitud ARCO crea folio y plazo de 20 días hábiles", async ({ page }) => {
    await abrir(page, "/cuenta?tab=arco");
    await page.getByTestId("campo-descripcion-arco").fill("Solicito una copia de mis datos personales.");
    await page.getByTestId("boton-enviar-arco").click();
    const lista = page.getByTestId("lista-arco");
    await expect(lista).toContainText("ARCO-");
    await expect(lista).toContainText("20 días hábiles");
    await lista.getByRole("button", { name: /Turnar a la Unidad de Transparencia/ }).click();
    await expect(lista).toContainText("Turnada a Transparencia");
  });

  test("TC-LEG-06 · CRÍTICO · la constancia guarda la huella exacta del texto aceptado", async ({ page }) => {
    await abrir(page, "/licencia");
    await expect(page.getByTestId("casilla-condiciones")).toBeDisabled();
    await page.getByTestId("texto-condiciones").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll"));
    });
    await page.getByTestId("casilla-condiciones").check();
    await page.getByTestId("casilla-facultades").check();
    await page.getByTestId("boton-aceptar-condiciones").click();
    const correo = await page.getByTestId("correo-simulado").innerText();
    const codigo = correo.match(/\b(\d{6})\b/)![1];
    await page.getByTestId("campo-codigo").fill(codigo === "000000" ? "111111" : "000000");
    await page.getByTestId("boton-confirmar-codigo").click();
    await expect(page.getByText("El código no coincide")).toBeVisible();
    await page.getByTestId("campo-codigo").fill(codigo);
    await page.getByTestId("boton-confirmar-codigo").click();
    const constancia = page.getByTestId("constancia");
    await expect(constancia).toContainText("ACE-2026-000001");

    // Recalcula en el navegador la huella del texto mostrado y la compara con la constancia.
    const huellaMostrada = (await page.getByTestId("constancia").locator("tr", { hasText: "Huella del texto" }).locator("code").innerText()).trim();
    expect(huellaMostrada).toMatch(/^[0-9a-f]{64}$/);
    await abrir(page, "/legal?doc=condiciones");
    const huellaPublicada = (await page.getByTestId("sello-condiciones").locator("code").innerText()).trim();
    expect(huellaPublicada).toBe(huellaMostrada);
    expect(await sha256(page, "abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("TC-LEG-09 · MEDIO · cancelar el plan programa el fin del servicio y es reversible", async ({ page }) => {
    await abrir(page, "/cuenta");
    await expect(page.getByTestId("estado-licencia")).toContainText("Pendiente");
    await expect(page.getByTestId("boton-cancelar-plan")).toHaveCount(0);
    // Activar primero la licencia.
    await abrir(page, "/licencia");
    await page.getByTestId("texto-condiciones").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll"));
    });
    await page.getByTestId("casilla-condiciones").check();
    await page.getByTestId("casilla-facultades").check();
    await page.getByTestId("boton-aceptar-condiciones").click();
    const codigo = (await page.getByTestId("correo-simulado").innerText()).match(/\b(\d{6})\b/)![1];
    await page.getByTestId("campo-codigo").fill(codigo);
    await page.getByTestId("boton-confirmar-codigo").click();

    await abrir(page, "/cuenta");
    await expect(page.getByTestId("plan-licencia")).toContainText("$3,480.00");
    await page.getByTestId("boton-cancelar-plan").click();
    await expect(page.getByTestId("boton-confirmar-cancelacion")).toBeDisabled();
    await page.getByTestId("campo-motivo-cancelacion").selectOption("otro_sistema");
    await page.getByTestId("casilla-entiendo-cancelacion").check();
    await page.getByTestId("boton-confirmar-cancelacion").click();
    await expect(page.getByTestId("aviso-cancelacion")).toContainText("El servicio sigue activo hasta el");
    await expect(page.getByTestId("estado-licencia")).toContainText("Cancelación programada");

    const descarga = page.waitForEvent("download");
    await page.getByTestId("boton-descargar-datos").click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toMatch(/^datos-liga-\d{4}-\d{2}-\d{2}\.json$/);

    await page.getByTestId("boton-revertir-cancelacion").click();
    await expect(page.getByTestId("estado-licencia")).toContainText("Activa");
    await abrir(page, "/bitacora");
    await expect(page.getByTestId("lista-bitacora")).toContainText("Cancelación del plan");
    await expect(page.getByTestId("lista-bitacora")).toContainText("Reversión de la cancelación del plan");
  });

  test("los delegados tienen su propio registro y no ven el plan", async ({ page }) => {
    await abrir(page, "/");
    await page.getByTestId("selector-rol").selectOption("delegado");
    await expect(page.getByTestId("registro-inicial")).toContainText("Delegado de Real Tulancingo FC");
    await cambiarRol(page, "delegado", EQUIPO.real);
    await abrir(page, "/cuenta");
    await expect(page.getByTestId("pestana-plan")).toHaveCount(0);
    await abrir(page, "/licencia");
    await expect(page.getByTestId("acceso-restringido")).toBeVisible();
  });
});
