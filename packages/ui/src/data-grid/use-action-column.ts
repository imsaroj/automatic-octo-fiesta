import { useLayoutEffect, useMemo, useRef } from "react"
import type { DataGridColumn } from "./grid-internals"
import {
  actionColumnSignature,
  isActionColumnEnabled,
  type GridActionColumnOptions,
} from "./action-column"
import {
  buildActionColumnDef,
  type GridActionColumnStore,
} from "./action-column-cell"

/**
 * Turn the `actionColumn` prop into a ColDef (or `null` when the column should
 * not exist — disabled, or every action statically hidden).
 *
 * Performance contract: consumers inline `actionColumn` with fresh callbacks on
 * every render (`loading: (row) => deletingId === row.id`), but recreating the
 * ColDef each time would make AG Grid re-diff its column model. So the ColDef
 * is memoized on the *structural* signature only, and the latest options flow
 * to the cells through a tiny external store: each mounted action cell
 * subscribes via `useSyncExternalStore` and re-renders when the options object
 * changes identity — no AG Grid refresh round-trip, no stale callbacks, and
 * only the visible action cells re-render.
 */
export const useGridActionColumn = <TRow>(
  options: GridActionColumnOptions<TRow> | undefined
): DataGridColumn<TRow> | null => {
  const optionsRef = useRef(options)
  const versionRef = useRef(0)
  const listenersRef = useRef<Set<() => void>>(new Set())

  // Publish the new options to the mounted cells. Layout effect so the cells
  // (which render after the grid commits) never see a stale snapshot.
  useLayoutEffect(() => {
    optionsRef.current = options
    versionRef.current += 1
    listenersRef.current.forEach((listener) => listener())
  }, [options])

  // Stable store handed to every action cell through cellRendererParams. The
  // refs are only read when a cell renders or when AG Grid invokes the
  // callbacks — never during this hook's own render.
  const store = useMemo(
    (): GridActionColumnStore<TRow> => ({
      getOptions: () => optionsRef.current ?? {},
      getVersion: () => versionRef.current,
      subscribe: (listener) => {
        listenersRef.current.add(listener)
        return () => listenersRef.current.delete(listener)
      },
    }),
    []
  )

  const signature = actionColumnSignature(options)
  return useMemo(() => {
    if (!isActionColumnEnabled(options)) return null
    // `options` is fresh from the render that changed `signature`; afterwards
    // the cells keep reading the latest value through the store. The ColDef
    // only *stores* the getters — they run when a cell renders or AG Grid
    // calls back, never during this hook's render.
    // eslint-disable-next-line react-hooks/refs -- refs-for-latest-props, same pattern as the SmartServerGrid datasource
    return buildActionColumnDef(options, store)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` covers every structural field; per-row callbacks intentionally don't rebuild the ColDef
  }, [signature, store])
}

/**
 * Insert the action column into a column list: first when pinned left
 * (the default), last when pinned right or unpinned.
 */
export const withActionColumn = <TRow>(
  columns: DataGridColumn<TRow>[],
  actionColumn: DataGridColumn<TRow> | null
): DataGridColumn<TRow>[] => {
  if (!actionColumn) return columns
  return actionColumn.pinned === "left"
    ? [actionColumn, ...columns]
    : [...columns, actionColumn]
}
