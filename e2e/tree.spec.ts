import { test, expect } from "@playwright/test"

/**
 * SmartTree editable explorer, keyboard-first: expand with ArrowRight, verify
 * the tri-state checkbox cascade from a folder to its leaves, and rename a node
 * inline via F2. Pointer drag-and-drop reordering is exercised by the
 * transfer/tree unit + behavior suites; this spec covers the browser-only
 * keyboard and focus paths.
 */

test("expand, checkbox cascade, and F2 rename", async ({ page }) => {
  await page.goto("/smart/tree-explorer")

  const tree = page.getByRole("tree")
  await expect(tree).toBeVisible()

  // ── Expand the root with the keyboard ───────────────────────────────────
  const workspace = page.getByRole("treeitem", { name: /workspace/ })
  await workspace.click()
  await page.keyboard.press("ArrowRight")
  const src = page.getByRole("treeitem", { name: /^src/ })
  await expect(src).toBeVisible()

  // ── Checkbox cascade: checking the folder checks its descendants ─────────
  await page.getByRole("checkbox", { name: "src" }).click()
  await src.click()
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("checkbox", { name: "index.ts" })).toBeChecked()
  await expect(page.getByRole("checkbox", { name: "app.tsx" })).toBeChecked()

  // ── Inline rename via F2 ────────────────────────────────────────────────
  const pkg = page.getByRole("treeitem", { name: /package\.json/ })
  await pkg.click()
  await page.keyboard.press("F2")
  const renameInput = page.getByRole("textbox")
  await renameInput.fill("manifest.json")
  await renameInput.press("Enter")
  await expect(
    page.getByRole("treeitem", { name: /manifest\.json/ })
  ).toBeVisible()
})
