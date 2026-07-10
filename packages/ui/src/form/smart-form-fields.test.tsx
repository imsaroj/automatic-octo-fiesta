import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm } from "./smart-form"
import type { FieldDefinition, FieldType } from "./field-types"

/**
 * Per-field-type render coverage: SmartForm must produce an interactive
 * control for every advertised `FieldType`, derive the required asterisk from
 * the schema, and surface validation errors (with focus) on submit. This is
 * the safety net under the field-registry — a broken registry entry shows up
 * here as a field wrapper with no control in it.
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

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
]

/**
 * Every FieldType except `text-editor` (Lexical bootstraps a full editor —
 * exercised by its own module and the Playwright suite, not re-run here).
 */
const CASES: Array<{ type: FieldType; extra?: Record<string, unknown> }> = [
  { type: "text" },
  { type: "email" },
  { type: "url" },
  { type: "password" },
  { type: "tel" },
  { type: "slug" },
  { type: "textarea" },
  { type: "number" },
  { type: "decimal" },
  { type: "integer" },
  { type: "currency" },
  { type: "percentage" },
  { type: "date" },
  { type: "time" },
  { type: "datetime" },
  { type: "month" },
  { type: "year" },
  { type: "daterange" },
  { type: "timerange" },
  { type: "select", extra: { options: OPTIONS } },
  { type: "combobox", extra: { options: OPTIONS } },
  { type: "autocomplete", extra: { options: OPTIONS } },
  { type: "multiselect", extra: { options: OPTIONS } },
  { type: "radio", extra: { options: OPTIONS } },
  { type: "checkbox" },
  { type: "checkbox-group", extra: { options: OPTIONS } },
  { type: "switch" },
  { type: "segmented", extra: { options: OPTIONS } },
  { type: "yesno" },
]

test("every field type renders an interactive control in its wrapper", () => {
  const fields = CASES.map(
    ({ type, extra }) =>
      ({
        name: `f_${type.replace(/-/g, "_")}`,
        type,
        label: type,
        ...extra,
      }) as FieldDefinition<Record<string, unknown>>
  )

  mount(
    <SmartForm
      schema={z.looseObject({}) as never}
      fields={fields}
      submitLabel={null}
    />
  )

  for (const { type } of CASES) {
    const wrapper = container.querySelector(
      `[data-field="f_${type.replace(/-/g, "_")}"]`
    )
    expect(
      wrapper,
      `field type "${type}" did not render a wrapper`
    ).not.toBeNull()
    const control = wrapper!.querySelector(
      'input, textarea, select, button, [role="checkbox"], [role="switch"], [role="radio"], [contenteditable="true"]'
    )
    expect(control, `field type "${type}" rendered no control`).not.toBeNull()
  }
})

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  note: z.string().optional(),
})
type F = z.infer<typeof schema>
const fields: FieldDefinition<F>[] = [
  { name: "name", type: "text", label: "Name" },
  { name: "note", type: "text", label: "Note" },
]

test("required asterisk derives from the schema, not the field definition", () => {
  mount(<SmartForm schema={schema} fields={fields} />)

  const labelFor = (name: string) =>
    container.querySelector(`[data-field="${name}"] label`)!.textContent
  expect(labelFor("name")).toContain("*")
  expect(labelFor("note")).not.toContain("*")
})

test("submitting invalid values shows the error, focuses the field, and blocks onSubmit", async () => {
  const onSubmit = vi.fn()
  mount(<SmartForm schema={schema} fields={fields} onSubmit={onSubmit} />)

  const submit = container.querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement
  await act(async () => submit.click())

  expect(onSubmit).not.toHaveBeenCalled()
  const error = container.querySelector('[data-field="name"] p')
  expect(error?.textContent).toBe("Name is required")
  // Focus lands on the first errored field's control.
  const input = container.querySelector(
    '[data-field="name"] input'
  ) as HTMLInputElement
  expect(document.activeElement).toBe(input)
})

test("a valid submit hands the values to onSubmit", async () => {
  const onSubmit = vi.fn()
  mount(<SmartForm schema={schema} fields={fields} onSubmit={onSubmit} />)

  const input = container.querySelector(
    '[data-field="name"] input'
  ) as HTMLInputElement
  const nativeSet = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!
  act(() => {
    nativeSet.call(input, "Ada")
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })

  await act(async () =>
    (
      container.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click()
  )

  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ name: "Ada" })
  )
})
