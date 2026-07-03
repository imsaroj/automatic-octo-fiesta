"use client"

import * as React from "react"

import type { FieldType, ResolvedFieldDefinition } from "./field-types"
import { SmartInputField } from "./smart-input-field"
import { SmartTextareaField } from "./smart-textarea-field"
import { SmartPasswordField } from "./smart-password-field"
import { SmartNumberField } from "./smart-number-field"
import { SmartSelectField } from "./smart-select-field"
import { SmartComboboxField } from "./smart-combobox-field"
import { SmartMultiSelectField } from "./smart-multi-select-field"
import { SmartCheckboxField } from "./smart-checkbox-field"
import { SmartSwitchField } from "./smart-switch-field"
import { SmartRadioGroupField } from "./smart-radio-group-field"
import { SmartDateField } from "./smart-date-field"
import { SmartSegmentedField } from "./smart-segmented-field"
import { SmartTextEditorField } from "./smart-text-editor-field"
import { SmartTelField } from "./smart-tel-field"
import { SmartSlugField } from "./smart-slug-field"
import { SmartTimeField } from "./smart-time-field"
import { SmartDateTimeField } from "./smart-datetime-field"
import { SmartMonthField } from "./smart-month-field"
import { SmartYearField } from "./smart-year-field"
import {
  SmartDateRangeField,
  type DateRangeValue,
} from "./smart-date-range-field"
import { SmartTimeRangeField, type TimeRange } from "./smart-time-range-field"
import { SmartCheckboxGroupField } from "./smart-checkbox-group-field"
import { SmartYesNoField } from "./smart-yesno-field"

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

/** Everything a registry entry needs to turn a definition into control props. */
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
 * A registered field type: the component to render, the empty value a field of
 * this type starts at when `data` omits it, and how to map a definition + live
 * value onto that component's props. Adding a field type is a new entry here —
 * no `switch` to grow. Apps extend the set via {@link SmartForm}'s `registry`
 * prop (see {@link registerField}).
 */
export interface FieldEntry {
  component: React.ComponentType<Record<string, unknown>>
  /** The empty value a field of this type starts at when `data` omits it. */
  defaultValue: unknown
  /** Build the control's props from the definition, common props, and value. */
  mapProps: (ctx: FieldRenderContext) => Record<string, unknown>
}

export type FieldRegistry = Record<string, FieldEntry>

// --- coercion helpers: the store value is untyped, so each entry narrows it ---
const asString = (value: unknown) => (value as string) ?? ""
const asStringArray = (value: unknown) => (value as string[]) ?? []
const asBool = (value: unknown) => (value as boolean) ?? false

/** Shared builder for the string-valued controls (input, textarea, date, …). */
function stringEntry(
  component: React.ComponentType<Record<string, unknown>>,
  extra?: (ctx: FieldRenderContext) => Record<string, unknown>
): FieldEntry {
  return {
    component,
    defaultValue: "",
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asString(ctx.value),
      setData: ctx.setValue,
      ...extra?.(ctx),
    }),
  }
}

const numberEntry = (
  derive: (field: ResolvedFieldDefinition) => Record<string, unknown>
): FieldEntry => ({
  component: SmartNumberField as never,
  defaultValue: null,
  mapProps: (ctx) => ({
    ...ctx.common,
    data: ctx.value as number | null,
    setData: ctx.setValue,
    ...derive(ctx.field),
  }),
})

/**
 * The built-in field registry: every {@link FieldType} the engine ships with.
 * Merged under any per-form `registry` prop, so apps override or add types
 * without forking the engine.
 */
export const defaultFieldRegistry = {
  // --- Text ---
  text: stringEntry(SmartInputField as never, ({ field }) => ({
    type: field.type,
    maxLength: field.maxLength,
    autoComplete: field.autoComplete,
  })),
  email: stringEntry(SmartInputField as never, ({ field }) => ({
    type: field.type,
    maxLength: field.maxLength,
    autoComplete: field.autoComplete,
  })),
  url: stringEntry(SmartInputField as never, ({ field }) => ({
    type: field.type,
    maxLength: field.maxLength,
    autoComplete: field.autoComplete,
  })),
  tel: stringEntry(SmartTelField as never, ({ field }) => ({
    autoComplete: field.autoComplete,
  })),
  slug: stringEntry(SmartSlugField as never, ({ field }) => ({
    prefix: field.slugPrefix,
    maxLength: field.maxLength,
  })),
  password: stringEntry(SmartPasswordField as never, ({ field }) => ({
    autoComplete: field.autoComplete,
  })),
  textarea: stringEntry(SmartTextareaField as never, ({ field }) => ({
    rows: field.rows,
    maxLength: field.maxLength,
  })),
  "text-editor": stringEntry(SmartTextEditorField as never, ({ field }) => ({
    format: field.editorFormat,
    toolbar: field.toolbar,
    minHeight: field.minHeight,
    maxHeight: field.maxHeight,
  })),

  // --- Numeric ---
  number: numberEntry((field) => ({
    decimalScale: field.decimalScale,
    prefix: field.prefix,
    suffix: field.suffix,
    min: field.min,
    max: field.max,
    step: field.step,
  })),
  decimal: numberEntry((field) => ({
    decimalScale: field.decimalScale,
    prefix: field.prefix,
    suffix: field.suffix,
    min: field.min,
    max: field.max,
    step: field.step,
  })),
  integer: numberEntry((field) => ({
    integer: true,
    decimalScale: field.decimalScale ?? 0,
    prefix: field.prefix,
    suffix: field.suffix,
    min: field.min,
    max: field.max,
    step: field.step,
  })),
  currency: numberEntry((field) => ({
    decimalScale: field.decimalScale ?? 2,
    prefix: field.prefix ?? "$",
    suffix: field.suffix,
    min: field.min,
    max: field.max,
    step: field.step,
  })),
  percentage: numberEntry((field) => ({
    decimalScale: field.decimalScale,
    prefix: field.prefix,
    suffix: field.suffix ?? "%",
    min: field.min,
    max: field.max,
    step: field.step,
  })),

  // --- Selection ---
  select: {
    component: SmartSelectField as never,
    defaultValue: "",
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asString(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options,
    }),
  },
  combobox: {
    component: SmartComboboxField as never,
    defaultValue: "",
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asString(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options ?? [],
      searchPlaceholder: ctx.field.searchPlaceholder,
      emptyText: ctx.field.emptyText,
    }),
  },
  autocomplete: {
    component: SmartComboboxField as never,
    defaultValue: "",
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asString(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options ?? [],
      searchPlaceholder: ctx.field.searchPlaceholder,
      emptyText: ctx.field.emptyText,
    }),
  },
  multiselect: {
    component: SmartMultiSelectField as never,
    defaultValue: [],
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asStringArray(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options,
      maxSelected: ctx.field.maxSelected,
      searchPlaceholder: ctx.field.searchPlaceholder,
    }),
  },
  radio: {
    component: SmartRadioGroupField as never,
    defaultValue: "",
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asString(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options,
      orientation: ctx.field.orientation,
    }),
  },
  checkbox: {
    component: SmartCheckboxField as never,
    defaultValue: false,
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asBool(ctx.value),
      setData: ctx.setValue,
    }),
  },
  "checkbox-group": {
    component: SmartCheckboxGroupField as never,
    defaultValue: [],
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asStringArray(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options,
      orientation: ctx.field.orientation,
    }),
  },
  switch: {
    component: SmartSwitchField as never,
    defaultValue: false,
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asBool(ctx.value),
      setData: ctx.setValue,
    }),
  },
  segmented: {
    component: SmartSegmentedField as never,
    defaultValue: "",
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asString(ctx.value),
      setData: ctx.setValue,
      options: ctx.field.options,
    }),
  },
  yesno: {
    component: SmartYesNoField as never,
    defaultValue: false,
    mapProps: (ctx) => ({
      ...ctx.common,
      data: asBool(ctx.value),
      setData: ctx.setValue,
      orientation: ctx.field.orientation,
      yesLabel: ctx.field.yesLabel,
      noLabel: ctx.field.noLabel,
    }),
  },

  // --- Date & time ---
  date: stringEntry(SmartDateField as never),
  time: stringEntry(SmartTimeField as never, ({ field }) => ({
    use12Hour: field.use12Hour,
    withSeconds: field.withSeconds,
    minuteStep: field.minuteStep,
  })),
  datetime: stringEntry(SmartDateTimeField as never, ({ field }) => ({
    use12Hour: field.use12Hour,
    withSeconds: field.withSeconds,
    minuteStep: field.minuteStep,
  })),
  month: stringEntry(SmartMonthField as never, ({ field }) => ({
    fromYear: field.fromYear,
    toYear: field.toYear,
  })),
  year: {
    component: SmartYearField as never,
    defaultValue: null,
    mapProps: (ctx) => ({
      ...ctx.common,
      data: ctx.value as number | null,
      setData: ctx.setValue,
      fromYear: ctx.field.fromYear,
      toYear: ctx.field.toYear,
    }),
  },
  daterange: {
    component: SmartDateRangeField as never,
    defaultValue: undefined,
    mapProps: (ctx) => ({
      ...ctx.common,
      data: ctx.value as DateRangeValue | undefined,
      setData: ctx.setValue,
      numberOfMonths: ctx.field.numberOfMonths,
    }),
  },
  timerange: {
    component: SmartTimeRangeField as never,
    defaultValue: undefined,
    mapProps: (ctx) => ({
      ...ctx.common,
      data: ctx.value as TimeRange | undefined,
      setData: ctx.setValue,
      use12Hour: ctx.field.use12Hour,
      withSeconds: ctx.field.withSeconds,
      minuteStep: ctx.field.minuteStep,
      startPlaceholder: ctx.field.startPlaceholder,
      endPlaceholder: ctx.field.endPlaceholder,
    }),
  },
} satisfies Record<FieldType, FieldEntry>

/**
 * Immutably merge custom field entries over the built-in registry, producing a
 * new registry you can pass to {@link SmartForm}'s `registry` prop. Adding a
 * field type is additive — the built-ins stay intact.
 *
 * ```tsx
 * const registry = registerField({ rating: { component: RatingField, defaultValue: 0, mapProps } })
 * <SmartForm registry={registry} … />
 * ```
 */
export function registerField(
  entries: Record<string, FieldEntry>,
  base: FieldRegistry = defaultFieldRegistry
): FieldRegistry {
  return { ...base, ...entries }
}
