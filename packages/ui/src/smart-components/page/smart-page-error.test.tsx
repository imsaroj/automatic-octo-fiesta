import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPageError } from "./smart-page-error"

/**
 * SmartPageError: an alert region with sensible defaults, an optional Retry
 * button (only with onRetry), and a page vs overlay visual variant.
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

const alert = () => container.querySelector<HTMLElement>('[role="alert"]')

test("defaults: generic title/description, no retry button", () => {
  mount(<SmartPageError />)

  expect(alert()).not.toBeNull()
  expect(alert()!.textContent).toContain("Something went wrong")
  expect(alert()!.textContent).toContain("An unexpected error occurred")
  expect(alert()!.querySelector("button")).toBeNull()
})

test("onRetry renders the retry button and wires the callback", () => {
  const onRetry = vi.fn()
  mount(
    <SmartPageError
      title="Failed to load users"
      description="The server returned 500."
      onRetry={onRetry}
      retryLabel="Reload"
    />
  )

  expect(alert()!.querySelector("h3")?.textContent).toBe("Failed to load users")
  expect(alert()!.textContent).toContain("The server returned 500.")

  const retry = alert()!.querySelector("button")!
  expect(retry.textContent).toContain("Reload")
  act(() => retry.click())
  expect(onRetry).toHaveBeenCalledTimes(1)
})

test("page variant is a dashed panel; overlay variant covers its parent", () => {
  mount(<SmartPageError />)
  expect(alert()!.className).toContain("border-dashed")

  act(() => root.render(<SmartPageError variant="overlay" />))
  expect(alert()!.className).toContain("absolute")
  expect(alert()!.className).toContain("inset-0")
})
