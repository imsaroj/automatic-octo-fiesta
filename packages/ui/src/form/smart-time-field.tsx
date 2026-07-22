import { SmartTimePicker } from "@iamsaroj/smart-ui/smart-components/smart-time-picker"
import type { FieldBaseProps } from "./base"

export interface SmartTimeFieldProps extends Omit<
  FieldBaseProps<string>,
  "readOnly"
> {
  /** Display (and pick) in 12-hour AM/PM form. Stored value stays 24-hour. */
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  /** Class applied to the trigger button (`className` styles the field wrapper). */
  triggerClassName?: string
}

/** Time field — stores a 24-hour `"HH:mm"` (or `"HH:mm:ss"`) string. */
export const SmartTimeField = ({
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
}: SmartTimeFieldProps) => (
  <SmartTimePicker
    value={data || undefined}
    onValueChange={setData}
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
