import type { ComponentProps, ReactNode } from "react"

/**
 * Native attributes an author may set on a text-input-backed field, forwarded
 * to the DOM element untouched.
 *
 * Curated on purpose. The underlying `Smart*` controls extend
 * `React.ComponentProps<"input">`, but the form engine owns the value channel
 * (`value` / `onChange` / `ref`) and the identity channel (`name` / `id`), so
 * re-exporting the whole DOM surface on a *config object* would advertise props
 * that are silently ignored — or that fight the form store. Everything here is
 * inert with respect to the engine: it only ever reaches the element.
 *
 * `maxLength` is deliberately absent: it is per-field (not every input-backed
 * field wants one) and each field declares it where it applies.
 */
export type NativeInputAttrs = Pick<
  ComponentProps<"input">,
  | "autoFocus"
  | "autoCapitalize"
  | "autoCorrect"
  | "enterKeyHint"
  | "inputMode"
  | "minLength"
  | "pattern"
  | "spellCheck"
  | "tabIndex"
>

/**
 * The same idea for `<textarea>`-backed fields — `inputMode` / `pattern` have no
 * meaning there, and `rows` / `maxLength` are declared by the field itself.
 */
export type NativeTextareaAttrs = Pick<
  ComponentProps<"textarea">,
  | "autoFocus"
  | "autoCapitalize"
  | "autoCorrect"
  | "enterKeyHint"
  | "minLength"
  | "spellCheck"
  | "tabIndex"
  | "wrap"
>

/**
 * The runtime counterpart of {@link NativeInputAttrs}. A registry entry builds
 * its props explicitly, so an attribute that exists only in the *type* would be
 * accepted by the compiler and then silently dropped on the way to the DOM —
 * these lists are what actually carry them across.
 *
 * `field-types.test.tsx` asserts each list matches its type exactly, so adding
 * an attribute to one without the other fails the build.
 */
export const NATIVE_INPUT_ATTR_KEYS = [
  "autoFocus",
  "autoCapitalize",
  "autoCorrect",
  "enterKeyHint",
  "inputMode",
  "minLength",
  "pattern",
  "spellCheck",
  "tabIndex",
] as const

export const NATIVE_TEXTAREA_ATTR_KEYS = [
  "autoFocus",
  "autoCapitalize",
  "autoCorrect",
  "enterKeyHint",
  "minLength",
  "spellCheck",
  "tabIndex",
  "wrap",
] as const

/**
 * Copy the declared native attributes off a field definition, skipping the ones
 * the author never set so they don't land on the DOM as explicit `undefined`.
 */
export const pickNativeAttrs = <S extends object, K extends keyof S>(
  field: S,
  keys: readonly K[]
): Pick<S, K> => {
  const out = {} as Pick<S, K>
  for (const key of keys) if (field[key] !== undefined) out[key] = field[key]
  return out
}

/**
 * Shared props for every controlled field in the form layer.
 * All fields are driven by the `data` / `setData` pair.
 */
export interface FieldBaseProps<T> {
  data: T
  setData: (value: T) => void
  label?: ReactNode
  placeholder?: string
  description?: ReactNode
  error?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  className?: string
  id?: string
}
