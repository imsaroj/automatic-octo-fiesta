import { memo, useState, useSyncExternalStore, type ReactElement } from "react"
import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@iamsaroj/smart-ui/lib/utils"
import {
  ACTION_BUTTON_CONFIG,
  ActionButton,
  useActionPermission,
  type ActionKind,
} from "@iamsaroj/smart-ui/smart-components/buttons"
import { SmartConfirmDialog } from "@iamsaroj/smart-ui/smart-components/smart-confirm-dialog"
import type { DataGridColumn } from "./grid-internals"
import {
  ACTION_COLUMN_ID,
  resolveActionAriaLabel,
  resolveActionColumnWidth,
  resolveActionTooltip,
  resolveActiveActions,
  resolveConfirmOptions,
  resolveRowValue,
  type GridActionColumnOptions,
  type GridRowActionConfig,
} from "./action-column"

/**
 * The cell renderer + ColDef builder behind the grids' `actionColumn` prop.
 * The renderer is memoized against AG Grid re-renders and subscribes to a
 * tiny external store (`useSyncExternalStore`) instead, so the ColDef never
 * has to change when per-row state (e.g. `loading: (row) => deletingId ===
 * row.id`) changes — `useGridActionColumn` publishes the fresh options and
 * only the mounted action cells re-render.
 */

interface GridActionButtonProps<TRow> {
  kind: ActionKind
  config: GridRowActionConfig<TRow>
  row: TRow
  showLabel: boolean
  /** Consult the permission provider for actions without explicit `visible`. */
  permissionAware: boolean
}

/**
 * One action button for one row (edit, delete, or a custom action): resolves the
 * per-row visible / disabled / loading flags, applies the destructive treatment
 * for destructive actions, and routes the click through an optional
 * {@link SmartConfirmDialog}. Icon, label and variant come from
 * `ACTION_BUTTON_CONFIG[kind]`.
 */
const GridActionButton = <TRow,>({
  kind,
  config,
  row,
  showLabel,
  permissionAware,
}: GridActionButtonProps<TRow>): ReactElement | null => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const can = useActionPermission()

  // Explicit `visible` (boolean or per-row predicate) always wins; otherwise
  // fall back to the permission provider — `edit` shows only where
  // `can("edit", row)` passes. No provider (or opted out) → visible.
  const visible =
    config.visible !== undefined
      ? resolveRowValue(config.visible, row, true)
      : permissionAware
        ? (can?.(kind, row) ?? true)
        : true
  if (!visible) return null

  const { label, variant: kindVariant } = ACTION_BUTTON_CONFIG[kind]
  const destructive = kindVariant === "destructive"

  const disabled = resolveRowValue(config.disabled, row, false)
  const loading = resolveRowValue(config.loading, row, false)
  const confirm = resolveConfirmOptions(kind, config.confirm, label)
  const tooltip = resolveActionTooltip(kind, config.tooltip, label)

  const fire = (): void => config.onClick?.(row)

  const handleClick = (): void => {
    // The button is disabled while loading, but guard anyway so a queued
    // event can never double-fire the action.
    if (loading || disabled) return
    if (confirm) setConfirmOpen(true)
    else fire()
  }

  return (
    <>
      <ActionButton
        action={kind}
        // The column already decided visibility above (explicit `visible` or
        // the permission provider); tell the button not to re-gate itself, or
        // it would double-apply `can(kind)` and undo an explicit override.
        permission
        iconOnly={!showLabel}
        size="sm"
        variant="ghost"
        className={cn(
          destructive &&
            "text-destructive hover:bg-destructive/10 hover:text-destructive"
        )}
        loading={loading}
        // Icon-only: spinner replaces the icon inside the same fixed-size
        // button, so the row height never changes while deleting.
        loadingText={showLabel ? undefined : ""}
        disabled={disabled}
        tooltip={tooltip === false ? false : tooltip}
        aria-label={resolveActionAriaLabel(kind, config.tooltip, label)}
        onClick={handleClick}
      />
      {confirm ? (
        <SmartConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          cancelLabel={confirm.cancelLabel}
          variant={destructive ? "destructive" : "default"}
          onConfirm={fire}
        />
      ) : null}
    </>
  )
}

/**
 * Bridge between the grid component and the mounted action cells: cells read
 * the latest options through it and subscribe to be re-rendered whenever the
 * `actionColumn` prop changes identity (see `useGridActionColumn`).
 */
export interface GridActionColumnStore<TRow> {
  /** Reads the *latest* options (ref-backed) so callbacks are never stale. */
  getOptions: () => GridActionColumnOptions<TRow>
  /** Monotonic change counter — the `useSyncExternalStore` snapshot. */
  getVersion: () => number
  /** Register for change notifications; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void
}

/** Extra cellRendererParams `buildActionColumnDef` wires into the renderer. */
export interface GridActionCellParams<TRow> {
  actionColumnStore: GridActionColumnStore<TRow>
}

const GridActionCellInner = <TRow,>(
  props: ICellRendererParams<TRow> & GridActionCellParams<TRow>
): ReactElement | null => {
  const { actionColumnStore } = props
  // Re-render whenever the grid's `actionColumn` prop changes — this is what
  // makes row-external state (deletingId, permissions, …) show up without the
  // consumer touching row data or AG Grid's refresh APIs.
  useSyncExternalStore(
    actionColumnStore.subscribe,
    actionColumnStore.getVersion,
    actionColumnStore.getVersion
  )

  const row = props.data
  // Infinite row model: placeholder rows have no data yet.
  if (row == null) return null

  const options = actionColumnStore.getOptions()
  const actions = resolveActiveActions(options)
  if (actions.length === 0) return null
  const showLabel = options.showLabel ?? false
  const permissionAware = options.permissionAware ?? true

  return (
    <div className="flex h-full items-center gap-1">
      {actions.map(({ kind, config }, index) => (
        <GridActionButton<TRow>
          key={`${kind}:${index}`}
          kind={kind}
          config={config}
          row={row}
          showLabel={showLabel}
          permissionAware={permissionAware}
        />
      ))}
    </div>
  )
}

/**
 * Memoized action-cell renderer. AG Grid re-renders it only on
 * `refreshCells({ force: true })` or row-data changes, keeping the column
 * cheap across thousands of virtualized rows.
 */
export const GridActionCell = memo(
  GridActionCellInner
) as typeof GridActionCellInner

/**
 * Build the injected action ColDef. The structural options (pin, width, label
 * mode, header, exportability) are baked in; the per-row behavior flows through
 * the `store` so the returned object can stay referentially stable (see
 * `useGridActionColumn`).
 *
 * The column opts out of everything a utility column must not do: sort,
 * filter, edit, resize (by default), move, hide, header menu, grouping /
 * pivot / aggregation, and (by default) export.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const buildActionColumnDef = <TRow,>(
  options: GridActionColumnOptions<TRow>,
  store: GridActionColumnStore<TRow>
): DataGridColumn<TRow> => {
  const pinned = options.pinned ?? "left"
  const resizable = options.resizable ?? false
  const width = resolveActionColumnWidth(
    resolveActiveActions(options).length,
    options.showLabel ?? false,
    options.width
  )
  return {
    colId: ACTION_COLUMN_ID,
    headerName: options.headerName ?? "Actions",
    // `pinned` is a *stateful* attribute: on a columnDefs update, `undefined`
    // means "keep the current state", so unpinning must be an explicit null.
    pinned: pinned === false ? null : pinned,
    lockPinned: true,
    lockPosition:
      pinned === "left" ? "left" : pinned === "right" ? "right" : undefined,
    lockVisible: true,
    suppressMovable: true,
    sortable: false,
    filter: false,
    floatingFilter: false,
    editable: false,
    resizable,
    suppressHeaderMenuButton: true,
    suppressHeaderFilterButton: true,
    suppressAutoSize: true,
    suppressColumnsToolPanel: true,
    enableRowGroup: false,
    enablePivot: false,
    enableValue: false,
    // `flex: 0` opts this column out of defaultColDef's `flex: 1`; the
    // min/max pair pins the width (defaultColDef.minWidth is 120, wider than
    // the icon-only column, so it must be overridden here).
    flex: 0,
    width,
    minWidth: width,
    maxWidth: resizable ? undefined : width,
    cellClass: "smart-grid-action-cell",
    cellRenderer: GridActionCell,
    cellRendererParams: {
      actionColumnStore: store,
    } satisfies GridActionCellParams<TRow>,
    // Read by both grids' export paths (CSV + XLSX) via `isExportSuppressed`.
    context: { suppressExport: options.exportable !== true },
  }
}
