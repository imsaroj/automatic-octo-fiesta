import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

/**
 * Automated accessibility scan of the key routes in **both** themes. axe runs in
 * a real browser here (unlike the jsdom unit axe pass), so layout- and
 * paint-dependent rules — including `color-contrast` across light/dark — are
 * meaningful. The suite fails on any **serious or critical** violation. It runs
 * with reduced motion so axe never samples a mid-transition color (and
 * exercises the app's `prefers-reduced-motion` path).
 */

test.use({ reducedMotion: "reduce" })

const ROUTES = [
  { name: "dashboard", path: "/" },
  { name: "simple grid", path: "/grids/simple" },
  { name: "all-fields form", path: "/form-engine/all-fields" },
  { name: "calendar", path: "/smart/calendar" },
  { name: "tree explorer", path: "/smart/tree-explorer" },
] as const

const THEMES = ["light", "dark"] as const

for (const theme of THEMES) {
  for (const route of ROUTES) {
    test(`a11y: ${route.name} (${theme})`, async ({ page }) => {
      // Seed the theme before the app boots so the provider reads it on load.
      await page.addInitScript((t) => {
        localStorage.setItem("theme", t)
      }, theme)

      await page.goto(route.path)
      // Let the route settle (lazy chunk + first paint).
      await expect(page.locator("#main-content")).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()

      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      )

      // Readable failure message instead of a raw object dump.
      const summary = serious
        .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`)
        .join("\n")
      expect(serious, summary).toEqual([])
    })
  }
}
