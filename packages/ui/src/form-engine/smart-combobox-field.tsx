import {
  SmartCombobox,
  type ComboboxOption,
} from "@workspace/ui/smart-components/smart-combobox"
import type { FieldBaseProps } from "./base"

export type { ComboboxOption }

export interface SmartComboboxFieldProps extends FieldBaseProps<string> {
  options: ComboboxOption[]
  searchPlaceholder?: string
  emptyText?: string
}

export const SmartComboboxField = ({
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
  searchPlaceholder,
  emptyText,
}: SmartComboboxFieldProps) => (
  <SmartCombobox
    value={data}
    onValueChange={(v) => setData(v)}
    placeholder={placeholder}
    searchPlaceholder={searchPlaceholder}
    emptyText={emptyText}
    label={label}
    description={description}
    error={error}
    required={required}
    options={options}
    disabled={disabled || readOnly}
    fieldClassName={className}
  />
)
