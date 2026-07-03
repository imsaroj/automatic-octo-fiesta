import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartSearchForm } from "./smart-search-form"
import type { SearchFieldDefinition } from "./types"

/**
 * Behavior contract of the search/filter bar on top of SmartForm:
 * - manual mode emits the pruned query only on submit, and an explicit Search
 *   is never deduped;
 * - auto mode never fires on mount, debounces edits, dedupes identical pruned
 *   queries, and is gated by the schema;
 * - Reset returns fields to their registry defaults (plus `searchOnReset`);
 * - `showCount` surfaces the active-filter count on the Search button.
 */

type Filters = { name: string; city: string }
const fields: SearchFieldDefinition<Filters>[] = [
  { name: "name", type: "text", label: "Name" },
  { name: "city", type: "text", label: "City" },
]

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

function mount(ui: React.ReactElement) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>))
}

const nativeSet = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value"
)!.set!

function typeInto(selector: string, value: string) {
  const input = container.querySelector(selector) as HTMLInputElement
  act(() => {
    nativeSet.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
  return input
}

const searchButton = () =>
  container.querySelector('button[type="submit"]') as HTMLButtonElement
const resetButton = () =>
  Array.from(container.querySelectorAll('button[type="button"]')).find((b) =>
    b.textContent?.includes("Reset")
  ) as HTMLButtonElement

test("manual mode: Search emits the pruned query, and only on submit", async () => {
  const onSearch = vi.fn()
  mount(<SmartSearchForm fields={fields} onSearch={onSearch} />)

  typeInto('[data-field="name"] input', "  ada  ")
  // Typing alone must not search in manual mode.
  expect(onSearch).not.toHaveBeenCalled()

  await act(async () => searchButton().click())

  // Blank `city` is pruned; `name` is trimmed.
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith({ name: "ada" })
})

test("manual mode: an explicit Search with unchanged filters still fires", async () => {
  const onSearch = vi.fn()
  mount(<SmartSearchForm fields={fields} onSearch={onSearch} />)

  typeInto('[data-field="name"] input', "ada")
  await act(async () => searchButton().click())
  await act(async () => searchButton().click())

  expect(onSearch).toHaveBeenCalledTimes(2)
  expect(onSearch).toHaveBeenNthCalledWith(2, { name: "ada" })
})

test("auto mode: hides the Search button, debounces, and never fires on mount", () => {
  vi.useFakeTimers()
  const onSearch = vi.fn()
  mount(
    <SmartSearchForm
      fields={fields}
      autoSearch
      debounce={300}
      onSearch={onSearch}
    />
  )

  expect(searchButton()).toBeNull()

  // Mount alone must not search, even after the debounce window.
  act(() => vi.advanceTimersByTime(1000))
  expect(onSearch).not.toHaveBeenCalled()

  typeInto('[data-field="name"] input', "ada")
  // Not yet — still inside the debounce window.
  act(() => vi.advanceTimersByTime(200))
  expect(onSearch).not.toHaveBeenCalled()

  act(() => vi.advanceTimersByTime(200))
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith({ name: "ada" })
})

test("auto mode: identical pruned queries are deduped, real changes fire", () => {
  vi.useFakeTimers()
  const onSearch = vi.fn()
  mount(
    <SmartSearchForm
      fields={fields}
      autoSearch
      debounce={300}
      onSearch={onSearch}
    />
  )

  typeInto('[data-field="name"] input', "ada")
  act(() => vi.advanceTimersByTime(400))
  expect(onSearch).toHaveBeenCalledTimes(1)

  // Trailing whitespace changes the raw value but prunes to the same query.
  typeInto('[data-field="name"] input', "ada ")
  act(() => vi.advanceTimersByTime(400))
  expect(onSearch).toHaveBeenCalledTimes(1)

  typeInto('[data-field="name"] input', "lovelace")
  act(() => vi.advanceTimersByTime(400))
  expect(onSearch).toHaveBeenCalledTimes(2)
  expect(onSearch).toHaveBeenLastCalledWith({ name: "lovelace" })
})

test("auto mode: an invalid filter state never fires a search", () => {
  vi.useFakeTimers()
  const onSearch = vi.fn()
  const schema = z.object({
    name: z.string().min(3),
    city: z.string().optional(),
  })
  mount(
    <SmartSearchForm
      fields={fields}
      schema={schema as never}
      autoSearch
      debounce={300}
      onSearch={onSearch}
    />
  )

  typeInto('[data-field="name"] input', "ad")
  act(() => vi.advanceTimersByTime(400))
  expect(onSearch).not.toHaveBeenCalled()

  typeInto('[data-field="name"] input', "ada")
  act(() => vi.advanceTimersByTime(400))
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith({ name: "ada" })
})

test("Reset clears fields to defaults, calls onReset, and searchOnReset re-emits", () => {
  const onSearch = vi.fn()
  const onReset = vi.fn()
  mount(
    <SmartSearchForm
      fields={fields}
      searchOnReset
      onSearch={onSearch}
      onReset={onReset}
    />
  )

  const input = typeInto('[data-field="name"] input', "ada")
  expect(input.value).toBe("ada")

  act(() => resetButton().click())

  expect(input.value).toBe("")
  expect(onReset).toHaveBeenCalledTimes(1)
  // searchOnReset re-runs the (now empty) query in manual mode.
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith({})
})

test("showCount renders the active-filter count on the Search button", () => {
  mount(
    <SmartSearchForm
      fields={fields}
      data={{ name: "ada", city: "london" }}
      setData={() => {}}
      showCount
    />
  )
  expect(searchButton().textContent).toContain("2")
})
