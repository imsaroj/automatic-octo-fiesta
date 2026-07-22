import type { ReactNode } from "react"
import { PhoneIcon } from "lucide-react"
import {
  SmartInputGroup,
  type SmartInputGroupTrailingButton,
} from "@iamsaroj/smart-ui/smart-components/smart-input-group"
import type { FieldBaseProps, NativeInputAttrs } from "./base"

export interface SmartTelFieldProps
  extends
    FieldBaseProps<string>,
    // `inputMode` stays pinned to `"tel"` — it is what makes this field a phone
    // field rather than a text field with an icon.
    Omit<NativeInputAttrs, "inputMode"> {
  autoComplete?: string
  maxLength?: number
  /** Replace the leading phone icon, e.g. with a country flag. */
  leadingIcon?: ReactNode
  /** Text at the leading edge, e.g. a dial code. Replaces {@link leadingIcon}. */
  leadingText?: string
  /** Icon at the trailing edge, e.g. a verified check. */
  trailingIcon?: ReactNode
  /** Action button at the trailing edge (verify, clear, …). */
  trailingButton?: SmartInputGroupTrailingButton
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
  maxLength,
  leadingIcon,
  leadingText,
  trailingIcon,
  trailingButton,
  ...native
}: SmartTelFieldProps) => (
  <SmartInputGroup
    // Spread first so the engine-owned props below always win.
    {...native}
    id={id}
    type="tel"
    inputMode="tel"
    // A leading text addon and a leading icon occupy the same slot; an explicit
    // `leadingText` therefore replaces the icon rather than crowding it.
    leadingIcon={
      leadingText != null ? undefined : (leadingIcon ?? <PhoneIcon />)
    }
    leadingText={leadingText}
    trailingIcon={trailingIcon}
    trailingButton={trailingButton}
    maxLength={maxLength}
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
