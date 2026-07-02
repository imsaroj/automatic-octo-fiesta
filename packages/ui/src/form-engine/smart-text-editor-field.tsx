import { SmartTextEditor } from "@workspace/ui/lexical-text-editor"
import type { SmartTextEditorFormat } from "@workspace/ui/lexical-text-editor"
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
}

export function SmartTextEditorField({
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
}: SmartTextEditorFieldProps) {
  return (
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
      onChange={setData}
      fieldClassName={className}
    />
  )
}
