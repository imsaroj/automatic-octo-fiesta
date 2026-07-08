import {
  CellApiModule,
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  CsvExportModule,
  DateFilterModule,
  InfiniteRowModelModule,
  ModuleRegistry,
  NumberEditorModule,
  NumberFilterModule,
  PaginationModule,
  QuickFilterModule,
  RowApiModule,
  RowSelectionModule,
  SelectEditorModule,
  TextEditorModule,
  TextFilterModule,
  ValidationModule,
  type ColDef,
} from "ag-grid-community"
import { SmartEmptyState } from "./empty-state"

/**
 * Internal helpers shared by {@link SmartGrid} (client-side) and
 * {@link SmartServerGrid} (server-side / infinite). Not part of the public API —
 * the data-grid barrel does not re-export this module.
 */

// AG Grid v33+ requires explicit module registration. Only the modules the two
// grids actually use are registered (not `AllCommunityModule`, which more than
// doubles the ag-grid chunk). If a new grid feature throws a "missing module"
// error in dev, add its module here — ValidationModule (registered outside
// production only) names the exact module to add.
let modulesRegistered = false

// Module-scoped ambient type so `process.env.NODE_ENV` type-checks under
// apps/web's tsconfig too (which loads vite/client types, not @types/node).
// Vite statically define-replaces the expression in browser builds.
declare const process: { env: { NODE_ENV?: string } }

// eslint-disable-next-line react-refresh/only-export-components
export const ensureGridModules = (): void => {
  if (!modulesRegistered) {
    ModuleRegistry.registerModules([
      // Row models: SmartGrid (client-side) + SmartServerGrid (infinite)
      ClientSideRowModelModule,
      InfiniteRowModelModule,
      // Column header filters (defaultColDef.filter: true) + quick search
      TextFilterModule,
      NumberFilterModule,
      DateFilterModule,
      QuickFilterModule,
      // Cell editing (editable columns; select/number editors used by demos)
      TextEditorModule,
      NumberEditorModule,
      SelectEditorModule,
      // Row selection (incl. cross-page selection in SmartServerGrid)
      RowSelectionModule,
      PaginationModule,
      CsvExportModule,
      // APIs the wrappers call: column state/visibility, forEachNode,
      // getCellValue (Excel export), cellClass support
      ColumnApiModule,
      RowApiModule,
      CellApiModule,
      CellStyleModule,
      // Dev-only: descriptive errors (e.g. which module a feature needs).
      // Stripped from production bundles via NODE_ENV define-replacement.
      ...(process.env.NODE_ENV !== "production" ? [ValidationModule] : []),
    ])
    modulesRegistered = true
  }
}

/** Column definition — a thin alias over AG Grid's `ColDef` so consumers needn't import AG Grid. */
export type DataGridColumn<TRow> = ColDef<TRow>

export type DataGridDensity = "compact" | "normal" | "comfortable"

// eslint-disable-next-line react-refresh/only-export-components
export const rowHeightByDensity: Record<DataGridDensity, number> = {
  compact: 36,
  normal: 44,
  comfortable: 56,
}

export interface NoRowsParams {
  title?: string
  description?: string
}

export const NoRowsOverlay = (props: NoRowsParams) => (
  <div className="flex h-full w-full items-center justify-center p-6">
    <SmartEmptyState
      className="border-0"
      title={props.title ?? "No data"}
      description={props.description ?? "There is nothing to display yet."}
    />
  </div>
)

/** Stable id for a column: explicit `colId`, else `field`, else positional. */
// eslint-disable-next-line react-refresh/only-export-components
export const resolveColumnId = <TRow,>(
  column: DataGridColumn<TRow>,
  index: number
): string => {
  if (column.colId) return column.colId
  if (typeof column.field === "string") return column.field
  return `col-${index}`
}

/** Human label for a column: `headerName`, else `field`, else a fallback. */
// eslint-disable-next-line react-refresh/only-export-components
export const resolveColumnLabel = <TRow,>(
  column: DataGridColumn<TRow>,
  fallback: string
): string => {
  if (column.headerName) return column.headerName
  if (typeof column.field === "string") return column.field
  return fallback
}
