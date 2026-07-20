"use client"

import * as React from "react"

/**
 * Defer a controlled overlay's `open` transition (`false` → `true`) by one
 * macrotask.
 *
 * Why: opening a Base UI popup from inside another interaction's event
 * dispatch — a grid row's Edit button, a dropdown menu item — races the
 * popup's dismiss behavior: the popup mounts its outside-press / focus-out
 * listeners while the originating click is still settling, reads that same
 * interaction as an outside press (or the closing menu's focus hand-off as a
 * focus-out), and closes itself before it ever paints. Consumers worked
 * around this with `setTimeout(0)` at every call site; this hook is that fix,
 * applied once inside the Smart overlay wrappers.
 *
 * Semantics:
 * - `false` → `true` is delivered one macrotask later (imperceptible).
 * - `true` → `false` passes through immediately — closing never lags.
 * - `undefined` stays `undefined`, so uncontrolled (trigger-driven) overlays
 *   are untouched: their opens are handled inside the popup library and were
 *   never subject to the race.
 *
 * **Internal** — used by SmartDialog / SmartSheet / SmartConfirmDialog /
 * SmartDrawer; not part of the public exports map.
 */
export function useDeferredOpen(
  open: boolean | undefined
): boolean | undefined {
  const [deferred, setDeferred] = React.useState<boolean | undefined>(
    open === true ? false : open
  )

  React.useEffect(() => {
    if (open) {
      const id = setTimeout(() => setDeferred(true), 0)
      return () => clearTimeout(id)
    }
    setDeferred(open)
    return undefined
  }, [open])

  // The closed side is derived, not stored, so `true` → `false` never waits
  // for the effect to run.
  return open ? deferred : open
}
