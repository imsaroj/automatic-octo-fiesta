import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm } from "./smart-form"
import type { FieldDefinition } from "./field-types"

/**
 * `emptyValue={null}` serializes blank fields as `null` on the way *out* (the
 * mirrored `setData` value and the `onSubmit` payload) while the internal store
 * and validation keep using `""` — so native inputs stay controlled and a
 * `z.string().min(1)` still reports its own message. Any `null` arriving back
 * through `data` is coerced to the field's blank so the round-trip is safe.
 */

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  note: z.string().optional().or(z.literal("")),
})
type Form = z.infer<typeof schema>
const fields: FieldDefinition<Form>[] = [
  { name: "name", type: "text", label: "Name" },
  { name: "note", type: "text", label: "Note" },
]

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

const nativeSet = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value"
)!.set!
const typeInto = (input: HTMLInputElement, value: string) =>
  act(() => {
    nativeSet.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })

test("blank fields mirror out as null, not empty string", () => {
  const calls: unknown[] = []
  const Harness = () => {
    const [data, setData] = React.useState<Form>({
      name: null as never,
      note: null as never,
    })
    return (
      <SmartForm
        schema={schema}
        data={data}
        setData={(d) => {
          calls.push(d)
          setData(d)
        }}
        fields={fields}
        emptyValue={null}
      />
    )
  }
  mount(<Harness />)
  const nameInput = container.querySelector(
    '[data-field="name"] input'
  ) as HTMLInputElement

  // Inbound null is coerced to "" so the input is controlled (not "null").
  expect(nameInput.value).toBe("")

  typeInto(nameInput, "Ada")
  typeInto(nameInput, "")

  const last = calls.at(-1) as Record<string, unknown>
  expect(last.name).toBeNull()
  expect(last.note).toBeNull()
})

test("required validation still fires on the empty string (not a null type error)", async () => {
  let submitted: Form | undefined
  const Harness = () => (
    <SmartForm
      schema={schema}
      fields={fields}
      emptyValue={null}
      submitLabel="Save"
      onSubmit={(v) => {
        submitted = v
      }}
    />
  )
  mount(<Harness />)
  const form = container.querySelector("form") as HTMLFormElement
  await act(async () => {
    form.requestSubmit()
  })

  // Submit blocked by the required rule — its own message, not a type error.
  expect(submitted).toBeUndefined()
  expect(container.textContent).toContain("Name is required")
  expect(container.textContent).not.toMatch(/received null/i)
})

test("a filled optional field passes through; only the blank one becomes null", async () => {
  let submitted: Record<string, unknown> | undefined
  const Harness = () => (
    <SmartForm
      schema={schema}
      fields={fields}
      emptyValue={null}
      submitLabel="Save"
      onSubmit={(v) => {
        submitted = v as Record<string, unknown>
      }}
    />
  )
  mount(<Harness />)
  const nameInput = container.querySelector(
    '[data-field="name"] input'
  ) as HTMLInputElement
  typeInto(nameInput, "Ada")

  const form = container.querySelector("form") as HTMLFormElement
  await act(async () => {
    form.requestSubmit()
  })

  expect(submitted).toBeDefined()
  expect(submitted!.name).toBe("Ada")
  expect(submitted!.note).toBeNull()
})

test("default emptyValue keeps empty strings (no behavior change)", () => {
  const calls: unknown[] = []
  const Harness = () => {
    const [data, setData] = React.useState<Form>({ name: "", note: "" })
    return (
      <SmartForm
        schema={schema}
        data={data}
        setData={(d) => {
          calls.push(d)
          setData(d)
        }}
        fields={fields}
      />
    )
  }
  mount(<Harness />)
  const nameInput = container.querySelector(
    '[data-field="name"] input'
  ) as HTMLInputElement
  typeInto(nameInput, "x")
  typeInto(nameInput, "")

  const last = calls.at(-1) as Record<string, unknown>
  expect(last.name).toBe("")
})
