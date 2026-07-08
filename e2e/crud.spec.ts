import { test, expect } from "@playwright/test"

/**
 * The CRUD reference page's read path: a TanStack Query list backed by the MSW
 * mock API, filtered server-side through the search box. Exercises the
 * loaded → filtered → empty → restored states a real consumer hits. (Create /
 * edit / delete run through SmartDialog + SmartConfirmDialog, which are covered
 * by their component render tests in packages/ui.)
 */

test("search filters the user list server-side, incl. the empty state", async ({
  page,
}) => {
  await page.goto("/examples/crud")
  await expect(
    page.getByRole("heading", { name: "Users", level: 1 })
  ).toBeVisible({ timeout: 20_000 })

  const search = page.getByPlaceholder("Search by name…")

  // A seeded name is present up front.
  await expect(
    page.getByRole("cell", { name: "Ada Lovelace" }).first()
  ).toBeVisible()

  // Filtering narrows the list to matching rows only.
  await search.fill("Torvalds")
  await expect(
    page.getByRole("cell", { name: /Torvalds/ }).first()
  ).toBeVisible()
  await expect(page.getByRole("cell", { name: "Ada Lovelace" })).toHaveCount(0)

  // A non-matching query surfaces the empty state.
  await search.fill("zzz-no-such-user")
  await expect(page.getByText("No users found")).toBeVisible()

  // Clearing restores the list.
  await search.fill("")
  await expect(
    page.getByRole("cell", { name: "Ada Lovelace" }).first()
  ).toBeVisible()
})
