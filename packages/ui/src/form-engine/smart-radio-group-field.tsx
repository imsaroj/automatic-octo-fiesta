import {
  SmartRadioGroup,
  type SmartRadioOption,
} from "@workspace/ui/smart-components/smart-radio-group"
import type { FieldBaseProps } from "./base"

export type { SmartRadioOption }

export interface SmartRadioGroupFieldProps extends Omit<
  FieldBaseProps<string>,
  "placeholder" | "readOnly"
> {
  options?: SmartRadioOption[]
  orientation?: "horizontal" | "vertical"
}

export function SmartRadioGroupField({
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
}: SmartRadioGroupFieldProps) {
  return (
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
}
