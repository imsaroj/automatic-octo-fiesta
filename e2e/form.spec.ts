import { test, expect } from "@playwright/test"

/**
 * The form demo (`/form/basic`): Zod validation blocks an empty
 * submit with inline errors, and a valid submit emits the success toast and
 * resets the form — including the Base UI select, exercised through a real
 * portal popup.
 */

test("an empty submit surfaces inline Zod errors and blocks submission", async ({
  page,
}) => {
  await page.goto("/form/basic")
  await page.getByRole("button", { name: "Send message" }).click()

  await expect(page.getByText("Name is required")).toBeVisible()
  await expect(page.getByText("Choose a subject")).toBeVisible()
  // No success toast — the submit was rejected.
  await expect(page.getByText("Message sent!")).toHaveCount(0)
})

test("a valid submit shows the success toast and clears the form", async ({
  page,
}) => {
  await page.goto("/form/basic")

  const name = page.getByPlaceholder("Ada Lovelace")
  await name.fill("Ada Lovelace")

  // Base UI select: open the portal popup and pick an option.
  await page
    .locator('[data-field="subject"] [data-slot="select-trigger"]')
    .click()
  await page.getByRole("option", { name: "Bug report" }).click()

  await page.getByPlaceholder("How can we help?").fill("Playwright says hello!")

  await page.getByRole("button", { name: "Send message" }).click()

  await expect(page.getByText("Message sent!")).toBeVisible()
  await expect(page.getByText("Thanks, Ada Lovelace!")).toBeVisible()
  // onSubmit resets the controlled data back to EMPTY.
  await expect(name).toHaveValue("")
})
