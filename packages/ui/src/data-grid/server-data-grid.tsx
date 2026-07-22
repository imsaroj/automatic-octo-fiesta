import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
} from "react"
import { AgGridReact } from "ag-grid-react"
import {
  type ColDef,
  type GetRowIdParams,
  type GridApi,
  type GridReadyEvent,
  type IDatasource,
  type RowDoubleClickedEvent,
  type RowSelectionOptions,
} from "ag-grid-community"
import { FileSpreadsheet } from "lucide-react"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { downloadXlsx, timestampForFilename } from "@iamsaroj/smart-ui/lib/xlsx"
import { GridToolbar } from "./grid-toolbar"
import { GridLoadingCell, GridLoadingOverlay } from "./grid-loading"
import { SmartPageError } from "@iamsaroj/smart-ui/smart-components/page/smart-page-error"
import {
  useSmartUIDefaults,
  useSmartUILabels,
} from "@iamsaroj/smart-ui/smart-components/provider"
import {
  type ServerFetchParams,
  type ServerFetchResult,
  type ServerFilter,
} from "./pagination"
import {
  createPageFetcher,
  type CreatePageFetcherOptions,
} from "./create-page-fetcher"
import { dataGridTheme } from "./grid-theme"
import {
  ensureGridModules,
  NoRowsOverlay,
  rowHeightByDensity,
  type DataGridColumn,
  type DataGridDensity,
  type NoRowsParams,
} from "./grid-internals"
import { GridShell } from "./grid-shell"
import { useGridColumnVisibility } from "./grid-column-visibility"
import {
  collectGridExport,
  createGridDatasource,
  debounce,
  readPersistedGridState,
  resolveExternalFilters,
  writePersistedGridState,
} from "./server-grid-internals"
import {
  useServerGridSelection,
  type ServerSelection,
} from "./use-server-grid-selection"
import type { GridActionColumnOptions } from "./action-column"
import { useGridActionColumn, withActionColumn } from "./use-action-column"

// Re-exported so `ServerSelection` stays importable from the package even
// though its definition lives in the selection hook module.
export type { ServerSelection }

/** Imperative handle exposed via `ref`. */
export interface SmartServerGridHandle<TRow> {
  /** Re-fetch the loaded blocks from the server, keeping scroll position. */
  refresh: () => void
  /** Purge every block and re-fetch from the first row. */
  reload: () => void
  /** All selected row ids (including rows not currently loaded). */
  getSelectedIds: () => string[]
  /** Selected rows currently loaded in the grid cache. */
  getSelectedRows: () => TRow[]
  /** Clear the selection. */
  clearSelection: () => void
}

export interface SmartServerGridProps<TRow> {
  /** Column definitions. */
  columns: DataGridColumn<TRow>[]
  /**
   * Fetch one block of rows from the server. Receives normalized paging, sort
   * and filter params plus an `AbortSignal`, and resolves to `{ rows, total }`.
   * Rejecting (or throwing) surfaces the error overlay with a **Retry** button.
   *
   * Provide **either** `fetchRows` (full control) **or** {@link source} (a
   * `createPageFetcher` config for the common case) — `fetchRows` wins if both
   * are set.
   */
  fetchRows?: (
    params: ServerFetchParams,
    signal: AbortSignal
  ) => Promise<ServerFetchResult<TRow>>
  /**
   * Declarative fetch config — the {@link createPageFetcher} options object. The
   * grid builds the `fetchRows` adapter for you, so simple server pages never
   * define a fetch function at all:
   *
   * ```tsx
   * <SmartServerGrid source={{ url: "/api/users", itemSchema: userRowSchema }} … />
   * ```
   *
   * Ignored when {@link fetchRows} is provided.
   */
  source?: CreatePageFetcherOptions<TRow>
  /** Stable row id — required for selection and block reconciliation across pages. */
  getRowId: (row: TRow) => string
  /**
   * Config-driven Edit/Delete action column — pinned, permission-aware and
   * row-aware, with per-row loading and optional delete confirmation. The
   * column auto-hides when disabled or when every action is statically hidden.
   */
  actionColumn?: GridActionColumnOptions<TRow>

  /**
   * External filters merged into every fetch — e.g. driven by a dedicated search
   * form rather than the column headers. Changing this array (by identity)
   * resets to page 1 and refetches; it stays out of the grid's own state, so
   * typing in the form never hits the server until you swap the array in.
   */
  filters?: ServerFilter[]
  /**
   * External filters as a plain query object — the shape `SmartSearchForm`'s
   * `onSearch` emits. Normalized via {@link toServerFilters} and merged after
   * {@link filters}, so a search form wires straight in with no conversion:
   *
   * ```tsx
   * <SmartSearchForm onSearch={setQuery} … />
   * <SmartServerGrid query={query} … />
   * ```
   *
   * Like `filters`, a change of identity resets to page 1 and refetches.
   */
  query?: Record<string, unknown>

  /** Show the classic pager (`true`) or stream via infinite scroll (`false`). Default `true`. */
  pagination?: boolean
  /** Rows per server block / page. Default `20`. */
  pageSize?: number
  /** Page-size options shown in the pager selector. */
  pageSizeOptions?: number[]

  /** Row selection mode. Default `"none"`. */
  selection?: "single" | "multiple" | "none"
  /** Fired when selection changes — loaded selected rows plus every selected id. */
  onSelectionChange?: (selection: ServerSelection<TRow>) => void
  /**
   * Fired on row double-click with the full row object. Designed as the
   * extension point for row-level actions (open a drawer, navigate, …).
   */
  onRowDoubleClick?: (row: TRow) => void

  /**
   * `localStorage` key. When set, the grid persists column order / size /
   * visibility plus the active sort, and restores them on reload.
   */
  persistStateKey?: string

  /** Title rendered in the toolbar. */
  title?: ReactNode
  /** Extra toolbar content rendered on the right. */
  toolbarActions?: ReactNode
  /** Manual refresh button. Default `true`. */
  refreshable?: boolean
  /** Column visibility menu. Default `true`. */
  columnSelector?: boolean
  /** Export-to-Excel (`.xlsx`) button — exports the loaded/displayed rows. Default `true`. */
  exportExcel?: boolean
  /** Export file name (without extension); a timestamp + `.xlsx` are appended. Default `"export"`. */
  exportFileName?: string

  /** Row density. Default `"normal"`. */
  density?: DataGridDensity
  /**
   * Fill the parent instead of using a fixed `height`. The grid becomes a
   * flex column (`h-full`) whose body grows to consume the remaining space and
   * resizes automatically with its container — use inside a
   * `flex-1 min-h-0` parent for a full-viewport layout. Default `false`.
   */
  fill?: boolean
  /** Grid height when `fill` is `false`. Default `480`. */
  height?: number | string
  /** Empty-state content shown when the server returns no rows. */
  emptyState?: { title?: string; description?: string }
  className?: string
}

/**
 * Server-driven data grid built on AG Grid Community's **Infinite Row Model**.
 * One datasource powers both modes: with `pagination` it renders a classic
 * pager, without it streams rows via infinite scroll. Sorting runs server-side
 * (each change re-queries through `fetchRows`) and filtering is supplied through
 * the `filters` prop (e.g. a search form) rather than column headers. It ships
 * loading + error/retry states, manual refresh, column resize/reorder, a column
 * visibility menu, Excel export, row double-click, cross-page selection, an
 * optional full-viewport `fill` layout, and column-state persistence.
 *
 * @example
 * ```tsx
 * <SmartServerGrid
 *   columns={columns}
 *   getRowId={(u) => u.id}
 *   fetchRows={fetchUsersPage}
 *   filters={searchFilters}   // from a search form
 *   pagination={false}        // infinite scroll
 *   selection="multiple"
 *   fill
 * />
 * ```
 */
const SmartServerGridInner = <TRow,>(
  props: SmartServerGridProps<TRow>,
  ref: ForwardedRef<SmartServerGridHandle<TRow>>
): ReactElement => {
  const {
    columns,
    fetchRows,
    source,
    getRowId,
    actionColumn,
    filters,
    query,
    pagination = true,
    pageSize: pageSizeProp,
    pageSizeOptions: pageSizeOptionsProp,
    selection = "none",
    onSelectionChange,
    onRowDoubleClick,
    persistStateKey,
    title,
    toolbarActions,
    refreshable = true,
    columnSelector = true,
    exportExcel = true,
    exportFileName = "export",
    density: densityProp,
    fill = false,
    height = 480,
    emptyState,
    className,
  } = props

  // Provider fallbacks (English labels + canonical defaults with no provider); an
  // explicit prop always wins.
  const uiDefaults = useSmartUIDefaults()
  const uiLabels = useSmartUILabels()
  const pageSize = pageSizeProp ?? uiDefaults.grid.pageSize
  const pageSizeOptions = pageSizeOptionsProp ?? uiDefaults.grid.pageSizeOptions
  const density = densityProp ?? uiDefaults.grid.density

  ensureGridModules()

  // Resolve the fetch adapter: an explicit `fetchRows` wins; otherwise build one
  // from the declarative `source` config. If neither is given, fall back to a
  // rejecting fetcher so the misconfiguration surfaces in the error overlay
  // (with a clear message) rather than as a blank grid.
  const resolvedFetchRows = useMemo<
    (
      params: ServerFetchParams,
      signal: AbortSignal
    ) => Promise<ServerFetchResult<TRow>>
  >(
    () =>
      fetchRows ??
      (source
        ? createPageFetcher<TRow>(source)
        : () =>
            Promise.reject(
              new Error(
                "SmartServerGrid: provide a `fetchRows` function or a `source` config."
              )
            )),
    [fetchRows, source]
  )

  // `filters` (already-normalized) and `query` (plain search-form object) are
  // merged into one external-filter list; both participate in the reset-on-change
  // contract through this memo's identity.
  const externalFilters = useMemo<ServerFilter[] | undefined>(
    () => resolveExternalFilters(filters, query),
    [filters, query]
  )

  // Latest props read by the (stable) datasource + grid callbacks, without
  // re-creating them — recreating the datasource would reset the grid.
  const gridApiRef = useRef<GridApi<TRow> | null>(null)
  const fetchRowsRef = useRef(resolvedFetchRows)
  const getRowIdRef = useRef(getRowId)
  const onRowDoubleClickRef = useRef(onRowDoubleClick)
  const filtersRef = useRef(externalFilters)
  const persistKeyRef = useRef(persistStateKey)
  useLayoutEffect(() => {
    fetchRowsRef.current = resolvedFetchRows
    getRowIdRef.current = getRowId
    onRowDoubleClickRef.current = onRowDoubleClick
    filtersRef.current = externalFilters
    persistKeyRef.current = persistStateKey
  })

  const controllersRef = useRef<Set<AbortController>>(new Set())

  // The live page size. Seeded from the `pageSize` prop but owned here so the
  // pager's selector can drive it: it feeds BOTH `cacheBlockSize` (the fetch
  // block size) and `paginationPageSize` (the displayed page size). Passing
  // either as a static prop would make the grid snap the selector back on the
  // next render, so both read this one piece of state. The ref mirror lets the
  // stable `onPaginationChanged` callback compare against the latest value.
  const [effectivePageSize, setEffectivePageSize] = useState(pageSize)
  const effectivePageSizeRef = useRef(pageSize)
  // The datasource created in `handleGridReady`, kept so a page-size change can
  // re-set it — that's what rebuilds the row cache at the new `cacheBlockSize`.
  const datasourceRef = useRef<IDatasource | null>(null)

  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // In-flight block count drives the "loading more" bar shown while infinite
  // scroll fetches subsequent pages (the overlay only covers the first load).
  const inFlightRef = useRef(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const { menuColumns, setColumnVisible } = useGridColumnVisibility(columns)

  // Cross-page selection lives in a dedicated hook — the selected-id set is the
  // source of truth, so a selection survives block reloads (see the hook).
  const gridSelection = useServerGridSelection(gridApiRef, onSelectionChange)

  const actionColumnDef = useGridActionColumn(actionColumn)
  const effectiveColumns = useMemo(
    () => withActionColumn(columns, actionColumnDef),
    [columns, actionColumnDef]
  )

  const saveState = useCallback(() => {
    const api = gridApiRef.current
    const key = persistKeyRef.current
    if (!api || !key) return
    writePersistedGridState(key, {
      columnState: api.getColumnState(),
    })
  }, [])

  const schedulePersistRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    schedulePersistRef.current = debounce(saveState, 300)
  }, [saveState])
  const schedulePersist = useCallback(() => schedulePersistRef.current?.(), [])

  const restoreState = useCallback((api: GridApi<TRow>) => {
    const key = persistKeyRef.current
    if (!key) return
    const parsed = readPersistedGridState(key)
    if (!parsed) return
    if (parsed.columnState)
      api.applyColumnState({ state: parsed.columnState, applyOrder: true })
  }, [])

  // External filters changed (Search / Reset) → reset to page 1 and refetch.
  // Skip the mount run so the datasource's own first fetch isn't duplicated.
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    setError(null)
    setInitialLoading(true)
    gridApiRef.current?.purgeInfiniteCache()
  }, [externalFilters])

  const defaultColDef = useMemo<ColDef<TRow>>(
    () => ({
      sortable: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
      // Rows in a block that is still being fetched: a placeholder bar instead
      // of an empty cell (see GridLoadingCell). Returning `undefined` once the
      // row has data hands the cell back to whatever the column defines.
      cellRendererSelector: (params) =>
        params.data == null ? { component: GridLoadingCell } : undefined,
    }),
    []
  )

  const rowSelection = useMemo<RowSelectionOptions | undefined>(() => {
    // No `headerCheckbox` in the infinite row model (AG Grid warning #129) — a
    // "select all" can't span rows the client hasn't loaded. Per-row checkboxes
    // plus our cross-page id tracking are what make sense here. `multiRow`
    // defaults headerCheckbox to true, so it must be disabled explicitly.
    if (selection === "multiple")
      return { mode: "multiRow", checkboxes: true, headerCheckbox: false }
    if (selection === "single") return { mode: "singleRow", checkboxes: true }
    return undefined
  }, [selection])

  const getRowIdCb = useCallback(
    (params: GetRowIdParams<TRow>) => getRowIdRef.current(params.data),
    []
  )

  const handleGridReady = useCallback(
    (event: GridReadyEvent<TRow>) => {
      gridApiRef.current = event.api
      // Restore sort/filter/columns BEFORE the first fetch so the first request
      // already reflects the persisted state, then start the datasource.
      restoreState(event.api)
      // Created once per grid instantiation (gridReady fires once), so the
      // datasource identity is stable for the grid's lifetime — a new one
      // would purge the cache. It reads the latest `fetchRows` / `filters`
      // through ref getters; the translation/abort/error flow lives in
      // `createGridDatasource` (server-grid-internals), where it is unit-tested.
      const datasource = createGridDatasource<TRow>({
        getFetchRows: () => fetchRowsRef.current,
        getExternalFilters: () => filtersRef.current,
        controllers: controllersRef.current,
        onFetchStart: () => {
          inFlightRef.current += 1
          setLoadingMore(true)
        },
        onSuccess: () => setError(null),
        onError: setError,
        onSettled: () => {
          setInitialLoading(false)
          inFlightRef.current = Math.max(0, inFlightRef.current - 1)
          if (inFlightRef.current === 0) setLoadingMore(false)
        },
      })
      datasourceRef.current = datasource
      event.api.setGridOption("datasource", datasource)
    },
    [restoreState]
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<TRow>) => {
      if (event.data) onRowDoubleClickRef.current?.(event.data)
    },
    []
  )

  // The pager's page-size selector only changes how many already-fetched rows are
  // *displayed*; in the infinite row model the fetch size is `cacheBlockSize`, which
  // Update by Saroj Khanal to re-released
  // AG Grid reads only when the row cache is built. So when the selector changes we
  // (1) sync `effectivePageSize` so the managed `cacheBlockSize`/`paginationPageSize`
  // props don't snap back on the next render, (2) bump the `cacheBlockSize` option,
  // and (3) re-set the datasource — that rebuilds the cache at the new block size, so
  // `fetchRows` finally receives the size the user picked. (Purging alone keeps the
  // old block size, which is why the selector appeared to do nothing.)
  const handlePaginationChanged = useCallback(() => {
    const api = gridApiRef.current
    if (!api || !pagination) return
    const next = api.paginationGetPageSize()
    if (!next || next === effectivePageSizeRef.current) return
    effectivePageSizeRef.current = next
    setEffectivePageSize(next)
    api.setGridOption("cacheBlockSize", next)
    if (datasourceRef.current)
      api.setGridOption("datasource", datasourceRef.current)
  }, [pagination])

  const handleRetry = useCallback(() => {
    setError(null)
    setInitialLoading(true)
    gridApiRef.current?.purgeInfiniteCache()
  }, [])

  const handleRefresh = useCallback(() => {
    setError(null)
    gridApiRef.current?.refreshInfiniteCache()
  }, [])

  const handleToggleColumn = useCallback(
    (id: string, visible: boolean) => {
      setColumnVisible(id, visible)
      gridApiRef.current?.setColumnsVisible([id], visible)
      schedulePersist()
    },
    [setColumnVisible, schedulePersist]
  )

  const handleExport = useCallback(() => {
    const api = gridApiRef.current
    if (!api) return
    // Export the displayed columns (respecting visibility + order) and the rows
    // currently loaded in the cache, using each cell's *displayed* value.
    const { headers, rows } = collectGridExport(api)
    const sheetName =
      typeof title === "string" && title.length > 0 ? title : "Export"
    downloadXlsx(`${exportFileName}-${timestampForFilename()}`, {
      name: sheetName,
      headers,
      rows,
    })
  }, [exportFileName, title])

  useImperativeHandle(
    ref,
    (): SmartServerGridHandle<TRow> => ({
      refresh: () => gridApiRef.current?.refreshInfiniteCache(),
      reload: handleRetry,
      getSelectedIds: gridSelection.getSelectedIds,
      getSelectedRows: gridSelection.collectLoadedSelectedRows,
      clearSelection: gridSelection.clearSelection,
    }),
    [
      handleRetry,
      gridSelection.getSelectedIds,
      gridSelection.collectLoadedSelectedRows,
      gridSelection.clearSelection,
    ]
  )

  const showToolbar =
    title ||
    refreshable ||
    columnSelector ||
    exportExcel ||
    toolbarActions ||
    selection !== "none"

  return (
    <GridShell
      fill={fill}
      height={height}
      className={className}
      toolbar={
        showToolbar ? (
          <GridToolbar
            className={cn("shrink-0", fill && "px-4 pt-4")}
            title={title}
            leadingContent={
              selection !== "none" && gridSelection.selectedCount > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {uiLabels.grid.selected(gridSelection.selectedCount)}
                </span>
              ) : null
            }
            toolbarActions={toolbarActions}
            onRefresh={refreshable ? handleRefresh : undefined}
            columns={columnSelector ? menuColumns : undefined}
            onToggleColumn={handleToggleColumn}
            onExport={exportExcel ? handleExport : undefined}
            exportIcon={<FileSpreadsheet className="h-4 w-4" />}
          />
        ) : null
      }
    >
      <AgGridReact<TRow>
        className="h-full w-full"
        theme={dataGridTheme}
        rowModelType="infinite"
        cacheBlockSize={effectivePageSize}
        columnDefs={effectiveColumns}
        defaultColDef={defaultColDef}
        suppressCellFocus={true}
        rowSelection={rowSelection}
        pagination={pagination}
        // Page-size props only apply to the pager; passing them in infinite
        // scroll mode trips AG Grid warning #94 when `pageSize` isn't one of
        // the selector options (`cacheBlockSize` already carries the size).
        paginationPageSize={pagination ? effectivePageSize : undefined}
        paginationPageSizeSelector={pagination ? pageSizeOptions : undefined}
        rowHeight={rowHeightByDensity[density]}
        getRowId={getRowIdCb}
        animateRows
        noRowsOverlayComponent={NoRowsOverlay}
        noRowsOverlayComponentParams={
          {
            title: emptyState?.title ?? uiLabels.grid.empty.title,
            description:
              emptyState?.description ?? uiLabels.grid.empty.description,
          } satisfies NoRowsParams
        }
        onGridReady={handleGridReady}
        onPaginationChanged={handlePaginationChanged}
        onModelUpdated={gridSelection.reapplySelection}
        onRowSelected={gridSelection.handleRowSelected}
        onRowDoubleClicked={handleRowDoubleClicked}
        onSortChanged={schedulePersist}
        onColumnMoved={schedulePersist}
        onColumnResized={schedulePersist}
        onColumnVisible={schedulePersist}
        onColumnPinned={schedulePersist}
      />
      {loadingMore && !initialLoading && !error ? (
        <div
          role="status"
          aria-live="polite"
          aria-label={uiLabels.grid.loadingMore}
          className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px] overflow-hidden bg-foreground/[0.09]"
        >
          {/* Same rail as the boot screen — one progress language across the
              library, so "more rows are coming" reads like "the app is coming". */}
          <div className="sui-boot__rail h-full rounded-full" />
        </div>
      ) : null}
      {initialLoading && !error ? (
        <GridLoadingOverlay
          label={uiLabels.grid.loading}
          rowHeight={rowHeightByDensity[density]}
          columnCount={effectiveColumns.length}
        />
      ) : null}
      {error ? (
        <SmartPageError
          variant="overlay"
          title={uiLabels.grid.errorTitle}
          description={error}
          onRetry={handleRetry}
          retryLabel={uiLabels.grid.retry}
        />
      ) : null}
    </GridShell>
  )
}

const SmartServerGridForwarded = forwardRef(SmartServerGridInner)
SmartServerGridForwarded.displayName = "SmartServerGrid"

/**
 * `forwardRef` erases generics, so re-assert the generic call signature. This is
 * the standard "generic forwardRef" cast — runtime is unchanged.
 */
export const SmartServerGrid = SmartServerGridForwarded as <TRow>(
  props: SmartServerGridProps<TRow> & {
    ref?: ForwardedRef<SmartServerGridHandle<TRow>>
  }
) => ReactElement
