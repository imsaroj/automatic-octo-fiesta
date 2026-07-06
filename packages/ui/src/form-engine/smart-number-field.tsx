import * as React from "react"
import { SmartInput } from "@workspace/ui/smart-components/smart-input"
import { SmartInputGroup } from "@workspace/ui/smart-components/smart-input-group"
import type { FieldBaseProps } from "./base"

export interface SmartNumberFieldProps extends FieldBaseProps<number | null> {
  decimalScale?: number
  min?: number
  max?: number
  step?: number
  /** Constrain to whole numbers — truncates decimals on blur, defaults `step` to 1. */
  integer?: boolean
  /** Leading addon text, e.g. `"$"` for a currency field. */
  prefix?: string
  /** Trailing addon text, e.g. `"%"` for a percentage field. */
  suffix?: string
}

export const SmartNumberField = ({
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
  step,
  integer,
  prefix,
  suffix,
}: SmartNumberFieldProps) => {
  const effectiveStep = step ?? 1

  const format = React.useCallback(
    (n: number) => {
      if (integer) return String(Math.trunc(n))
      return decimalScale !== undefined ? n.toFixed(decimalScale) : String(n)
    },
    [decimalScale, integer]
  )

  // Strip characters that can never belong to a number while preserving valid
  // in-progress input ("-", "1.", "1.20"), so letters never render in the field.
  const sanitize = React.useCallback(
    (raw: string): string => {
      let s = raw.replace(integer ? /[^0-9-]/g : /[^0-9.-]/g, "")
      // Keep a minus sign only when it leads the value.
      const negative = s.startsWith("-")
      s = s.replace(/-/g, "")
      if (negative) s = "-" + s
      if (!integer) {
        // Keep only the first decimal point.
        const dot = s.indexOf(".")
        if (dot !== -1) {
          s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "")
        }
      }
      return s
    },
    [integer]
  )

  const parse = React.useCallback(
    (raw: string): number | null => {
      const cleaned = sanitize(raw)
      if (!cleaned || cleaned === "-" || cleaned === ".") return null
      const n = Number(cleaned)
      if (Number.isNaN(n)) return null
      return integer ? Math.trunc(n) : n
    },
    [integer, sanitize]
  )

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

  const clamp = (n: number): number => {
    let clamped = n
    if (min !== undefined) clamped = Math.max(min, clamped)
    if (max !== undefined) clamped = Math.min(max, clamped)
    return clamped
  }

  const handleBlur = () => {
    const parsed = parse(text)
    if (parsed === null) {
      setText("")
      emit(null)
      return
    }
    const clamped = clamp(parsed)
    emit(clamped)
    setText(format(clamped))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitize(e.target.value)
    setText(next)
    emit(parse(next))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      const dir = e.key === "ArrowUp" ? 1 : -1
      const next = clamp((parse(text) ?? 0) + dir * effectiveStep)
      emit(next)
      setText(format(next))
    }
  }

  const shared = {
    id,
    inputMode: (integer ? "numeric" : "decimal") as "numeric" | "decimal",
    value: text,
    placeholder,
    label,
    description,
    error,
    required,
    disabled,
    readOnly,
    "aria-invalid": error ? (true as const) : undefined,
    fieldClassName: className,
    onChange: handleChange,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  }

  // Currency / percentage-style fields render addons via an input group; plain
  // numbers stay on the lighter SmartInput.
  if (prefix != null || suffix != null) {
    return (
      <SmartInputGroup {...shared} leadingText={prefix} trailingText={suffix} />
    )
  }

  return <SmartInput type="text" {...shared} />
}
