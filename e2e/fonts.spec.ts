import { test, expect } from "@playwright/test"

/**
 * Guard for the font-subset pruning (globals.css imports only the latin /
 * latin-ext @font-face rules from fonts.css instead of every @fontsource
 * subset): both variable fonts must still be registered and fetchable, and
 * the app's serif-first typography must keep applying.
 */

test("Noto Serif styles the body; both variable fonts are loadable", async ({
  page,
}) => {
  await page.goto("/")
  await page.waitForFunction(() => document.fonts.status === "loaded")

  // The app's typography is serif-first: body text uses Noto Serif Variable.
  const bodyFamily = await page.evaluate(
    () => getComputedStyle(document.body).fontFamily
  )
  expect(bodyFamily).toContain("Noto Serif Variable")

  // Fonts load lazily (Inter backs `font-sans`, used by kbd etc.) — force a
  // load so a broken @font-face URL fails here, not in production.
  for (const family of ["Noto Serif Variable", "Inter Variable"]) {
    expect(
      await page.evaluate(async (name) => {
        const faces = await document.fonts.load(`16px "${name}"`)
        return faces.length > 0 && document.fonts.check(`16px "${name}"`)
      }, family),
      `${family} should load`
    ).toBe(true)
  }
})
