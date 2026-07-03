import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartStatCard } from "./smart-stat-card"

/**
 * SmartStatCard's contract is mostly the delta logic: a numeric delta is
 * formatted with a sign and % suffix and drives the trend colour/arrow from its
 * sign; a string delta is verbatim; an explicit `trend` overrides both.
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

/** The change-indicator row under the value (absent when `delta` is omitted). */
const deltaRow = () => container.querySelector<HTMLElement>(".mt-1")

test("renders the label and headline value", () => {
  mount(<SmartStatCard label="Sessions" value="248,392" />)
  expect(container.textContent).toContain("Sessions")
  expect(container.textContent).toContain("248,392")
  expect(deltaRow()).toBeNull()
})

test("a positive numeric delta formats as +N% with an upward green trend", () => {
  mount(
    <SmartStatCard
      label="Revenue"
      value="$48k"
      delta={12.4}
      deltaLabel="vs last period"
    />
  )

  const row = deltaRow()!
  expect(row.textContent).toContain("+12.4%")
  expect(row.textContent).toContain("vs last period")
  expect(row.className).toContain("text-green-600")
  expect(row.querySelector("svg")).not.toBeNull() // the trend arrow
})

test("a negative numeric delta formats as -N% with a downward red trend", () => {
  mount(<SmartStatCard label="Churn" value="3.2%" delta={-3.2} />)

  const row = deltaRow()!
  expect(row.textContent).toContain("-3.2%")
  expect(row.className).toContain("text-red-600")
  expect(row.querySelector("svg")).not.toBeNull()
})

test("a string delta renders verbatim and defaults to the up trend", () => {
  mount(<SmartStatCard label="Margin" value="38%" delta="+2.3 pp" />)

  const row = deltaRow()!
  expect(row.textContent).toContain("+2.3 pp")
  expect(row.className).toContain("text-green-600")
})

test("an explicit trend overrides the sign — neutral shows no arrow", () => {
  mount(<SmartStatCard label="Users" value="1,024" delta={5} trend="neutral" />)

  const row = deltaRow()!
  expect(row.textContent).toContain("+5%")
  expect(row.className).toContain("text-muted-foreground")
  expect(row.querySelector("svg")).toBeNull()
})
