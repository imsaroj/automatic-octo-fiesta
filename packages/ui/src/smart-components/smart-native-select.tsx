"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Label } from "@workspace/ui/components/label"

export interface SmartNativeSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SmartNativeSelectGroup {
  label: string
  options: SmartNativeSelectOption[]
}

export interface SmartNativeSelectProps extends Omit<
  React.ComponentProps<"select">,
  "children"
> {
  /** Flat list of options. Mutually exclusive with `groups`. */
  options?: SmartNativeSelectOption[]
  /** Optgroup-based grouped options. Mutually exclusive with `options`. */
  groups?: SmartNativeSelectGroup[]
  /** Disabled placeholder option rendered as the first entry. */
  placeholder?: string
  // Field-level decoration
  /** Field label rendered above the select. */
  label?: React.ReactNode
  /** Hint rendered below. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  fieldRequired?: boolean
  optional?: boolean
  fieldClassName?: string
}

/**
 * Styled native `<select>` with field label, description, and error support.
 * Prefer `SmartSelect` (JS-powered) for rich option layouts; use this when
 * you need native form submission, mobile-native pickers, or zero JS overhead.
 *
 * ```tsx
 * <SmartNativeSelect
 *   label="Country"
 *   placeholder="Choose a country"
 *   options={[
 *     { value: "kr", label: "South Korea" },
 *     { value: "us", label: "United States" },
 *   ]}
 * />
 * ```
 */
export const SmartNativeSelect = ({
  options,
  groups,
  placeholder,
  label,
  description,
  error,
  fieldRequired,
  optional,
  fieldClassName,
  className,
  id: idProp,
  required,
  disabled,
  ...selectProps
}: SmartNativeSelectProps) => {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const isRequired = required ?? fieldRequired

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label htmlFor={id}>
          {label}
          {isRequired && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
          {optional && (
            <span className="font-normal text-muted-foreground">
              {" "}
              (optional)
            </span>
          )}
        </Label>
      )}
      <select
        id={id}
        disabled={disabled}
        required={isRequired}
        aria-describedby={hintId}
        aria-invalid={error != null ? true : undefined}
        className={cn(
          "flex h-7 w-full appearance-none rounded-md border border-input bg-input/20 px-2 py-0.5 text-xs/relaxed outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30",
          error != null &&
            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
          className
        )}
        {...selectProps}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options?.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
      </select>
      {hasHint && (
        <p
          id={hintId}
          className={cn(
            "text-xs",
            error != null ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? description}
        </p>
      )}
    </div>
  )
}
