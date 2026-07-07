import * as React from "react"

/**
 * Controlled/uncontrolled state in one hook. When `controlled` is provided the
 * hook is a pass-through that only calls `onChange`; otherwise it owns state and
 * still forwards changes to `onChange`.
 */
export function useControllable<V>(
  controlled: V | undefined,
  defaultValue: V,
  onChange?: (value: V) => void
): [V, (next: V | ((prev: V) => V)) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const isControlled = controlled !== undefined
  const value = isControlled ? (controlled as V) : uncontrolled

  const valueRef = React.useRef(value)
  React.useEffect(() => {
    valueRef.current = value
  })

  const set = React.useCallback(
    (next: V | ((prev: V) => V)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: V) => V)(valueRef.current)
          : next
      if (!isControlled) setUncontrolled(resolved)
      onChange?.(resolved)
    },
    [isControlled, onChange]
  )

  return [value, set]
}

/** Convert an id array prop into a Set-backed controllable value. */
export function useIdSet(
  controlled: string[] | undefined,
  defaultValue: string[] | undefined,
  onChange?: (ids: string[]) => void
): [
  Set<string>,
  (next: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
] {
  const controlledSet = React.useMemo(
    () => (controlled ? new Set(controlled) : undefined),
    [controlled]
  )
  const defaultSet = React.useMemo(
    () => new Set(defaultValue ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleChange = React.useCallback(
    (set: Set<string>) => onChange?.([...set]),
    [onChange]
  )

  return useControllable(controlledSet, defaultSet, handleChange)
}
