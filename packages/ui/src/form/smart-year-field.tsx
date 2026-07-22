import { SmartYearPicker } from "@iamsaroj/smart-ui/smart-components/smart-year-picker"
import type { FieldBaseProps } from "./base"

export interface SmartYearFieldProps extends Omit<
  FieldBaseProps<number | null>,
  "readOnly"
> {
  fromYear?: number
  toYear?: number
  /** Class applied to the trigger button (`className` styles the field wrapper). */
  triggerClassName?: string
}

/** Year field — stores a numeric year (or `null` when unset). */
export const SmartYearField = ({
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
  triggerClassName,
}: SmartYearFieldProps) => (
  <SmartYearPicker
    value={data ?? undefined}
    onValueChange={(year) => setData(year)}
    label={label}
    description={description}
    error={error}
    required={required}
    disabled={disabled}
    fromYear={fromYear}
    toYear={toYear}
    placeholder={placeholder}
    className={triggerClassName}
    fieldClassName={className}
  />
)
