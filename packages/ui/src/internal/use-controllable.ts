import * as React from "react"

/**
 * Controlled/uncontrolled state in one hook. When `controlled` is provided the
 * hook is a pass-through that only calls `onChange`; otherwise it owns state and
 * still forwards changes to `onChange`.
 *
 * **Internal** — shared by the tree and calendar engines (each re-exports it for
 * its own module); not part of the public exports map.
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
