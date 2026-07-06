"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

const PAGE_SIZE = 12

export interface SmartYearPickerProps {
  /** Selected year (controlled). */
  value?: number
  onValueChange?: (value: number) => void
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

/** Floor `year` to the start of its 12-year page. */
const pageStart = (year: number, fromYear: number) =>
  fromYear + Math.floor((year - fromYear) / PAGE_SIZE) * PAGE_SIZE

/**
 * Popover year picker — a paged 12-year grid. Produces a numeric year.
 *
 * ```tsx
 * <SmartYearPicker label="Model year" value={year} onValueChange={setYear} />
 * ```
 */
export const SmartYearPicker = ({
  value,
  onValueChange,
  placeholder = "Pick a year",
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
}: SmartYearPickerProps) => {
  const id = React.useId()
  const hasHint = error != null || description != null
  const hintId = hasHint ? `${id}-hint` : undefined
  const [open, setOpen] = React.useState(false)
  const [pageBase, setPageBase] = React.useState(() =>
    pageStart(value ?? new Date().getFullYear(), fromYear)
  )

  // Snap the visible page to the selected value each time the popover opens.
  const handleOpenChange = (next: boolean) => {
    if (next && value != null) setPageBase(pageStart(value, fromYear))
    setOpen(next)
  }

  const years = Array.from({ length: PAGE_SIZE }, (_, i) => pageBase + i)
  const canPrev = pageBase > fromYear
  const canNext = pageBase + PAGE_SIZE <= toYear

  const select = (year: number) => {
    onValueChange?.(year)
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
                value == null && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value != null ? value : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="mb-2 flex items-center justify-between">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!canPrev}
              onClick={() => setPageBase((b) => b - PAGE_SIZE)}
              aria-label="Previous years"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              {years[0]} – {years[years.length - 1]}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!canNext}
              onClick={() => setPageBase((b) => b + PAGE_SIZE)}
              aria-label="Next years"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {years.map((year) => {
              const outOfRange = year < fromYear || year > toYear
              return (
                <Button
                  key={year}
                  size="sm"
                  variant={year === value ? "default" : "ghost"}
                  className="w-16"
                  disabled={outOfRange}
                  onClick={() => select(year)}
                >
                  {year}
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
