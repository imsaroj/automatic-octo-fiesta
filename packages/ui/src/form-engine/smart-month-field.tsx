import { SmartMonthPicker } from "@iamsaroj/smart-ui/smart-components/smart-month-picker"
import type { FieldBaseProps } from "./base"

export interface SmartMonthFieldProps extends Omit<
  FieldBaseProps<string>,
  "readOnly"
> {
  fromYear?: number
  toYear?: number
}

/** Month field — stores a `"YYYY-MM"` string; empty means "unset". */
export const SmartMonthField = ({
  data,
  setData,
  label,
  placeholder,
  description,
  error,
  required,
  disabled,
  className,
  fromYear,
  toYear,
}: SmartMonthFieldProps) => {
  const [y, m] = data ? data.split("-").map(Number) : []
  const value = y && m ? new Date(y, m - 1, 1) : undefined

  const toValue = (date: Date | undefined): string =>
    date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      : ""

  return (
    <SmartMonthPicker
      value={value}
      onValueChange={(date) => setData(toValue(date))}
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      fromYear={fromYear}
      toYear={toYear}
      placeholder={placeholder}
      fieldClassName={className}
    />
  )
}
