import { afterEach, expect, test } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import {
  defaultFieldRegistry,
  registerField,
  type CommonFieldProps,
  type FieldEntry,
} from "./field-registry"
import type { FieldType } from "./field-types"
import { SmartForm } from "./smart-form"

/**
 * The registry is the single source of truth for both the empty value of each
 * field type (absorbing the old `defaultForType` switch) and how a definition
 * maps onto its control's props. These lock in that contract so the switch →
 * registry refactor stays behavior-preserving.
 */

// Every `FieldType` the engine advertises must have a registry entry — a missing
// one would silently render nothing.
const ALL_TYPES: FieldType[] = [
  "text",
  "email",
  "url",
  "password",
  "tel",
  "slug",
  "textarea",
  "text-editor",
  "number",
  "decimal",
  "integer",
  "currency",
  "percentage",
  "date",
  "time",
  "datetime",
  "month",
  "year",
  "daterange",
  "timerange",
  "select",
  "combobox",
  "autocomplete",
  "multiselect",
  "radio",
  "checkbox",
  "checkbox-group",
  "switch",
  "segmented",
  "yesno",
]

test("every field type has a registry entry with a component and mapProps", () => {
  for (const type of ALL_TYPES) {
    const entry = defaultFieldRegistry[type]
    expect(entry, `missing registry entry for "${type}"`).toBeDefined()
    expect(typeof entry.component).not.toBe("undefined")
    expect(typeof entry.mapProps).toBe("function")
  }
})

test("default values match the former defaultForType mapping", () => {
  const d = (t: FieldType) => defaultFieldRegistry[t].defaultValue
  // Booleans
  for (const t of ["checkbox", "switch", "yesno"] as const)
    expect(d(t)).toBe(false)
  // Arrays
  for (const t of ["multiselect", "checkbox-group"] as const)
    expect(d(t)).toEqual([])
  // Numeric → null
  for (const t of [
    "number",
    "decimal",
    "integer",
    "currency",
    "percentage",
    "year",
  ] as const)
    expect(d(t)).toBeNull()
  // Ranges → undefined
  for (const t of ["daterange", "timerange"] as const)
    expect(d(t)).toBeUndefined()
  // Everything else → empty string
  expect(d("text")).toBe("")
  expect(d("select")).toBe("")
  expect(d("date")).toBe("")
})

test("mapProps coerces the store value and forwards type-specific props", () => {
  const common: CommonFieldProps = { required: false }
  // currency defaults prefix "$" and decimalScale 2, and passes value straight through.
  const currency = defaultFieldRegistry.currency.mapProps({
    field: { name: "amount", type: "currency" },
    common,
    value: 42,
    setValue: () => {},
  })
  expect(currency.data).toBe(42)
  expect(currency.prefix).toBe("$")
  expect(currency.decimalScale).toBe(2)

  // A null string value is coerced to "" for text-like fields.
  const text = defaultFieldRegistry.text.mapProps({
    field: { name: "name", type: "text" },
    common,
    value: null,
    setValue: () => {},
  })
  expect(text.data).toBe("")

  // multiselect coerces a null value to an empty array.
  const multi = defaultFieldRegistry.multiselect.mapProps({
    field: { name: "tags", type: "multiselect" },
    common,
    value: undefined,
    setValue: () => {},
  })
  expect(multi.data).toEqual([])
})

test("registerField merges immutably without mutating the base registry", () => {
  const before = Object.keys(defaultFieldRegistry).length
  const custom: FieldEntry = {
    component: () => null,
    defaultValue: "custom-default",
    mapProps: (ctx) => ({ ...ctx.common }),
  }
  const merged = registerField({ rating: custom })

  expect(merged.rating).toBe(custom)
  expect(merged.text).toBe(defaultFieldRegistry.text) // built-ins preserved
  // Base registry is untouched.
  expect(Object.keys(defaultFieldRegistry).length).toBe(before)
  expect("rating" in defaultFieldRegistry).toBe(false)
})

// --- integration: a custom registry actually renders through SmartForm ---
let container: HTMLDivElement | undefined
let root: Root | undefined
afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  container = undefined
  root = undefined
})

const mount = (ui: React.ReactElement) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<React.StrictMode>{ui}</React.StrictMode>))
}

test("SmartForm renders a custom field type supplied via the registry prop", () => {
  const registry = registerField({
    stars: {
      component: (props: Record<string, unknown>) => (
        <output data-testid="stars">{String(props.data)}</output>
      ),
      defaultValue: 3,
      mapProps: (ctx) => ({ ...ctx.common, data: ctx.value }),
    },
  })

  const schema = z.object({ rating: z.number() })
  type Form = z.infer<typeof schema>

  mount(
    <SmartForm<Form>
      schema={schema}
      registry={registry}
      fields={[{ name: "rating", type: "stars" as never }]}
      submitLabel={null}
    />
  )

  const out = container!.querySelector('[data-testid="stars"]')
  expect(out).not.toBeNull()
  // Registry-supplied defaultValue (3) seeds the field.
  expect(out?.textContent).toBe("3")
})
