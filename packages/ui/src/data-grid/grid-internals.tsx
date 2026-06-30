import { AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community";
import { SmartEmptyState } from "@/data-grid/empty-state";

/**
 * Internal helpers shared by {@link SmartGrid} (client-side) and
 * {@link ServerSmartGrid} (server-side / infinite). Not part of the public API —
 * the data-grid barrel does not re-export this module.
 */

// AG Grid v33+ requires explicit module registration. Community modules are free
// and `AllCommunityModule` includes both the client-side and infinite row models.
let modulesRegistered = false;

// eslint-disable-next-line react-refresh/only-export-components
export function ensureGridModules(): void {
  if (!modulesRegistered) {
    ModuleRegistry.registerModules([AllCommunityModule]);
    modulesRegistered = true;
  }
}

/** Column definition — a thin alias over AG Grid's `ColDef` so consumers needn't import AG Grid. */
export type DataGridColumn<TRow> = ColDef<TRow>;

export type DataGridDensity = "compact" | "normal" | "comfortable";

// eslint-disable-next-line react-refresh/only-export-components
export const rowHeightByDensity: Record<DataGridDensity, number> = {
  compact: 36,
  normal: 44,
  comfortable: 56,
};

export interface NoRowsParams {
  title?: string;
  description?: string;
}

export function NoRowsOverlay(props: NoRowsParams) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <SmartEmptyState
        className="border-0"
        title={props.title ?? "No data"}
        description={props.description ?? "There is nothing to display yet."}
      />
    </div>
  )
}

/** Stable id for a column: explicit `colId`, else `field`, else positional. */
// eslint-disable-next-line react-refresh/only-export-components
export function resolveColumnId<TRow>(column: DataGridColumn<TRow>, index: number): string {
  if (column.colId) return column.colId;
  if (typeof column.field === "string") return column.field;
  return `col-${index}`;
}

/** Human label for a column: `headerName`, else `field`, else a fallback. */
// eslint-disable-next-line react-refresh/only-export-components
export function resolveColumnLabel<TRow>(column: DataGridColumn<TRow>, fallback: string): string {
  if (column.headerName) return column.headerName;
  if (typeof column.field === "string") return column.field;
  return fallback;
}
