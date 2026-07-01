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
  type IGetRowsParams,
  type RowDoubleClickedEvent,
  type RowSelectionOptions,
} from "ag-grid-community"
import { AlertCircle, Columns3, FileSpreadsheet, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadXlsx, timestampForFilename } from "@/lib/xlsx"
import { Button } from "@/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu"
import { SmartLoadingOverlay } from "@/smart-components/loading-overlay"
import {
  buildServerFetchParams,
  type ServerFetchParams,
  type ServerFetchResult,
  type ServerFilter,
} from "@/data-grid/pagination"
import { dataGridTheme } from "@/data-grid/grid-theme"
import {
  ensureGridModules,
  NoRowsOverlay,
  resolveColumnId,
  resolveColumnLabel,
  rowHeightByDensity,
  type DataGridColumn,
  type DataGridDensity,
  type NoRowsParams,
} from "@/data-grid/grid-internals"
import {
  collectGridExport,
  debounce,
  errorMessage,
  mergeServerFilters,
  readPersistedGridState,
  writePersistedGridState,
} from "@/data-grid/server-grid-internals"
import {
  useServerGridSelection,
  type ServerSelection,
} from "@/data-grid/use-server-grid-selection"

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
   */
  fetchRows: (
    params: ServerFetchParams,
    signal: AbortSignal
  ) => Promise<ServerFetchResult<TRow>>
  /** Stable row id — required for selection and block reconciliation across pages. */
  getRowId: (row: TRow) => string

  /**
   * External filters merged into every fetch — e.g. driven by a dedicated search
   * form rather than the column headers. Changing this array (by identity)
   * resets to page 1 and refetches; it stays out of the grid's own state, so
   * typing in the form never hits the server until you swap the array in.
   */
  filters?: ServerFilter[]

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
   * Per-column header filters (text/number/set inputs + filter menu). Default
   * `true`. Set `false` to remove all in-header filtering — sorting stays
   * enabled — when filtering is driven by an external search form instead.
   */
  columnFilters?: boolean
  /** Floating filter row beneath the headers (only applies when `columnFilters`). Default `true`. */
  floatingFilters?: boolean

  /**
   * `localStorage` key. When set, the grid persists column order / size /
   * visibility plus the active sort and filters, and restores them on reload.
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

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-md border border-border bg-card p-6 text-center shadow-sm">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Couldn’t load data</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  )
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
 *   columnFilters={false}
 *   pagination={false}        // infinite scroll
 *   selection="multiple"
 *   fill
 * />
 * ```
 */
function SmartServerGridInner<TRow>(
  props: SmartServerGridProps<TRow>,
  ref: ForwardedRef<SmartServerGridHandle<TRow>>
): ReactElement {
  const {
    columns,
    fetchRows,
    getRowId,
    filters,
    pagination = true,
    pageSize = 20,
    pageSizeOptions = [5, 10, 20, 50],
    selection = "none",
    onSelectionChange,
    onRowDoubleClick,
    columnFilters = true,
    floatingFilters = true,
    persistStateKey,
    title,
    toolbarActions,
    refreshable = true,
    columnSelector = true,
    exportExcel = true,
    exportFileName = "export",
    density = "normal",
    fill = false,
    height = 480,
    emptyState,
    className,
  } = props

  ensureGridModules()

  // Latest props read by the (stable) datasource + grid callbacks, without
  // re-creating them — recreating the datasource would reset the grid.
  const gridApiRef = useRef<GridApi<TRow> | null>(null)
  const fetchRowsRef = useRef(fetchRows)
  const getRowIdRef = useRef(getRowId)
  const onRowDoubleClickRef = useRef(onRowDoubleClick)
  const filtersRef = useRef(filters)
  const persistKeyRef = useRef(persistStateKey)
  useLayoutEffect(() => {
    fetchRowsRef.current = fetchRows
    getRowIdRef.current = getRowId
    onRowDoubleClickRef.current = onRowDoubleClick
    filtersRef.current = filters
    persistKeyRef.current = persistStateKey
  })

  const controllersRef = useRef<Set<AbortController>>(new Set())

  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    columns.forEach((column, index) => {
      initial[resolveColumnId(column, index)] = column.hide !== true
    })
    return initial
  })

  // Cross-page selection lives in a dedicated hook — the selected-id set is the
  // source of truth, so a selection survives block reloads (see the hook).
  const gridSelection = useServerGridSelection(gridApiRef, onSelectionChange)

  const saveState = useCallback(() => {
    const api = gridApiRef.current
    const key = persistKeyRef.current
    if (!api || !key) return
    writePersistedGridState(key, {
      columnState: api.getColumnState(),
      filterModel: api.getFilterModel() as Record<string, unknown>,
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
    if (parsed.filterModel) api.setFilterModel(parsed.filterModel)
  }, [])

  // Stable datasource: reads the latest `fetchRows` / `filters` from refs so its
  // identity never changes (a new datasource would purge the grid).
  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: (params: IGetRowsParams) => {
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
          filtersRef.current
        )
        const controller = new AbortController()
        controllersRef.current.add(controller)
        fetchRowsRef
          .current(serverParams, controller.signal)
          .then(
            (result) => {
              // `lastRow` = the known total, so the grid sizes the scrollbar exactly.
              params.successCallback(result.rows, result.total)
              setError(null)
            },
            (reason: unknown) => {
              if (controller.signal.aborted) return
              params.failCallback()
              setError(errorMessage(reason))
            }
          )
          .finally(() => {
            controllersRef.current.delete(controller)
            setInitialLoading(false)
          })
      },
    }),
    []
  )

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
  }, [filters])

  const defaultColDef = useMemo<ColDef<TRow>>(
    () => ({
      sortable: true,
      filter: columnFilters,
      floatingFilter: columnFilters && floatingFilters,
      resizable: true,
      flex: 1,
      minWidth: 120,
    }),
    [columnFilters, floatingFilters]
  )

  const rowSelection = useMemo<RowSelectionOptions | undefined>(() => {
    // No `headerCheckbox` in the infinite row model (AG Grid warning #129) — a
    // "select all" can't span rows the client hasn't loaded. Per-row checkboxes
    // plus our cross-page id tracking are what make sense here.
    if (selection === "multiple") return { mode: "multiRow", checkboxes: true }
    if (selection === "single") return { mode: "singleRow", checkboxes: true }
    return undefined
  }, [selection])

  const toggleableColumns = useMemo(
    () =>
      columns.map((column, index) => {
        const id = resolveColumnId(column, index)
        return { id, label: resolveColumnLabel(column, id) }
      }),
    [columns]
  )

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
      event.api.setGridOption("datasource", datasource)
    },
    [datasource, restoreState]
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<TRow>) => {
      if (event.data) onRowDoubleClickRef.current?.(event.data)
    },
    []
  )

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
      setColumnVisibility((prev) => ({ ...prev, [id]: visible }))
      gridApiRef.current?.setColumnsVisible([id], visible)
      schedulePersist()
    },
    [schedulePersist]
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
    <div
      className={cn("flex flex-col gap-3", fill && "h-full min-h-0", className)}
      style={fill ? { height: "100%" } : undefined}
    >
      {showToolbar ? (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {title ? (
              <h3 className="text-base font-semibold">{title}</h3>
            ) : null}
            {selection !== "none" && gridSelection.selectedCount > 0 ? (
              <span className="text-sm text-muted-foreground">
                {gridSelection.selectedCount} selected
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {toolbarActions}
            {refreshable ? (
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            ) : null}
            {columnSelector ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  <Columns3 className="h-4 w-4" />
                  Columns
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {toggleableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={columnVisibility[column.id] ?? true}
                      onCheckedChange={(checked) =>
                        handleToggleColumn(column.id, checked)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {exportExcel ? (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileSpreadsheet className="h-4 w-4" />
                Export
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn("relative w-full", fill && "min-h-0 flex-1")}
        style={fill ? undefined : { height }}
      >
        <AgGridReact<TRow>
          className="h-full w-full"
          theme={dataGridTheme}
          rowModelType="infinite"
          cacheBlockSize={pageSize}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          suppressCellFocus={true}
          rowSelection={rowSelection}
          pagination={pagination}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={pageSizeOptions}
          rowHeight={rowHeightByDensity[density]}
          getRowId={getRowIdCb}
          animateRows
          noRowsOverlayComponent={NoRowsOverlay}
          noRowsOverlayComponentParams={
            {
              title: emptyState?.title,
              description: emptyState?.description,
            } satisfies NoRowsParams
          }
          onGridReady={handleGridReady}
          onModelUpdated={gridSelection.reapplySelection}
          onRowSelected={gridSelection.handleRowSelected}
          onRowDoubleClicked={handleRowDoubleClicked}
          onSortChanged={schedulePersist}
          onFilterChanged={schedulePersist}
          onColumnMoved={schedulePersist}
          onColumnResized={schedulePersist}
          onColumnVisible={schedulePersist}
          onColumnPinned={schedulePersist}
        />
        {initialLoading && !error ? (
          <SmartLoadingOverlay loading label="Loading data…" />
        ) : null}
        {error ? <ErrorPanel message={error} onRetry={handleRetry} /> : null}
      </div>
    </div>
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
