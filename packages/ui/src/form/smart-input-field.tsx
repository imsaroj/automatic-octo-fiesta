import { SmartInput } from "@iamsaroj/smart-ui/smart-components/smart-input"
import type { FieldBaseProps, NativeInputAttrs } from "./base"

export interface SmartInputFieldProps
  extends FieldBaseProps<string>, NativeInputAttrs {
  type?: "text" | "email" | "url"
  maxLength?: number
  autoComplete?: string
  /**
   * Allow the value to start with whitespace. Leading spaces are stripped by
   * default, both typed and pasted.
   */
  allowLeadingSpace?: boolean
}

/** Single-line text input for `text`, `email`, and `url` string values. */
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
  allowLeadingSpace,
  ...native
}: SmartInputFieldProps) => (
  <SmartInput
    // Spread first so the engine-owned props below always win.
    {...native}
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
    allowLeadingSpace={allowLeadingSpace}
    aria-invalid={error ? true : undefined}
    onChange={(e) => setData(e.target.value)}
    fieldClassName={className}
  />
)
