import {
  SmartMultiSelect,
  type SmartMultiSelectOption,
} from "@workspace/ui/smart-components/smart-multi-select"
import type { FieldBaseProps } from "./base"

export type { SmartMultiSelectOption }

export interface SmartMultiSelectFieldProps extends FieldBaseProps<string[]> {
  options?: SmartMultiSelectOption[]
  maxSelected?: number
  searchPlaceholder?: string
}

export function SmartMultiSelectField({
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
  options = [],
  maxSelected,
  searchPlaceholder,
}: SmartMultiSelectFieldProps) {
  return (
    <SmartMultiSelect
      value={data}
      onValueChange={setData}
      placeholder={placeholder}
      label={label}
      description={description}
      error={error}
      required={required}
      options={options}
      maxSelected={maxSelected}
      searchPlaceholder={searchPlaceholder}
      disabled={disabled || readOnly}
      fieldClassName={className}
    />
  )
}
