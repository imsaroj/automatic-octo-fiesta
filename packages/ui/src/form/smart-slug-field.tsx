import type { ReactNode } from "react"
import {
  SmartInputGroup,
  type SmartInputGroupTrailingButton,
} from "@iamsaroj/smart-ui/smart-components/smart-input-group"
import type { FieldBaseProps, NativeInputAttrs } from "./base"

export interface SmartSlugFieldProps
  extends
    FieldBaseProps<string>,
    // `autoCapitalize` / `autoCorrect` / `spellCheck` are fixed off: slugify
    // normalizes every keystroke, so letting an author flip them would promise
    // behavior the field cannot honor.
    Omit<NativeInputAttrs, "autoCapitalize" | "autoCorrect" | "spellCheck"> {
  /** Text shown at the leading edge, e.g. a base path. @default "/" */
  prefix?: string
  maxLength?: number
  /** Text at the trailing edge, e.g. a file extension. */
  suffix?: string
  /** Icon at the trailing edge. */
  trailingIcon?: ReactNode
  /** Action button at the trailing edge (copy, regenerate, …). */
  trailingButton?: SmartInputGroupTrailingButton
}

/** Slugify: lowercase, spaces/underscores → hyphens, strip invalid chars. */
const slugify = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")

/**
 * URL-slug input. Normalizes as the user types (lowercase, hyphenated, stripped
 * of invalid characters) while preserving a trailing hyphen mid-word.
 */
export const SmartSlugField = ({
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
  prefix = "/",
  maxLength,
  suffix,
  trailingIcon,
  trailingButton,
  ...native
}: SmartSlugFieldProps) => (
  <SmartInputGroup
    // Spread first so the engine-owned props below always win.
    {...native}
    id={id}
    leadingText={prefix}
    trailingText={suffix}
    trailingIcon={trailingIcon}
    trailingButton={trailingButton}
    value={data}
    placeholder={placeholder ?? "my-page-slug"}
    label={label}
    description={description}
    error={error}
    required={required}
    disabled={disabled}
    readOnly={readOnly}
    maxLength={maxLength}
    autoCapitalize="off"
    autoCorrect="off"
    spellCheck={false}
    aria-invalid={error ? true : undefined}
    onChange={(e) => setData(slugify(e.target.value))}
    fieldClassName={className}
  />
)
