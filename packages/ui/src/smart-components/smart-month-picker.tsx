"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export interface SmartMonthPickerProps {
  /** Selected month, normalized to the first day of the month (controlled). */
  value?: Date
  onValueChange?: (value: Date | undefined) => void
  placeholder?: string
  /** Earliest selectable year (inclusive). */
  fromYear?: number
  /** Latest selectable year (inclusive). */
  toYear?: number
  disabled?: boolean
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

/**
 * Popover month picker — a 12-cell month grid with year navigation. Produces
 * a `Date` fixed to the first day of the chosen month.
 *
 * ```tsx
 * <SmartMonthPicker label="Billing month" value={month} onValueChange={setMonth} />
 * ```
 */
export function SmartMonthPicker({
  value,
  onValueChange,
  placeholder = "Pick a month",
  fromYear = 1970,
  toYear = new Date().getFullYear() + 10,
  disabled,
  className,
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
}: SmartMonthPickerProps) {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const [open, setOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(
    value?.getFullYear() ?? new Date().getFullYear()
  )

  // Snap the visible year to the selected value each time the popover opens.
  const handleOpenChange = (next: boolean) => {
    if (next && value) setViewYear(value.getFullYear())
    setOpen(next)
  }

  const select = (monthIndex: number) => {
    onValueChange?.(new Date(viewYear, monthIndex, 1))
    setOpen(false)
  }

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
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMMM yyyy") : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="mb-2 flex items-center justify-between">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={viewYear <= fromYear}
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Previous year"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-medium">{viewYear}</span>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={viewYear >= toYear}
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Next year"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((month, index) => {
              const isSelected =
                value?.getFullYear() === viewYear && value?.getMonth() === index
              return (
                <Button
                  key={month}
                  size="sm"
                  variant={isSelected ? "default" : "ghost"}
                  className="w-16"
                  onClick={() => select(index)}
                >
                  {month}
                </Button>
              )
            })}
          </div>
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
