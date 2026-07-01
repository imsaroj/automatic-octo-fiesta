"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Label } from "@workspace/ui/components/label"

export interface SmartDatePickerProps {
  /** Currently selected date (controlled). */
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  /** Class applied to the picker trigger button. Defaults to full-width. */
  pickerClassName?: string
  // Field-level decoration
  /** Field label rendered above the picker. */
  label?: React.ReactNode
  /** Hint rendered below. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
}

/**
 * DatePicker (calendar popover) with optional field label, description,
 * and error message. The trigger defaults to full-width.
 *
 * ```tsx
 * <SmartDatePicker
 *   label="Date of birth"
 *   date={dob}
 *   onDateChange={setDob}
 *   required
 *   error={dobError}
 * />
 * ```
 */
export function SmartDatePicker({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  pickerClassName,
  date,
  onDateChange,
  placeholder,
  disabled,
}: SmartDatePickerProps) {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label != null && (
        <Label>
          {label}
          {required && (
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
      <DatePicker
        date={date}
        onDateChange={onDateChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("w-full", pickerClassName)}
      />
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
