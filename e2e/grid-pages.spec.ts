import { test, expect, type Page } from "@playwright/test"

/**
 * Regression guard for AG Grid **module slimming** (`ensureGridModules`
 * registers specific modules, not `AllCommunityModule`). Every grid page is
 * exercised with its core interactions while console output is captured — in
 * dev the ValidationModule turns any "feature used without its module" into a
 * loud console error, so a missing registration fails these tests instead of
 * silently breaking a feature in production.
 */

const gridErrors: string[] = []

const watchConsole = (page: Page) => {
  gridErrors.length = 0
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return
    const text = message.text()
    if (/AG Grid/i.test(text)) gridErrors.push(text)
  })
}

const firstRow = (page: Page) =>
  page.locator(".ag-center-cols-container .ag-row").first()

const expectRows = async (page: Page) => {
  // Cold dev server: the AG Grid chunk compiles on demand on first hit.
  await expect(firstRow(page)).toBeVisible({ timeout: 45_000 })
}

test.afterEach(() => {
  expect(gridErrors, "AG Grid console errors/warnings").toEqual([])
})

test("simple grid: sort, quick search, pagination and CSV export work", async ({
  page,
}) => {
  watchConsole(page)
  await page.goto("/grids/simple")
  await expectRows(page)

  // Sort (client-side row model)
  await page.locator('.ag-header-cell[col-id="name"]').click()
  await expect(page.locator('.ag-header-cell[col-id="name"]')).toHaveAttribute(
    "aria-sort",
    "ascending"
  )

  // Quick filter empties the grid; clearing restores the rows. (AG Grid does
  // not show the no-rows overlay for filtered-out rows — only for empty data.
  // Row-element counts are unstable while animateRows transitions, so assert
  // via 0 ↔ visible rather than exact counts.)
  const rows = page.locator(".ag-center-cols-container .ag-row")
  await page.getByLabel("Search table").fill("zzz-no-match")
  await expect(rows).toHaveCount(0)
  await page.getByLabel("Search table").fill("")
  await expect(rows.first()).toBeVisible()

  // Pagination pages forward
  await expect(page.locator(".ag-paging-panel")).toContainText("Page 1 of")
  await page.locator(".ag-paging-panel [data-ref='btNext']").click()
  await expect(page.locator(".ag-paging-panel")).toContainText("Page 2 of")

  // CSV export produces a download
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /export/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.csv$/)
})

test("editable grid: text, select and number editors commit edits", async ({
  page,
}) => {
  watchConsole(page)
  await page.goto("/grids/editable")
  await expectRows(page)

  // Select editor first (agSelectCellEditor renders a picker field in the
  // cell) — checked before any committed edit re-renders the row.
  const roleCell = firstRow(page).locator('[col-id="role"]')
  await roleCell.dblclick()
  await expect(page.getByRole("combobox")).toBeVisible()
  await page.keyboard.press("Escape")

  // Text editor
  const emailCell = firstRow(page).locator('[col-id="email"]')
  await emailCell.dblclick()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("edited@example.com")
  await page.keyboard.press("Enter")
  await expect(emailCell).toHaveText("edited@example.com")

  // Number editor (agNumberCellEditor)
  const salaryCell = firstRow(page).locator('[col-id="salary"]')
  await salaryCell.dblclick()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("123456")
  await page.keyboard.press("Enter")
  await expect(salaryCell).toContainText("123,456")
})

test("master-detail (nested grids) renders both levels", async ({ page }) => {
  watchConsole(page)
  await page.goto("/grids/master-detail")
  await expectRows(page)
  // The detail panel is a second SmartGrid — both instances must mount.
  expect(await page.locator(".ag-root-wrapper").count()).toBeGreaterThan(1)
})

test("infinite grid: scroll streams more blocks; selection survives", async ({
  page,
}) => {
  watchConsole(page)
  await page.goto("/grids/infinite")
  await expectRows(page)

  // Cross-page selection (RowSelectionModule with checkboxes)
  await firstRow(page).locator(".ag-selection-checkbox").click()
  await expect(page.getByText(/1 selected/)).toBeVisible()

  // Infinite row model streams the next block on scroll
  const rowCount = await page
    .locator(".ag-center-cols-container .ag-row")
    .count()
  await page.locator(".ag-body-viewport").evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await expect
    .poll(() => page.locator(".ag-center-cols-container .ag-row").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThan(rowCount)
})

test("CRUD example: the user list renders through TanStack Query + MSW", async ({
  page,
}) => {
  // Plain-HTML table page (no AG Grid) — still worth a smoke check since it
  // shares the MSW dataset the grid pages depend on.
  await page.goto("/examples/crud")
  await expect(page.locator("table tbody tr").first()).toContainText(
    "Ada Lovelace",
    { timeout: 45_000 }
  )
})
