import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartButton } from "./smart-button"

/**
 * SmartButton's whole job is the loading state: spinner + disabled + optional
 * label swap. Lock in each of those and that the idle state stays a plain button.
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

const button = () => container.querySelector("button") as HTMLButtonElement
const spinner = () => container.querySelector('[role="status"]')

test("idle: renders children, enabled, no spinner", () => {
  mount(<SmartButton>Save changes</SmartButton>)

  expect(button().textContent).toBe("Save changes")
  expect(button().disabled).toBe(false)
  expect(spinner()).toBeNull()
})

test("loading: disables the button, shows the spinner, swaps in loadingText", () => {
  mount(
    <SmartButton loading loadingText="Saving…">
      Save changes
    </SmartButton>
  )

  expect(button().disabled).toBe(true)
  expect(spinner()).not.toBeNull()
  expect(button().textContent).toContain("Saving…")
  expect(button().textContent).not.toContain("Save changes")
})

test("loading without loadingText keeps the children as the label", () => {
  mount(<SmartButton loading>Save changes</SmartButton>)

  expect(spinner()).not.toBeNull()
  expect(button().textContent).toContain("Save changes")
})

test("an explicit disabled stays disabled independent of loading", () => {
  mount(<SmartButton disabled>Save changes</SmartButton>)
  expect(button().disabled).toBe(true)
  expect(spinner()).toBeNull()
})
