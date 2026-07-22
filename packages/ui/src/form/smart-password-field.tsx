import { SmartPasswordInput } from "@iamsaroj/smart-ui/smart-components/smart-password-input"
import type { FieldBaseProps, NativeInputAttrs } from "./base"

export interface SmartPasswordFieldProps
  extends FieldBaseProps<string>, NativeInputAttrs {
  autoComplete?: string
  maxLength?: number
  /** Allow a leading space — off by default, since it is rarely intended. */
  allowLeadingSpace?: boolean
}

/** Masked password input with a show/hide toggle. */
export const SmartPasswordField = ({
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
  id,
  autoComplete,
  maxLength,
  allowLeadingSpace,
  ...native
}: SmartPasswordFieldProps) => (
  <SmartPasswordInput
    // Spread first so the engine-owned props below always win.
    {...native}
    id={id}
    value={data}
    placeholder={placeholder}
    label={label}
    description={description}
    error={error}
    required={required}
    disabled={disabled}
    readOnly={readOnly}
    autoComplete={autoComplete}
    maxLength={maxLength}
    allowLeadingSpace={allowLeadingSpace}
    aria-invalid={error ? true : undefined}
    onChange={(e) => setData(e.target.value)}
    fieldClassName={className}
  />
)
