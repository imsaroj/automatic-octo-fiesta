import {
  SmartRadioGroup,
  type SmartRadioOption,
} from "@iamsaroj/smart-ui/smart-components/smart-radio-group"
import type { FieldBaseProps } from "./base"

export type { SmartRadioOption }

export interface SmartRadioGroupFieldProps extends Omit<
  FieldBaseProps<string>,
  "placeholder" | "readOnly"
> {
  options?: SmartRadioOption[]
  orientation?: "horizontal" | "vertical"
}

/** Single choice from a visible radio group. */
export const SmartRadioGroupField = ({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  className,
  options = [],
  orientation,
}: SmartRadioGroupFieldProps) => (
  <SmartRadioGroup
    value={data}
    onValueChange={setData}
    label={label}
    description={description}
    error={error}
    required={required}
    items={options}
    disabled={disabled}
    orientation={orientation}
    fieldClassName={className}
  />
)
