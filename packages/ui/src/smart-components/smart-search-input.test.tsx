import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartSearchInput } from "./smart-search-input"

/**
 * SmartSearchInput is a controlled value/onValueChange input with a clear
 * button that only exists while there is something to clear.
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

const nativeSet = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value"
)!.set!

const input = () => container.querySelector("input") as HTMLInputElement
const clearButton = () =>
  container.querySelector<HTMLButtonElement>(
    'button[aria-label="Clear search"]'
  )

const Harness = (props: {
  onValueChange?: (v: string) => void
  initial?: string
}) => {
  const [value, setValue] = React.useState(props.initial ?? "")
  return (
    <SmartSearchInput
      value={value}
      onValueChange={(v) => {
        setValue(v)
        props.onValueChange?.(v)
      }}
      aria-label="Search users"
    />
  )
}

test("typing reports each value through onValueChange", () => {
  const onValueChange = vi.fn()
  mount(<Harness onValueChange={onValueChange} />)

  expect(input().placeholder).toBe("Search…")
  expect(input().getAttribute("aria-label")).toBe("Search users")

  act(() => {
    nativeSet.call(input(), "grace")
    input().dispatchEvent(new Event("input", { bubbles: true }))
  })

  expect(onValueChange).toHaveBeenCalledWith("grace")
  expect(input().value).toBe("grace")
})

test("the clear button only appears with a value, and clears it", () => {
  const onValueChange = vi.fn()
  mount(<Harness initial="grace" onValueChange={onValueChange} />)

  expect(clearButton()).not.toBeNull()
  act(() => clearButton()!.click())

  expect(onValueChange).toHaveBeenCalledWith("")
  expect(input().value).toBe("")
  // Once empty, the clear affordance goes away.
  expect(clearButton()).toBeNull()
})
