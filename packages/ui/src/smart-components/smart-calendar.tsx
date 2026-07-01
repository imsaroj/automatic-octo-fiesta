"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Calendar } from "@workspace/ui/components/calendar"
import { Label } from "@workspace/ui/components/label"

export interface SmartCalendarProps {
  /** Currently selected date (controlled, single-date mode). */
  selected?: Date
  onSelect?: (date: Date | undefined) => void
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

/**
 * Inline single-date calendar with optional label, description, and error.
 *
 * Use `DatePicker` (or `SmartDatePicker`) when you need a popover trigger.
 * Use `SmartCalendar` when the calendar should be permanently visible —
 * date-of-birth pickers, scheduling widgets, availability selectors.
 *
 * ```tsx
 * <SmartCalendar
 *   label="Select a delivery date"
 *   description="Pick any date within the next 30 days."
 *   selected={date}
 *   onSelect={setDate}
 *   fromDate={new Date()}
 * />
 * ```
 */
export { Calendar }

export function SmartCalendar({
  label,
  description,
  error,
  required,
  fieldClassName,
  className,
  selected,
  onSelect,
  defaultMonth,
  disabled,
  showOutsideDays,
}: SmartCalendarProps) {
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
        </Label>
      )}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        defaultMonth={defaultMonth}
        disabled={disabled}
        showOutsideDays={showOutsideDays}
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
