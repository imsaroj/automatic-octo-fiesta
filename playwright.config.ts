import { defineConfig, devices } from "@playwright/test"

/**
 * Smoke E2E suite against the Vite playground (`apps/web`).
 *
 * The app MUST run through `vite dev`: the MSW mock API (`src/mocks/`) only
 * starts in dev builds (`enableMocking()` no-ops in prod), and every data spec
 * relies on its deterministic seeded dataset. Specs cover exactly the layer
 * jsdom can't — AG Grid canvas/virtualization, Base UI portals in a real
 * browser, and real network through the service worker.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The dev server compiles on demand — keep a couple of workers so specs
  // don't stampede the first-load transform.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5183",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // A dedicated, strict port so the suite can never silently reuse some
    // other app that happens to be developing on Vite's default 5173.
    command: "pnpm --filter web dev --port 5183 --strictPort",
    url: "http://localhost:5183",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
