"use client"

import * as React from "react"
import { ClockIcon, CalendarClockIcon } from "lucide-react"

import { cn } from "@imsaroj/smart-ui/lib/utils"
import { Button } from "@imsaroj/smart-ui/components/button"
import { Calendar } from "@imsaroj/smart-ui/components/calendar"
import { Label } from "@imsaroj/smart-ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@imsaroj/smart-ui/components/popover"

/* -------------------------------------------------------------------------- */
/*  Time helpers (value is always 24-hour, zero-padded)                       */
/* -------------------------------------------------------------------------- */

interface TimeParts {
  h: number // 0–23
  m: number // 0–59
  s: number // 0–59
}

const pad = (n: number) => String(n).padStart(2, "0")
const range = (n: number, step = 1) =>
  Array.from({ length: Math.ceil(n / step) }, (_, i) => i * step)

/** Parse `"HH:mm"` / `"HH:mm:ss"` → parts. Returns `undefined` when empty. */
const parseTimeString = (value?: string): TimeParts | undefined => {
  if (!value) return undefined
  const [h, m, s] = value.split(":").map((p) => Number.parseInt(p, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined
  return { h, m, s: Number.isNaN(s) ? 0 : s }
}

const partsToString = (parts: TimeParts, withSeconds: boolean): string =>
  withSeconds
    ? `${pad(parts.h)}:${pad(parts.m)}:${pad(parts.s)}`
    : `${pad(parts.h)}:${pad(parts.m)}`

const formatTimeDisplay = (
  parts: TimeParts,
  use12Hour: boolean,
  withSeconds: boolean
): string => {
  const secondPart = withSeconds ? `:${pad(parts.s)}` : ""
  if (use12Hour) {
    const period = parts.h < 12 ? "AM" : "PM"
    const displayHour = parts.h % 12 || 12
    return `${pad(displayHour)}:${pad(parts.m)}${secondPart} ${period}`
  }
  return `${pad(parts.h)}:${pad(parts.m)}${secondPart}`
}

/* -------------------------------------------------------------------------- */
/*  Shared column UI                                                          */
/* -------------------------------------------------------------------------- */

const TimeColumn = ({
  values,
  selected,
  onSelect,
  render = pad,
}: {
  values: number[]
  selected: number | undefined
  onSelect: (value: number) => void
  render?: (value: number) => string
}) => (
  <div className="no-scrollbar flex max-h-56 flex-col gap-0.5 overflow-y-auto p-1">
    {values.map((value) => (
      <Button
        key={value}
        size="icon-sm"
        variant={value === selected ? "default" : "ghost"}
        className="w-full shrink-0"
        onClick={() => onSelect(value)}
        data-time-selected={value === selected || undefined}
      >
        {render(value)}
      </Button>
    ))}
  </div>
)

/**
 * Hour / minute (/ second) (/ AM–PM) columns operating on 24-hour `TimeParts`.
 * Emits complete parts on every change (missing fields default to 0).
 */
const TimeColumns = ({
  parts,
  onChange,
  use12Hour,
  withSeconds,
  minuteStep,
}: {
  parts: TimeParts | undefined
  onChange: (parts: TimeParts) => void
  use12Hour: boolean
  withSeconds: boolean
  minuteStep: number
}) => {
  const base: TimeParts = parts ?? { h: 0, m: 0, s: 0 }
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Scroll the selected cells into view when the panel first shows a value.
  React.useEffect(() => {
    scrollRef.current
      ?.querySelectorAll<HTMLElement>("[data-time-selected]")
      .forEach((el) => el.scrollIntoView({ block: "center" }))
    // Run once on mount — re-scrolling on every keystroke is jarring.
  }, [])

  const period: "AM" | "PM" = base.h < 12 ? "AM" : "PM"
  const hour12 = base.h % 12 || 12

  const setHour = (value: number) => {
    if (use12Hour) {
      const h = period === "PM" ? (value % 12) + 12 : value % 12
      onChange({ ...base, h })
    } else {
      onChange({ ...base, h: value })
    }
  }
  const setPeriod = (next: "AM" | "PM") => {
    const h12 = base.h % 12
    onChange({ ...base, h: next === "PM" ? h12 + 12 : h12 })
  }

  return (
    <div ref={scrollRef} className="flex divide-x">
      <TimeColumn
        values={use12Hour ? range(12).map((n) => n + 1) : range(24)}
        selected={use12Hour ? hour12 : base.h}
        onSelect={setHour}
      />
      <TimeColumn
        values={range(60, minuteStep)}
        selected={base.m}
        onSelect={(m) => onChange({ ...base, m })}
      />
      {withSeconds && (
        <TimeColumn
          values={range(60)}
          selected={base.s}
          onSelect={(s) => onChange({ ...base, s })}
        />
      )}
      {use12Hour && (
        <div className="flex flex-col gap-0.5 p-1">
          {(["AM", "PM"] as const).map((p) => (
            <Button
              key={p}
              size="icon-sm"
              variant={p === period ? "default" : "ghost"}
              className="w-full shrink-0"
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Field decoration wrapper (shared with the other Smart* field controls)   */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  optional?: boolean
  fieldClassName?: string
}

const Field = ({
  label,
  description,
  error,
  required,
  optional,
  fieldClassName,
  children,
}: FieldProps & { children: React.ReactNode }) => {
  const id = React.useId()
  const hasHint = error != null || description != null
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
      {children}
      {hasHint && (
        <p
          id={`${id}-hint`}
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

/* -------------------------------------------------------------------------- */
/*  SmartTimePicker                                                           */
/* -------------------------------------------------------------------------- */

export interface SmartTimePickerProps extends FieldProps {
  /** Selected time as `"HH:mm"` (or `"HH:mm:ss"` with `withSeconds`), 24-hour. */
  value?: string
  onValueChange?: (value: string) => void
  /** Display (and pick) in 12-hour AM/PM form. The emitted value stays 24-hour. */
  use12Hour?: boolean
  /** Include a seconds column and seconds in the value. */
  withSeconds?: boolean
  /** Minute increment for the minutes column. Defaults to 1. */
  minuteStep?: number
  placeholder?: string
  disabled?: boolean
  /** Class applied to the trigger button. Defaults to full-width. */
  className?: string
}

/**
 * Popover time picker with hour / minute (optionally seconds, optionally
 * AM–PM) columns. The value is a 24-hour `"HH:mm"` string regardless of the
 * `use12Hour` display option.
 *
 * ```tsx
 * <SmartTimePicker label="Start time" value={time} onValueChange={setTime} />
 * ```
 */
export const SmartTimePicker = ({
  value,
  onValueChange,
  use12Hour = false,
  withSeconds = false,
  minuteStep = 1,
  placeholder = "Pick a time",
  disabled,
  className,
  ...field
}: SmartTimePickerProps) => {
  const parts = parseTimeString(value)

  return (
    <Field {...field}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !parts && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <ClockIcon className="mr-2 h-4 w-4" />
          {parts ? (
            formatTimeDisplay(parts, use12Hour, withSeconds)
          ) : (
            <span>{placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <TimeColumns
            parts={parts}
            onChange={(next) =>
              onValueChange?.(partsToString(next, withSeconds))
            }
            use12Hour={use12Hour}
            withSeconds={withSeconds}
            minuteStep={minuteStep}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

/* -------------------------------------------------------------------------- */
/*  SmartDateTimePicker                                                       */
/* -------------------------------------------------------------------------- */

export interface SmartDateTimePickerProps extends FieldProps {
  /** Selected date + time. */
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  placeholder?: string
  /** Disable the whole trigger (`true`) or specific calendar days (matcher). */
  disabled?: React.ComponentProps<typeof Calendar>["disabled"]
  className?: string
}

const formatDateTime = (
  date: Date,
  use12Hour: boolean,
  withSeconds: boolean
): string => {
  const datePart = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const time = formatTimeDisplay(
    { h: date.getHours(), m: date.getMinutes(), s: date.getSeconds() },
    use12Hour,
    withSeconds
  )
  return `${datePart}, ${time}`
}

/**
 * Combined calendar + time-column picker in a single popover, producing a
 * single `Date`. Picking a day keeps the current time; picking a time keeps
 * the current day (defaulting to today when none is set yet).
 *
 * ```tsx
 * <SmartDateTimePicker label="Starts at" value={when} onValueChange={setWhen} />
 * ```
 */
export const SmartDateTimePicker = ({
  value,
  onValueChange,
  use12Hour = false,
  withSeconds = false,
  minuteStep = 1,
  placeholder = "Pick date & time",
  disabled,
  className,
  ...field
}: SmartDateTimePickerProps) => {
  const parts: TimeParts | undefined = value
    ? { h: value.getHours(), m: value.getMinutes(), s: value.getSeconds() }
    : undefined

  const handleDay = (day: Date | undefined) => {
    if (!day) {
      onValueChange?.(undefined)
      return
    }
    const next = new Date(day)
    if (value) {
      next.setHours(value.getHours(), value.getMinutes(), value.getSeconds(), 0)
    } else {
      next.setHours(0, 0, 0, 0)
    }
    onValueChange?.(next)
  }

  const handleTime = (t: TimeParts) => {
    const next = value ? new Date(value) : new Date()
    next.setHours(t.h, t.m, t.s, 0)
    onValueChange?.(next)
  }

  return (
    <Field {...field}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled === true}
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <CalendarClockIcon className="mr-2 h-4 w-4" />
          {value ? (
            formatDateTime(value, use12Hour, withSeconds)
          ) : (
            <span>{placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row sm:divide-x">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDay}
              disabled={disabled}
            />
            <TimeColumns
              parts={parts}
              onChange={handleTime}
              use12Hour={use12Hour}
              withSeconds={withSeconds}
              minuteStep={minuteStep}
            />
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
