import { SmartInputGroup } from "@workspace/ui/smart-components/smart-input-group"
import type { FieldBaseProps } from "./base"

export interface SmartSlugFieldProps extends FieldBaseProps<string> {
  /** Text shown at the leading edge, e.g. a base path. @default "/" */
  prefix?: string
  maxLength?: number
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
}: SmartSlugFieldProps) => (
  <SmartInputGroup
    id={id}
    leadingText={prefix}
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
