"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

/**
 * Translate the intuitive upper-case tokens people reach for (`YYYY`, `DD`)
 * into their date-fns equivalents (`yyyy`, `dd`). date-fns uses `yyyy` for the
 * calendar year (`YYYY` is the week-numbering year) and `dd` for day-of-month
 * (`DD` is day-of-year), so passing the upper-case forms straight through would
 * be subtly wrong. `MM`/`M` (month) and text inside single quotes are left
 * untouched, so preset patterns like `"PPP"` still pass through unchanged.
 */
const normalizeDateFormat = (pattern: string) =>
  pattern.replace(/'[^']*'|[A-Za-z]+/g, (token) =>
    token.startsWith("'") ? token : token.replace(/Y/g, "y").replace(/D/g, "d")
  )
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  /**
   * How the selected date is rendered in the trigger. Accepts a date-fns
   * pattern; the intuitive upper-case tokens are normalized, so
   * `"YYYY-MM-DD"`, `"DD/MM/YYYY"`, `"MM-DD-YYYY"`, `"YYYY.MM.DD"` all work.
   * Defaults to `"PPP"` (e.g. "July 10th, 2026").
   */
  dateFormat?: string
  /**
   * Disables the whole trigger when `true`, or forwards a react-day-picker
   * matcher (e.g. `(d) => d < today`) to disable specific calendar days.
   */
  disabled?: React.ComponentProps<typeof Calendar>["disabled"]
  /**
   * Caption navigation style. `"label"` (default) shows a static month/year
   * label; `"dropdown"` turns both month and year into pickers, and
   * `"dropdown-months"` / `"dropdown-years"` enable just one of them.
   */
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
  /** Earliest month the (year) dropdown can navigate to. */
  startMonth?: React.ComponentProps<typeof Calendar>["startMonth"]
  /** Latest month the (year) dropdown can navigate to. */
  endMonth?: React.ComponentProps<typeof Calendar>["endMonth"]
}

export const DatePicker = ({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled,
  dateFormat,
  captionLayout,
  startMonth,
  endMonth,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
            disabled={disabled === true}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? (
          format(date, dateFormat ? normalizeDateFormat(dateFormat) : "PPP")
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(next) => {
            onDateChange?.(next)
            // Close once a concrete day is chosen (react-day-picker fires with
            // `undefined` when the selected day is toggled off — keep open then).
            if (next) setOpen(false)
          }}
          disabled={disabled}
          captionLayout={captionLayout}
          startMonth={startMonth}
          endMonth={endMonth}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  )
}
