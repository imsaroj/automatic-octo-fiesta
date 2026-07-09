import { useMemo, useRef, useState, type ReactNode } from "react"
import { AgGridReact } from "ag-grid-react"
import {
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type RowSelectionOptions,
  type SelectionChangedEvent,
} from "ag-grid-community"
import { Download } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SmartLoadingOverlay } from "@workspace/ui/smart-components/loading-overlay"
import { SmartSearchInput } from "@workspace/ui/smart-components/search-input"
import { GridToolbar } from "./grid-toolbar"
import { escapeCsvFormula } from "./formula-guard"
import { dataGridTheme } from "./grid-theme"
import {
  ensureGridModules,
  NoRowsOverlay,
  resolveColumnId,
  resolveColumnLabel,
  rowHeightByDensity,
  type DataGridColumn,
  type DataGridDensity,
  type NoRowsParams,
} from "./grid-internals"
import {
  isExportSuppressed,
  type GridActionColumnOptions,
} from "./action-column"
import { useGridActionColumn, withActionColumn } from "./use-action-column"

// Re-exported so consumers can import these public types straight from the grid entrypoint.
export type { DataGridColumn, DataGridDensity } from "./grid-internals"

export interface SmartGridProps<TRow> {
  /** Row data. */
  rows: TRow[]
  /** Column definitions. */
  columns: DataGridColumn<TRow>[]
  /**
   * Config-driven Edit/Delete action column — pinned, permission-aware and
   * row-aware, with per-row loading and optional delete confirmation. The
   * column auto-hides when disabled or when every action is statically hidden.
   */
  actionColumn?: GridActionColumnOptions<TRow>
  /** Show the branded loading overlay. */
  loading?: boolean
  /** Optional grid title rendered in the toolbar. */
  title?: ReactNode
  /** Extra toolbar content rendered on the right. */
  toolbarActions?: ReactNode
  /** Quick-search box (filters across all columns). Default `true`. */
  quickSearch?: boolean
  /** Column visibility menu. Default `true`. */
  columnSelector?: boolean
  /** Export-to-CSV button. Default `true`. */
  exportCsv?: boolean
  /** CSV file name (without extension). Default `"export"`. */
  exportFileName?: string
  /** Enable client-side pagination. Default `true`. */
  pagination?: boolean
  /** Rows per page. Default `10`. */
  pageSize?: number
  /** Page-size options shown in the selector. */
  pageSizeOptions?: number[]
  /** Row selection mode. Default `"none"`. */
  selection?: "single" | "multiple" | "none"
  /** Fired when the selection changes. */
  onSelectionChange?: (rows: TRow[]) => void
  /** Stable row id getter (recommended for selection + updates). */
  getRowId?: (row: TRow) => string
  /** Row density. Default `"normal"`. */
  density?: DataGridDensity
  /** Grid height. Default `480`. */
  height?: number | string
  /** Empty-state content shown when there are no rows. */
  emptyState?: { title?: string; description?: string }
  className?: string
}

/**
 * Enterprise data grid built on AG Grid Community. Hides AG Grid setup behind a
 * small prop API while supporting sorting, filtering, quick search, column
 * visibility, CSV export, row selection, pagination, custom cell renderers and
 * branded loading/empty states.
 *
 * @example
 * ```tsx
 * <SmartGrid rows={users} columns={columns} loading={isLoading} selection="multiple" />
 * ```
 */
export const SmartGrid = <TRow,>({
  rows,
  columns,
  actionColumn,
  loading = false,
  title,
  toolbarActions,
  quickSearch = true,
  columnSelector = true,
  exportCsv = true,
  exportFileName = "export",
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selection = "none",
  onSelectionChange,
  getRowId,
  density = "normal",
  height = 480,
  emptyState,
  className,
}: SmartGridProps<TRow>) => {
  ensureGridModules()

  const gridRef = useRef<AgGridReact<TRow>>(null)
  const [gridApi, setGridApi] = useState<GridApi<TRow> | null>(null)
  const [quickFilter, setQuickFilter] = useState("")

  const actionColumnDef = useGridActionColumn(actionColumn)
  const effectiveColumns = useMemo(
    () => withActionColumn(columns, actionColumnDef),
    [columns, actionColumnDef]
  )

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    columns.forEach((column, index) => {
      initial[resolveColumnId(column, index)] = column.hide !== true
    })
    return initial
  })

  const defaultColDef = useMemo<ColDef<TRow>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    }),
    []
  )

  const rowSelection = useMemo<RowSelectionOptions | undefined>(() => {
    if (selection === "multiple") return { mode: "multiRow" }
    if (selection === "single") return { mode: "singleRow" }
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

  const handleGridReady = (event: GridReadyEvent<TRow>): void => {
    setGridApi(event.api)
  }

  const handleSelectionChanged = (event: SelectionChangedEvent<TRow>): void => {
    onSelectionChange?.(event.api.getSelectedRows())
  }

  const handleToggleColumn = (id: string, visible: boolean): void => {
    setColumnVisibility((prev) => ({ ...prev, [id]: visible }))
    gridApi?.setColumnsVisible([id], visible)
  }

  const handleExport = (): void => {
    if (!gridApi) return
    // Drop columns flagged non-exportable (e.g. the action column). Only pass
    // columnKeys when something is actually excluded, so AG Grid's default
    // column handling stays in effect otherwise.
    const displayed = gridApi.getAllDisplayedColumns()
    const exportable = displayed.filter(
      (column) => !isExportSuppressed(column.getColDef().context)
    )
    gridApi.exportDataAsCsv({
      fileName: `${exportFileName}.csv`,
      columnKeys:
        exportable.length === displayed.length
          ? undefined
          : exportable.map((column) => column.getColId()),
      // Neutralize spreadsheet formula injection (=/+/-/@ leading strings).
      processCellCallback: (params) => escapeCsvFormula(params.value),
    })
  }

  const showToolbar =
    title || quickSearch || columnSelector || exportCsv || toolbarActions

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showToolbar ? (
        <GridToolbar
          title={title}
          leadingContent={
            quickSearch ? (
              <SmartSearchInput
                value={quickFilter}
                onValueChange={setQuickFilter}
                placeholder="Search…"
                className="h-9 w-full sm:w-64"
                aria-label="Search table"
              />
            ) : null
          }
          toolbarActions={toolbarActions}
          columns={
            columnSelector
              ? toggleableColumns.map((column) => ({
                  ...column,
                  visible: columnVisibility[column.id] ?? true,
                }))
              : undefined
          }
          onToggleColumn={handleToggleColumn}
          onExport={exportCsv ? handleExport : undefined}
          exportIcon={<Download className="h-4 w-4" />}
        />
      ) : null}

      <SmartLoadingOverlay loading={loading} label="Loading data…">
        <div style={{ height, width: "100%" }}>
          <AgGridReact<TRow>
            ref={gridRef}
            theme={dataGridTheme}
            rowData={rows}
            columnDefs={effectiveColumns}
            suppressCellFocus={true}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilter}
            rowSelection={rowSelection}
            pagination={pagination}
            paginationPageSize={pageSize}
            paginationPageSizeSelector={pageSizeOptions}
            rowHeight={rowHeightByDensity[density]}
            getRowId={getRowId ? (params) => getRowId(params.data) : undefined}
            animateRows
            noRowsOverlayComponent={NoRowsOverlay}
            noRowsOverlayComponentParams={
              {
                title: emptyState?.title,
                description: emptyState?.description,
              } satisfies NoRowsParams
            }
            onGridReady={handleGridReady}
            onSelectionChanged={handleSelectionChanged}
          />
        </div>
      </SmartLoadingOverlay>
    </div>
  )
}
