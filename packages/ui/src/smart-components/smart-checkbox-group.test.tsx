import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartCheckboxGroup } from "./smart-checkbox-group"

/**
 * SmartCheckboxGroup produces a `string[]` from a list of checkboxes. Covered:
 * controlled and uncontrolled toggling (order preserved), per-item id/htmlFor
 * wiring, disabled items, orientation, and the error hint on the group.
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

const boxes = () =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="checkbox"]'))

const ITEMS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS", description: "Standard rates apply." },
  { value: "push", label: "Push", disabled: true },
]

test("renders every item with its label wired via id/htmlFor", () => {
  mount(<SmartCheckboxGroup label="Notifications" items={ITEMS} />)

  expect(boxes()).toHaveLength(3)
  const labels = Array.from(container.querySelectorAll("label")).map(
    (l) => l.textContent
  )
  expect(labels).toEqual(["Notifications", "Email", "SMS", "Push"])
  // Each item's label points at its checkbox (Base UI puts the id on the
  // hidden native input that backs the role="checkbox" element).
  const emailLabel = Array.from(container.querySelectorAll("label")).find(
    (l) => l.textContent === "Email"
  ) as HTMLLabelElement
  const target = document.getElementById(emailLabel.htmlFor)
  expect(target).not.toBeNull()
  expect(target!.closest('[data-slot="field"]')).toBe(
    boxes()[0].closest('[data-slot="field"]')
  )
  // Item description renders and is linked.
  expect(container.textContent).toContain("Standard rates apply.")
  expect(boxes()[1].getAttribute("aria-describedby")).not.toBeNull()
})

test("uncontrolled: toggling accumulates and removes values", () => {
  const onValueChange = vi.fn()
  mount(
    <SmartCheckboxGroup
      items={ITEMS}
      defaultValue={["email"]}
      onValueChange={onValueChange}
    />
  )

  expect(boxes()[0].getAttribute("aria-checked")).toBe("true")

  act(() => boxes()[1].click()) // check SMS
  expect(onValueChange).toHaveBeenLastCalledWith(["email", "sms"])

  act(() => boxes()[0].click()) // uncheck Email
  expect(onValueChange).toHaveBeenLastCalledWith(["sms"])
})

test("controlled: value drives checked state; edits round-trip through setData-style state", () => {
  const Harness = () => {
    const [value, setValue] = React.useState<string[]>(["sms"])
    return (
      <SmartCheckboxGroup
        items={ITEMS}
        value={value}
        onValueChange={setValue}
      />
    )
  }
  mount(<Harness />)

  expect(boxes().map((b) => b.getAttribute("aria-checked"))).toEqual([
    "false",
    "true",
    "false",
  ])

  act(() => boxes()[0].click())
  expect(boxes()[0].getAttribute("aria-checked")).toBe("true")
})

test("disabled items cannot be toggled", () => {
  const onValueChange = vi.fn()
  mount(<SmartCheckboxGroup items={ITEMS} onValueChange={onValueChange} />)

  act(() => boxes()[2].click()) // Push is disabled
  expect(onValueChange).not.toHaveBeenCalled()
})

test("group-level disabled disables every item", () => {
  const onValueChange = vi.fn()
  mount(
    <SmartCheckboxGroup items={ITEMS} disabled onValueChange={onValueChange} />
  )
  act(() => boxes().forEach((b) => b.click()))
  expect(onValueChange).not.toHaveBeenCalled()
})

test("orientation switches the layout classes", () => {
  mount(<SmartCheckboxGroup items={ITEMS} orientation="horizontal" />)
  expect(container.querySelector('[role="group"]')!.className).toContain(
    "flex-row"
  )

  act(() => root.render(<SmartCheckboxGroup items={ITEMS} />))
  expect(container.querySelector('[role="group"]')!.className).toContain(
    "flex-col"
  )
})

test("error replaces the description and is linked to the group", () => {
  mount(
    <SmartCheckboxGroup
      label="Notifications"
      items={ITEMS}
      description="Choose at least one."
      error="Selection required."
    />
  )
  const group = container.querySelector('[role="group"]')!
  const hint = document.getElementById(group.getAttribute("aria-describedby")!)!
  expect(hint.textContent).toBe("Selection required.")
  expect(hint.className).toContain("text-destructive")
})
