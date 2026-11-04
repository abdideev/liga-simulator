// Validación no funcional (ISO/IEC 25010): accesibilidad, seguridad,
// eficiencia de desempeño. Los resultados se adjuntan al reporte.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { abrir, cambiarRol, EQUIPO } from "./utils";

const PANTALLAS = [
  "/",
  "/equipos",
  "/equipos/equipo-4",
  "/partidos/partido-2",
  "/estadisticas",
  "/registro",
  "/bitacora",
  "/cuenta",
  "/licencia",
  "/privacidad",
  "/legal",
];

test.describe("Usabilidad: accesibilidad WCAG 2.1 AA (axe-core)", () => {
  for (const ruta of PANTALLAS) {
    test(`sin violaciones graves en ${ruta}`, async ({ page }, info) => {
      await abrir(page, ruta);
      await page.waitForTimeout(400); // deja terminar las animaciones de entrada
      const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const graves = resultado.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      await info.attach("axe.json", {
        body: JSON.stringify(resultado.violations.map((v) => ({ id: v.id, impact: v.impact, nodos: v.nodes.length, ayuda: v.help }))),
        contentType: "application/json",
      });
      expect(graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodo(s)`)).toEqual([]);
    });
  }
  test("sin violaciones graves en el registro inicial y la vista pública", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("registro-inicial")).toBeVisible();
    let r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => v.id)).toEqual([]);
    await page.getByTestId("selector-rol").selectOption("publico");
    await page.goto("/publico");
    await expect(page.getByTestId("vista-publica")).toBeVisible();
    r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => v.id)).toEqual([]);
  });
});

test.describe("Seguridad", () => {
  test("los textos capturados se muestran escapados (sin inyección de scripts)", async ({ page }) => {
    let alertas = 0;
    page.on("dialog", async (d) => {
      alertas++;
      await d.dismiss();
    });
    await abrir(page, "/equipos/equipo-1");
    const ataque = `<img src=x onerror="alert(1)"><script>alert(2)</script>`;
    await page.getByTestId("campo-nombre-jugador").fill(ataque);
    await page.getByTestId("campo-fecha-nacimiento").fill("2000-01-01");
    await page.getByTestId("campo-numero").fill("13");
    await page.getByTestId("campo-curp").fill("TATA000101HHGRRSA1");
    await page.getByTestId("boton-inscribir-jugador").click();
    await expect(page.locator('[data-testid^="fila-jugador-"]', { hasText: "<script>alert(2)</script>" })).toBeVisible();
    await abrir(page, "/bitacora");
    await page.waitForTimeout(300);
    expect(alertas).toBe(0);
    expect(await page.locator("img[src='x']").count()).toBe(0);
  });

  test("cada rol solo abre lo suyo, también por URL directa", async ({ page }) => {
    await abrir(page, "/");
    await cambiarRol(page, "delegado", EQUIPO.real);
    for (const ruta of ["/configuracion", "/registro", "/bitacora", "/licencia", "/equipos/equipo-4"]) {
      await abrir(page, ruta);
      await expect(page.getByTestId("acceso-restringido"), ruta).toBeVisible();
    }
    await cambiarRol(page, "publico");
    for (const ruta of ["/equipos", "/partidos", "/estadisticas", "/cuenta"]) {
      await abrir(page, ruta);
      await expect(page.getByTestId("acceso-restringido"), ruta).toBeVisible();
    }
  });

  test("encabezados HTTP de seguridad", async ({ request }) => {
    const r = await request.get("/");
    const h = r.headers();
    expect(h["x-powered-by"], "no anuncia la tecnología del servidor").toBeUndefined();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});

test.describe("Eficiencia de desempeño", () => {
  test("p95 del tiempo de respuesta del servidor < 2 s (40 solicitudes por pantalla)", async ({ request }, info) => {
    const resultados: Record<string, { p50: number; p95: number; max: number }> = {};
    for (const ruta of ["/", "/publico", "/partidos/partido-2", "/privacidad"]) {
      const tiempos: number[] = [];
      for (let i = 0; i < 40; i++) {
        const t0 = performance.now();
        const r = await request.get(ruta);
        await r.body();
        tiempos.push(performance.now() - t0);
        expect(r.status()).toBe(200);
      }
      tiempos.sort((a, b) => a - b);
      const p = (q: number) => Math.round(tiempos[Math.ceil(q * tiempos.length) - 1]);
      resultados[ruta] = { p50: p(0.5), p95: p(0.95), max: Math.round(tiempos.at(-1)!) };
    }
    await info.attach("tiempos.json", { body: JSON.stringify(resultados, null, 2), contentType: "application/json" });
    for (const [ruta, r] of Object.entries(resultados)) expect(r.p95, ruta).toBeLessThan(2000);
  });

  test("cada pantalla queda lista en menos de 2 s en el navegador", async ({ page }, info) => {
    await abrir(page, "/");
    const tiempos: Record<string, number> = {};
    for (const [ruta, marca] of [
      ["/publico", "selector-rol"],
      ["/estadisticas", "tabla-posiciones"],
      ["/partidos/partido-2", "convocatoria-local"],
      ["/equipos/equipo-1", "formulario-jugador"],
      ["/bitacora", "lista-bitacora"],
    ] as const) {
      const t0 = Date.now();
      await page.goto(ruta);
      await expect(page.getByTestId(marca)).toBeVisible();
      tiempos[ruta] = Date.now() - t0;
    }
    await info.attach("carga-navegador.json", { body: JSON.stringify(tiempos, null, 2), contentType: "application/json" });
    for (const [ruta, ms] of Object.entries(tiempos)) expect(ms, ruta).toBeLessThan(2000);
  });
});
