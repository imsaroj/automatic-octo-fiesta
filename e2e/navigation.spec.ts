import { test, expect } from "@playwright/test"

/**
 * Route-level code splitting: every page is a `lazy()` chunk behind Suspense.
 * Both entry paths must work — a cold deep link (server serves the shell, the
 * chunk loads on demand) and a client-side navigation from the sidebar.
 */

test("a deep link loads its lazy page chunk", async ({ page }) => {
  await page.goto("/smart/forms")
  // Generous timeout: on a cold dev server this chunk compiles on demand.
  await expect(
    page.getByRole("heading", { name: "Form Controls" })
  ).toBeVisible({ timeout: 20_000 })
})

test("sidebar navigation loads another lazy chunk client-side", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()

  await page.getByRole("link", { name: "Travel" }).click()
  await expect(page).toHaveURL(/\/projects\/travel/)
  // The lazily-loaded page rendered its content (not the Suspense fallback).
  await expect(page.getByRole("heading", { name: "Travel" })).toBeVisible()
})
