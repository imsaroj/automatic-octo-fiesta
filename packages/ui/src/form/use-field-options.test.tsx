import { afterEach, expect, test } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import { useFieldOptions } from "./use-field-options"
import type { FieldOptions } from "./field-types"

/**
 * useFieldOptions resolves a field's `options` (array or async resolver) into
 * `{ options, loading, error }` for the control to render.
 */

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// Render the hook's result into the DOM (pure) rather than capturing it into an
// outer variable during render.
const Probe = ({ options }: { options?: FieldOptions }) => {
  const { options: opts, loading, error } = useFieldOptions(options)
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{String(error)}</span>
      <span data-testid="options">{JSON.stringify(opts)}</span>
    </div>
  )
}

const mount = (options?: FieldOptions) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<Probe options={options} />))
}

const read = (testId: string) =>
  container.querySelector(`[data-testid="${testId}"]`)?.textContent

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })

test("returns a materialized array directly, not loading", () => {
  mount([{ value: 1, label: "One" }])
  expect(read("loading")).toBe("false")
  expect(read("error")).toBe("false")
  expect(read("options")).toBe(JSON.stringify([{ value: 1, label: "One" }]))
})

test("treats undefined options as an empty, non-loading list", () => {
  mount(undefined)
  expect(read("loading")).toBe("false")
  expect(read("options")).toBe("[]")
})

test("an async resolver starts loading, then resolves to its options", async () => {
  mount(async () => [{ value: 2, label: "Two" }])
  // Synchronously after mount: loading, no options yet.
  expect(read("loading")).toBe("true")
  expect(read("options")).toBe("[]")

  await flush()

  expect(read("loading")).toBe("false")
  expect(read("error")).toBe("false")
  expect(read("options")).toBe(JSON.stringify([{ value: 2, label: "Two" }]))
})

test("a rejected resolver surfaces error with an empty list", async () => {
  mount(async () => {
    throw new Error("boom")
  })
  await flush()
  expect(read("loading")).toBe("false")
  expect(read("error")).toBe("true")
  expect(read("options")).toBe("[]")
})

test("aborts the in-flight resolver on unmount (no post-unmount state write)", () => {
  let sawAbort = false
  mount(
    ({ signal }) =>
      new Promise((resolve) => {
        signal.addEventListener("abort", () => {
          sawAbort = true
        })
        // never resolves before unmount
        setTimeout(() => resolve([{ value: 1, label: "One" }]), 50)
      })
  )
  act(() => root.unmount())
  expect(sawAbort).toBe(true)
  // Re-establish a container so afterEach's unmount/remove stays safe.
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<div />))
})
