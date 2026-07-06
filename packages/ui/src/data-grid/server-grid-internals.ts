import type {
  ColumnState,
  GridApi,
  IDatasource,
  IGetRowsParams,
} from "ag-grid-community"
import {
  buildServerFetchParams,
  type ServerFetchParams,
  type ServerFetchResult,
  type ServerFilter,
} from "./pagination"
import type { XlsxCell } from "@workspace/ui/lib/xlsx"

/**
 * Pure, stateless helpers extracted from {@link SmartServerGrid} so the
 * component file stays focused on wiring AG Grid to React, and so the tricky
 * bits (the infinite-model datasource, state persistence, export shaping,
 * error coercion, filter merging) can be unit-tested directly.
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
export const readPersistedGridState = (
  key: string
): PersistedGridState | null => {
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
export const writePersistedGridState = (
  key: string,
  state: PersistedGridState
): void => {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}

/* --------------------------------- debounce -------------------------------- */

/** Tiny trailing debounce — keeps persistence off the hot path of resize/scroll. */
export const debounce = <A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): ((...args: A) => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

/* ------------------------------- error coercion ---------------------------- */

/** Best-effort message from an unknown thrown value (incl. `NormalizedApiError`). */
export const errorMessage = (error: unknown): string => {
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
export const mergeServerFilters = (
  base: ServerFilter[],
  external: ServerFilter[] | undefined
): ServerFilter[] => {
  if (!external || external.length === 0) return base
  return [...base, ...external]
}

/* -------------------------------- datasource ------------------------------- */

/**
 * Wiring {@link createGridDatasource} needs from the component. The getters
 * read mutable refs so the datasource object itself can stay **stable** for the
 * grid's lifetime — handing AG Grid a new datasource purges its cache.
 */
export interface CreateGridDatasourceOptions<TRow> {
  /** Read the latest `fetchRows` prop. */
  getFetchRows: () => (
    params: ServerFetchParams,
    signal: AbortSignal
  ) => Promise<ServerFetchResult<TRow>>
  /** Read the latest external (search-form) filters. */
  getExternalFilters: () => ServerFilter[] | undefined
  /** Live registry of in-flight requests (for abort-on-unmount etc.). */
  controllers: Set<AbortController>
  /** A block fetch started — drives the "loading more" indicator. */
  onFetchStart: () => void
  /** A block resolved — clear any error state. */
  onSuccess: () => void
  /** A block failed (not aborted) — surface the error overlay. */
  onError: (message: string) => void
  /** A block settled either way — clear the initial-loading overlay. */
  onSettled: () => void
}

/**
 * The infinite-row-model datasource behind {@link SmartServerGrid}: translates
 * AG Grid's `IGetRowsParams` into normalized {@link ServerFetchParams}, merges
 * external filters over column filters, tracks an `AbortController` per block,
 * and routes the outcome into the success/fail callbacks — swallowing
 * rejections of blocks that were aborted (an abort is not an error).
 */
export const createGridDatasource = <TRow>(
  options: CreateGridDatasourceOptions<TRow>
): IDatasource => ({
  getRows: (params: IGetRowsParams) => {
    options.onFetchStart()
    const serverParams = buildServerFetchParams({
      startRow: params.startRow,
      endRow: params.endRow,
      sortModel: params.sortModel,
      filterModel: (params.filterModel ?? null) as Record<
        string,
        unknown
      > | null,
    })
    // Merge any external (search-form) filters on top of column filters.
    serverParams.filters = mergeServerFilters(
      serverParams.filters,
      options.getExternalFilters()
    )
    const controller = new AbortController()
    options.controllers.add(controller)
    options
      .getFetchRows()(serverParams, controller.signal)
      .then(
        (result) => {
          // `lastRow` = the known total, so the grid sizes the scrollbar exactly.
          params.successCallback(result.rows, result.total)
          options.onSuccess()
        },
        (reason: unknown) => {
          if (controller.signal.aborted) return
          params.failCallback()
          options.onError(errorMessage(reason))
        }
      )
      .finally(() => {
        options.controllers.delete(controller)
        options.onSettled()
      })
  },
})

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
export const collectGridExport = <TRow>(
  api: GridApi<TRow>
): GridExportTable => {
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
