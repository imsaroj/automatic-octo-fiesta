import { SmartPasswordInput } from "@imsaroj/smart-ui/smart-components/smart-password-input"
import type { FieldBaseProps } from "./base"

export interface SmartPasswordFieldProps extends FieldBaseProps<string> {
  autoComplete?: string
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
}: SmartPasswordFieldProps) => (
  <SmartPasswordInput
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
    aria-invalid={error ? true : undefined}
    onChange={(e) => setData(e.target.value)}
    fieldClassName={className}
  />
)
