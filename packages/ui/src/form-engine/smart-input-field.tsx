import { SmartInput } from "@workspace/ui/smart-components/smart-input"
import type { FieldBaseProps } from "./base"

export interface SmartInputFieldProps extends FieldBaseProps<string> {
  type?: "text" | "email" | "url"
  maxLength?: number
  autoComplete?: string
}

export const SmartInputField = ({
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
  type = "text",
  maxLength,
  autoComplete,
}: SmartInputFieldProps) => (
  <SmartInput
    id={id}
    type={type}
    value={data}
    placeholder={placeholder}
    label={label}
    description={description}
    error={error}
    required={required}
    disabled={disabled}
    readOnly={readOnly}
    maxLength={maxLength}
    autoComplete={autoComplete}
    aria-invalid={error ? true : undefined}
    onChange={(e) => setData(e.target.value)}
    fieldClassName={className}
  />
)
