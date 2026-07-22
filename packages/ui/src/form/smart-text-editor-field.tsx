import { SmartTextEditor } from "@iamsaroj/smart-ui/text-editor"
import type { SmartTextEditorFormat } from "@iamsaroj/smart-ui/text-editor"
import type { FieldBaseProps } from "./base"

export interface SmartTextEditorFieldProps extends FieldBaseProps<string> {
  /** Serialization format for the value. Defaults to `"html"`. */
  format?: SmartTextEditorFormat
  /** Show or hide the formatting toolbar. Defaults to `true`. */
  toolbar?: boolean
  /** Minimum height of the editable area (CSS value, e.g. `"120px"`). */
  minHeight?: string
  /** Maximum height of the editable area before it scrolls (CSS value). */
  maxHeight?: string
  /** Focus the editor on mount. */
  autoFocus?: boolean
  /** Class applied to the `contenteditable` element itself. */
  editorClassName?: string
}

/** Lexical rich-text editor field; serializes its value as HTML or JSON. */
export const SmartTextEditorField = ({
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
  format,
  toolbar,
  minHeight,
  maxHeight,
  autoFocus,
  editorClassName,
}: SmartTextEditorFieldProps) => (
  <SmartTextEditor
    value={data ?? ""}
    placeholder={placeholder}
    label={label}
    description={description}
    error={error}
    required={required}
    readOnly={readOnly || disabled}
    format={format}
    toolbar={toolbar}
    minHeight={minHeight}
    maxHeight={maxHeight}
    // The a11y rule targets components that autofocus themselves. This one only
    // relays a choice the app author made in the field definition — the same
    // `autoFocus` every other field type forwards — and defaults to off.
    // eslint-disable-next-line jsx-a11y/no-autofocus
    autoFocus={autoFocus}
    editorClassName={editorClassName}
    onChange={setData}
    fieldClassName={className}
  />
)
