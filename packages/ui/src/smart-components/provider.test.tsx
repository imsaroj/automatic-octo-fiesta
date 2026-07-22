import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"

import {
  SmartUIProvider,
  useSmartUI,
  useSmartUIDefaults,
  useSmartUILabels,
  useSmartUIFormats,
} from "./provider"
import { SmartSearchForm } from "@/search/smart-search-form"
import type { SearchFieldDefinition } from "@/search/types"

/**
 * SmartUIProvider's contract: with no provider components see English labels +
 * canonical defaults; a partial override deep-merges over those (keeping
 * siblings), function labels interpolate, and nested providers compose.
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
  act(() => root.render(ui))
}

/** Probe that renders resolved config values as text for assertion. */
const Probe = () => {
  const labels = useSmartUILabels()
  const defaults = useSmartUIDefaults()
  const formats = useSmartUIFormats()
  return (
    <div>
      <span data-testid="confirm-cancel">{labels.confirm.cancel}</span>
      <span data-testid="confirm-confirm">{labels.confirm.confirm}</span>
      <span data-testid="grid-retry">{labels.grid.retry}</span>
      <span data-testid="grid-selected">{labels.grid.selected(3)}</span>
      <span data-testid="grid-pageSize">{defaults.grid.pageSize}</span>
      <span data-testid="grid-density">{defaults.grid.density}</span>
      {/* `columns` is a layout value now — it can be a breakpoint map. */}
      <span data-testid="form-columns">
        {JSON.stringify(defaults.form.columns)}
      </span>
      <span data-testid="has-formatDate">
        {formats.formatDate ? "yes" : "no"}
      </span>
    </div>
  )
}

const text = (testId: string) =>
  container.querySelector(`[data-testid="${testId}"]`)?.textContent

test("falls back to English labels and canonical defaults with no provider", () => {
  mount(<Probe />)
  expect(text("confirm-cancel")).toBe("Cancel")
  expect(text("grid-retry")).toBe("Retry")
  expect(text("grid-selected")).toBe("3 selected")
  expect(text("grid-pageSize")).toBe("20")
  expect(text("grid-density")).toBe("normal")
  expect(text("form-columns")).toBe("1")
  expect(text("has-formatDate")).toBe("no")
})

test("a partial label override deep-merges over English, keeping siblings", () => {
  mount(
    <SmartUIProvider labels={{ confirm: { cancel: "취소" } }}>
      <Probe />
    </SmartUIProvider>
  )
  // Overridden…
  expect(text("confirm-cancel")).toBe("취소")
  // …sibling in the same group is untouched…
  expect(text("confirm-confirm")).toBe("Confirm")
  // …and other groups are untouched.
  expect(text("grid-retry")).toBe("Retry")
})

test("a function label can be overridden and still interpolates", () => {
  mount(
    <SmartUIProvider
      labels={{ grid: { selected: (count) => `${count}개 선택됨` } }}
    >
      <Probe />
    </SmartUIProvider>
  )
  expect(text("grid-selected")).toBe("3개 선택됨")
})

test("defaults override merges over canonical defaults", () => {
  mount(
    <SmartUIProvider
      defaults={{ grid: { pageSize: 50 }, form: { columns: 2 } }}
    >
      <Probe />
    </SmartUIProvider>
  )
  expect(text("grid-pageSize")).toBe("50")
  // Untouched sibling keeps the canonical value.
  expect(text("grid-density")).toBe("normal")
  expect(text("form-columns")).toBe("2")
})

test("useSmartUI exposes labels, defaults and formats together", () => {
  // Render the combined config into the DOM (pure) rather than capturing it
  // into an outer variable during render.
  const Grab = () => {
    const { labels, defaults, formats } = useSmartUI()
    return (
      <div>
        <span data-testid="all-confirm">{labels.confirm.confirm}</span>
        <span data-testid="all-pageSize">{defaults.grid.pageSize}</span>
        <span data-testid="all-formats">{JSON.stringify(formats)}</span>
      </div>
    )
  }
  mount(
    <SmartUIProvider defaults={{ grid: { pageSize: 30 } }}>
      <Grab />
    </SmartUIProvider>
  )
  expect(text("all-confirm")).toBe("Confirm")
  expect(text("all-pageSize")).toBe("30")
  expect(text("all-formats")).toBe("{}")
})

test("formats hooks flow through the context", () => {
  mount(
    <SmartUIProvider formats={{ formatDate: (d) => d.toISOString() }}>
      <Probe />
    </SmartUIProvider>
  )
  expect(text("has-formatDate")).toBe("yes")
})

test("a component reads overridden labels from the provider (search form buttons)", () => {
  const fields: SearchFieldDefinition<{ q: string }>[] = [
    { name: "q", type: "text", label: "Query" },
  ]
  mount(
    <SmartUIProvider labels={{ search: { search: "검색", reset: "초기화" } }}>
      <SmartSearchForm fields={fields} />
    </SmartUIProvider>
  )
  const buttonText = Array.from(container.querySelectorAll("button")).map(
    (b) => b.textContent
  )
  expect(buttonText).toContain("검색")
  expect(buttonText).toContain("초기화")
})

test("nested providers compose — a child's overrides merge over its parent's", () => {
  mount(
    <SmartUIProvider
      labels={{ confirm: { cancel: "취소", confirm: "확인" } }}
      defaults={{ grid: { pageSize: 50 } }}
    >
      <SmartUIProvider labels={{ confirm: { confirm: "삭제" } }}>
        <Probe />
      </SmartUIProvider>
    </SmartUIProvider>
  )
  // Child overrides its own key…
  expect(text("confirm-confirm")).toBe("삭제")
  // …inherits the parent's other override…
  expect(text("confirm-cancel")).toBe("취소")
  // …and the parent's defaults still apply.
  expect(text("grid-pageSize")).toBe("50")
})
