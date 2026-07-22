import {
  SmartMultiSelect,
  type SmartMultiSelectOption,
} from "@iamsaroj/smart-ui/smart-components/smart-multi-select"
import type { FieldBaseProps } from "./base"

export type { SmartMultiSelectOption }

export interface SmartMultiSelectFieldProps extends FieldBaseProps<string[]> {
  options?: SmartMultiSelectOption[]
  maxSelected?: number
  searchPlaceholder?: string
  /** Message shown when the search matches nothing. */
  emptyText?: string
  /** Class applied to the trigger button (`className` styles the field wrapper). */
  triggerClassName?: string
}

/** Searchable multi-choice select bound to a string-array value. */
export const SmartMultiSelectField = ({
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
  emptyText,
  triggerClassName,
}: SmartMultiSelectFieldProps) => (
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
    emptyText={emptyText}
    className={triggerClassName}
    disabled={disabled || readOnly}
    fieldClassName={className}
  />
)
