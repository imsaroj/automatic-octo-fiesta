import { useMemo, useRef, useState, type ReactNode } from "react"
import { AgGridReact } from "ag-grid-react"
import {
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type RowSelectionOptions,
  type SelectionChangedEvent,
} from "ag-grid-community"
import { Download, FileSpreadsheet } from "lucide-react"
import { downloadXlsx, timestampForFilename } from "@iamsaroj/smart-ui/lib/xlsx"
import { SmartLoadingOverlay } from "@iamsaroj/smart-ui/smart-components/smart-loading-overlay"
import { SmartSearchInput } from "@iamsaroj/smart-ui/smart-components/smart-search-input"
import { useSmartUILabels } from "@iamsaroj/smart-ui/smart-components/provider"
import { GridToolbar } from "./grid-toolbar"
import { GridShell } from "./grid-shell"
import { useGridColumnVisibility } from "./grid-column-visibility"
import { escapeCsvFormula } from "./formula-guard"
import { dataGridTheme } from "./grid-theme"
import {
  ensureGridModules,
  NoRowsOverlay,
  rowHeightByDensity,
  type DataGridColumn,
  type DataGridDensity,
  type NoRowsParams,
} from "./grid-internals"
import { collectGridExport } from "./server-grid-internals"
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
  /**
   * Export to Excel (`.xlsx`) instead of CSV — the export button downloads the
   * displayed columns and rows via the same writer `SmartServerGrid` uses. When
   * `true` it supersedes `exportCsv`. @default false
   */
  exportExcel?: boolean
  /** Export file name (without extension). Default `"export"`. */
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
  /**
   * Fill the parent instead of using a fixed `height` — the grid becomes a flex
   * column whose body grows to consume the remaining space. Use inside a
   * `flex-1 min-h-0` parent for a full-viewport layout. @default false
   */
  fill?: boolean
  /** Grid height when `fill` is `false`. Default `480`. */
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
  exportExcel = false,
  exportFileName = "export",
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selection = "none",
  onSelectionChange,
  getRowId,
  density = "normal",
  fill = false,
  height = 480,
  emptyState,
  className,
}: SmartGridProps<TRow>) => {
  ensureGridModules()

  // Labels fall back to the provider (English by default). Pagination defaults
  // (pageSize/pageSizeOptions) deliberately stay component-local — the client
  // grid's values diverge from the server grid's and converge under I8, not here.
  const uiLabels = useSmartUILabels()

  const gridRef = useRef<AgGridReact<TRow>>(null)
  const [gridApi, setGridApi] = useState<GridApi<TRow> | null>(null)
  const [quickFilter, setQuickFilter] = useState("")

  const actionColumnDef = useGridActionColumn(actionColumn)
  const effectiveColumns = useMemo(
    () => withActionColumn(columns, actionColumnDef),
    [columns, actionColumnDef]
  )

  const { menuColumns, setColumnVisible } = useGridColumnVisibility(columns)

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

  const handleGridReady = (event: GridReadyEvent<TRow>): void => {
    setGridApi(event.api)
  }

  const handleSelectionChanged = (event: SelectionChangedEvent<TRow>): void => {
    onSelectionChange?.(event.api.getSelectedRows())
  }

  const handleToggleColumn = (id: string, visible: boolean): void => {
    setColumnVisible(id, visible)
    gridApi?.setColumnsVisible([id], visible)
  }

  const handleExportCsv = (): void => {
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

  const handleExportExcel = (): void => {
    if (!gridApi) return
    // Same `.xlsx` writer + column/row shaping as SmartServerGrid (respects
    // visibility, order and the action column's export opt-out).
    const { headers, rows: exportRows } = collectGridExport(gridApi)
    const sheetName =
      typeof title === "string" && title.length > 0 ? title : "Export"
    downloadXlsx(`${exportFileName}-${timestampForFilename()}`, {
      name: sheetName,
      headers,
      rows: exportRows,
    })
  }

  // Excel supersedes CSV when both are enabled; otherwise the single export
  // button follows whichever format is on.
  const onExport = exportExcel
    ? handleExportExcel
    : exportCsv
      ? handleExportCsv
      : undefined

  const showToolbar =
    title ||
    quickSearch ||
    columnSelector ||
    exportCsv ||
    exportExcel ||
    toolbarActions

  return (
    <GridShell
      fill={fill}
      height={height}
      className={className}
      toolbar={
        showToolbar ? (
          <GridToolbar
            title={title}
            leadingContent={
              quickSearch ? (
                <SmartSearchInput
                  value={quickFilter}
                  onValueChange={setQuickFilter}
                  placeholder={uiLabels.grid.searchPlaceholder}
                  className="h-9 w-full sm:w-64"
                  aria-label="Search table"
                />
              ) : null
            }
            toolbarActions={toolbarActions}
            columns={columnSelector ? menuColumns : undefined}
            onToggleColumn={handleToggleColumn}
            onExport={onExport}
            exportIcon={
              exportExcel ? (
                <FileSpreadsheet className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )
            }
          />
        ) : null
      }
    >
      <AgGridReact<TRow>
        ref={gridRef}
        className="h-full w-full"
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
            title: emptyState?.title ?? uiLabels.grid.empty.title,
            description:
              emptyState?.description ?? uiLabels.grid.empty.description,
          } satisfies NoRowsParams
        }
        onGridReady={handleGridReady}
        onSelectionChanged={handleSelectionChanged}
      />
      {loading ? (
        <SmartLoadingOverlay loading label={uiLabels.grid.loading} />
      ) : null}
    </GridShell>
  )
}
