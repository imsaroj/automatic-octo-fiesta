import { afterEach, beforeEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { SmartPageErrorBoundary } from "./smart-page-error-boundary"

/**
 * SmartPageErrorBoundary catches render-time throws, hands them to the default
 * SmartPageError fallback wired to `reset`, and heals on `resetKeys`.
 */

let container: HTMLDivElement
let root: Root
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  // React logs every caught error; the suite would otherwise be unreadable.
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  consoleError.mockRestore()
})

const render = (ui: React.ReactElement) => act(() => root.render(ui))
const text = () => container.textContent ?? ""
const buttonWith = (label: string) =>
  [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label)
  )

const Boom = ({ throws }: { throws: boolean }) => {
  if (throws) throw new Error("cell renderer exploded")
  return <p>recovered</p>
}

test("renders children untouched while nothing throws", () => {
  render(
    <SmartPageErrorBoundary>
      <p>all good</p>
    </SmartPageErrorBoundary>
  )
  expect(text()).toBe("all good")
})

test("catches a throw and renders SmartPageError with the message", () => {
  render(
    <SmartPageErrorBoundary>
      <Boom throws />
    </SmartPageErrorBoundary>
  )

  expect(container.querySelector('[role="alert"]')).not.toBeNull()
  expect(text()).toContain("cell renderer exploded")
})

test("onError receives the error and React's component stack", () => {
  const onError = vi.fn()
  render(
    <SmartPageErrorBoundary onError={onError}>
      <Boom throws />
    </SmartPageErrorBoundary>
  )

  expect(onError).toHaveBeenCalledTimes(1)
  const [error, componentStack] = onError.mock.calls[0]!
  expect((error as Error).message).toBe("cell renderer exploded")
  expect(componentStack).toContain("Boom")
})

test("the retry button re-renders the subtree", () => {
  const Host = () => {
    const [throws, setThrows] = React.useState(true)
    return (
      <SmartPageErrorBoundary onReset={() => setThrows(false)}>
        <Boom throws={throws} />
      </SmartPageErrorBoundary>
    )
  }

  render(<Host />)
  expect(text()).toContain("cell renderer exploded")

  act(() => buttonWith("Try again")!.click())
  expect(text()).toBe("recovered")
})

test("resetKeys heal a boundary that would otherwise stay broken after navigation", () => {
  const Host = ({ route, throws }: { route: string; throws: boolean }) => (
    <SmartPageErrorBoundary resetKeys={[route]}>
      <Boom throws={throws} />
    </SmartPageErrorBoundary>
  )

  render(<Host route="/reports" throws />)
  expect(text()).toContain("cell renderer exploded")

  render(<Host route="/settings" throws={false} />)
  expect(text()).toBe("recovered")
})

test("a function fallback gets the error and its own reset", () => {
  render(
    <SmartPageErrorBoundary
      fallback={({ error, reset }) => (
        <button onClick={reset}>custom: {(error as Error).message}</button>
      )}
    >
      <Boom throws />
    </SmartPageErrorBoundary>
  )

  expect(text()).toContain("custom: cell renderer exploded")
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

test("the component stack rides along in the copyable details", () => {
  render(
    <SmartPageErrorBoundary>
      <Boom throws />
    </SmartPageErrorBoundary>
  )

  const details = container.querySelector("details")!
  expect(details.textContent).toContain("Component stack:")
  expect(details.textContent).toContain("Boom")
})
