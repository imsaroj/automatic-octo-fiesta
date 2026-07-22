import { afterEach, expect, test, vi } from "vitest"
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { z } from "zod"

import { SmartForm } from "./smart-form"
import type { FieldDefinition } from "./field-types"

/**
 * Passthrough coverage: a prop a field type advertises must actually reach the
 * control that renders it. The type-level tests in `field-types.test.tsx` only
 * prove a config is *accepted* — nothing there would catch a `mapProps` that
 * forgets to forward it, which is exactly how these props go missing.
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

const loose = z.looseObject({}) as never
const el = (selector: string) => container.querySelector(selector)

test("native attributes reach the underlying input", () => {
  const fields: FieldDefinition<Record<string, unknown>>[] = [
    {
      name: "code",
      type: "text",
      pattern: "[A-Z]+",
      inputMode: "numeric",
      minLength: 3,
      maxLength: 8,
      spellCheck: false,
      autoCapitalize: "characters",
    },
  ]
  mount(<SmartForm schema={loose} fields={fields} />)

  const input = el('[data-field="code"] input') as HTMLInputElement
  expect(input.getAttribute("pattern")).toBe("[A-Z]+")
  expect(input.getAttribute("inputmode")).toBe("numeric")
  expect(input.getAttribute("minlength")).toBe("3")
  expect(input.getAttribute("maxlength")).toBe("8")
  expect(input.getAttribute("spellcheck")).toBe("false")
  expect(input.getAttribute("autocapitalize")).toBe("characters")
})

test("textarea, tel, and slug forward their own additions", () => {
  const fields: FieldDefinition<Record<string, unknown>>[] = [
    { name: "bio", type: "textarea", wrap: "hard", spellCheck: false },
    { name: "phone", type: "tel", maxLength: 20, leadingText: "+44" },
    { name: "path", type: "slug", prefix: "/blog/", suffix: ".html" },
  ]
  mount(<SmartForm schema={loose} fields={fields} />)

  const textarea = el('[data-field="bio"] textarea') as HTMLTextAreaElement
  expect(textarea.getAttribute("wrap")).toBe("hard")
  expect(textarea.getAttribute("spellcheck")).toBe("false")

  const phone = el('[data-field="phone"] input') as HTMLInputElement
  expect(phone.getAttribute("maxlength")).toBe("20")
  expect(el('[data-field="phone"]')!.textContent).toContain("+44")

  // Both slug addons render — the leading prefix and the new trailing suffix.
  const slug = el('[data-field="path"]')!.textContent
  expect(slug).toContain("/blog/")
  expect(slug).toContain(".html")
})

test("select forwards trigger-level presentation props", () => {
  const fields: FieldDefinition<Record<string, unknown>>[] = [
    {
      name: "plan",
      type: "select",
      options: [{ value: "a", label: "A" }],
      size: "sm",
      triggerClassName: "custom-trigger",
    },
  ]
  mount(<SmartForm schema={loose} fields={fields} />)

  expect(el('[data-field="plan"] .custom-trigger')).not.toBeNull()
})

test("pickers expose their trigger's class, distinct from the field wrapper", () => {
  const fields: FieldDefinition<Record<string, unknown>>[] = [
    { name: "at", type: "time", triggerClassName: "time-trigger" },
    { name: "on", type: "date", pickerClassName: "date-trigger" },
    { name: "span", type: "daterange", triggerClassName: "range-trigger" },
    { name: "yr", type: "year", triggerClassName: "year-trigger" },
  ]
  mount(<SmartForm schema={loose} fields={fields} />)

  for (const [name, cls] of [
    ["at", "time-trigger"],
    ["on", "date-trigger"],
    ["span", "range-trigger"],
    ["yr", "year-trigger"],
  ]) {
    expect(
      el(`[data-field="${name}"] .${cls}`),
      `${name} trigger`
    ).not.toBeNull()
  }
})

/**
 * `multiple` is the one addition with behavior rather than presentation behind
 * it: the stored value becomes an array, which means the *empty* value has to
 * become `[]` too (via the entry's `resolveDefaultValue`). Validating against an
 * array schema proves it — a leftover `""` default fails `z.array` and blocks
 * the submit.
 */
const tagsSchema = z.object({ tags: z.array(z.string()) })

test("a multiple combobox starts at [] and submits an array", async () => {
  const onSubmit = vi.fn()
  const fields: FieldDefinition<z.infer<typeof tagsSchema>>[] = [
    {
      name: "tags",
      type: "combobox",
      multiple: true,
      maxSelected: 2,
      options: [
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta" },
      ],
    },
  ]
  mount(<SmartForm schema={tagsSchema} fields={fields} onSubmit={onSubmit} />)

  await act(async () =>
    (
      container.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click()
  )

  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tags: [] }))
})

test("a single combobox still starts at the empty string", async () => {
  const onSubmit = vi.fn()
  const schema = z.object({ tag: z.string() })
  const fields: FieldDefinition<z.infer<typeof schema>>[] = [
    { name: "tag", type: "combobox", options: [{ value: "a", label: "A" }] },
  ]
  mount(<SmartForm schema={schema} fields={fields} onSubmit={onSubmit} />)

  await act(async () =>
    (
      container.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click()
  )

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tag: "" }))
})
