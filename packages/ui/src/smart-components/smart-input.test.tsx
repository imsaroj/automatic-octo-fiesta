import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartInput } from "./smart-input"

/**
 * SmartInput's contract is the field decoration wiring: auto `id`/`htmlFor`
 * pairing, the description↔error swap with `aria-describedby`/`aria-invalid`,
 * and the required/optional label suffixes — plus transparent input passthrough.
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

const input = () => container.querySelector("input") as HTMLInputElement
const label = () => container.querySelector("label") as HTMLLabelElement
const hint = () => container.querySelector("p")

test("auto-generates an id and wires the label to it", () => {
  mount(<SmartInput label="Email" type="email" />)

  expect(input().id).not.toBe("")
  expect(label().htmlFor).toBe(input().id)
  expect(input().type).toBe("email")
})

test("an explicit id wins over the generated one", () => {
  mount(<SmartInput label="Email" id="my-email" />)
  expect(input().id).toBe("my-email")
  expect(label().htmlFor).toBe("my-email")
})

test("description renders as a muted hint linked via aria-describedby", () => {
  mount(<SmartInput label="Email" description="Work address preferred." />)

  expect(hint()?.textContent).toBe("Work address preferred.")
  expect(hint()?.className).toContain("text-muted-foreground")
  expect(input().getAttribute("aria-describedby")).toBe(hint()?.id)
  expect(input().getAttribute("aria-invalid")).toBeNull()
})

test("error replaces the description and marks the input invalid", () => {
  mount(
    <SmartInput
      label="Email"
      description="Work address preferred."
      error="Enter a valid email."
    />
  )

  expect(hint()?.textContent).toBe("Enter a valid email.")
  expect(hint()?.className).toContain("text-destructive")
  expect(input().getAttribute("aria-invalid")).toBe("true")
  expect(input().getAttribute("aria-describedby")).toBe(hint()?.id)
})

test("required adds the asterisk; optional adds the muted suffix", () => {
  mount(<SmartInput label="Email" required />)
  expect(label().textContent).toContain("*")

  act(() => root.render(<SmartInput label="Nickname" optional />))
  expect(label().textContent).toContain("(optional)")
  expect(label().textContent).not.toContain("*")
})

test("no decoration props → just the input, no label or hint", () => {
  mount(<SmartInput placeholder="Plain" />)
  expect(container.querySelector("label")).toBeNull()
  expect(hint()).toBeNull()
  expect(input().placeholder).toBe("Plain")
})

test("native input props pass straight through", () => {
  const onChange = vi.fn()
  mount(
    <SmartInput label="Name" value="ada" onChange={onChange} maxLength={10} />
  )

  expect(input().value).toBe("ada")
  expect(input().maxLength).toBe(10)

  const nativeSet = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!
  act(() => {
    nativeSet.call(input(), "ada l")
    input().dispatchEvent(new Event("input", { bubbles: true }))
  })
  expect(onChange).toHaveBeenCalled()
})
