import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm } from "./smart-form"
import type { AsyncFieldOptions, FieldDefinition } from "./field-types"

/**
 * OptionField integration through SmartForm: option-based fields keep the real
 * (typed) value in the store — a numeric option round-trips as a `number`, not a
 * `String()`-ed key — and an async `options` resolver populates the control after
 * it settles.
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

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })

/** Options render as labelled buttons inside the segmented control's group. */
const segmentButtons = (): HTMLButtonElement[] =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="group"] button')
  )
const segmentByText = (text: string): HTMLButtonElement | undefined =>
  segmentButtons().find((el) => (el.textContent ?? "").trim() === text)

test("a numeric select keeps a number in the store (no String()/Number())", async () => {
  const schema = z.object({ roleId: z.number() })
  type Form = z.infer<typeof schema>
  const fields: FieldDefinition<Form>[] = [
    {
      name: "roleId",
      type: "segmented",
      label: "Role",
      options: [
        { value: 1, label: "Admin" },
        { value: 2, label: "Editor" },
      ],
    },
  ]
  const setData = vi.fn()
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      setData={setData}
      submitLabel={null}
    />
  )

  const editor = segmentByText("Editor")
  expect(editor).toBeDefined()
  await act(async () => editor!.click())

  // The store received the real number 2 — not the string "2".
  const last = setData.mock.calls.at(-1)?.[0] as Form
  expect(last.roleId).toBe(2)
  expect(typeof last.roleId).toBe("number")
})

test("async options populate the control after the resolver settles", async () => {
  const schema = z.object({ roleId: z.number() })
  type Form = z.infer<typeof schema>
  const loadRoles: AsyncFieldOptions<number> = vi.fn(async () => [
    { value: 1, label: "Admin" },
    { value: 2, label: "Editor" },
  ])
  const fields: FieldDefinition<Form>[] = [
    { name: "roleId", type: "segmented", label: "Role", options: loadRoles },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} submitLabel={null} />)

  // Before the resolver settles there are no option buttons yet.
  expect(segmentButtons().length).toBe(0)

  await flush()

  expect(loadRoles).toHaveBeenCalledTimes(1)
  expect(segmentByText("Admin")).toBeDefined()
  expect(segmentByText("Editor")).toBeDefined()
})
