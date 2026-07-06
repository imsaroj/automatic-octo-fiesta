import {
  SmartCheckboxGroup,
  type SmartCheckboxGroupOption,
} from "@workspace/ui/smart-components/smart-checkbox-group"
import type { FieldBaseProps } from "./base"

export type { SmartCheckboxGroupOption }

export interface SmartCheckboxGroupFieldProps extends Omit<
  FieldBaseProps<string[]>,
  "placeholder" | "readOnly"
> {
  options?: SmartCheckboxGroupOption[]
  orientation?: "horizontal" | "vertical"
}

/** "Select all that apply" checkbox group — stores a `string[]` of values. */
export const SmartCheckboxGroupField = ({
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
}: SmartCheckboxGroupFieldProps) => (
  <SmartCheckboxGroup
    value={data}
    onValueChange={setData}
    items={options}
    label={label}
    description={description}
    error={error}
    required={required}
    disabled={disabled}
    orientation={orientation}
    fieldClassName={className}
  />
)
