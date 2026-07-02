import { SmartTextarea } from "@workspace/ui/smart-components/smart-textarea"
import type { FieldBaseProps } from "./base"

export interface SmartTextareaFieldProps extends FieldBaseProps<string> {
  rows?: number
  maxLength?: number
}

export function SmartTextareaField({
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
  rows = 3,
  maxLength,
}: SmartTextareaFieldProps) {
  return (
    <SmartTextarea
      id={id}
      value={data}
      placeholder={placeholder}
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      rows={rows}
      maxLength={maxLength}
      aria-invalid={error ? true : undefined}
      onChange={(e) => setData(e.target.value)}
      fieldClassName={className}
    />
  )
}
