import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartSelect } from "./smart-select"

/**
 * SmartSelect = data-driven Select + field decoration. Covered here: the
 * label/hint/error wiring on the trigger, popup open with flat and grouped
 * options, and selection round-tripping through onValueChange.
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

const trigger = () =>
  container.querySelector('[data-slot="select-trigger"]') as HTMLElement

function openSelect() {
  act(() => {
    trigger().dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    trigger().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    trigger().click()
  })
}

const items = () =>
  Array.from(document.querySelectorAll('[data-slot="select-item"]'))

const OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer", disabled: true },
]

test("renders label wired to the trigger, with placeholder", () => {
  mount(
    <SmartSelect label="Role" placeholder="Choose role" options={OPTIONS} />
  )

  const label = container.querySelector("label") as HTMLLabelElement
  expect(label.textContent).toBe("Role")
  expect(label.htmlFor).toBe(trigger().id)
  expect(trigger().textContent).toContain("Choose role")
})

test("error marks the trigger invalid and replaces the description", () => {
  mount(
    <SmartSelect
      label="Role"
      options={OPTIONS}
      description="Pick one."
      error="Role is required."
    />
  )

  expect(trigger().getAttribute("aria-invalid")).toBe("true")
  const hint = container.querySelector("p")!
  expect(hint.textContent).toBe("Role is required.")
  expect(hint.className).toContain("text-destructive")
  expect(trigger().getAttribute("aria-describedby")).toBe(hint.id)
})

test("required renders the asterisk; fieldRequired is an alias", () => {
  mount(<SmartSelect label="Role" options={OPTIONS} fieldRequired />)
  expect(container.querySelector("label")?.textContent).toContain("*")
})

test("opens with all flat options; disabled options are marked", () => {
  mount(<SmartSelect label="Role" options={OPTIONS} />)
  openSelect()

  expect(items().map((i) => i.textContent)).toEqual([
    "Admin",
    "Editor",
    "Viewer",
  ])
  expect(items()[2].getAttribute("data-disabled")).not.toBeNull()
})

test("grouped options render group labels", () => {
  mount(
    <SmartSelect
      groups={[
        { label: "Staff", options: [{ value: "admin", label: "Admin" }] },
        { label: "Guests", options: [{ value: "viewer", label: "Viewer" }] },
      ]}
    />
  )
  openSelect()

  const groupLabels = Array.from(
    document.querySelectorAll('[data-slot="select-label"]')
  ).map((el) => el.textContent)
  expect(groupLabels).toEqual(["Staff", "Guests"])
  expect(items()).toHaveLength(2)
})

test("selecting an item emits onValueChange and shows the label in the trigger", () => {
  const onValueChange = vi.fn()
  function Harness() {
    const [value, setValue] = React.useState<string | undefined>(undefined)
    return (
      <SmartSelect
        options={OPTIONS}
        value={value}
        onValueChange={(v) => {
          onValueChange(v)
          setValue(v ?? undefined)
        }}
      />
    )
  }
  mount(<Harness />)
  openSelect()

  const editor = items().find((i) => i.textContent === "Editor") as HTMLElement
  act(() => {
    editor.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }))
    editor.click()
  })

  expect(onValueChange).toHaveBeenCalledWith("editor")
  // The trigger reflects the selection (Base UI falls back to the raw value
  // once the popup unmounts, so match case-insensitively) — and no longer
  // shows the placeholder.
  expect(trigger().textContent!.toLowerCase()).toContain("editor")
})

test("disabled disables the trigger", () => {
  mount(<SmartSelect options={OPTIONS} disabled />)
  expect(trigger().getAttribute("disabled")).not.toBeNull()
})
