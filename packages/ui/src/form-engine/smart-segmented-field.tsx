import {
  SmartSegmented,
  type SmartSegmentedOption,
} from "@workspace/ui/smart-components/smart-segmented"
import type { FieldBaseProps } from "./base"

export type { SmartSegmentedOption }

export interface SmartSegmentedFieldProps extends Omit<
  FieldBaseProps<string>,
  "placeholder" | "readOnly"
> {
  options?: SmartSegmentedOption[]
}

/** Single choice rendered as a segmented control. */
export const SmartSegmentedField = ({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  className,
  options = [],
}: SmartSegmentedFieldProps) => (
  <SmartSegmented
    value={data}
    onValueChange={setData}
    label={label}
    description={description}
    error={error}
    required={required}
    options={options}
    disabled={disabled}
    fieldClassName={className}
  />
)
