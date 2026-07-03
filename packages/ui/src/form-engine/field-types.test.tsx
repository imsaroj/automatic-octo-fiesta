import { expect, test } from "vitest"
import type { FieldDefinition } from "./field-types"

/**
 * `FieldDefinition<T>` is a discriminated union: each field family permits only
 * its own extras. These are primarily **compile-time** assertions — the
 * `@ts-expect-error` lines fail `tsc` if the union ever stops rejecting an
 * invalid config, so they guard the "invalid configs are unrepresentable"
 * guarantee. The runtime `expect` just keeps Vitest happy.
 */

type Form = { plan: string; amount: number; agree: boolean }

test("valid per-type configs compile; invalid extras are rejected", () => {
  const valid: FieldDefinition<Form>[] = [
    { name: "plan", type: "select", options: [{ value: "x", label: "X" }] },
    { name: "amount", type: "currency", decimalScale: 2, prefix: "$" },
    { name: "agree", type: "checkbox" },
    { name: "plan", type: "text", maxLength: 40 },
  ]

  const optionsOnText: FieldDefinition<Form> = {
    name: "plan",
    type: "text",
    // @ts-expect-error — `options` is not valid on a text field.
    options: [{ value: "x", label: "X" }],
  }

  const decimalOnCheckbox: FieldDefinition<Form> = {
    name: "agree",
    type: "checkbox",
    // @ts-expect-error — `decimalScale` is not valid on a checkbox.
    decimalScale: 2,
  }

  const yesLabelOnSwitch: FieldDefinition<Form> = {
    name: "agree",
    type: "switch",
    // @ts-expect-error — `yesLabel` belongs to `yesno`, not `switch`.
    yesLabel: "Yep",
  }

  expect(valid).toHaveLength(4)
  expect(optionsOnText).toBeDefined()
  expect(decimalOnCheckbox).toBeDefined()
  expect(yesLabelOnSwitch).toBeDefined()
})
