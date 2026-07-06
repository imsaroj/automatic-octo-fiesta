import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartCombobox } from "./smart-combobox"

/**
 * SmartCombobox = searchable select (Base UI Combobox) + field decoration.
 * Covered: decoration (label/error/required), the type-ahead input display,
 * opening the popup with all options, single-select round-trip, the multiple
 * variant's chip rendering, and the disabled state.
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

/** The combobox anchor is a `role="combobox"` input. */
const input = () =>
  container.querySelector('input[role="combobox"]') as HTMLInputElement

const openList = () => {
  act(() => {
    input().focus()
    input().dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    input().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    input().click()
  })
}

const listItems = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="combobox-item"]')
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
  expect(input().placeholder).toBe("Select framework…")
  expect(input().value).toBe("")

  act(() =>
    root.render(
      <SmartCombobox
        placeholder="Select framework…"
        options={OPTIONS}
        value="remix"
      />
    )
  )
  // The selected option's label fills the type-ahead input.
  expect(input().value).toBe("Remix")
})

test("opens the popup with all options", () => {
  mount(<SmartCombobox options={OPTIONS} />)

  expect(input().getAttribute("aria-expanded")).toBe("false")
  openList()

  expect(input().getAttribute("aria-expanded")).toBe("true")
  expect(listItems().map((i) => i.textContent)).toEqual([
    "Next.js",
    "Remix",
    "Vite",
  ])
})

test("selecting an option emits onValueChange and closes the popup", () => {
  const onValueChange = vi.fn()
  mount(<SmartCombobox options={OPTIONS} onValueChange={onValueChange} />)
  openList()

  const remix = listItems().find((i) => i.textContent === "Remix")!
  act(() => {
    remix.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    remix.click()
  })

  expect(onValueChange).toHaveBeenCalledWith("remix")
  expect(input().getAttribute("aria-expanded")).toBe("false")
})

test("multiple: selected values render as removable chips", () => {
  mount(
    <SmartCombobox
      multiple
      options={OPTIONS}
      value={["next", "vite"]}
      onValueChange={() => {}}
    />
  )
  const chips = Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]')
  ).map((c) => c.textContent)
  const text = chips.join(" ")
  expect(text).toContain("Next.js")
  expect(text).toContain("Vite")
  expect(text).not.toContain("Remix")
})

test("disabled disables the input", () => {
  mount(<SmartCombobox options={OPTIONS} disabled />)
  expect(input().disabled).toBe(true)
})
