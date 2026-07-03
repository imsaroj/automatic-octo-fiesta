import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartLoadingOverlay } from "./loading-overlay"

/**
 * SmartLoadingOverlay has two modes: wrapping children (dim them behind an
 * absolute overlay) and standalone (render just the overlay, or nothing at
 * all while idle). `fullscreen` swaps absolute for fixed positioning.
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

const overlay = () => container.querySelector<HTMLElement>('[role="status"]')

test("idle with children: renders the children and no overlay", () => {
  mount(
    <SmartLoadingOverlay loading={false}>
      <p data-testid="content">Data</p>
    </SmartLoadingOverlay>
  )

  expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  expect(overlay()).toBeNull()
})

test("loading with children: keeps the children and layers the overlay on top", () => {
  mount(
    <SmartLoadingOverlay loading label="Fetching users…">
      <p data-testid="content">Data</p>
    </SmartLoadingOverlay>
  )

  // Children stay mounted (dimmed, not unmounted) under a positioned wrapper.
  expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  const el = overlay()!
  expect(el.getAttribute("aria-live")).toBe("polite")
  expect(el.textContent).toContain("Fetching users…")
  expect(el.className).toContain("absolute")
})

test("standalone: renders just the overlay while loading, nothing while idle", () => {
  mount(<SmartLoadingOverlay loading />)
  expect(overlay()).not.toBeNull()
  expect(overlay()!.textContent).toContain("Loading…") // default label

  act(() => root.render(<SmartLoadingOverlay loading={false} />))
  expect(container.innerHTML).toBe("")
})

test("fullscreen covers the viewport with fixed positioning", () => {
  mount(<SmartLoadingOverlay loading fullscreen />)
  expect(overlay()!.className).toContain("fixed")
  expect(overlay()!.className).not.toContain("absolute")
})
