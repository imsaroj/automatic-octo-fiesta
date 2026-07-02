"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

import { deepEqual, isFieldRequired } from "./smart-form-internals"
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
import { useSelector } from "@tanstack/react-store"

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

export interface FieldDefinition<T extends Record<string, unknown>> {
  name: keyof T & string
  type: FieldType
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  /** Number of grid columns this field spans. */
  colSpan?: 1 | 2 | 3
  /** Return `true` to hide the field (and skip validation for it). */
  hidden?: (data: T) => boolean
  // Choice options (select / combobox / multiselect / radio / segmented)
  options?: {
    value: string
    label: string
    description?: string
    disabled?: boolean
  }[]
  // Number extras (number / decimal / integer / currency / percentage)
  decimalScale?: number
  min?: number
  max?: number
  step?: number
  /** Leading addon text, e.g. a currency symbol. Defaults to `"$"` for `currency`. */
  prefix?: string
  /** Trailing addon text, e.g. a unit. Defaults to `"%"` for `percentage`. */
  suffix?: string
  // Slug extras
  slugPrefix?: string
  // Textarea extras
  rows?: number
  maxLength?: number
  // Text-editor extras
  editorFormat?: "html" | "json"
  toolbar?: boolean
  minHeight?: string
  maxHeight?: string
  // Input extras
  autoComplete?: string
  // Choice-group layout (radio / checkbox-group / yesno)
  orientation?: "horizontal" | "vertical"
  // Combobox / autocomplete extras
  searchPlaceholder?: string
  emptyText?: string
  // Multiselect extras
  maxSelected?: number
  // Date & time extras (time / datetime / timerange / month / year / daterange)
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  fromYear?: number
  toYear?: number
  numberOfMonths?: number
  startPlaceholder?: string
  endPlaceholder?: string
  // Yes/No labels
  yesLabel?: string
  noLabel?: string
}

const COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as const
const SPAN = { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3" } as const

export interface SmartFormProps<T extends Record<string, unknown>> {
  /** Zod schema — the single source of truth for validation *and* required-ness. */
  schema: z.ZodType<T>
  /** Controlled form data. Seeds the form on mount and stays mirrored to edits. */
  data?: T
  /** Kept in sync with every edit — no manual per-field wiring required. */
  setData?: (data: T) => void
  fields: FieldDefinition<T>[]
  /** Number of grid columns. Default `1`. */
  columns?: 1 | 2 | 3
  /** Called with the parsed, validated values on a successful submit. */
  onSubmit?: (data: T) => void | Promise<void>
  /** `id` on the `<form>`, so a submit button placed outside can drive it via `form={id}`. */
  id?: string
  /** Label for the submit button. Pass `null` to suppress and use `children` instead. */
  submitLabel?: React.ReactNode | null
  /** Label for an optional reset button (resets to the initial `data`). */
  resetLabel?: string
  /** Rendered inside the form after the field grid (replaces default button row when provided). */
  children?: React.ReactNode
  className?: string
}

/** The empty value a field of `type` should start at when `data` omits it. */
function defaultForType(type: FieldType): unknown {
  switch (type) {
    case "checkbox":
    case "switch":
    case "yesno":
      return false
    case "multiselect":
    case "checkbox-group":
      return []
    case "number":
    case "decimal":
    case "integer":
    case "currency":
    case "percentage":
    case "year":
      return null
    case "daterange":
    case "timerange":
      return undefined
    default:
      return ""
  }
}

/**
 * Declarative form engine on **TanStack Form + Zod**: supply a Zod schema and a
 * field definition array — the engine renders the right control for each field,
 * validates against the schema (live, per-field), and surfaces errors inline.
 *
 * The schema is the single source of truth: validation *and* the required
 * asterisk are both derived from it, so field definitions stay UI-only. Pass
 * `data`/`setData` to mirror the live values into your own state (e.g. a preview
 * panel or async load); both are optional — the form owns its state either way.
 *
 * ```tsx
 * const schema = z.object({ name: z.string().min(1), email: z.email().optional() })
 * type Form = z.infer<typeof schema>
 *
 * const fields: FieldDefinition<Form>[] = [
 *   { name: "name", type: "text",  label: "Name" },
 *   { name: "email", type: "email", label: "Email" },
 * ]
 *
 * <SmartForm schema={schema} fields={fields} onSubmit={(value) => save(value)} />
 * ```
 */
export function SmartForm<T extends Record<string, unknown>>({
  schema,
  data,
  setData,
  fields,
  columns = 1,
  onSubmit,
  id,
  submitLabel = "Submit",
  resetLabel,
  children,
  className,
}: SmartFormProps<T>) {
  // Mount-time defaults: field-type blanks, overridden by any provided `data`.
  const defaultValues = React.useMemo<T>(() => {
    const base: Record<string, unknown> = {}
    for (const field of fields) base[field.name] = defaultForType(field.type)
    return { ...base, ...(data as Record<string, unknown>) } as T
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The current form baseline. Kept in sync with `form.reset` in the reconcile
  // effect so it matches the `defaultValues` TanStack re-applies on every render
  // (`useForm` calls `form.update(opts)` each render): if they diverged, that
  // update would revert an adopted external value straight back to the stale
  // mount baseline.
  const [baseline, setBaseline] = React.useState<T>(defaultValues)

  // Fields the schema treats as optional (and that aren't forced required in the
  // definition). For these, an empty string means "not provided", so it should
  // pass rather than fail — e.g. `z.email().optional()` shouldn't flag a blank.
  const optionalKeys = React.useMemo(() => {
    const set = new Set<string>()
    for (const field of fields) {
      if (field.required) continue
      if (!isFieldRequired(schema, field.name)) set.add(field.name)
    }
    return set
  }, [schema, fields])

  // Normalize empty optional strings to `undefined` before validation so an
  // optional field only validates once the user actually types something.
  // Required fields keep their empty string, so their own messages still fire.
  const validationSchema = React.useMemo(
    () =>
      z.preprocess((raw) => {
        if (raw == null || typeof raw !== "object") return raw
        const out = { ...(raw as Record<string, unknown>) }
        for (const key of optionalKeys)
          if (out[key] === "") out[key] = undefined
        return out
      }, schema as z.ZodType),
    [schema, optionalKeys]
  )

  const form = useForm({
    defaultValues: baseline,
    // Zod v4 schemas are Standard Schemas; TanStack types the validator input as
    // `T` while Zod reports `unknown`. Runtime-identical, so the cast only bridges
    // that TS-only divergence — validation runs exactly as written.
    validators: {
      onChange: validationSchema as never,
      onSubmit: validationSchema as never,
    },
    onSubmit: ({ value }) => onSubmit?.(value as T),
  })

  const values = useSelector(form.store, (state) => state.values) as T
  // A submit attempt should reveal every error, even for fields never blurred.
  const submitAttempted = useSelector(
    form.store,
    (state) => state.submissionAttempts > 0
  )
  const lastSyncedRef = React.useRef<T>(defaultValues)
  // Set right before we push our own edits into `setData`, so the resulting
  // `data` change is recognized as *our* echo (not an external override) and
  // doesn't trigger a form reset — see the two sync effects below.
  const selfUpdateRef = React.useRef(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  // On a failed submit, move focus to the first field (in definition order) that
  // has an error, so the user lands right where they need to fix things.
  const focusFirstError = React.useCallback(() => {
    for (const field of fields) {
      const meta = form.getFieldMeta(field.name as never)
      if (!meta || (meta.errors?.length ?? 0) === 0) continue
      const wrapper = formRef.current?.querySelector<HTMLElement>(
        `[data-field="${CSS.escape(field.name)}"]`
      )
      // Focus the first focusable control inside the field — works across every
      // control type (input, trigger button, etc.) without threading ids around.
      wrapper
        ?.querySelector<HTMLElement>(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        )
        ?.focus()
      break
    }
  }, [fields, form])

  // Mirror live form values back into the consumer's `setData`.
  React.useEffect(() => {
    if (!setData) return
    if (deepEqual(values, lastSyncedRef.current)) return
    lastSyncedRef.current = values
    // Flag the `data` update this triggers as self-originated so the reconcile
    // effect skips it. Without this, rapid edits race: `values` runs ahead of
    // the mirrored `data`, the reconcile effect sees them differ and resets the
    // form back to the stale `data`, which loops (max update depth).
    selfUpdateRef.current = true
    setData(values)
  }, [values, setData])

  // Reconcile external `data` changes (async load / programmatic reset) into the
  // form — e.g. `setData(EMPTY)` after a successful submit. `form.reset(values)`
  // adopts them as the new baseline and clears *all* state (field meta *and*
  // `submissionAttempts`), so the fresh values start pristine: no lingering
  // blurred/touched flags and no leftover submit attempt keeping errors visible.
  React.useEffect(() => {
    if (data === undefined) return
    // Ignore the `data` change our own mirror effect just produced — adopting it
    // back into the form would fight live edits (and can loop under rapid input).
    if (selfUpdateRef.current) {
      selfUpdateRef.current = false
      return
    }
    if (deepEqual(data, lastSyncedRef.current)) return
    lastSyncedRef.current = data
    const base: Record<string, unknown> = {}
    for (const field of fields) base[field.name] = defaultForType(field.type)
    const next = { ...base, ...(data as Record<string, unknown>) } as T
    // Advance the baseline in lockstep so the per-render `form.update(opts)` sees
    // no defaultValues change and leaves the freshly adopted values in place.
    setBaseline(next)
    form.reset(next as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <form
      ref={formRef}
      id={id}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit().then(focusFirstError)
      }}
      className={cn("grid gap-4", COLS[columns], className)}
    >
      {fields.map((field) => {
        if (field.hidden?.(values)) return null

        const spanClass = field.colSpan ? SPAN[field.colSpan] : undefined
        const required = field.required ?? isFieldRequired(schema, field.name)

        return (
          <form.Field key={field.name} name={field.name as never}>
            {(fieldApi) => {
              // Validation runs live (`onChange` schema), but errors only *display*
              // after the field is blurred — so typing doesn't flash an error, yet
              // once shown it clears in real time as the value becomes valid. A
              // submit attempt reveals errors on every field, blurred or not.
              const meta = fieldApi.state.meta
              const error =
                meta.isBlurred || submitAttempted
                  ? getErrorMessage(meta.errors)
                  : undefined

              return (
                // `onBlur` bubbles from whatever control is inside (React blur is
                // focusout), so the field flips to blurred/touched when focus leaves
                // without every field component needing to forward an onBlur prop.
                <div
                  className={spanClass}
                  data-field={field.name}
                  onBlur={() => fieldApi.handleBlur()}
                >
                  <FieldRenderer
                    field={field}
                    required={required}
                    value={fieldApi.state.value}
                    onChange={(v) => fieldApi.handleChange(v as never)}
                    error={error}
                  />
                </div>
              )
            }}
          </form.Field>
        )
      })}

      {children !== undefined ? (
        <div className={SPAN[columns]}>{children}</div>
      ) : submitLabel !== null ? (
        <div
          className={cn(
            "flex items-center justify-end gap-2 pt-1",
            SPAN[columns]
          )}
        >
          {resetLabel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              {resetLabel}
            </Button>
          )}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {submitLabel}
              </Button>
            )}
          </form.Subscribe>
        </div>
      ) : null}
    </form>
  )
}

/** Normalize TanStack field errors (strings or Standard-Schema issues) to text. */
function getErrorMessage(errors: ReadonlyArray<unknown>): string | undefined {
  const first = errors?.[0]
  if (first == null) return undefined
  if (typeof first === "string") return first
  if (typeof first === "object" && "message" in first) {
    return String((first as { message: unknown }).message)
  }
  return String(first)
}

function FieldRenderer<T extends Record<string, unknown>>({
  field,
  required,
  value,
  onChange,
  error,
}: {
  field: FieldDefinition<T>
  required: boolean
  value: unknown
  onChange: (v: unknown) => void
  error?: string
}) {
  const common = {
    label: field.label,
    placeholder: field.placeholder,
    description: field.description,
    error,
    required,
    disabled: field.disabled,
  }

  switch (field.type) {
    case "text":
    case "email":
    case "url":
      return (
        <SmartInputField
          {...common}
          type={field.type}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          maxLength={field.maxLength}
          autoComplete={field.autoComplete}
        />
      )
    case "tel":
      return (
        <SmartTelField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          autoComplete={field.autoComplete}
        />
      )
    case "slug":
      return (
        <SmartSlugField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          prefix={field.slugPrefix}
          maxLength={field.maxLength}
        />
      )
    case "password":
      return (
        <SmartPasswordField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          autoComplete={field.autoComplete}
        />
      )
    case "textarea":
      return (
        <SmartTextareaField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          rows={field.rows}
          maxLength={field.maxLength}
        />
      )
    case "text-editor":
      return (
        <SmartTextEditorField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          format={field.editorFormat}
          toolbar={field.toolbar}
          minHeight={field.minHeight}
          maxHeight={field.maxHeight}
        />
      )
    case "number":
    case "decimal":
    case "integer":
    case "currency":
    case "percentage":
      return (
        <SmartNumberField
          {...common}
          data={value as number | null}
          setData={onChange as (v: number | null) => void}
          integer={field.type === "integer"}
          decimalScale={
            field.decimalScale ??
            (field.type === "currency"
              ? 2
              : field.type === "integer"
                ? 0
                : undefined)
          }
          prefix={field.prefix ?? (field.type === "currency" ? "$" : undefined)}
          suffix={
            field.suffix ?? (field.type === "percentage" ? "%" : undefined)
          }
          min={field.min}
          max={field.max}
          step={field.step}
        />
      )
    case "select":
      return (
        <SmartSelectField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          options={field.options}
        />
      )
    case "combobox":
    case "autocomplete":
      return (
        <SmartComboboxField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          options={field.options ?? []}
          searchPlaceholder={field.searchPlaceholder}
          emptyText={field.emptyText}
        />
      )
    case "multiselect":
      return (
        <SmartMultiSelectField
          {...common}
          data={(value as string[]) ?? []}
          setData={onChange as (v: string[]) => void}
          options={field.options}
          maxSelected={field.maxSelected}
          searchPlaceholder={field.searchPlaceholder}
        />
      )
    case "checkbox":
      return (
        <SmartCheckboxField
          {...common}
          data={(value as boolean) ?? false}
          setData={onChange as (v: boolean) => void}
        />
      )
    case "switch":
      return (
        <SmartSwitchField
          {...common}
          data={(value as boolean) ?? false}
          setData={onChange as (v: boolean) => void}
        />
      )
    case "radio":
      return (
        <SmartRadioGroupField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          options={field.options}
          orientation={field.orientation}
        />
      )
    case "checkbox-group":
      return (
        <SmartCheckboxGroupField
          {...common}
          data={(value as string[]) ?? []}
          setData={onChange as (v: string[]) => void}
          options={field.options}
          orientation={field.orientation}
        />
      )
    case "yesno":
      return (
        <SmartYesNoField
          {...common}
          data={(value as boolean) ?? false}
          setData={onChange as (v: boolean) => void}
          orientation={field.orientation}
          yesLabel={field.yesLabel}
          noLabel={field.noLabel}
        />
      )
    case "date":
      return (
        <SmartDateField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
        />
      )
    case "time":
      return (
        <SmartTimeField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          use12Hour={field.use12Hour}
          withSeconds={field.withSeconds}
          minuteStep={field.minuteStep}
        />
      )
    case "datetime":
      return (
        <SmartDateTimeField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          use12Hour={field.use12Hour}
          withSeconds={field.withSeconds}
          minuteStep={field.minuteStep}
        />
      )
    case "month":
      return (
        <SmartMonthField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          fromYear={field.fromYear}
          toYear={field.toYear}
        />
      )
    case "year":
      return (
        <SmartYearField
          {...common}
          data={value as number | null}
          setData={onChange as (v: number | null) => void}
          fromYear={field.fromYear}
          toYear={field.toYear}
        />
      )
    case "daterange":
      return (
        <SmartDateRangeField
          {...common}
          data={value as DateRangeValue | undefined}
          setData={onChange as (v: DateRangeValue | undefined) => void}
          numberOfMonths={field.numberOfMonths}
        />
      )
    case "timerange":
      return (
        <SmartTimeRangeField
          {...common}
          data={value as TimeRange | undefined}
          setData={onChange as (v: TimeRange | undefined) => void}
          use12Hour={field.use12Hour}
          withSeconds={field.withSeconds}
          minuteStep={field.minuteStep}
          startPlaceholder={field.startPlaceholder}
          endPlaceholder={field.endPlaceholder}
        />
      )
    case "segmented":
      return (
        <SmartSegmentedField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          options={field.options}
        />
      )
    default:
      return null
  }
}
