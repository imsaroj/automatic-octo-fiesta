import type { FieldOption, PrimitiveOptionValue } from "./field-types"

/**
 * Serialize an option value to the string key the DOM controls use. Booleans map
 * to `"true"`/`"false"`; numbers via `String`. The real (typed) value is kept in
 * the form store — this is only the key handed to the underlying string-based
 * control (native select, radio, command list…).
 */
export const serializeOptionValue = (value: PrimitiveOptionValue): string =>
  typeof value === "boolean" ? (value ? "true" : "false") : String(value)

/** A string-keyed option for the underlying string-based control. */
export interface StringOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

/**
 * A codec between the real (typed) option values held in the form store and the
 * string keys the DOM controls exchange. Built from the resolved option list so
 * `fromKey` can recover the exact original value (a key like `"3"` maps back to
 * the number `3`, not the string `"3"`).
 */
export interface OptionValueCodec {
  /** String-keyed options to hand the underlying control. */
  stringOptions: StringOption[]
  /** Real value → its string key. */
  toKey: (value: PrimitiveOptionValue) => string
  /**
   * String key → the real value. Unknown keys (e.g. the empty "unselected"
   * key, or a value not in the current option set) pass through as the string.
   */
  fromKey: (key: string) => PrimitiveOptionValue
}

/** Build an {@link OptionValueCodec} from a resolved option list. */
export const buildOptionCodec = (
  options: ReadonlyArray<FieldOption>
): OptionValueCodec => {
  const byKey = new Map<string, PrimitiveOptionValue>()
  const stringOptions: StringOption[] = options.map((opt) => {
    const key = serializeOptionValue(opt.value)
    byKey.set(key, opt.value)
    return {
      value: key,
      label: opt.label,
      description: opt.description,
      disabled: opt.disabled,
    }
  })
  return {
    stringOptions,
    toKey: serializeOptionValue,
    fromKey: (key) =>
      byKey.has(key) ? (byKey.get(key) as PrimitiveOptionValue) : key,
  }
}
