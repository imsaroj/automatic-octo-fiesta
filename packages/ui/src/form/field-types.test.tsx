import { expect, test } from "vitest"
import type {
  BuiltinFieldType,
  FieldDefinition,
  FieldType,
  FieldTypeExtras,
} from "./field-types"
import { defineFieldType, type FieldEntry } from "./field-registry"
import {
  NATIVE_INPUT_ATTR_KEYS,
  NATIVE_TEXTAREA_ATTR_KEYS,
  type NativeInputAttrs,
  type NativeTextareaAttrs,
} from "./base"
import { SmartInputField, type SmartInputFieldProps } from "./smart-input-field"

/**
 * `FieldDefinition<T>` is a discriminated union generated from
 * {@link FieldTypeExtras}: each field type permits only its own extras. These are
 * primarily **compile-time** assertions — the `@ts-expect-error` lines fail
 * `tsc` if the guarantees ever stop holding. The runtime `expect` just keeps
 * Vitest happy.
 */

type Form = { plan: string; amount: number; agree: boolean }

/** `A` and `B` are the same type — invariant, so neither may drift. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

test("BuiltinFieldType matches FieldTypeExtras exactly", () => {
  // This assertion only holds where no app augmentation is in scope — which is
  // exactly here, the library's own build. Add a key to `FieldTypeExtras`
  // without listing it in `BuiltinFieldType` (or vice versa) and this fails.
  const exhaustive: Equals<BuiltinFieldType, keyof FieldTypeExtras> = true
  const openAlias: Equals<FieldType, keyof FieldTypeExtras> = true

  expect(exhaustive).toBe(true)
  expect(openAlias).toBe(true)
})

test("the native-attribute key lists match their types exactly", () => {
  // The types decide what an author may *write*; these arrays decide what the
  // registry actually *forwards*. Drift between them is silent at runtime — a
  // prop that type-checks and then never reaches the DOM — so pin them together.
  const inputKeys: Equals<
    (typeof NATIVE_INPUT_ATTR_KEYS)[number],
    keyof NativeInputAttrs
  > = true
  const textareaKeys: Equals<
    (typeof NATIVE_TEXTAREA_ATTR_KEYS)[number],
    keyof NativeTextareaAttrs
  > = true

  expect(inputKeys).toBe(true)
  expect(textareaKeys).toBe(true)
})

test("valid per-type configs compile", () => {
  const valid: FieldDefinition<Form>[] = [
    { name: "plan", type: "select", options: [{ value: "x", label: "X" }] },
    { name: "amount", type: "currency", decimalScale: 2, prefix: "$" },
    { name: "agree", type: "checkbox" },
    { name: "plan", type: "text", maxLength: 40, autoComplete: "off" },
    { name: "plan", type: "textarea", rows: 4 },
    { name: "plan", type: "slug", prefix: "/blog/" },
    { name: "plan", type: "text-editor", format: "json", toolbar: false },
    {
      name: "plan",
      type: "combobox",
      emptyText: "None",
      searchPlaceholder: "…",
    },
    { name: "plan", type: "multiselect", maxSelected: 3 },
    { name: "plan", type: "radio", orientation: "horizontal" },
    { name: "agree", type: "yesno", yesLabel: "Yep", noLabel: "Nope" },
    { name: "plan", type: "date" },
    // The picker's own controls / calendar config reach a `date` field.
    {
      name: "plan",
      type: "date",
      steppers: "prev",
      todayButton: true,
      timeZone: "utc",
      captionLayout: "dropdown",
      startMonth: new Date(1970, 0),
      dateFormat: "yyyy-MM-dd",
    },
    { name: "plan", type: "daterange", numberOfMonths: 2 },
    { name: "plan", type: "time", use12Hour: true, minuteStep: 15 },
    { name: "plan", type: "timerange", startPlaceholder: "From" },
    { name: "amount", type: "year", fromYear: 2000, toYear: 2030 },
    // Layout placement is shared by every type.
    { name: "plan", type: "text", span: "1/2", newRow: true },
  ]

  expect(valid).toHaveLength(18)
})

test("an extra belonging to another field type is rejected", () => {
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

  const rowsOnInput: FieldDefinition<Form> = {
    name: "plan",
    type: "text",
    // @ts-expect-error — `rows` belongs to `textarea`, not `text`.
    rows: 3,
  }

  const numberOfMonthsOnDate: FieldDefinition<Form> = {
    name: "plan",
    type: "date",
    // @ts-expect-error — `numberOfMonths` belongs to `daterange`.
    numberOfMonths: 2,
  }

  const todayButtonOnMonth: FieldDefinition<Form> = {
    name: "plan",
    type: "month",
    // @ts-expect-error — the picker's controls belong to `date`, not `month`.
    todayButton: true,
  }

  const maxSelectedOnSelect: FieldDefinition<Form> = {
    name: "plan",
    type: "select",
    // @ts-expect-error — `maxSelected` belongs to `multiselect`.
    maxSelected: 2,
  }

  const integerIsEngineOwned: FieldDefinition<Form> = {
    name: "amount",
    type: "number",
    // @ts-expect-error — `integer` is derived from the field type, not authored.
    integer: true,
  }

  expect([
    optionsOnText,
    decimalOnCheckbox,
    yesLabelOnSwitch,
    rowsOnInput,
    numberOfMonthsOnDate,
    todayButtonOnMonth,
    maxSelectedOnSelect,
    integerIsEngineOwned,
  ]).toHaveLength(8)
})

test("defineFieldType ties a field type to the control that renders it", () => {
  const ok = defineFieldType("text", {
    component: SmartInputField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartInputFieldProps => ({
      ...common,
      data: String(value ?? ""),
      setData: setValue,
      type: field.type,
      maxLength: field.maxLength,
    }),
  })

  const readsAnotherTypesExtra = defineFieldType("text", {
    component: SmartInputField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartInputFieldProps => ({
      ...common,
      data: String(value ?? ""),
      setData: setValue,
      // @ts-expect-error — `options` does not exist on a `text` definition.
      maxLength: field.options,
    }),
  })

  const returnsAPropTheControlLacks = defineFieldType("text", {
    component: SmartInputField,
    defaultValue: "",
    mapProps: ({ common, value, setValue }): SmartInputFieldProps => ({
      ...common,
      data: String(value ?? ""),
      setData: setValue,
      // @ts-expect-error — not a prop of SmartInputField; this is the drift guard.
      notARealInputProp: 1,
    }),
  })

  // An entry filed under the wrong key is caught by the registry's `satisfies`.
  const wrongKey = {
    // @ts-expect-error — a "text" entry cannot be registered as `email`.
    email: ok as FieldEntry<"text">,
  } satisfies { email: FieldEntry<"email"> }

  expect([
    ok,
    readsAnotherTypesExtra,
    returnsAPropTheControlLacks,
    wrongKey,
  ]).toHaveLength(4)
})
