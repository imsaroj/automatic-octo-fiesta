import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm } from "./smart-form"
import type { FormNode } from "./form-nodes"

/**
 * The layout tree: fields become grid cells whose `span` resolves against the
 * live column count, and `section` nodes nest a second grid inside the form —
 * without that nesting leaking into validation, which still sees one flat set
 * of fields.
 *
 * jsdom evaluates no container queries, so these assert the *inputs* the engine
 * writes (custom properties, structure); `resolve.test.ts` covers the value
 * math and `styles/layout.css` turns them into a layout in a real browser.
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
  street: z.string().min(1, "Street is required"),
  city: z.string(),
  zip: z.string(),
  note: z.string().optional(),
})
type Form = z.infer<typeof schema>

const cell = (name: string) =>
  container.querySelector<HTMLElement>(`[data-field="${name}"]`)!

const cssVar = (el: HTMLElement, name: string) =>
  el.style.getPropertyValue(name)

test("a field's span resolves against the form's column count", () => {
  const fields: FormNode<Form>[] = [
    { name: "street", type: "text", span: "full" },
    { name: "city", type: "text", span: "1/2" },
    { name: "zip", type: "text", span: 3 },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} columns={12} />)

  expect(cssVar(cell("street"), "--sui-col-base")).toBe("1 / -1")
  // "1/2" of a 12-column grid is six tracks — no per-field arithmetic.
  expect(cssVar(cell("city"), "--sui-col-base")).toBe("span 6")
  expect(cssVar(cell("zip"), "--sui-col-base")).toBe("span 3")
})

test("a span wider than the container's column count collapses to full width", () => {
  const fields: FormNode<Form>[] = [{ name: "city", type: "text", span: 6 }]
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      columns={{ base: 1, md: 12 }}
    />
  )
  // One declaration, two behaviors: full width on a narrow container, half a
  // row once the container passes 48rem.
  expect(cssVar(cell("city"), "--sui-col-base")).toBe("1 / -1")
  expect(cssVar(cell("city"), "--sui-col-md")).toBe("span 6")
})

test("a section renders its own nested grid", () => {
  const fields: FormNode<Form>[] = [
    { name: "street", type: "text" },
    {
      kind: "section",
      id: "address",
      title: "Address",
      columns: 4,
      fields: [
        { name: "city", type: "text", span: "1/2" },
        { name: "zip", type: "text", span: "1/2" },
      ],
    },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} columns={12} />)

  // Outer grid + the section's own grid.
  expect(container.querySelectorAll(".sui-grid")).toHaveLength(2)
  // The nested fields resolve against the section's 4 columns, not the form's 12.
  expect(cssVar(cell("city"), "--sui-col-base")).toBe("span 2")
  expect(container.querySelector("h3")?.textContent).toBe("Address")
})

test("a section inherits the form's columns when it declares none", () => {
  const fields: FormNode<Form>[] = [
    {
      kind: "section",
      id: "address",
      fields: [{ name: "city", type: "text", span: "1/2" }],
    },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} columns={12} />)
  expect(cssVar(cell("city"), "--sui-col-base")).toBe("span 6")
})

test("a section's modes gate every field nested inside it", () => {
  const fields: FormNode<Form>[] = [
    { name: "street", type: "text" },
    {
      kind: "section",
      id: "address",
      modes: ["create"],
      fields: [
        { name: "city", type: "text" },
        { name: "zip", type: "text" },
      ],
    },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} mode="edit" />)

  expect(cell("street")).toBeTruthy()
  expect(container.querySelector('[data-field="city"]')).toBeNull()
  expect(container.querySelector('[data-field="zip"]')).toBeNull()
})

test("a mode-excluded section's fields are stripped from the submitted value", async () => {
  const onSubmit = vi.fn()
  const fields: FormNode<Form>[] = [
    { name: "street", type: "text" },
    { name: "zip", type: "text" },
    {
      kind: "section",
      id: "address",
      modes: ["create"],
      fields: [{ name: "city", type: "text" }],
    },
  ]
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      mode="edit"
      initialData={{ street: "1 Main St" }}
      onSubmit={onSubmit}
    />
  )

  await act(async () => {
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
  })

  expect(onSubmit).toHaveBeenCalledTimes(1)
  // `city` never reaches the payload — the section's `modes` cascaded to it.
  expect(onSubmit.mock.calls[0][0]).toEqual({ street: "1 Main St", zip: "" })
})

test("custom and divider nodes render inline in the grid", () => {
  const fields: FormNode<Form>[] = [
    { name: "street", type: "text" },
    { kind: "divider", id: "sep", label: "Optional" },
    {
      kind: "custom",
      id: "echo",
      render: ({ values }) => <p data-testid="echo">{values.street}</p>,
    },
  ]
  mount(
    <SmartForm<Form>
      schema={schema}
      fields={fields}
      initialData={{ street: "1 Main St" }}
    />
  )

  expect(container.querySelector('[data-testid="echo"]')?.textContent).toBe(
    "1 Main St"
  )
  expect(container.textContent).toContain("Optional")
})

test("a collapsible section hides its panel until toggled", () => {
  const fields: FormNode<Form>[] = [
    {
      kind: "section",
      id: "address",
      title: "Address",
      collapsible: true,
      defaultCollapsed: true,
      fields: [{ name: "city", type: "text" }],
    },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} />)

  const panel = container.querySelector<HTMLElement>("#address-panel")!
  expect(panel.hidden).toBe(true)

  const toggle = container.querySelector<HTMLButtonElement>(
    '[aria-controls="address-panel"]'
  )!
  act(() => toggle.click())
  expect(container.querySelector<HTMLElement>("#address-panel")!.hidden).toBe(
    false
  )
})

test("a failed submit reopens a collapsed section hiding the error", async () => {
  const fields: FormNode<Form>[] = [
    {
      kind: "section",
      id: "address",
      title: "Address",
      collapsible: true,
      defaultCollapsed: true,
      // `street` is required by the schema and starts blank.
      fields: [{ name: "street", type: "text" }],
    },
  ]
  mount(<SmartForm<Form> schema={schema} fields={fields} />)

  expect(container.querySelector<HTMLElement>("#address-panel")!.hidden).toBe(
    true
  )

  await act(async () => {
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
  })

  expect(container.querySelector<HTMLElement>("#address-panel")!.hidden).toBe(
    false
  )
})
