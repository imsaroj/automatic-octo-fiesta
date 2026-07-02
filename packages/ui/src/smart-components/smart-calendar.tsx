"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { cn } from "@workspace/ui/lib/utils"
import { Calendar } from "@workspace/ui/components/calendar"
import { Label } from "@workspace/ui/components/label"

/** Props shared by every selection mode. */
interface SmartCalendarBaseProps {
  /** Override the default displayed month. */
  defaultMonth?: Date
  /**
   * Disable specific dates or all navigation. Pass a function to restrict
   * selectable dates (e.g. `disabled={(d) => d < minDate || d > maxDate}`).
   */
  disabled?: boolean | ((date: Date) => boolean)
  showOutsideDays?: boolean
  className?: string
  // Field-level decoration
  /** Label displayed above the calendar (visual only — no htmlFor wiring). */
  label?: React.ReactNode
  /** Hint rendered below the calendar. Hidden when `error` is set. */
  description?: React.ReactNode
  /** Validation error shown below instead of `description`. */
  error?: React.ReactNode
  required?: boolean
  fieldClassName?: string
}

/** Single-date selection (default). */
interface SmartCalendarSingleProps extends SmartCalendarBaseProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

/** Multiple independent dates. */
interface SmartCalendarMultipleProps extends SmartCalendarBaseProps {
  mode: "multiple"
  selected?: Date[]
  onSelect?: (dates: Date[] | undefined) => void
  /** Minimum number of dates that must be selected. */
  min?: number
  /** Maximum number of dates that can be selected. */
  max?: number
}

/** Contiguous start–end date range. */
interface SmartCalendarRangeProps extends SmartCalendarBaseProps {
  mode: "range"
  selected?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  /** Minimum number of days the range must span. */
  min?: number
  /** Maximum number of days the range can span. */
  max?: number
}

export type SmartCalendarProps =
  | SmartCalendarSingleProps
  | SmartCalendarMultipleProps
  | SmartCalendarRangeProps

/**
 * Inline calendar with optional label, description, and error.
 *
 * Defaults to single-date selection; pass `mode="multiple"` or `mode="range"`
 * to change the selection behaviour (each mode has its own `selected` /
 * `onSelect` value shape).
 *
 * Use `DatePicker` (or `SmartDatePicker`) when you need a popover trigger.
 * Use `SmartCalendar` when the calendar should be permanently visible —
 * date-of-birth pickers, scheduling widgets, availability selectors.
 *
 * ```tsx
 * // Single (default)
 * <SmartCalendar selected={date} onSelect={setDate} />
 *
 * // Range
 * <SmartCalendar
 *   mode="range"
 *   label="Trip dates"
 *   selected={range}
 *   onSelect={setRange}
 * />
 * ```
 */
export { Calendar }
export type { DateRange }

export function SmartCalendar({
  label,
  description,
  error,
  required,
  fieldClassName,
  className,
  ...calendarProps
}: SmartCalendarProps) {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

  // Default to single-date selection. Cast once: the per-mode `selected` /
  // `onSelect` shapes are validated on `SmartCalendarProps`, but DayPicker's
  // discriminated union can't be reconstructed from a spread.
  const dayPickerProps = {
    ...calendarProps,
    mode: calendarProps.mode ?? "single",
  } as React.ComponentProps<typeof Calendar>

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
        </Label>
      )}
      <Calendar
        {...dayPickerProps}
        className={cn("rounded-md border border-border", className)}
        aria-describedby={hintId}
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
