import {
  SmartSelect,
  type SmartSelectOption,
  type SmartSelectGroup,
} from "@iamsaroj/smart-ui/smart-components/smart-select"
import type { FieldBaseProps } from "./base"

export type { SmartSelectOption, SmartSelectGroup }

export interface SmartSelectFieldProps extends FieldBaseProps<string> {
  options?: SmartSelectOption[]
  groups?: SmartSelectGroup[]
  /** Trigger height. @default "default" */
  size?: "default" | "sm"
  /** Class applied to the trigger button (the field's `className` styles the wrapper). */
  triggerClassName?: string
}

/** Single-choice dropdown from flat `options` or grouped `groups`. */
export const SmartSelectField = ({
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
  options,
  groups,
  size,
  triggerClassName,
}: SmartSelectFieldProps) => (
  <SmartSelect
    size={size}
    triggerClassName={triggerClassName}
    value={data ?? null}
    onValueChange={(v) => setData(v ?? "")}
    placeholder={placeholder}
    label={label}
    description={description}
    error={error}
    fieldRequired={required}
    options={options}
    groups={groups}
    disabled={disabled || readOnly}
    fieldClassName={className}
  />
)
