import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes que usam o Postgres do `.env` (pnpm db:up). Rodam em série e limpam o que criam.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest-stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["dotenv/config"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
