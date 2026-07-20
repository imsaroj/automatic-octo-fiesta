import { afterEach, expect, test } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { GridShell } from "./grid-shell"

/**
 * The shared outer chrome for both grids: a fixed-`height` body vs. the `fill`
 * flex layout, the toolbar slot, and the positioned body that overlays cover.
 */

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(ui))
}

const rootDiv = () => container.firstElementChild as HTMLElement
const bodyDiv = () =>
  rootDiv().querySelector<HTMLElement>(":scope > div:last-child")!

test("fixed height: body carries the height style and is positioned", () => {
  mount(
    <GridShell height={520}>
      <span data-testid="grid">grid</span>
    </GridShell>
  )
  expect(container.querySelector('[data-testid="grid"]')).not.toBeNull()
  const body = bodyDiv()
  expect(body.style.height).toBe("520px")
  // Positioned so a standalone absolute overlay covers exactly the grid area.
  expect(body.className).toContain("relative")
})

test("fill: root and body switch to the flex-grow layout, no fixed height", () => {
  mount(
    <GridShell fill>
      <span>grid</span>
    </GridShell>
  )
  expect(rootDiv().className).toContain("h-full")
  expect(rootDiv().style.height).toBe("100%")
  const body = bodyDiv()
  expect(body.className).toContain("flex-1")
  expect(body.style.height).toBe("")
})

test("renders the toolbar slot above the body and merges className", () => {
  mount(
    <GridShell className="custom-shell" toolbar={<div data-testid="tb" />}>
      <span>grid</span>
    </GridShell>
  )
  expect(rootDiv().className).toContain("custom-shell")
  expect(container.querySelector('[data-testid="tb"]')).not.toBeNull()
})
