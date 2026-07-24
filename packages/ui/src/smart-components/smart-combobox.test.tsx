import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartCombobox } from "./smart-combobox"

/**
 * SmartCombobox = searchable select + field decoration. Covered: decoration
 * (label/error/required), popup open with options, single-select round-trip,
 * and the multiple variant's badge rendering.
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
  container.querySelector('[role="combobox"]') as HTMLButtonElement

const openCombobox = () => {
  act(() => {
    trigger().dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    trigger().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    trigger().click()
  })
}

const commandItems = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')
  )

const OPTIONS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "vite", label: "Vite" },
]

test("renders label, required asterisk, and error hint", () => {
  mount(
    <SmartCombobox
      label="Framework"
      required
      error="Pick a framework."
      options={OPTIONS}
    />
  )

  const label = container.querySelector("label")!
  expect(label.textContent).toContain("Framework")
  expect(label.textContent).toContain("*")

  const hint = container.querySelector("p")!
  expect(hint.textContent).toBe("Pick a framework.")
  expect(hint.className).toContain("text-destructive")
})

test("shows the placeholder until a value is selected", () => {
  mount(<SmartCombobox placeholder="Select framework…" options={OPTIONS} />)
  expect(trigger().textContent).toContain("Select framework…")

  act(() =>
    root.render(
      <SmartCombobox
        placeholder="Select framework…"
        options={OPTIONS}
        value="remix"
      />
    )
  )
  expect(trigger().textContent).toContain("Remix")
})

test("opens the popup with a search input and all options", () => {
  // `required` keeps the blank "Select" row out of the way — it has its own
  // tests below.
  mount(<SmartCombobox options={OPTIONS} required />)

  expect(trigger().getAttribute("aria-expanded")).toBe("false")
  openCombobox()

  expect(trigger().getAttribute("aria-expanded")).toBe("true")
  expect(document.querySelector('[data-slot="command-input"]')).not.toBeNull()
  expect(commandItems().map((i) => i.textContent)).toEqual([
    "Next.js",
    "Remix",
    "Vite",
  ])
})

test("selecting an option emits onValueChange and closes the popup", () => {
  const onValueChange = vi.fn()
  mount(<SmartCombobox options={OPTIONS} onValueChange={onValueChange} />)
  openCombobox()

  const remix = commandItems().find((i) => i.textContent === "Remix")!
  act(() => {
    // cmdk items select on click.
    remix.click()
  })

  expect(onValueChange).toHaveBeenCalledWith("remix")
  expect(trigger().getAttribute("aria-expanded")).toBe("false")
})

test("multiple: selected values render as badges on the trigger", () => {
  mount(
    <SmartCombobox
      multiple
      options={OPTIONS}
      value={["next", "vite"]}
      onValueChange={() => {}}
    />
  )
  expect(trigger().textContent).toContain("Next.js")
  expect(trigger().textContent).toContain("Vite")
  expect(trigger().textContent).not.toContain("Remix")
})

test("disabled disables the trigger", () => {
  mount(<SmartCombobox options={OPTIONS} disabled />)
  expect(trigger().disabled).toBe(true)
})

// ── emptyOption: the blank row that clears the selection ────────────────────

test("an optional combobox leads with the blank row; a required one omits it", () => {
  mount(<SmartCombobox options={OPTIONS} />)
  openCombobox()
  expect(commandItems().map((i) => i.textContent)).toEqual([
    "Select",
    "Next.js",
    "Remix",
    "Vite",
  ])
})

test("emptyOption and emptyOptionLabel override the default", () => {
  mount(<SmartCombobox options={OPTIONS} emptyOption={false} />)
  openCombobox()
  expect(commandItems().map((i) => i.textContent)).not.toContain("Select")

  act(() => root.unmount())
  container.remove()

  mount(<SmartCombobox options={OPTIONS} required emptyOptionLabel="Any" />)
  openCombobox()
  expect(commandItems().map((i) => i.textContent)).not.toContain("Any")

  act(() => root.unmount())
  container.remove()

  mount(<SmartCombobox options={OPTIONS} emptyOptionLabel="Any" />)
  openCombobox()
  expect(commandItems()[0].textContent).toBe("Any")
})

test("picking the blank row clears the value back to the placeholder", () => {
  const onValueChange = vi.fn()
  const Harness = () => {
    const [value, setValue] = React.useState("remix")
    return (
      <SmartCombobox
        options={OPTIONS}
        placeholder="Select framework…"
        value={value}
        onValueChange={(v) => {
          onValueChange(v)
          setValue(v)
        }}
      />
    )
  }
  mount(<Harness />)
  expect(trigger().textContent).toContain("Remix")

  openCombobox()
  act(() => commandItems()[0].click())

  expect(onValueChange).toHaveBeenCalledWith("")
  expect(trigger().textContent).toContain("Select framework…")
})

test("multiple never gets a blank row — clearing the badges already empties it", () => {
  mount(
    <SmartCombobox
      multiple
      options={OPTIONS}
      value={[]}
      onValueChange={() => {}}
    />
  )
  openCombobox()
  expect(commandItems().map((i) => i.textContent)).toEqual([
    "Next.js",
    "Remix",
    "Vite",
  ])
})
