"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
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
   * Disables the whole trigger when `true`, or forwards a react-day-picker
   * matcher (e.g. `(d) => d < today`) to disable specific calendar days.
   */
  disabled?: React.ComponentProps<typeof Calendar>["disabled"]
}

export const DatePicker = ({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled,
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
        {date ? format(date, "PPP") : <span>{placeholder}</span>}
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
        />
      </PopoverContent>
    </Popover>
  )
}
