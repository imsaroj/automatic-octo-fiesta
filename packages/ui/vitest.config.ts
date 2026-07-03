import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/**", // vendored shadcn/ui primitives
        "src/**/*.test.{ts,tsx}",
        "src/**/index.ts", // re-export barrels
      ],
      // Baseline captured 2026-07 (~24% lines). Thresholds sit a couple points
      // below the measured numbers so CI enforces "don't regress", not an
      // aspirational target — raise these as component test coverage grows.
      thresholds: {
        statements: 21,
        branches: 8,
        functions: 16,
        lines: 22,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@workspace/ui": resolve(__dirname, "src"),
    },
  },
})
