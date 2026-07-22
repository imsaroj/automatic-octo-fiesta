import {
  SmartDatePicker,
  type SmartDatePickerProps,
} from "@iamsaroj/smart-ui/smart-components/smart-date-picker"
import type { FieldBaseProps } from "./base"

/**
 * The picker's own controls and calendar configuration, forwarded untouched:
 * day steppers, the reset-to-today button, which clock "today" is read from,
 * the caption's month/year dropdowns (with their navigable range), and the
 * trigger's display format.
 *
 * `Pick`ed from {@link SmartDatePickerProps} rather than restated so the field —
 * and, through `FieldTypeExtras`, the `type: "date"` config — can't drift from
 * the picker it renders.
 */
export type SmartDateFieldProps = FieldBaseProps<string> &
  Pick<
    SmartDatePickerProps,
    | "steppers"
    | "todayButton"
    | "timeZone"
    | "captionLayout"
    | "startMonth"
    | "endMonth"
    | "dateFormat"
    | "pickerClassName"
  >

/**
 * Single calendar-date field. Stores the value as an ISO `yyyy-MM-dd` string and
 * parses it back at local midnight, so the round-trip is time-zone stable.
 *
 * ```tsx
 * { name: "dueDate", label: "Due date", type: "date", steppers: true, todayButton: true }
 * { name: "dob", type: "date", captionLayout: "dropdown", startMonth: new Date(1940, 0) }
 * ```
 *
 * @remarks
 * `timeZone="utc"` only moves what the today button and steppers consider
 * "today" — the stored value stays a plain calendar date with no time component,
 * so it is unaffected.
 */
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
  steppers,
  todayButton,
  timeZone,
  captionLayout,
  startMonth,
  endMonth,
  dateFormat,
  pickerClassName,
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
      steppers={steppers}
      todayButton={todayButton}
      timeZone={timeZone}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      dateFormat={dateFormat}
      pickerClassName={pickerClassName}
      fieldClassName={className}
    />
  )
}
