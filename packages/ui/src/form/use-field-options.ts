"use client"

import * as React from "react"

import type {
  AsyncFieldOptions,
  FieldOption,
  FieldOptions,
} from "./field-types"

/** Resolved option state a control renders from. */
export interface FieldOptionsState {
  options: FieldOption[]
  /** True while an async resolver is in flight (before its first result). */
  loading: boolean
  /** True if the async resolver rejected. */
  error: boolean
}

/**
 * Resolve a field's `options` — a materialized array or an async resolver — into
 * a render-ready `{ options, loading, error }`.
 *
 * - **Array**: returned directly, `loading: false` (recomputed each render, so no
 *   stale snapshot even if the array identity changes).
 * - **Function**: invoked once per resolver identity with an `AbortSignal`;
 *   `loading` is `true` until it settles, in-flight requests abort on unmount /
 *   resolver change, and a rejection surfaces as `error` with an empty list.
 *
 * The library supplies the `AbortSignal` but never a fetch client — the resolver
 * is the app's, keeping data-fetching app-owned. Live server-side search (feeding
 * the control's search term back into the resolver) is a forward-compatible
 * extension of {@link AsyncFieldOptions}; v1 resolves once on mount and filters
 * the loaded set client-side.
 */
export const useFieldOptions = (
  options: FieldOptions | undefined
): FieldOptionsState => {
  const resolver =
    typeof options === "function" ? (options as AsyncFieldOptions) : undefined

  const [asyncState, setAsyncState] = React.useState<FieldOptionsState>(() => ({
    options: [],
    loading: resolver !== undefined,
    error: false,
  }))

  React.useEffect(() => {
    if (!resolver) return
    const controller = new AbortController()
    // Reset to loading when the resolver identity changes (a re-run) so stale
    // options don't linger while the new fetch is in flight. This synchronizes
    // React state with an external async system — the sanctioned use of a
    // set-state effect (same pattern as internal/use-deferred-open). It settles
    // in one render, not a cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAsyncState({ options: [], loading: true, error: false })
    resolver({ signal: controller.signal })
      .then((resolved) => {
        if (!controller.signal.aborted)
          setAsyncState({ options: resolved, loading: false, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAsyncState({ options: [], loading: false, error: true })
      })
    return () => controller.abort()
  }, [resolver])

  // Sync case: derive in render so an inline array is never a stale snapshot.
  if (!resolver) {
    return {
      options: (options as FieldOption[] | undefined) ?? [],
      loading: false,
      error: false,
    }
  }
  return asyncState
}
