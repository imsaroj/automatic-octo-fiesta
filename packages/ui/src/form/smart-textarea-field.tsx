import { SmartTextarea } from "@iamsaroj/smart-ui/smart-components/smart-textarea"
import type { FieldBaseProps, NativeTextareaAttrs } from "./base"

export interface SmartTextareaFieldProps
  extends FieldBaseProps<string>, NativeTextareaAttrs {
  rows?: number
  maxLength?: number
  /**
   * Allow the value to start with whitespace. Leading spaces are stripped by
   * default, both typed and pasted.
   */
  allowLeadingSpace?: boolean
}

/** Multi-line plain-text input. */
export const SmartTextareaField = ({
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
  allowLeadingSpace,
  ...native
}: SmartTextareaFieldProps) => (
  <SmartTextarea
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
    rows={rows}
    maxLength={maxLength}
    allowLeadingSpace={allowLeadingSpace}
    aria-invalid={error ? true : undefined}
    onChange={(e) => setData(e.target.value)}
    fieldClassName={className}
  />
)
