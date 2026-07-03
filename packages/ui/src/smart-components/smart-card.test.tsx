import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartCard } from "./smart-card"

/**
 * SmartCard flattens the 5-part Card compound into a config prop. These lock in
 * the mapping (header/footer/children → the right Card slots) and, more
 * importantly, that omitted zones render no empty slot wrappers at all.
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

const slot = (name: string) => container.querySelector(`[data-slot="${name}"]`)

test("maps header/footer/children onto the Card compound slots", () => {
  mount(
    <SmartCard
      header={{
        title: "Orders",
        subtitle: "Latest orders",
        actions: <button data-testid="add">Add</button>,
      }}
      footer={<nav data-testid="pagination" />}
    >
      <p>Body</p>
    </SmartCard>
  )

  expect(slot("card")).not.toBeNull()
  expect(slot("card-title")?.textContent).toBe("Orders")
  expect(slot("card-description")?.textContent).toBe("Latest orders")
  expect(
    slot("card-action")?.querySelector('[data-testid="add"]')
  ).not.toBeNull()
  expect(slot("card-content")?.textContent).toBe("Body")
  expect(
    slot("card-footer")?.querySelector('[data-testid="pagination"]')
  ).not.toBeNull()
})

test("omitted zones render no slot wrappers", () => {
  mount(<SmartCard>Only body</SmartCard>)

  expect(slot("card-content")?.textContent).toBe("Only body")
  expect(slot("card-header")).toBeNull()
  expect(slot("card-footer")).toBeNull()
})

test("an empty header object counts as no header", () => {
  mount(<SmartCard header={{}}>Body</SmartCard>)
  expect(slot("card-header")).toBeNull()
})

test("a header can be partial — title only, no description/action wrappers", () => {
  mount(<SmartCard header={{ title: "Just a title" }} />)

  expect(slot("card-title")?.textContent).toBe("Just a title")
  expect(slot("card-description")).toBeNull()
  expect(slot("card-action")).toBeNull()
  // No children → no content slot either.
  expect(slot("card-content")).toBeNull()
})
