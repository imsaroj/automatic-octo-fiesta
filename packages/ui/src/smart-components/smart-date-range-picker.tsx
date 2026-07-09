"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { Button } from "@iamsaroj/smart-ui/components/button"
import { Calendar } from "@iamsaroj/smart-ui/components/calendar"
import { Label } from "@iamsaroj/smart-ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@iamsaroj/smart-ui/components/popover"

export type { DateRange }

export interface SmartDateRangePickerProps {
  /** Selected range (controlled). */
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  placeholder?: string
  /** Number of months rendered side by side. @default 2 */
  numberOfMonths?: number
  /** Disable the whole trigger (`true`) or specific calendar days (matcher). */
  disabled?: React.ComponentProps<typeof Calendar>["disabled"]
  /** Class applied to the trigger button. Defaults to full-width. */
  className?: string
  // Field-level decoration
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
}

const formatRange = (range: DateRange | undefined): string | undefined => {
  if (!range?.from) return undefined
  if (!range.to) return format(range.from, "PP")
  return `${format(range.from, "PP")} – ${format(range.to, "PP")}`
}

/**
 * Popover date-range picker built on a range-mode `Calendar`. Produces a
 * `{ from, to }` `DateRange`. For an always-visible range calendar use
 * `SmartCalendar mode="range"` instead.
 *
 * ```tsx
 * <SmartDateRangePicker
 *   label="Reporting period"
 *   value={range}
 *   onValueChange={setRange}
 * />
 * ```
 */
export const SmartDateRangePicker = ({
  value,
  onValueChange,
  placeholder = "Pick a date range",
  numberOfMonths = 2,
  disabled,
  className,
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
}: SmartDateRangePickerProps) => {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const display = formatRange(value)

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
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled === true}
              className={cn(
                "w-full justify-start text-left font-normal",
                !display && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {display ?? <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onValueChange}
            numberOfMonths={numberOfMonths}
            defaultMonth={value?.from}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
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
