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

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const trigger = () =>
  container.querySelector('[data-slot="select-trigger"]') as HTMLElement

const openSelect = () => {
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
  // Not required → the blank "Select" row leads the list (see the emptyOption
  // tests below); the real options follow it in order.
  mount(<SmartSelect label="Role" options={OPTIONS} required />)
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
      required
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
  const Harness = () => {
    // `null`, not `undefined`: the select must be controlled from the first
    // render so it never flips uncontrolled → controlled (Base UI warns).
    const [value, setValue] = React.useState<string | null>(null)
    return (
      <SmartSelect
        options={OPTIONS}
        value={value}
        onValueChange={(v) => {
          onValueChange(v)
          setValue(v)
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
  // The trigger reflects the selection by showing its label, and no longer
  // shows the placeholder.
  expect(trigger().textContent!.toLowerCase()).toContain("editor")
})

test("trigger shows the label, not the raw value, when they differ", () => {
  // Regression: Base UI's Select.Value stringifies the raw value on the trigger
  // unless the Root is given an `items` map. With value ("true") ≠ label
  // ("Active"), a missing map showed `true`; SmartSelect must show `Active`.
  const STATUS = [
    { value: "true", label: "Active" },
    { value: "false", label: "Disabled" },
  ]
  const Harness = () => {
    const [value, setValue] = React.useState<string | null>(null)
    return (
      <SmartSelect options={STATUS} value={value} onValueChange={setValue} />
    )
  }
  mount(<Harness />)
  openSelect()

  const active = items().find((i) => i.textContent === "Active") as HTMLElement
  act(() => {
    active.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }))
    active.click()
  })

  expect(trigger().textContent).toContain("Active")
  expect(trigger().textContent).not.toContain("true")
})

test("disabled disables the trigger", () => {
  mount(<SmartSelect options={OPTIONS} disabled />)
  expect(trigger().getAttribute("disabled")).not.toBeNull()
})

// ── emptyOption: the blank row that clears the selection ────────────────────

test("an optional select leads with the blank row; a required one omits it", () => {
  mount(<SmartSelect options={OPTIONS} />)
  openSelect()
  expect(items().map((i) => i.textContent)).toEqual([
    "Select",
    "Admin",
    "Editor",
    "Viewer",
  ])

  act(() => root.unmount())
  container.remove()

  // Required is the whole reason the row is conditional: there is no legal
  // empty state to offer, so offering one would contradict the asterisk.
  mount(<SmartSelect options={OPTIONS} required />)
  openSelect()
  expect(items().map((i) => i.textContent)).not.toContain("Select")
})

test("emptyOption overrides the required-derived default in both directions", () => {
  mount(<SmartSelect options={OPTIONS} emptyOption={false} />)
  openSelect()
  expect(items().map((i) => i.textContent)).not.toContain("Select")

  act(() => root.unmount())
  container.remove()

  mount(<SmartSelect options={OPTIONS} required emptyOption />)
  openSelect()
  expect(items()[0].textContent).toBe("Select")
})

test("emptyOptionLabel renames the blank row", () => {
  mount(<SmartSelect options={OPTIONS} emptyOptionLabel="— none —" />)
  openSelect()
  expect(items()[0].textContent).toBe("— none —")
})

test("picking the blank row emits null and restores the placeholder", () => {
  const onValueChange = vi.fn()
  const Harness = () => {
    const [value, setValue] = React.useState<string | null>("editor")
    return (
      <SmartSelect
        options={OPTIONS}
        placeholder="Choose role"
        value={value}
        onValueChange={(v) => {
          onValueChange(v)
          setValue(v)
        }}
      />
    )
  }
  mount(<Harness />)
  expect(trigger().textContent!.toLowerCase()).toContain("editor")

  openSelect()
  const blank = items()[0] as HTMLElement
  act(() => {
    blank.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }))
    blank.click()
  })

  expect(onValueChange).toHaveBeenCalledWith(null)
  // The blank row is deliberately absent from the Root's `items` map, so a
  // cleared select falls back to the placeholder rather than rendering
  // "Select" as if it were a chosen value.
  expect(trigger().textContent).toContain("Choose role")
  expect(trigger().textContent).not.toContain("Select")
})

test("the blank row leads a grouped list too", () => {
  mount(
    <SmartSelect
      groups={[
        { label: "Staff", options: [{ value: "admin", label: "Admin" }] },
      ]}
    />
  )
  openSelect()
  expect(items().map((i) => i.textContent)).toEqual(["Select", "Admin"])
})
