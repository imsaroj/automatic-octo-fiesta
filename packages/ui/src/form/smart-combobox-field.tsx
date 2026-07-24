import {
  SmartCombobox,
  type ComboboxOption,
} from "@iamsaroj/smart-ui/smart-components/smart-combobox"
import type { FieldBaseProps } from "./base"

export type { ComboboxOption }

/**
 * The value is `string` in single mode and `string[]` with `multiple`. Kept as a
 * plain union rather than a `multiple`-discriminated pair: the form engine
 * reaches this component through `OptionField`, which erases the value's type at
 * that boundary anyway, and a union here would collapse under the `Omit` that
 * derives the field's authoring type (`keyof` a union is the *intersection* of
 * its keys, so `multiple` and `maxSelected` would vanish from the config).
 */
export interface SmartComboboxFieldProps extends FieldBaseProps<
  string | string[]
> {
  options: ComboboxOption[]
  searchPlaceholder?: string
  emptyText?: string
  /**
   * Select several options, shown as removable badges in the trigger. The stored
   * value becomes an **array** — schema it as one (`z.array(z.string())`); the
   * form's empty value follows automatically (`[]`, not `""`).
   */
  multiple?: boolean
  /** Cap the number of selectable options. Only meaningful with `multiple`. */
  maxSelected?: number
  /** Class applied to the trigger button (`className` styles the field wrapper). */
  triggerClassName?: string
  /**
   * Prepend a blank choice that clears the field back to `""`. Defaults to
   * **`!required`**; ignored under `multiple` (clearing the badges already
   * empties it).
   */
  emptyOption?: boolean
  /**
   * Label for that blank choice. Defaults to the `form.emptyOption` provider
   * label (`"Select"`).
   */
  emptyOptionLabel?: string
}

/** Searchable choice combobox — one value, or several with `multiple`. */
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
  multiple,
  maxSelected,
  triggerClassName,
  emptyOption,
  emptyOptionLabel,
}: SmartComboboxFieldProps) => {
  const shared = {
    placeholder,
    searchPlaceholder,
    emptyText,
    label,
    description,
    error,
    required,
    options,
    emptyOption,
    emptyOptionLabel,
    disabled: disabled || readOnly,
    className: triggerClassName,
    fieldClassName: className,
  }

  // Two call sites rather than one with a spread `multiple`: `ComboboxProps` is
  // a discriminated union, and only a *literal* `multiple` keeps the
  // `value` ↔ `onValueChange` correlation TypeScript needs to check it.
  return multiple ? (
    <SmartCombobox
      {...shared}
      multiple
      maxSelected={maxSelected}
      value={Array.isArray(data) ? data : data ? [data] : []}
      onValueChange={setData}
    />
  ) : (
    <SmartCombobox
      {...shared}
      value={Array.isArray(data) ? data[0] : data}
      onValueChange={setData}
    />
  )
}
