import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPage, SMART_PAGE_SLOT } from "./smart-page"

/**
 * SmartPage auto-detects its layout from the slot-tagged children and dispatches
 * to the matching renderer. These lock in that detection + dispatch after the
 * layout renderers were extracted into `./layouts/*` — a `sidebar` slot must
 * still produce the split layout (bordered sidebar column), a `grid-area` slot
 * the standard layout, and `loading`/`error` must replace the children.
 */

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function mount(ui: React.ReactElement) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

/** Build a slot-tagged component the way the real slot components are tagged. */
function slot(name: string, testid: string) {
  return Object.assign(() => <div data-testid={testid} />, {
    [SMART_PAGE_SLOT]: name,
  })
}

test("a sidebar slot renders the split layout with a bordered sidebar column", () => {
  const Sidebar = slot("sidebar", "sidebar-content")
  const Content = slot("content", "main-content")
  mount(
    <SmartPage>
      <Content />
      <Sidebar />
    </SmartPage>
  )

  // Split layout wraps the sidebar in a bordered right column.
  const sidebarCol = container.querySelector(".border-l")
  expect(sidebarCol).not.toBeNull()
  expect(
    sidebarCol!.querySelector('[data-testid="sidebar-content"]')
  ).not.toBeNull()
  expect(container.querySelector('[data-testid="main-content"]')).not.toBeNull()
})

test("a grid-area slot renders the standard layout (no split sidebar column)", () => {
  const Grid = slot("grid-area", "grid-content")
  mount(
    <SmartPage>
      <Grid />
    </SmartPage>
  )

  expect(container.querySelector('[data-testid="grid-content"]')).not.toBeNull()
  // Standard layout has no bordered sidebar column.
  expect(container.querySelector(".border-l")).toBeNull()
})

test("the loading prop replaces children with a status region", () => {
  const Content = slot("content", "main-content")
  mount(
    <SmartPage loading loadingLabel="Fetching…">
      <Content />
    </SmartPage>
  )

  const status = container.querySelector('[role="status"]')
  expect(status).not.toBeNull()
  expect(status!.textContent).toContain("Fetching…")
  // Children are not rendered while loading.
  expect(container.querySelector('[data-testid="main-content"]')).toBeNull()
})

test("the error prop replaces children with the error node", () => {
  const Content = slot("content", "main-content")
  mount(
    <SmartPage error={<div data-testid="err">Boom</div>}>
      <Content />
    </SmartPage>
  )

  expect(container.querySelector('[data-testid="err"]')).not.toBeNull()
  expect(container.querySelector('[data-testid="main-content"]')).toBeNull()
})
