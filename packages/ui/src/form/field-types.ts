/**
 * Field type union, option shape, and the {@link FieldDefinition} config object
 * consumed by {@link SmartForm}. Kept separate from `smart-form.tsx` so the
 * field registry can depend on these types without a circular import.
 *
 * `FieldDefinition<T>` is a **discriminated union** keyed on `type`: each field
 * family only permits the extras that apply to it, so invalid configs (a
 * `decimalScale` on a checkbox, `options` on a text field) are unrepresentable
 * and rejected at compile time. The engine's runtime still works off the wide
 * {@link ResolvedFieldDefinition} — every variant is assignable to it — which is
 * what the field registry reads from.
 */

export type FieldType =
  // Text
  | "text"
  | "email"
  | "url"
  | "password"
  | "tel"
  | "slug"
  | "textarea"
  | "text-editor"
  // Numeric
  | "number"
  | "decimal"
  | "integer"
  | "currency"
  | "percentage"
  // Date & time
  | "date"
  | "time"
  | "datetime"
  | "month"
  | "year"
  | "daterange"
  | "timerange"
  // Selection
  | "select"
  | "combobox"
  | "autocomplete"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "checkbox-group"
  | "switch"
  | "segmented"
  | "yesno"

/** A single selectable choice for `select` / `combobox` / `multiselect` / `radio` / `segmented` fields. */
export interface FieldOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

/** Props every field shares, regardless of type — the discriminated union base. */
export interface FieldBase<T extends Record<string, unknown>> {
  name: keyof T & string
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  /** Number of grid columns this field spans. */
  colSpan?: 1 | 2 | 3
  /** Return `true` to hide the field (and skip validation for it). */
  hidden?: (data: T) => boolean
}

// ── Text ──────────────────────────────────────────────────────────────────
/** `text` / `email` / `url` / `password` — plain single-line inputs. */
export interface TextField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "text" | "email" | "url" | "password"
  maxLength?: number
  autoComplete?: string
}

/** `tel` — phone-number input. */
export interface TelField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "tel"
  autoComplete?: string
}

/** `slug` — auto-lowercased, hyphenated identifier input. */
export interface SlugField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "slug"
  slugPrefix?: string
  maxLength?: number
}

/** `textarea` — multi-line plain-text input. */
export interface TextareaField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "textarea"
  rows?: number
  maxLength?: number
}

/** `text-editor` — Lexical rich-text editor. */
export interface TextEditorField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "text-editor"
  editorFormat?: "html" | "json"
  toolbar?: boolean
  minHeight?: string
  maxHeight?: string
}

// ── Numeric ───────────────────────────────────────────────────────────────
/** `number` / `decimal` / `integer` / `currency` / `percentage`. */
export interface NumberField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "number" | "decimal" | "integer" | "currency" | "percentage"
  decimalScale?: number
  min?: number
  max?: number
  step?: number
  /** Leading addon text, e.g. a currency symbol. Defaults to `"$"` for `currency`. */
  prefix?: string
  /** Trailing addon text, e.g. a unit. Defaults to `"%"` for `percentage`. */
  suffix?: string
}

// ── Date & time ─────────────────────────────────────────────────────────────
/** `date` — single calendar date. */
export interface DateField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "date"
}

/** `time` / `datetime` — clock (and optionally calendar) input. */
export interface TimeField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "time" | "datetime"
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
}

/** `month` / `year` — coarse-grained date pickers. */
export interface MonthYearField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "month" | "year"
  fromYear?: number
  toYear?: number
}

/** `daterange` — start/end calendar range. */
export interface DateRangeField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "daterange"
  numberOfMonths?: number
}

/** `timerange` — start/end clock range. */
export interface TimeRangeField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "timerange"
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  startPlaceholder?: string
  endPlaceholder?: string
}

// ── Selection ───────────────────────────────────────────────────────────────
/** `select` — native/styled single-choice dropdown. */
export interface SelectField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "select"
  options?: FieldOption[]
}

/** `combobox` / `autocomplete` — searchable single-choice popover. */
export interface ComboboxField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "combobox" | "autocomplete"
  options?: FieldOption[]
  searchPlaceholder?: string
  emptyText?: string
}

/** `multiselect` — searchable multi-choice popover. */
export interface MultiSelectField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "multiselect"
  options?: FieldOption[]
  maxSelected?: number
  searchPlaceholder?: string
}

/** `radio` — single choice from a visible group. */
export interface RadioField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "radio"
  options?: FieldOption[]
  orientation?: "horizontal" | "vertical"
}

/** `segmented` — single choice as a segmented control. */
export interface SegmentedField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "segmented"
  options?: FieldOption[]
}

/** `checkbox-group` — multiple choices from a visible group. */
export interface CheckboxGroupField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "checkbox-group"
  options?: FieldOption[]
  orientation?: "horizontal" | "vertical"
}

/** `checkbox` / `switch` — single boolean toggle. */
export interface BooleanField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "checkbox" | "switch"
}

/** `yesno` — boolean rendered as a labelled two-option control. */
export interface YesNoField<
  T extends Record<string, unknown>,
> extends FieldBase<T> {
  type: "yesno"
  orientation?: "horizontal" | "vertical"
  yesLabel?: string
  noLabel?: string
}

/**
 * A single field's configuration — a discriminated union on `type`. Each family
 * permits only its own extras, so the editor autocompletes per type and invalid
 * combinations fail to compile.
 */
export type FieldDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
> =
  | TextField<T>
  | TelField<T>
  | SlugField<T>
  | TextareaField<T>
  | TextEditorField<T>
  | NumberField<T>
  | DateField<T>
  | TimeField<T>
  | MonthYearField<T>
  | DateRangeField<T>
  | TimeRangeField<T>
  | SelectField<T>
  | ComboboxField<T>
  | MultiSelectField<T>
  | RadioField<T>
  | SegmentedField<T>
  | CheckboxGroupField<T>
  | BooleanField<T>
  | YesNoField<T>

/**
 * The flattened superset of every field variant's props: a single wide shape
 * the engine and field registry read from at runtime. Every {@link FieldDefinition}
 * variant is assignable to it, so a `field` typed as the union can be passed
 * wherever a resolved definition is expected. **Authoring should use
 * {@link FieldDefinition}** (the strict union) — this exists for the registry's
 * `mapProps`, which reads extras generically without narrowing.
 */
export interface ResolvedFieldDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends FieldBase<T> {
  type: FieldType
  options?: FieldOption[]
  decimalScale?: number
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  slugPrefix?: string
  rows?: number
  maxLength?: number
  editorFormat?: "html" | "json"
  toolbar?: boolean
  minHeight?: string
  maxHeight?: string
  autoComplete?: string
  orientation?: "horizontal" | "vertical"
  searchPlaceholder?: string
  emptyText?: string
  maxSelected?: number
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  fromYear?: number
  toYear?: number
  numberOfMonths?: number
  startPlaceholder?: string
  endPlaceholder?: string
  yesLabel?: string
  noLabel?: string
}
