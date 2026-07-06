import { test, expect } from "@playwright/test"

/**
 * Action-button presets page: covers the two behaviors jsdom can't — the
 * Base UI tooltip portal on icon-only buttons, and permission gating
 * re-rendering live when the role changes.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/smart/buttons")
  await expect(
    page.getByRole("heading", { name: "Action Buttons", level: 1 })
  ).toBeVisible({ timeout: 20_000 })
})

test("all preset groups render with their default labels", async ({ page }) => {
  const presets = page
    .locator("section", {
      has: page.getByRole("heading", { name: "All presets" }),
    })
    .first()
  for (const label of ["Add", "Sync", "Import", "Approve", "Previous"]) {
    await expect(
      presets.getByRole("button", { name: label, exact: true })
    ).toBeVisible()
  }
})

test("icon-only button exposes its label as aria-label and tooltip", async ({
  page,
}) => {
  const toolbar = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Icon-only toolbar" }),
    })
    .first()
  const archive = toolbar.getByRole("button", { name: "Archive" })
  await expect(archive).toBeVisible()
  await expect(archive).toHaveText("") // no visible label

  await archive.hover()
  // Base UI portals the popup to the body without role="tooltip"; the repo's
  // TooltipContent marks it with a data-slot instead.
  await expect(
    page.locator('[data-slot="tooltip-content"]', { hasText: "Archive" })
  ).toBeVisible()
})

test("switching role hides denied actions and disables deniedBehavior='disable' ones", async ({
  page,
}) => {
  const gating = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Permission gating" }),
    })
    .first()
  const deleteInToolbar = gating.getByRole("button", {
    name: "Delete",
    exact: true,
  })

  // Admin sees everything: one hideable Delete + one disable-mode Delete.
  await expect(deleteInToolbar).toHaveCount(2)
  for (const btn of await deleteInToolbar.all()) {
    await expect(btn).toBeEnabled()
  }

  await gating.getByRole("button", { name: "Viewer" }).click()

  // The hide-mode Delete unmounts; the disable-mode one stays but disabled.
  await expect(deleteInToolbar).toHaveCount(1)
  await expect(deleteInToolbar).toBeDisabled()
})
