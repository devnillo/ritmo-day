import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// "server-only" lança erro fora do bundle de servidor do Next; nos testes ele vira um módulo vazio.
const serverOnlyStub = fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true, alias: { "server-only": serverOnlyStub } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.int.test.ts"],
          setupFiles: ["./test/setup-unit.ts"],
        },
      },
      {
        // Precisa do Postgres de desenvolvimento rodando (compose.dev.yaml).
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          setupFiles: ["./test/setup-integration.ts"],
        },
      },
    ],
  },
});
