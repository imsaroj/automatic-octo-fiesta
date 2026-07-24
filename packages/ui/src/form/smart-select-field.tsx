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
  /**
   * Render a blank choice at the top of the list that clears the field back to
   * `""`. Defaults to **`!required`** — an optional field can be emptied again,
   * a required one has nothing to offer. Pass `false` to suppress it.
   */
  emptyOption?: boolean
  /**
   * Label for that blank choice. Defaults to the `form.emptyOption` provider
   * label (`"Select"`).
   *
   * `string`, not the `ReactNode` the standalone `SmartSelect` accepts: every
   * field type's extras are intersected into `ResolvedFieldDefinition`, so a
   * prop name shared with the combobox field must carry the same type there —
   * and the combobox's list filters on its labels, which have to be strings.
   */
  emptyOptionLabel?: string
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
  emptyOption,
  emptyOptionLabel,
}: SmartSelectFieldProps) => (
  <SmartSelect
    size={size}
    triggerClassName={triggerClassName}
    emptyOption={emptyOption}
    emptyOptionLabel={emptyOptionLabel}
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
