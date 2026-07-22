import { configDefaults, defineConfig } from "vitest/config"
import { resolve } from "path"

// Pure logic suites that never touch document/window/localStorage — neither
// the test file nor the code it exercises. These run under the cheap `node`
// environment; everything else pays for jsdom. When adding a test, put it
// here only if it needs no DOM at all (note: `server-grid-internals.test.ts`
// stays on jsdom because it round-trips localStorage).
const NODE_TESTS = [
  "src/calendar/booking.test.tsx",
  "src/calendar/calendar-utils.test.tsx",
  "src/calendar/recurrence.test.tsx",
  "src/data-grid/create-page-fetcher.test.ts",
  "src/data-grid/formula-guard.test.ts",
  "src/data-grid/grid-datasource.test.ts",
  "src/data-grid/pagination.test.ts",
  "src/form/field-types.test.tsx",
  "src/layout/resolve.test.ts",
  "src/form/smart-form-internals.test.ts",
  "src/lib/format.test.ts",
  "src/lib/xlsx.test.ts",
  "src/search/build-query.test.ts",
  "src/smart-components/page/error-kind.test.ts",
  "src/transfer-list/transfer-utils.test.tsx",
  "src/tree/tree-utils.test.tsx",
]

export default defineConfig({
  test: {
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
      // Thresholds sit a couple points below the measured numbers so CI
      // enforces "don't regress", not an aspirational target — raise these as
      // component test coverage grows. God Prompt 5 (2026-07-08) added engine
      // interaction + axe render tests, lifting lines ~24% → ~60%.
      thresholds: {
        statements: 56,
        branches: 51,
        functions: 50,
        lines: 57,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: NODE_TESTS,
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: [...configDefaults.exclude, ...NODE_TESTS],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@iamsaroj/smart-ui": resolve(__dirname, "src"),
    },
  },
})
