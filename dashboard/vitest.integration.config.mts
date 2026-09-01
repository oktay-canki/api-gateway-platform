import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    environment: "node",

    globals: true,

    setupFiles: ["./tests/setup.ts", "./tests/integration/setup.ts"],

    include: ["tests/integration/**/*.test.ts"],

    exclude: ["node_modules", ".next"],

    clearMocks: true,
    restoreMocks: true,

    maxWorkers: 1,
  },
});
