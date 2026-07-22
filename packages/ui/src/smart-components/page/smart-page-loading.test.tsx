import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPageLoading } from "./smart-page-loading"

/**
 * SmartPageLoading: an accessible busy region whose motion is entirely CSS —
 * no state, no timers, so it never re-renders while a route resolves.
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
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

test("announces itself as a busy status region carrying the label", () => {
  mount(<SmartPageLoading label="Preparing your workspace" />)

  const region = container.querySelector('[role="status"]')!
  expect(region).not.toBeNull()
  expect(region.getAttribute("aria-busy")).toBe("true")
  expect(region.getAttribute("aria-live")).toBe("polite")
  expect(region.getAttribute("aria-label")).toBe("Preparing your workspace")
  expect(region.textContent).toContain("Preparing your workspace")
})

test("falls back to the default label", () => {
  mount(<SmartPageLoading />)

  const region = container.querySelector('[role="status"]')!
  expect(region.getAttribute("aria-label")).toBe("Loading…")
  expect(region.textContent).toContain("Loading…")
})

test("every decorative layer is hidden from assistive tech", () => {
  mount(<SmartPageLoading />)

  const region = container.querySelector('[role="status"]')!
  // The bloom, the halo and the mark's glyph carry no meaning a screen
  // reader could use — only the label should reach the accessibility tree.
  for (const cls of [".sui-boot__halo", ".sui-boot__rail"]) {
    expect(region.querySelector(cls)).not.toBeNull()
  }
  expect(region.querySelectorAll('[aria-hidden="true"]').length).toBe(3)
  expect(region.querySelectorAll("p").length).toBe(1)
})

test("merges consumer classes onto the root without dropping its own", () => {
  mount(<SmartPageLoading className="bg-muted" />)

  const region = container.querySelector('[role="status"]')!
  expect(region.classList.contains("bg-muted")).toBe(true)
  expect(region.classList.contains("flex-1")).toBe(true)
})
