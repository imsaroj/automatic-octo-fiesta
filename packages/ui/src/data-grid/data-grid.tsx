import { useMemo, useRef, useState, type ReactNode } from "react"
import { AgGridReact } from "ag-grid-react"
import {
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type RowSelectionOptions,
  type SelectionChangedEvent,
} from "ag-grid-community"
import { Columns3, Download } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { SmartSearchInput } from "@/smart-components/search-input"
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

// Re-exported so `@s-component/ui` continues to surface these public types.
export type {
  DataGridColumn,
  DataGridDensity,
} from "@/data-grid/grid-internals"

export interface SmartGridProps<TRow> {
  /** Row data. */
  rows: TRow[]
  /** Column definitions. */
  columns: DataGridColumn<TRow>[]
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
  /** SPagination. Default `true`. */
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
export function SmartGrid<TRow>({
  rows,
  columns,
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
}: SmartGridProps<TRow>) {
  ensureGridModules()

  const gridRef = useRef<AgGridReact<TRow>>(null)
  const [gridApi, setGridApi] = useState<GridApi<TRow> | null>(null)
  const [quickFilter, setQuickFilter] = useState("")

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
    gridApi?.exportDataAsCsv({ fileName: `${exportFileName}.csv` })
  }

  const showToolbar =
    title || quickSearch || columnSelector || exportCsv || toolbarActions

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showToolbar ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {title ? (
              <h3 className="text-base font-semibold">{title}</h3>
            ) : null}
            {quickSearch ? (
              <SmartSearchInput
                value={quickFilter}
                onValueChange={setQuickFilter}
                placeholder="Search…"
                className="h-9 w-full sm:w-64"
                aria-label="Search table"
              />
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {toolbarActions}
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
            {exportCsv ? (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <SmartLoadingOverlay loading={loading} label="Loading data…">
        <div style={{ height, width: "100%" }}>
          <AgGridReact<TRow>
            ref={gridRef}
            theme={dataGridTheme}
            rowData={rows}
            columnDefs={columns}
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
