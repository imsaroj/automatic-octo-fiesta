import { afterEach, expect, test } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { GridLoadingCell, GridLoadingOverlay } from "./grid-loading"

/**
 * The grid's loading states: the first-load skeleton overlay (rows at the
 * grid's own row height, one sweep, one status pill) and the full-width
 * skeleton row an infinite grid paints for a block it is still fetching.
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

const overlay = () => container.querySelector<HTMLElement>('[role="status"]')!

test("announces itself as a busy region carrying the label", () => {
  mount(
    <GridLoadingOverlay label="Loading data…" rowHeight={44} columnCount={5} />
  )

  const el = overlay()
  expect(el.getAttribute("aria-busy")).toBe("true")
  expect(el.getAttribute("aria-live")).toBe("polite")
  expect(el.getAttribute("aria-label")).toBe("Loading data…")
  expect(el.textContent).toContain("Loading data…")
})

test("draws skeleton rows at the grid's row height, below the column header", () => {
  mount(<GridLoadingOverlay label="Loading…" rowHeight={36} columnCount={4} />)

  const rows = overlay().querySelectorAll<HTMLElement>("[style*='height']")
  expect(rows.length).toBeGreaterThan(0)
  expect(rows[0].style.height).toBe("36px")
  // Each row carries one placeholder bar per (clamped) column.
  expect(rows[0].querySelectorAll(".sui-skel").length).toBe(4)
  // The body starts below AG Grid's header rather than covering it.
  expect(overlay().querySelector(".sui-grid-loading__body")).not.toBeNull()
  // Entrance is a delayed fade, so a fast fetch never flashes a skeleton.
  expect(overlay().className).toContain("sui-delayed-in")
})

test("clamps the column count so the skeleton always reads as a table", () => {
  mount(<GridLoadingOverlay label="Loading…" rowHeight={44} columnCount={1} />)
  const firstRow = overlay().querySelector<HTMLElement>("[style*='height']")!
  expect(firstRow.querySelectorAll(".sui-skel").length).toBe(3)

  act(() =>
    root.render(
      <GridLoadingOverlay label="Loading…" rowHeight={44} columnCount={12} />
    )
  )
  const wideRow = overlay().querySelector<HTMLElement>("[style*='height']")!
  expect(wideRow.querySelectorAll(".sui-skel").length).toBe(6)
})

test("a pending cell draws one placeholder bar, pulsing on its own", () => {
  mount(
    <GridLoadingCell
      node={{ rowIndex: 7 }}
      column={{ getColId: () => "email" }}
    />
  )

  const bars = container.querySelectorAll<HTMLElement>(".sui-skel")
  expect(bars.length).toBe(1)
  // No sweep passes over rows mid-scroll, so the bar carries its own motion.
  expect(bars[0].className).toContain("sui-skel--pulse")
  // Decorative — the grid already announces its own busy state.
  expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
})

test("pending cells vary by row and column, and survive missing params", () => {
  mount(
    <GridLoadingCell node={{ rowIndex: 1 }} column={{ getColId: () => "a" }} />
  )
  const first = container.querySelector<HTMLElement>(".sui-skel")!.style.width

  act(() =>
    root.render(
      <GridLoadingCell
        node={{ rowIndex: 2 }}
        column={{ getColId: () => "a" }}
      />
    )
  )
  expect(
    container.querySelector<HTMLElement>(".sui-skel")!.style.width
  ).not.toBe(first)

  act(() => root.render(<GridLoadingCell />))
  expect(
    container.querySelector<HTMLElement>(".sui-skel")!.style.width
  ).not.toBe("")
})
