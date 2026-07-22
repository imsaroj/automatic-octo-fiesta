import {
  SmartDateRangePicker,
  type DateRange,
} from "@iamsaroj/smart-ui/smart-components/smart-date-range-picker"
import type { FieldBaseProps } from "./base"

/** Stored range value — ISO `"YYYY-MM-DD"` date strings. */
export interface DateRangeValue {
  from?: string
  to?: string
}

export interface SmartDateRangeFieldProps extends Omit<
  FieldBaseProps<DateRangeValue | undefined>,
  "readOnly"
> {
  numberOfMonths?: number
  /** Class applied to the trigger button (`className` styles the field wrapper). */
  triggerClassName?: string
}

const toISO = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const parseDay = (value?: string): Date | undefined =>
  value ? new Date(`${value}T00:00:00`) : undefined

/**
 * Date-range field. Stores `{ from, to }` as ISO `"YYYY-MM-DD"` date strings
 * (serializable), converting to/from the picker's `Date` range.
 */
export const SmartDateRangeField = ({
  data,
  setData,
  label,
  placeholder,
  description,
  error,
  required,
  disabled,
  className,
  numberOfMonths,
  triggerClassName,
}: SmartDateRangeFieldProps) => {
  const value: DateRange | undefined = data?.from
    ? { from: parseDay(data.from), to: parseDay(data.to) }
    : undefined

  return (
    <SmartDateRangePicker
      value={value}
      onValueChange={(range) =>
        setData(
          range?.from
            ? {
                from: toISO(range.from),
                to: range.to ? toISO(range.to) : undefined,
              }
            : undefined
        )
      }
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      numberOfMonths={numberOfMonths}
      placeholder={placeholder}
      className={triggerClassName}
      fieldClassName={className}
    />
  )
}
