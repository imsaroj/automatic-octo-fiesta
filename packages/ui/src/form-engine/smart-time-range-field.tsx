import {
  SmartTimeRangePicker,
  type TimeRange,
} from "@workspace/ui/smart-components/smart-time-range-picker"
import type { FieldBaseProps } from "./base"

export type { TimeRange }

export interface SmartTimeRangeFieldProps extends Omit<
  FieldBaseProps<TimeRange | undefined>,
  "readOnly" | "placeholder"
> {
  use12Hour?: boolean
  withSeconds?: boolean
  minuteStep?: number
  startPlaceholder?: string
  endPlaceholder?: string
}

/** Time-range field — stores `{ start, end }` as 24-hour `"HH:mm"` strings. */
export function SmartTimeRangeField({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  className,
  use12Hour,
  withSeconds,
  minuteStep,
  startPlaceholder,
  endPlaceholder,
}: SmartTimeRangeFieldProps) {
  return (
    <SmartTimeRangePicker
      value={data}
      onValueChange={setData}
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      use12Hour={use12Hour}
      withSeconds={withSeconds}
      minuteStep={minuteStep}
      startPlaceholder={startPlaceholder}
      endPlaceholder={endPlaceholder}
      fieldClassName={className}
    />
  )
}
