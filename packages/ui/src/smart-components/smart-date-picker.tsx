"use client"

import * as React from "react"
import { addDays } from "date-fns"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { cn } from "@imsaroj/smart-ui/lib/utils"
import { Button } from "@imsaroj/smart-ui/components/button"
import { DatePicker } from "@imsaroj/smart-ui/components/date-picker"
import { Label } from "@imsaroj/smart-ui/components/label"

export interface SmartDatePickerProps {
  /** Currently selected date (controlled). */
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  /**
   * Disables the whole trigger when `true`, or forwards a react-day-picker
   * matcher (e.g. `(d) => d < today`) to disable specific calendar days.
   */
  disabled?: React.ComponentProps<typeof DatePicker>["disabled"]
  /** Class applied to the picker trigger button. Defaults to full-width. */
  pickerClassName?: string
  /**
   * Day-stepper buttons flanking the picker. `"prev"` shows only the −1 day
   * button (in front), `"next"` only the +1 day button (behind), `"both"`
   * (or `true`) shows both. Stepping from an empty value starts at today.
   * Defaults to `false` (no steppers).
   */
  steppers?: boolean | "prev" | "next" | "both"
  /**
   * Show a "reset to today" button after the picker. Defaults to `false`.
   */
  todayButton?: boolean
  /**
   * Which clock "today" is read from for the today button and steppers:
   * `"local"` (default) uses the browser's local calendar day, `"utc"` uses
   * the current UTC calendar day (they can differ around midnight).
   */
  timeZone?: "local" | "utc"
  /**
   * Caption navigation style for the calendar. `"label"` (default) shows a
   * static month/year label; `"dropdown"` turns both month and year into
   * pickers, and `"dropdown-months"` / `"dropdown-years"` enable just one.
   */
  captionLayout?: React.ComponentProps<typeof DatePicker>["captionLayout"]
  /** Earliest month the (year) dropdown can navigate to. */
  startMonth?: React.ComponentProps<typeof DatePicker>["startMonth"]
  /** Latest month the (year) dropdown can navigate to. */
  endMonth?: React.ComponentProps<typeof DatePicker>["endMonth"]
  /**
   * How the selected date is rendered in the trigger. Accepts a date-fns
   * pattern; the intuitive upper-case tokens are normalized, so
   * `"YYYY-MM-DD"`, `"DD/MM/YYYY"`, `"MM-DD-YYYY"`, `"YYYY.MM.DD"` all work.
   * Defaults to `"PPP"` (e.g. "July 10th, 2026").
   */
  dateFormat?: React.ComponentProps<typeof DatePicker>["dateFormat"]
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
 * Midnight-today, so today-resets/steppers don't carry a time component.
 * `"utc"` pins to the current UTC calendar day (still represented as a local
 * midnight `Date` so the calendar highlights the right cell).
 */
const today = (timeZone: "local" | "utc" = "local") => {
  const d = new Date()
  if (timeZone === "utc") {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * DatePicker (calendar popover) with optional field label, description,
 * and error message. The trigger defaults to full-width.
 *
 * ```tsx
 * <SmartDatePicker
 *   label="Date of birth"
 *   selected={dob}
 *   onSelect={setDob}
 *   required
 *   error={dobError}
 * />
 * ```
 *
 * Opt into the day-stepper controls with `steppers` and/or `todayButton`
 * (reset to today). `steppers` is independently configurable — `"prev"` for
 * just the −1 day button, `"next"` for just +1, `"both"` (or `true`) for both:
 *
 * ```tsx
 * <SmartDatePicker selected={date} onSelect={setDate} steppers todayButton />
 * <SmartDatePicker selected={date} onSelect={setDate} steppers="prev" />
 * <SmartDatePicker selected={date} onSelect={setDate} steppers="next" />
 * ```
 *
 * Use `timeZone="utc"` to make the today button / steppers read the current
 * UTC calendar day instead of the browser's local day, and `captionLayout`
 * (with optional `startMonth`/`endMonth`) to enable month/year dropdowns:
 *
 * ```tsx
 * <SmartDatePicker selected={date} onSelect={setDate} todayButton timeZone="utc" />
 * <SmartDatePicker
 *   selected={date}
 *   onSelect={setDate}
 *   captionLayout="dropdown"
 *   startMonth={new Date(1970, 0)}
 *   endMonth={new Date(2035, 11)}
 * />
 * ```
 */
export const SmartDatePicker = ({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  pickerClassName,
  selected,
  onSelect,
  placeholder,
  disabled,
  steppers,
  todayButton,
  timeZone = "local",
  captionLayout,
  startMonth,
  endMonth,
  dateFormat,
}: SmartDatePickerProps) => {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined

  // `disabled === true` disables the whole control; a matcher only disables
  // calendar days, so the stepper/today buttons stay active in that case.
  const controlsDisabled = disabled === true
  const showPrev =
    steppers === true || steppers === "both" || steppers === "prev"
  const showNext =
    steppers === true || steppers === "both" || steppers === "next"
  const hasControls = showPrev || showNext || todayButton === true

  const step = (delta: number) => {
    onSelect?.(addDays(selected ?? today(timeZone), delta))
  }

  const picker = (
    <DatePicker
      date={selected}
      onDateChange={onSelect}
      placeholder={placeholder}
      disabled={disabled}
      dateFormat={dateFormat}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      className={cn("w-full", pickerClassName)}
    />
  )

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
      {hasControls ? (
        <div className="flex items-center gap-1.5">
          {showPrev && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous day"
              disabled={controlsDisabled}
              onClick={() => step(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">{picker}</div>
          {showNext && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next day"
              disabled={controlsDisabled}
              onClick={() => step(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {todayButton && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Reset to today"
              disabled={controlsDisabled}
              onClick={() => onSelect?.(today(timeZone))}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        picker
      )}
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
