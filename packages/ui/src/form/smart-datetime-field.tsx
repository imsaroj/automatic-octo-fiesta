import { SmartDateTimePicker } from "@iamsaroj/smart-ui/smart-components/smart-time-picker"
import type { FieldBaseProps } from "./base"

export interface SmartDateTimeFieldProps extends Omit<
  FieldBaseProps<string>,
  "readOnly"
> {
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  /** Class applied to the trigger button (`className` styles the field wrapper). */
  triggerClassName?: string
}

/**
 * Combined date + time field. Stores an ISO 8601 string (`Date.toISOString()`);
 * an empty string means "unset".
 */
export const SmartDateTimeField = ({
  data,
  setData,
  label,
  placeholder,
  description,
  error,
  required,
  disabled,
  className,
  use12Hour,
  withSeconds,
  minuteStep,
  triggerClassName,
}: SmartDateTimeFieldProps) => {
  const value = data ? new Date(data) : undefined
  const selected = value && !Number.isNaN(value.getTime()) ? value : undefined

  return (
    <SmartDateTimePicker
      value={selected}
      onValueChange={(date) => setData(date ? date.toISOString() : "")}
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      use12Hour={use12Hour}
      withSeconds={withSeconds}
      minuteStep={minuteStep}
      placeholder={placeholder}
      className={triggerClassName}
      fieldClassName={className}
    />
  )
}
