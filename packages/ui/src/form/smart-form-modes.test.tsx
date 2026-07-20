import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm, type SmartFormHandle } from "./smart-form"
import type { FieldDefinition } from "./field-types"

/**
 * I5: `initialData` seeds an uncontrolled form, the `ref` handle re-initializes
 * it without a `key` remount, and per-field `modes` + the `mode` prop drop a
 * field from render *and* validation so one schema serves create and edit.
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Min 6 chars"),
})
type Form = z.infer<typeof schema>

const fields: FieldDefinition<Form>[] = [
  { name: "name", type: "text", label: "Name" },
  // create-only — absent in edit mode
  { name: "password", type: "password", label: "Password", modes: ["create"] },
]

const inputValue = (name: string) =>
  container.querySelector<HTMLInputElement>(`[data-field="${name}"] input`)
    ?.value

const submitButton = () =>
  container.querySelector<HTMLButtonElement>('button[type="submit"]')!

test("initialData seeds the fields on mount", () => {
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      mode="edit"
      initialData={{ name: "Ada" }}
    />
  )
  expect(inputValue("name")).toBe("Ada")
})

test("mode filtering drops a create-only field from render", () => {
  mount(<SmartForm<Form> schema={schema} fields={fields} mode="edit" />)
  expect(container.querySelector('[data-field="name"]')).not.toBeNull()
  // password is create-only → not rendered in edit mode
  expect(container.querySelector('[data-field="password"]')).toBeNull()
})

test("edit mode drops the create-only field from validation and the submitted value", async () => {
  const onSubmit = vi.fn()
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      mode="edit"
      initialData={{ name: "Ada" }}
      onSubmit={onSubmit}
    />
  )

  await act(async () => submitButton().click())

  // Submit succeeds even though the base schema requires `password` (min 6):
  // the mode scopes it out. And the value carries no `password` key.
  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit).toHaveBeenCalledWith({ name: "Ada" })
})

test("create mode still requires the create-only field", async () => {
  const onSubmit = vi.fn()
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      mode="create"
      initialData={{ name: "Ada" }}
      onSubmit={onSubmit}
    />
  )

  await act(async () => submitButton().click())

  // password is empty → validation blocks submit and shows its error.
  expect(onSubmit).not.toHaveBeenCalled()
  const error = container.querySelector('[data-field="password"] p')
  expect(error?.textContent).toContain("Min 6 chars")
})

test("ref.reset(values) re-initializes to a new record, ref.reset() returns to the seed", () => {
  const ref = React.createRef<SmartFormHandle<Form>>()
  mount(
    <SmartForm<Form>
      ref={ref}
      schema={schema}
      fields={fields}
      mode="edit"
      initialData={{ name: "Ada" }}
    />
  )
  expect(inputValue("name")).toBe("Ada")

  // Load a different record — no key remount.
  act(() => ref.current!.reset({ name: "Grace" }))
  expect(inputValue("name")).toBe("Grace")

  // Reset with no args returns to the initial seed.
  act(() => ref.current!.reset())
  expect(inputValue("name")).toBe("Ada")
})

test("ref.submit() submits programmatically", async () => {
  const onSubmit = vi.fn()
  const ref = React.createRef<SmartFormHandle<Form>>()
  mount(
    <SmartForm<Form>
      ref={ref}
      schema={schema}
      fields={fields}
      mode="edit"
      initialData={{ name: "Ada" }}
      onSubmit={onSubmit}
      submitLabel={null}
    />
  )

  await act(async () => {
    ref.current!.submit()
    await new Promise((r) => setTimeout(r, 0))
  })

  expect(onSubmit).toHaveBeenCalledWith({ name: "Ada" })
})
