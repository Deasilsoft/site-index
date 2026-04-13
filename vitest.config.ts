import { defineConfig } from "vitest/config";
import { resolveAliasPath } from "./vite.config.js";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolveAliasPath("src"),
      "@examples": resolveAliasPath("examples"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
