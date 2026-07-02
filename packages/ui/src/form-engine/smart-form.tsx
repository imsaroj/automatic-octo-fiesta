"use client"

import * as React from "react"
import type { z } from "zod"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

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

export type FieldType =
  | "text"
  | "email"
  | "url"
  | "password"
  | "textarea"
  | "number"
  | "select"
  | "combobox"
  | "multiselect"
  | "checkbox"
  | "switch"
  | "radio"
  | "date"
  | "segmented"

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
  // Number extras
  decimalScale?: number
  min?: number
  max?: number
  step?: number
  // Textarea extras
  rows?: number
  maxLength?: number
  // Input extras
  autoComplete?: string
}

const COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as const
const SPAN = { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3" } as const

export interface SmartFormProps<T extends Record<string, unknown>> {
  schema: z.ZodType<T>
  data: T
  setData: (data: T) => void
  fields: FieldDefinition<T>[]
  /** Number of grid columns. Default `1`. */
  columns?: 1 | 2 | 3
  onSubmit?: (data: T) => void
  /** Label for the submit button. Pass `null` to suppress and use `children` instead. */
  submitLabel?: React.ReactNode | null
  /** Label for an optional reset button. */
  resetLabel?: string
  /** Rendered inside the form after the field grid (replaces default button row when provided). */
  children?: React.ReactNode
  className?: string
}

/**
 * Declarative form engine: supply a Zod schema, controlled data, and a field
 * definition array — the engine renders the right control for each field,
 * validates on submit, and surfaces Zod errors inline.
 *
 * ```tsx
 * const schema = z.object({ name: z.string().min(1), email: z.email() })
 * type Form = z.infer<typeof schema>
 *
 * const fields: FieldDefinition<Form>[] = [
 *   { name: "name", type: "text",  label: "Name" },
 *   { name: "email", type: "email", label: "Email" },
 * ]
 *
 * <SmartForm schema={schema} data={data} setData={setData} fields={fields} onSubmit={...} />
 * ```
 */
export function SmartForm<T extends Record<string, unknown>>({
  schema,
  data,
  setData,
  fields,
  columns = 1,
  onSubmit,
  submitLabel = "Submit",
  resetLabel,
  children,
  className,
}: SmartFormProps<T>) {
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [attempted, setAttempted] = React.useState(false)

  const validate = React.useCallback(
    (d: T): Record<string, string> => {
      const result = schema.safeParse(d)
      if (result.success) return {}
      const flat = result.error.flatten()
      const out: Record<string, string> = {}
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        const first = (msgs as string[] | undefined)?.[0]
        if (first) out[key] = first
      }
      return out
    },
    [schema]
  )

  const handleChange = React.useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      const next = { ...data, [name]: value } as T
      setData(next)
      if (attempted) setErrors(validate(next))
    },
    [data, setData, attempted, validate]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    const errs = validate(data)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      const result = schema.safeParse(data)
      if (result.success) onSubmit?.(result.data as T)
    }
  }

  const handleReset = () => {
    setErrors({})
    setAttempted(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      onReset={handleReset}
      className={cn("grid gap-4", COLS[columns], className)}
    >
      {fields.map((field) => {
        if (field.hidden?.(data)) return null

        const spanClass = field.colSpan ? SPAN[field.colSpan] : undefined
        const error = errors[field.name]
        const value = data[field.name]
        const onChange = (v: unknown) =>
          handleChange(field.name as keyof T, v as T[keyof T])

        return (
          <div key={field.name} className={spanClass}>
            <FieldRenderer
              field={field}
              value={value}
              onChange={onChange}
              error={error}
            />
          </div>
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
            <Button type="reset" variant="outline">
              {resetLabel}
            </Button>
          )}
          <Button type="submit">{submitLabel}</Button>
        </div>
      ) : null}
    </form>
  )
}

function FieldRenderer<T extends Record<string, unknown>>({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldDefinition<T>
  value: unknown
  onChange: (v: unknown) => void
  error?: string
}) {
  const common = {
    label: field.label,
    placeholder: field.placeholder,
    description: field.description,
    error,
    required: field.required,
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
    case "number":
      return (
        <SmartNumberField
          {...common}
          data={value as number | null}
          setData={onChange as (v: number | null) => void}
          decimalScale={field.decimalScale}
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
      return (
        <SmartComboboxField
          {...common}
          data={(value as string) ?? ""}
          setData={onChange as (v: string) => void}
          options={field.options ?? []}
        />
      )
    case "multiselect":
      return (
        <SmartMultiSelectField
          {...common}
          data={(value as string[]) ?? []}
          setData={onChange as (v: string[]) => void}
          options={field.options}
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
