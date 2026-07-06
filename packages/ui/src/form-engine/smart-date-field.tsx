import { SmartDatePicker } from "@workspace/ui/smart-components/smart-date-picker"
import type { FieldBaseProps } from "./base"

export type SmartDateFieldProps = FieldBaseProps<string>

export const SmartDateField = ({
  data,
  setData,
  label,
  placeholder,
  description,
  error,
  required,
  disabled,
  readOnly,
  className,
}: SmartDateFieldProps) => {
  const dateValue = data ? new Date(`${data}T00:00:00`) : undefined

  const toISO = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  return (
    <SmartDatePicker
      label={label}
      description={description}
      error={error}
      required={required}
      selected={dateValue}
      placeholder={placeholder ?? "Select date"}
      disabled={disabled || readOnly}
      onSelect={(date) => setData(date ? toISO(date) : "")}
      fieldClassName={className}
    />
  )
}
