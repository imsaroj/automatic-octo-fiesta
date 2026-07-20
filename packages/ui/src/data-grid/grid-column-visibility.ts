import { useCallback, useMemo, useState } from "react"

import {
  resolveColumnId,
  resolveColumnLabel,
  type DataGridColumn,
} from "./grid-internals"
import type { GridToolbarColumn } from "./grid-toolbar"

/**
 * Shared column-visibility state for both grids — the map init, the toggleable
 * column list, and the toolbar-shaped `menuColumns` were duplicated
 * character-for-character in `SmartGrid` and `SmartServerGrid` (a classic
 * source of drift). Each grid still owns the AG Grid side effect
 * (`api.setColumnsVisible`) and any persistence, but the React state lives here.
 *
 * **Internal** — not re-exported from the data-grid barrel.
 */
export interface GridColumnVisibility {
  /** Visibility map keyed by resolved column id (`true` = shown). */
  visibility: Record<string, boolean>
  /** Columns shaped for the toolbar's visibility menu (id/label/visible). */
  menuColumns: GridToolbarColumn[]
  /** Update one column's visibility in the map (does not touch AG Grid). */
  setColumnVisible: (id: string, visible: boolean) => void
}

export const useGridColumnVisibility = <TRow>(
  columns: DataGridColumn<TRow>[]
): GridColumnVisibility => {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    columns.forEach((column, index) => {
      initial[resolveColumnId(column, index)] = column.hide !== true
    })
    return initial
  })

  const toggleable = useMemo(
    () =>
      columns.map((column, index) => {
        const id = resolveColumnId(column, index)
        return { id, label: resolveColumnLabel(column, id) }
      }),
    [columns]
  )

  const menuColumns = useMemo<GridToolbarColumn[]>(
    () =>
      toggleable.map((column) => ({
        ...column,
        visible: visibility[column.id] ?? true,
      })),
    [toggleable, visibility]
  )

  const setColumnVisible = useCallback(
    (id: string, visible: boolean) =>
      setVisibility((prev) => ({ ...prev, [id]: visible })),
    []
  )

  return { visibility, menuColumns, setColumnVisible }
}
