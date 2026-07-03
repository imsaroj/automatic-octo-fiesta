import { test, expect, type Page } from "@playwright/test"

/**
 * SmartServerGrid against the real MSW `/api/users` endpoint (300 seeded
 * users, Spring `Page<T>` shape): rows load through the service worker,
 * sorting round-trips to the query string, the search form filters
 * server-side, and the error overlay's Retry recovers.
 */

const pagingPanel = (page: Page) => page.locator(".ag-paging-panel")

async function gotoServerGrid(page: Page) {
  await page.goto("/grids/server")
  // First block fetched through MSW (450 ms simulated latency) — the pager
  // knowing the exact total proves a real `Page<T>` response was parsed.
  // Generous budget: on a cold dev server the AG Grid chunk compiles on
  // demand, and parallel workers all hit that transform at once.
  await expect(pagingPanel(page)).toContainText("300", { timeout: 45_000 })
}

test("loads the first page of users through the mock API", async ({ page }) => {
  await gotoServerGrid(page)

  const rows = page.locator(".ag-center-cols-container .ag-row")
  expect(await rows.count()).toBeGreaterThan(0)
  // Deterministic dataset: every row has a non-empty name cell.
  await expect(rows.first().locator('[col-id="name"]')).not.toBeEmpty()
})

test("sorting a column round-trips to the request query string", async ({
  page,
}) => {
  await gotoServerGrid(page)

  // Clicking the Name header must trigger a server re-query with the sort
  // encoded Spring-style (`sort=name,asc`).
  const [request] = await Promise.all([
    page.waitForRequest((req) =>
      decodeURIComponent(req.url()).includes("sort=name,asc")
    ),
    page.locator('.ag-header-cell[col-id="name"]').click(),
  ])
  expect(decodeURIComponent(request.url())).toContain("sort=name,asc")

  // Second click flips the direction.
  await Promise.all([
    page.waitForRequest((req) =>
      decodeURIComponent(req.url()).includes("sort=name,desc")
    ),
    page.locator('.ag-header-cell[col-id="name"]').click(),
  ])
})

test("the search form filters server-side down to the empty state", async ({
  page,
}) => {
  await gotoServerGrid(page)

  await page.getByPlaceholder("Search name…").fill("zzz-no-such-user")
  const [request] = await Promise.all([
    page.waitForRequest((req) =>
      decodeURIComponent(req.url()).includes("name=contains:zzz-no-such-user")
    ),
    page.getByRole("button", { name: "Search" }).click(),
  ])
  expect(request).toBeTruthy()

  // No seeded user matches → the grid shows its empty state.
  await expect(page.getByText("No users match")).toBeVisible({
    timeout: 20_000,
  })

  // Reset clears the filter and the rows come back.
  await page.getByRole("button", { name: "Reset" }).click()
  await expect(
    page.locator(".ag-center-cols-container .ag-row").first()
  ).toBeVisible({ timeout: 20_000 })
})

test("a failing fetch shows the Retry panel and recovery restores rows", async ({
  page,
}) => {
  await gotoServerGrid(page)

  // Flip the page's error simulation on — the reload now hits the MSW 500.
  await page.getByRole("button", { name: "Simulate error" }).click()
  await expect(page.getByText(/Couldn.t load data/)).toBeVisible({
    timeout: 20_000,
  })
  const retry = page.getByRole("button", { name: "Retry" })
  await expect(retry).toBeVisible()

  // Retry while the API still fails → the panel stays (retry really refetches).
  await retry.click()
  await expect(page.getByText(/Couldn.t load data/)).toBeVisible({
    timeout: 20_000,
  })

  // Fix the API and reload → the grid recovers.
  await page.getByRole("button", { name: "Erroring (click to fix)" }).click()
  await expect(page.getByText(/Couldn.t load data/)).toBeHidden({
    timeout: 20_000,
  })
  await expect(pagingPanel(page)).toContainText("300", { timeout: 20_000 })
})
