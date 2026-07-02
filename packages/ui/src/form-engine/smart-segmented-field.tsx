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

export function SmartSegmentedField({
  data,
  setData,
  label,
  description,
  error,
  required,
  disabled,
  className,
  options = [],
}: SmartSegmentedFieldProps) {
  return (
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
}
