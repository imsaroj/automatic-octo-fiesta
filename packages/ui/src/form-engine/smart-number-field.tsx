import * as React from "react"
import { SmartInput } from "@workspace/ui/smart-components/smart-input"
import type { FieldBaseProps } from "./base"

export interface SmartNumberFieldProps extends FieldBaseProps<number | null> {
  decimalScale?: number
  min?: number
  max?: number
  step?: number
}

export function SmartNumberField({
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
  decimalScale,
  min,
  max,
  step = 1,
}: SmartNumberFieldProps) {
  const format = React.useCallback(
    (n: number) =>
      decimalScale !== undefined ? n.toFixed(decimalScale) : String(n),
    [decimalScale]
  )

  const parse = (raw: string): number | null => {
    const cleaned = raw.replace(/[^0-9.-]/g, "")
    if (!cleaned || cleaned === "-" || cleaned === ".") return null
    const n = Number(cleaned)
    return Number.isNaN(n) ? null : n
  }

  const [text, setText] = React.useState(() =>
    data === null ? "" : format(data)
  )
  const emittedRef = React.useRef<number | null>(data)

  React.useEffect(() => {
    if (Object.is(data, emittedRef.current)) return
    emittedRef.current = data
    setText(data === null ? "" : format(data))
  }, [data, format])

  const emit = (next: number | null) => {
    emittedRef.current = next
    setData(next)
  }

  const handleBlur = () => {
    const parsed = parse(text)
    if (parsed === null) {
      setText("")
      emit(null)
      return
    }
    let clamped = parsed
    if (min !== undefined) clamped = Math.max(min, clamped)
    if (max !== undefined) clamped = Math.min(max, clamped)
    emit(clamped)
    setText(format(clamped))
  }

  return (
    <SmartInput
      id={id}
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={error ? true : undefined}
      fieldClassName={className}
      onChange={(e) => {
        setText(e.target.value)
        emit(parse(e.target.value))
      }}
      onBlur={handleBlur}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault()
          const dir = e.key === "ArrowUp" ? 1 : -1
          let next = (parse(text) ?? 0) + dir * step
          if (min !== undefined) next = Math.max(min, next)
          if (max !== undefined) next = Math.min(max, next)
          emit(next)
          setText(format(next))
        }
      }}
    />
  )
}
