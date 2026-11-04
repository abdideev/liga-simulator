import { defineConfig, devices } from "@playwright/test";

// End-to-end suite: the Entregable 7 test cases (TC-INT, TC-FUN, TC-REG,
// TC-E2E), the legal cases (TC-LEG), accessibility and response time.
//
// By default it builds and serves the production app. To reuse a server that
// is already running, set PW_BASE_URL (e.g. http://localhost:3000).
const baseURL = process.env.PW_BASE_URL ?? "http://localhost:3210";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "reportes/e2e", open: "never" }], ["json", { outputFile: "reportes/e2e/resultados.json" }]],
  use: {
    baseURL,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 820 } },
      testIgnore: /compatibilidad\.spec\.ts/,
    },
    { name: "celular", use: { ...devices["Pixel 7"] }, testMatch: /compatibilidad\.spec\.ts/ },
  ],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : { command: "npm run build && npx next start -p 3210", url: baseURL, timeout: 240_000, reuseExistingServer: true },
});
