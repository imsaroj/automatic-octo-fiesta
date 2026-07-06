"use client"

import * as React from "react"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Label } from "@workspace/ui/components/label"
import { SmartTimePicker } from "@workspace/ui/smart-components/smart-time-picker"

export interface TimeRange {
  /** Start time as 24-hour `"HH:mm"` (or `"HH:mm:ss"` with `withSeconds`). */
  start?: string
  /** End time as 24-hour `"HH:mm"` (or `"HH:mm:ss"` with `withSeconds`). */
  end?: string
}

export interface SmartTimeRangePickerProps {
  /** Selected `{ start, end }` range (controlled). */
  value?: TimeRange
  onValueChange?: (range: TimeRange) => void
  /** Display (and pick) in 12-hour AM/PM form. Emitted values stay 24-hour. */
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  disabled?: boolean
  startPlaceholder?: string
  endPlaceholder?: string
  // Field-level decoration
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
}

/**
 * Paired start / end time pickers producing a `{ start, end }` range. Both
 * ends share the `use12Hour` / `withSeconds` / `minuteStep` display options.
 *
 * ```tsx
 * <SmartTimeRangePicker
 *   label="Office hours"
 *   value={hours}
 *   onValueChange={setHours}
 * />
 * ```
 */
export const SmartTimeRangePicker = ({
  value,
  onValueChange,
  use12Hour = false,
  withSeconds = false,
  minuteStep = 1,
  disabled,
  startPlaceholder = "Start",
  endPlaceholder = "End",
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
}: SmartTimeRangePickerProps) => {
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
      <div className="flex items-center gap-2">
        <SmartTimePicker
          value={value?.start}
          onValueChange={(start) => onValueChange?.({ ...value, start })}
          use12Hour={use12Hour}
          withSeconds={withSeconds}
          minuteStep={minuteStep}
          disabled={disabled}
          placeholder={startPlaceholder}
          fieldClassName="flex-1"
        />
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <SmartTimePicker
          value={value?.end}
          onValueChange={(end) => onValueChange?.({ ...value, end })}
          use12Hour={use12Hour}
          withSeconds={withSeconds}
          minuteStep={minuteStep}
          disabled={disabled}
          placeholder={endPlaceholder}
          fieldClassName="flex-1"
        />
      </div>
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
