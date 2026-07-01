import type { ColumnState, GridApi } from "ag-grid-community"
import type { ServerFilter } from "@/data-grid/pagination"
import type { XlsxCell } from "@/lib/xlsx"

/**
 * Pure, stateless helpers extracted from {@link SmartServerGrid} so the
 * component file stays focused on wiring AG Grid to React, and so the tricky
 * bits (state persistence, export shaping, error coercion, filter merging) can
 * be unit-tested directly.
 *
 * **Internal** — the data-grid barrel does not re-export this module.
 */

/* ------------------------------- persistence ------------------------------- */

/** The grid state persisted to `localStorage` under `persistStateKey`. */
export interface PersistedGridState {
  columnState?: ColumnState[]
  filterModel?: Record<string, unknown>
}

/**
 * Read the persisted column/filter state for `key`. Returns `null` when nothing
 * is stored or when storage is unavailable / the value is corrupt (so callers
 * just start fresh).
 */
export function readPersistedGridState(key: string): PersistedGridState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as PersistedGridState
  } catch {
    /* storage unavailable (private mode / quota) or corrupt — ignore */
    return null
  }
}

/** Persist column/filter state under `key`; silently no-ops if storage fails. */
export function writePersistedGridState(
  key: string,
  state: PersistedGridState
): void {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}

/* --------------------------------- debounce -------------------------------- */

/** Tiny trailing debounce — keeps persistence off the hot path of resize/scroll. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

/* ------------------------------- error coercion ---------------------------- */

/** Best-effort message from an unknown thrown value (incl. `NormalizedApiError`). */
export function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message
  }
  return "Failed to load data."
}

/* ------------------------------- filter merge ------------------------------ */

/**
 * Merge external (search-form) filters on top of the grid's own column filters.
 * Returns `base` untouched when there are no external filters.
 */
export function mergeServerFilters(
  base: ServerFilter[],
  external: ServerFilter[] | undefined
): ServerFilter[] {
  if (!external || external.length === 0) return base
  return [...base, ...external]
}

/* ---------------------------------- export --------------------------------- */

/** A grid's loaded rows shaped into a header row + body rows for `.xlsx` export. */
export interface GridExportTable {
  headers: string[]
  rows: XlsxCell[][]
}

/**
 * Collect the currently-displayed columns and loaded rows into a flat table for
 * export, using each cell's *displayed* (formatted) value. Respects column
 * visibility and order. Only rows present in the grid's cache are included
 * (the infinite row model never holds every page at once).
 */
export function collectGridExport<TRow>(api: GridApi<TRow>): GridExportTable {
  const displayed = api.getAllDisplayedColumns()
  const headers = displayed.map((column) => {
    const headerName = column.getColDef().headerName
    return typeof headerName === "string" && headerName.length > 0
      ? headerName
      : column.getColId()
  })
  const rows: XlsxCell[][] = []
  api.forEachNode((node) => {
    if (!node.data) return
    rows.push(
      displayed.map((column) => {
        const value = api.getCellValue({
          rowNode: node,
          colKey: column,
          useFormatter: true,
        }) as XlsxCell | null
        return value ?? ""
      })
    )
  })
  return { headers, rows }
}
