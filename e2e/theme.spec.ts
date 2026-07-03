import { test, expect } from "@playwright/test"

/**
 * Theme switching from the sidebar user menu: picking Dark/Light must swap the
 * class on `document.documentElement` (which drives every Tailwind `dark:`
 * style) and persist the choice to localStorage.
 */

test("the theme menu toggles the documentElement class", async ({ page }) => {
  await page.goto("/")

  // User menu (sidebar footer) → Theme submenu → Dark.
  await page.getByRole("button", { name: /shadcn/ }).click()
  await page.getByText("Theme", { exact: true }).click()
  await page.getByRole("menuitemradio", { name: "Dark" }).click()

  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("dark")

  // Base UI radio items keep the menu open on select, so the submenu is still
  // showing — switch straight back to light.
  await page.getByRole("menuitemradio", { name: "Light" }).click()

  await expect(page.locator("html")).toHaveClass(/light/)
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("light")
})
