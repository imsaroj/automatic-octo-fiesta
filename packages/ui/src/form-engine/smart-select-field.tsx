import {
  SmartSelect,
  type SmartSelectOption,
  type SmartSelectGroup,
} from "@workspace/ui/smart-components/smart-select"
import type { FieldBaseProps } from "./base"

export type { SmartSelectOption, SmartSelectGroup }

export interface SmartSelectFieldProps extends FieldBaseProps<string> {
  options?: SmartSelectOption[]
  groups?: SmartSelectGroup[]
}

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
}: SmartSelectFieldProps) => (
  <SmartSelect
    value={data}
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
