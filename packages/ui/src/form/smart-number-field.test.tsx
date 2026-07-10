import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { SmartNumberField } from "./smart-number-field"

/**
 * The numeric field types (number / decimal / integer / currency / percentage)
 * must never let alphabetic (or other non-numeric) characters render in the
 * input. `parse` always cleaned the emitted value, but `handleChange` used to
 * echo the raw keystrokes back to the input, so letters stayed visible until
 * blur. These tests lock in immediate sanitization on every keystroke.
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

const typeInto = (input: HTMLInputElement, value: string) => {
  act(() => {
    nativeSet.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

const Harness = (props: { integer?: boolean }) => {
  const [data, setData] = React.useState<number | null>(null)
  return (
    <SmartNumberField
      id="n"
      label="Amount"
      data={data}
      setData={setData}
      integer={props.integer}
    />
  )
}

const getInput = () => container.querySelector("#n") as HTMLInputElement

test("strips alphabetic characters from a decimal field as the user types", () => {
  mount(<Harness />)
  const input = getInput()

  typeInto(input, "12a3")
  expect(input.value).toBe("123")

  typeInto(input, "abc")
  expect(input.value).toBe("")
})

test("keeps a single decimal point and a leading minus", () => {
  mount(<Harness />)
  const input = getInput()

  typeInto(input, "1.2x3")
  expect(input.value).toBe("1.23")

  // Extra decimal points are dropped, only the first survives.
  typeInto(input, "1.2.3")
  expect(input.value).toBe("1.23")

  // Minus is kept only when it leads the value.
  typeInto(input, "-5")
  expect(input.value).toBe("-5")
  typeInto(input, "5-3")
  expect(input.value).toBe("53")
})

test("integer field rejects letters and the decimal point", () => {
  mount(<Harness integer />)
  const input = getInput()

  typeInto(input, "4b2")
  expect(input.value).toBe("42")

  // The decimal point is not a valid integer character.
  typeInto(input, "4.2")
  expect(input.value).toBe("42")
})
