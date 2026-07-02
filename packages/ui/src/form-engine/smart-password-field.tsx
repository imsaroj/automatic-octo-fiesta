import { SmartPasswordInput } from "@workspace/ui/smart-components/smart-password-input"
import type { FieldBaseProps } from "./base"

export interface SmartPasswordFieldProps extends FieldBaseProps<string> {
  autoComplete?: string
}

export function SmartPasswordField({
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
}: SmartPasswordFieldProps) {
  return (
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
}
