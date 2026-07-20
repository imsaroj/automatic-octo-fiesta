import * as React from "react"

import { useControllable } from "../internal/use-controllable"

// Re-exported so tree-internal callers keep importing from this module.
export { useControllable }

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
