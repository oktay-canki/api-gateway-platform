import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    environment: "node",

    globals: true,

    setupFiles: ["./tests/setup.ts"],

    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],

    exclude: ["node_modules", ".next", "tests/integration/**"],

    clearMocks: true,
    restoreMocks: true,
  },
});
