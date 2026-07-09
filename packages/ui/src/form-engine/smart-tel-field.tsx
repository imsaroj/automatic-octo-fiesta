import { PhoneIcon } from "lucide-react"
import { SmartInputGroup } from "@imsaroj/smart-ui/smart-components/smart-input-group"
import type { FieldBaseProps } from "./base"

export interface SmartTelFieldProps extends FieldBaseProps<string> {
  autoComplete?: string
}

/** Phone-number input: `type="tel"` with a leading phone icon. */
export const SmartTelField = ({
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
  autoComplete = "tel",
}: SmartTelFieldProps) => (
  <SmartInputGroup
    id={id}
    type="tel"
    inputMode="tel"
    leadingIcon={<PhoneIcon />}
    value={data}
    placeholder={placeholder ?? "+1 (555) 000-0000"}
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
