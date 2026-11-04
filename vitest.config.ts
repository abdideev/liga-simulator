import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests for the pure domain layer (src/lib). Coverage is measured on the
// business logic only: the UI is covered by the Playwright suite in e2e/.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/__tests__/**", "src/lib/types.ts", "src/lib/acciones.ts"],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "reportes/cobertura",
    },
  },
});
