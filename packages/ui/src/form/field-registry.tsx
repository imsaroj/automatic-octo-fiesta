"use client"

import * as React from "react"

import type {
  BuiltinFieldType,
  FieldType,
  FieldVariant,
  ResolvedFieldDefinition,
} from "./field-types"
import { SmartInputField, type SmartInputFieldProps } from "./smart-input-field"
import {
  SmartTextareaField,
  type SmartTextareaFieldProps,
} from "./smart-textarea-field"
import {
  SmartPasswordField,
  type SmartPasswordFieldProps,
} from "./smart-password-field"
import {
  SmartNumberField,
  type SmartNumberFieldProps,
} from "./smart-number-field"
import { SmartSelectField } from "./smart-select-field"
import { SmartComboboxField } from "./smart-combobox-field"
import { SmartMultiSelectField } from "./smart-multi-select-field"
import {
  SmartCheckboxField,
  type SmartCheckboxFieldProps,
} from "./smart-checkbox-field"
import {
  SmartSwitchField,
  type SmartSwitchFieldProps,
} from "./smart-switch-field"
import { SmartRadioGroupField } from "./smart-radio-group-field"
import { SmartDateField, type SmartDateFieldProps } from "./smart-date-field"
import { SmartSegmentedField } from "./smart-segmented-field"
import {
  SmartTextEditorField,
  type SmartTextEditorFieldProps,
} from "./smart-text-editor-field"
import { SmartTelField, type SmartTelFieldProps } from "./smart-tel-field"
import { SmartSlugField, type SmartSlugFieldProps } from "./smart-slug-field"
import { SmartTimeField, type SmartTimeFieldProps } from "./smart-time-field"
import {
  SmartDateTimeField,
  type SmartDateTimeFieldProps,
} from "./smart-datetime-field"
import { SmartMonthField, type SmartMonthFieldProps } from "./smart-month-field"
import { SmartYearField, type SmartYearFieldProps } from "./smart-year-field"
import {
  SmartDateRangeField,
  type DateRangeValue,
  type SmartDateRangeFieldProps,
} from "./smart-date-range-field"
import {
  SmartTimeRangeField,
  type TimeRange,
  type SmartTimeRangeFieldProps,
} from "./smart-time-range-field"
import { SmartCheckboxGroupField } from "./smart-checkbox-group-field"
import { SmartYesNoField, type SmartYesNoFieldProps } from "./smart-yesno-field"
import { OptionField, type OptionFieldProps } from "./option-field"

/**
 * Props shared by every rendered field, derived once by {@link SmartForm} from
 * the definition (label / placeholder / description) plus live validation state
 * (error / required). Spread into each field's own props by `mapProps`.
 */
export interface CommonFieldProps {
  label?: React.ReactNode
  placeholder?: string
  description?: React.ReactNode
  error?: string
  required: boolean
  disabled?: boolean
}

/**
 * What a registry entry receives at runtime. `field` is the **wide** resolved
 * definition because the engine looks entries up by a runtime string — the
 * discriminated union narrows *authoring*, not dispatch.
 *
 * Entries built with {@link defineFieldType} see the narrowed
 * {@link TypedFieldRenderContext} instead, so they can only read props their own
 * field type actually declares.
 */
export interface FieldRenderContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  field: ResolvedFieldDefinition<T>
  common: CommonFieldProps
  /** Current field value from the form store (untyped — coerced per entry). */
  value: unknown
  /** Push a new value into the form store. */
  setValue: (value: unknown) => void
}

/**
 * {@link FieldRenderContext} narrowed to one field type: `field` carries exactly
 * that type's extras, so reading a prop belonging to a different type is a
 * compile error rather than a silent `undefined`.
 */
export interface TypedFieldRenderContext<K extends FieldType> extends Omit<
  FieldRenderContext,
  "field"
> {
  field: FieldVariant<Record<string, unknown>, K>
}

/**
 * A registered field type: the component to render, the empty value a field of
 * this type starts at when `data` omits it, and how to map a definition + live
 * value onto that component's props. Adding a field type is a new entry here —
 * no `switch` to grow. Apps extend the set via {@link SmartForm}'s `registry`
 * prop (see {@link registerField} and {@link defineFieldType}).
 *
 * This is the **runtime** shape the engine consumes. Build entries with
 * {@link defineFieldType} to get the compile-time guarantees.
 */
export interface FieldEntry<K extends string = string> {
  /**
   * The `type` key this entry is registered under. Carrying it in the type is
   * what lets the registry's `satisfies` clause catch an entry filed under the
   * wrong key (`email: defineFieldType("text", …)`).
   */
  type?: K
  component: React.ComponentType<Record<string, unknown>>
  /** The empty value a field of this type starts at when `data` omits it. */
  defaultValue: unknown
  /** Build the control's props from the definition, common props, and value. */
  mapProps: (ctx: FieldRenderContext) => Record<string, unknown>
}

export type FieldRegistry = Record<string, FieldEntry>

/**
 * Define a field type with both halves type-checked against each other:
 *
 * - `mapProps` receives the definition **narrowed to `type`**, so it cannot read
 *   an extra belonging to some other field type.
 * - `mapProps` must return exactly the props of `component`, so a field type can
 *   never drift from the control that renders it — remove `maxLength` from
 *   `SmartInputField` and the `text` entry stops compiling.
 *
 * **Annotate `mapProps`' return type**, as every built-in entry does. TypeScript
 * only excess-property-checks an object literal against an *explicitly written*
 * return type; left to inference the literal is checked for missing and
 * mistyped props but silently tolerates stale extra ones — which is precisely
 * the drift this is here to catch.
 *
 * ```ts
 * const registry = registerField({
 *   rating: defineFieldType("rating", {
 *     component: RatingField,
 *     defaultValue: 0,
 *     mapProps: ({ field, common, value, setValue }) => ({
 *       ...common,
 *       data: Number(value ?? 0),
 *       setData: setValue,
 *       max: field.max,
 *     }),
 *   }),
 * })
 * ```
 *
 * The cast to the wide {@link FieldEntry} is sound: the engine dispatches on a
 * runtime string and hands over a {@link ResolvedFieldDefinition}, which is a
 * superset of every variant — an entry can only read props it declared, and
 * those are all present on the resolved shape.
 */
export const defineFieldType = <K extends FieldType, P>(
  type: K,
  entry: {
    component: React.ComponentType<P>
    defaultValue: unknown
    // `NoInfer` is load-bearing: it pins `P` to the component's props so the
    // returned literal is checked against a *known* target. Without it the
    // return value is also an inference site for `P`, which silently widens it
    // and skips excess-property checking — letting a stale prop survive the very
    // drift this is meant to catch.
    mapProps: (ctx: TypedFieldRenderContext<K>) => NoInfer<P>
  }
): FieldEntry<K> => ({ type, ...entry }) as unknown as FieldEntry<K>

// --- coercion helpers: the store value is untyped, so each entry narrows it ---
const asString = (value: unknown) => (value as string) ?? ""
const asBool = (value: unknown) => (value as boolean) ?? false
const asNumber = (value: unknown) => (value as number | null) ?? null

/**
 * The built-in field registry: every {@link FieldType} the engine ships with.
 * Merged under any per-form `registry` prop, so apps override or add types
 * without forking the engine.
 *
 * The `satisfies` clause keeps it exhaustive over {@link BuiltinFieldType} —
 * adding a built-in field type without an entry here is a compile error, while
 * an app's own augmented types stay its own to register.
 */
export const defaultFieldRegistry = {
  // --- Text ---
  text: defineFieldType("text", {
    component: SmartInputField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartInputFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      type: field.type,
      maxLength: field.maxLength,
      autoComplete: field.autoComplete,
    }),
  }),
  email: defineFieldType("email", {
    component: SmartInputField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartInputFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      type: field.type,
      maxLength: field.maxLength,
      autoComplete: field.autoComplete,
    }),
  }),
  url: defineFieldType("url", {
    component: SmartInputField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartInputFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      type: field.type,
      maxLength: field.maxLength,
      autoComplete: field.autoComplete,
    }),
  }),
  password: defineFieldType("password", {
    component: SmartPasswordField,
    defaultValue: "",
    mapProps: ({
      field,
      common,
      value,
      setValue,
    }): SmartPasswordFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      autoComplete: field.autoComplete,
    }),
  }),
  tel: defineFieldType("tel", {
    component: SmartTelField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartTelFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      autoComplete: field.autoComplete,
    }),
  }),
  slug: defineFieldType("slug", {
    component: SmartSlugField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartSlugFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      prefix: field.prefix,
      maxLength: field.maxLength,
    }),
  }),
  textarea: defineFieldType("textarea", {
    component: SmartTextareaField,
    defaultValue: "",
    mapProps: ({
      field,
      common,
      value,
      setValue,
    }): SmartTextareaFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      rows: field.rows,
      maxLength: field.maxLength,
    }),
  }),
  "text-editor": defineFieldType("text-editor", {
    component: SmartTextEditorField,
    defaultValue: "",
    mapProps: ({
      field,
      common,
      value,
      setValue,
    }): SmartTextEditorFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      format: field.format,
      toolbar: field.toolbar,
      minHeight: field.minHeight,
      maxHeight: field.maxHeight,
    }),
  }),

  // --- Numeric ---
  number: defineFieldType("number", {
    component: SmartNumberField,
    defaultValue: null,
    mapProps: ({ field, common, value, setValue }): SmartNumberFieldProps => ({
      ...common,
      data: asNumber(value),
      setData: setValue,
      decimalScale: field.decimalScale,
      prefix: field.prefix,
      suffix: field.suffix,
      min: field.min,
      max: field.max,
      step: field.step,
    }),
  }),
  decimal: defineFieldType("decimal", {
    component: SmartNumberField,
    defaultValue: null,
    mapProps: ({ field, common, value, setValue }): SmartNumberFieldProps => ({
      ...common,
      data: asNumber(value),
      setData: setValue,
      decimalScale: field.decimalScale,
      prefix: field.prefix,
      suffix: field.suffix,
      min: field.min,
      max: field.max,
      step: field.step,
    }),
  }),
  integer: defineFieldType("integer", {
    component: SmartNumberField,
    defaultValue: null,
    mapProps: ({ field, common, value, setValue }): SmartNumberFieldProps => ({
      ...common,
      data: asNumber(value),
      setData: setValue,
      integer: true,
      decimalScale: field.decimalScale ?? 0,
      prefix: field.prefix,
      suffix: field.suffix,
      min: field.min,
      max: field.max,
      step: field.step,
    }),
  }),
  currency: defineFieldType("currency", {
    component: SmartNumberField,
    defaultValue: null,
    mapProps: ({ field, common, value, setValue }): SmartNumberFieldProps => ({
      ...common,
      data: asNumber(value),
      setData: setValue,
      decimalScale: field.decimalScale ?? 2,
      prefix: field.prefix ?? "$",
      suffix: field.suffix,
      min: field.min,
      max: field.max,
      step: field.step,
    }),
  }),
  percentage: defineFieldType("percentage", {
    component: SmartNumberField,
    defaultValue: null,
    mapProps: ({ field, common, value, setValue }): SmartNumberFieldProps => ({
      ...common,
      data: asNumber(value),
      setData: setValue,
      decimalScale: field.decimalScale,
      prefix: field.prefix,
      suffix: field.suffix ?? "%",
      min: field.min,
      max: field.max,
      step: field.step,
    }),
  }),

  // --- Selection ---
  // Option-based fields route through OptionField, which resolves options
  // (sync array or async resolver), maps typed store values ↔ string DOM keys,
  // and renders the underlying string-based control. `defaultValue` keeps the
  // empty string / empty array the store starts at when `data` omits the field.
  select: defineFieldType("select", {
    component: OptionField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartSelectField,
      options: field.options,
      value,
      setValue,
      common,
    }),
  }),
  combobox: defineFieldType("combobox", {
    component: OptionField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartComboboxField,
      options: field.options,
      value,
      setValue,
      common,
      extra: {
        searchPlaceholder: field.searchPlaceholder,
        emptyText: field.emptyText,
      },
    }),
  }),
  autocomplete: defineFieldType("autocomplete", {
    component: OptionField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartComboboxField,
      options: field.options,
      value,
      setValue,
      common,
      extra: {
        searchPlaceholder: field.searchPlaceholder,
        emptyText: field.emptyText,
      },
    }),
  }),
  multiselect: defineFieldType("multiselect", {
    component: OptionField,
    defaultValue: [],
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartMultiSelectField,
      options: field.options,
      multiple: true,
      value,
      setValue,
      common,
      extra: {
        maxSelected: field.maxSelected,
        searchPlaceholder: field.searchPlaceholder,
      },
    }),
  }),
  radio: defineFieldType("radio", {
    component: OptionField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartRadioGroupField,
      options: field.options,
      value,
      setValue,
      common,
      extra: { orientation: field.orientation },
    }),
  }),
  segmented: defineFieldType("segmented", {
    component: OptionField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartSegmentedField,
      options: field.options,
      value,
      setValue,
      common,
    }),
  }),
  "checkbox-group": defineFieldType("checkbox-group", {
    component: OptionField,
    defaultValue: [],
    mapProps: ({ field, common, value, setValue }): OptionFieldProps => ({
      control: SmartCheckboxGroupField,
      options: field.options,
      multiple: true,
      value,
      setValue,
      common,
      extra: { orientation: field.orientation },
    }),
  }),

  // --- Boolean ---
  checkbox: defineFieldType("checkbox", {
    component: SmartCheckboxField,
    defaultValue: false,
    mapProps: ({ common, value, setValue }): SmartCheckboxFieldProps => ({
      ...common,
      data: asBool(value),
      setData: setValue,
    }),
  }),
  switch: defineFieldType("switch", {
    component: SmartSwitchField,
    defaultValue: false,
    mapProps: ({ common, value, setValue }): SmartSwitchFieldProps => ({
      ...common,
      data: asBool(value),
      setData: setValue,
    }),
  }),
  yesno: defineFieldType("yesno", {
    component: SmartYesNoField,
    defaultValue: false,
    mapProps: ({ field, common, value, setValue }): SmartYesNoFieldProps => ({
      ...common,
      data: asBool(value),
      setData: setValue,
      orientation: field.orientation,
      yesLabel: field.yesLabel,
      noLabel: field.noLabel,
    }),
  }),

  // --- Date & time ---
  date: defineFieldType("date", {
    component: SmartDateField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartDateFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      steppers: field.steppers,
      todayButton: field.todayButton,
      timeZone: field.timeZone,
      captionLayout: field.captionLayout,
      startMonth: field.startMonth,
      endMonth: field.endMonth,
      dateFormat: field.dateFormat,
    }),
  }),
  time: defineFieldType("time", {
    component: SmartTimeField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartTimeFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      use12Hour: field.use12Hour,
      withSeconds: field.withSeconds,
      minuteStep: field.minuteStep,
    }),
  }),
  datetime: defineFieldType("datetime", {
    component: SmartDateTimeField,
    defaultValue: "",
    mapProps: ({
      field,
      common,
      value,
      setValue,
    }): SmartDateTimeFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      use12Hour: field.use12Hour,
      withSeconds: field.withSeconds,
      minuteStep: field.minuteStep,
    }),
  }),
  month: defineFieldType("month", {
    component: SmartMonthField,
    defaultValue: "",
    mapProps: ({ field, common, value, setValue }): SmartMonthFieldProps => ({
      ...common,
      data: asString(value),
      setData: setValue,
      fromYear: field.fromYear,
      toYear: field.toYear,
    }),
  }),
  year: defineFieldType("year", {
    component: SmartYearField,
    defaultValue: null,
    mapProps: ({ field, common, value, setValue }): SmartYearFieldProps => ({
      ...common,
      data: asNumber(value),
      setData: setValue,
      fromYear: field.fromYear,
      toYear: field.toYear,
    }),
  }),
  daterange: defineFieldType("daterange", {
    component: SmartDateRangeField,
    defaultValue: undefined,
    mapProps: ({
      field,
      common,
      value,
      setValue,
    }): SmartDateRangeFieldProps => ({
      ...common,
      data: value as DateRangeValue | undefined,
      setData: setValue,
      numberOfMonths: field.numberOfMonths,
    }),
  }),
  timerange: defineFieldType("timerange", {
    component: SmartTimeRangeField,
    defaultValue: undefined,
    mapProps: ({
      field,
      common,
      value,
      setValue,
    }): SmartTimeRangeFieldProps => ({
      ...common,
      data: value as TimeRange | undefined,
      setData: setValue,
      use12Hour: field.use12Hour,
      withSeconds: field.withSeconds,
      minuteStep: field.minuteStep,
      startPlaceholder: field.startPlaceholder,
      endPlaceholder: field.endPlaceholder,
    }),
  }),
} satisfies { [K in BuiltinFieldType]: FieldEntry<K> }

/**
 * Immutably merge custom field entries over the built-in registry, producing a
 * new registry you can pass to {@link SmartForm}'s `registry` prop. Adding a
 * field type is additive — the built-ins stay intact.
 *
 * ```tsx
 * const registry = registerField({ rating: defineFieldType("rating", { … }) })
 * <SmartForm registry={registry} … />
 * ```
 */
export const registerField = (
  entries: Record<string, FieldEntry>,
  base: FieldRegistry = defaultFieldRegistry
): FieldRegistry => ({ ...base, ...entries })
