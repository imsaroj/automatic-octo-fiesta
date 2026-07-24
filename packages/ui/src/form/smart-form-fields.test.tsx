import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm } from "./smart-form"
import type { FieldDefinition, FieldType } from "./field-types"

/**
 * Per-field-type render coverage: SmartForm must produce an interactive
 * control for every advertised `FieldType`, take the required asterisk from the
 * field definition, and surface validation errors (with focus) on submit. This is
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

test("required asterisk comes from the field definition, not the schema", () => {
  // Deliberately crossed over: `name` is required by the schema but unmarked,
  // `note` is optional but marked. Presentation follows the definition alone.
  mount(
    <SmartForm
      schema={schema}
      fields={[
        { name: "name", type: "text", label: "Name" },
        { name: "note", type: "text", label: "Note", required: true },
      ]}
    />
  )

  const labelFor = (name: string) =>
    container.querySelector(`[data-field="${name}"] label`)!.textContent
  expect(labelFor("name")).not.toContain("*")
  expect(labelFor("note")).toContain("*")
})

test("required: true is presentation only — it never tightens validation", async () => {
  // `email` is `.optional()`, so a blank must still normalize to undefined and
  // pass, even though the definition marks it required for the user's benefit.
  const emailSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email().optional(),
  })
  const onSubmit = vi.fn()
  mount(
    <SmartForm
      schema={emailSchema}
      initialData={{ name: "Ada", email: "" }}
      fields={[
        { name: "name", type: "text", label: "Name" },
        { name: "email", type: "text", label: "Email", required: true },
      ]}
      onSubmit={onSubmit}
      submitLabel="Submit"
    />
  )

  await act(async () =>
    (
      container.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click()
  )

  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: "Ada" })
})

test("submitting invalid values shows the error, focuses the field, and blocks onSubmit", async () => {
  const onSubmit = vi.fn()
  mount(
    <SmartForm
      schema={schema}
      fields={fields}
      onSubmit={onSubmit}
      submitLabel="Submit"
    />
  )

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
  mount(
    <SmartForm
      schema={schema}
      fields={fields}
      onSubmit={onSubmit}
      submitLabel="Submit"
    />
  )

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

/**
 * The `date` field forwards SmartDatePicker's own controls. Asserted end to end
 * — definition → registry `mapProps` → field → picker — because the type-level
 * tests only prove the config is *accepted*, not that it reaches the picker.
 */
const dateSchema = z.object({ due: z.string() })
type D = z.infer<typeof dateSchema>

const buttonLabels = () =>
  Array.from(container.querySelectorAll("button")).map((b) =>
    b.getAttribute("aria-label")
  )

test("a date field renders no picker controls unless asked", () => {
  const fields: FieldDefinition<D>[] = [{ name: "due", type: "date" }]
  mount(<SmartForm schema={dateSchema} fields={fields} />)

  expect(buttonLabels()).not.toContain("Next day")
  expect(buttonLabels()).not.toContain("Reset to today")
})

test("steppers / todayButton reach the picker and drive the stored value", async () => {
  const onSubmit = vi.fn()
  const fields: FieldDefinition<D>[] = [
    { name: "due", type: "date", steppers: "next", todayButton: true },
  ]
  mount(
    <SmartForm
      schema={dateSchema}
      fields={fields}
      onSubmit={onSubmit}
      submitLabel="Submit"
    />
  )

  // `steppers: "next"` is the +1 button only — the "prev" half stays hidden.
  expect(buttonLabels()).toContain("Next day")
  expect(buttonLabels()).toContain("Reset to today")
  expect(buttonLabels()).not.toContain("Previous day")

  const byLabel = (label: string) =>
    container.querySelector(
      `button[aria-label="${label}"]`
    ) as HTMLButtonElement

  await act(async () => byLabel("Reset to today").click())
  await act(async () =>
    (
      container.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click()
  )

  const now = new Date()
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ due: iso }))
})

// ── The button row is opt-in ────────────────────────────────────────────────

const submitButton = () =>
  container.querySelector<HTMLButtonElement>('button[type="submit"]')
// By text, not by `type="button"` — a field's own trigger (the date picker's,
// for one) is a type="button" too and would match first.
const buttonByText = (text: string) =>
  Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === text
  )

test("no submitLabel renders no button row at all", () => {
  mount(
    <SmartForm schema={dateSchema} fields={[{ name: "due", type: "date" }]} />
  )
  expect(submitButton()).toBeNull()
})

test("submitLabel names the button; `true` takes the provider label", () => {
  mount(
    <SmartForm
      schema={dateSchema}
      fields={[{ name: "due", type: "date" }]}
      submitLabel="Send it"
    />
  )
  expect(submitButton()!.textContent).toBe("Send it")

  act(() => root.unmount())
  container.remove()

  // `true` is the only way to reach `labels.form.submit` now that omitting the
  // prop means "no button" — without it that label would be unreachable.
  mount(
    <SmartForm
      schema={dateSchema}
      fields={[{ name: "due", type: "date" }]}
      submitLabel
    />
  )
  expect(submitButton()!.textContent).toBe("Submit")
})

test("resetLabel alone still renders its button, with no submit beside it", () => {
  // Regression guard: the reset button used to live inside the submit row, so
  // defaulting submit off would have taken reset down with it.
  mount(
    <SmartForm
      schema={dateSchema}
      fields={[{ name: "due", type: "date" }]}
      resetLabel="Clear"
    />
  )
  expect(buttonByText("Clear")).toBeDefined()
  expect(submitButton()).toBeNull()
})
