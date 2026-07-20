import type { ReactNode } from "react"

import type { ActionKind } from "@iamsaroj/smart-ui/smart-components/buttons"

/**
 * Types and pure logic behind the grids' `actionColumn` prop — the config-driven
 * Edit/Delete (+ custom) action column shared by {@link SmartGrid} and
 * {@link SmartServerGrid}. Everything here is renderer-free and unit-tested in
 * `action-column.test.ts` (the `ActionKind` import is a type, erased at runtime);
 * the cell renderer and ColDef builder live in `action-column-cell.tsx`, the
 * React wiring in `use-action-column.ts`.
 */

/** Stable `colId` of the injected action column. */
export const ACTION_COLUMN_ID = "smart-actions"

/** The built-in sugar row actions (`actions.edit` / `actions.delete`). */
export type GridActionKind = "edit" | "delete"

export const GRID_ACTION_KINDS: readonly GridActionKind[] = ["edit", "delete"]

/** A static value or a per-row resolver. */
export type GridActionRowValue<TRow, V> = V | ((row: TRow) => V)

/** Confirmation dialog copy; unset fields fall back to per-action defaults. */
export interface GridActionConfirmOptions {
  /** Headline question. @default "Delete this row?" (delete) */
  title?: string
  /** Supporting text explaining the consequences. */
  description?: ReactNode
  /** Confirm button label. @default the action label */
  confirmLabel?: string
  /** Cancel button label. @default "Cancel" */
  cancelLabel?: string
}

/** Configuration for one row action (Edit or Delete). */
export interface GridRowActionConfig<TRow> {
  /** Static on/off switch for the action. @default true */
  enabled?: boolean
  /** Show/hide the button — statically or per row. @default true */
  visible?: GridActionRowValue<TRow, boolean>
  /** Disable the button (kept visible) — statically or per row. @default false */
  disabled?: GridActionRowValue<TRow, boolean>
  /**
   * Per-row loading state: shows a spinner, disables the button and swallows
   * further clicks — only for the rows the resolver matches. Row height is
   * unaffected (the spinner replaces the icon inside a fixed-size button).
   */
  loading?: GridActionRowValue<TRow, boolean>
  /**
   * Tooltip content. `true`/omitted uses the default ("Edit row" / "Delete
   * row"), `false` disables it, a string replaces it. Also used as the
   * button's `aria-label` in icon-only mode.
   */
  tooltip?: boolean | string
  /**
   * Ask for confirmation before firing `onClick`. `true` uses the per-action
   * default copy; pass {@link GridActionConfirmOptions} to customize it.
   */
  confirm?: boolean | GridActionConfirmOptions
  /** Fired with the row (after confirmation, when `confirm` is set). */
  onClick?: (row: TRow) => void
}

/**
 * One action as accepted by the `actions` prop: `false` hides it, `true`
 * enables it with defaults, an object configures it.
 */
export type GridRowActionProp<TRow> = boolean | GridRowActionConfig<TRow>

/**
 * A row action beyond the built-in Edit/Delete. `action` names an
 * `ACTION_BUTTON_CONFIG` entry (`"view"`, `"duplicate"`, `"restore"`, …) that
 * supplies the icon, label and variant; everything else is the same per-row
 * config (visible/disabled/loading/tooltip/confirm/onClick) the built-ins use.
 */
export interface GridCustomRowAction<TRow> extends GridRowActionConfig<TRow> {
  action: ActionKind
}

export interface GridActionColumnActions<TRow> {
  edit?: GridRowActionProp<TRow>
  delete?: GridRowActionProp<TRow>
  /**
   * Additional actions, rendered in order **after** edit/delete. Set `edit` /
   * `delete` to `false` and list everything here to control the full order.
   */
  custom?: GridCustomRowAction<TRow>[]
}

/** Where the action column is pinned. `false` = a regular scrolling column. */
export type GridActionColumnPin = "left" | "right" | false

/** The grids' `actionColumn` prop. */
export interface GridActionColumnOptions<TRow> {
  /** Master switch — `false` removes the column entirely. @default true */
  enabled?: boolean
  /** Pin side; pinned columns stay visible while scrolling. @default "left" */
  pinned?: GridActionColumnPin
  /** Fixed width in px. Omit to auto-size from the button count. */
  width?: number
  /** Render "Edit"/"Delete" labels next to the icons. @default false */
  showLabel?: boolean
  /** Include the column in CSV/Excel exports. @default false */
  exportable?: boolean
  /** Let the user resize the column. @default false */
  resizable?: boolean
  /** Header text. @default "Actions" */
  headerName?: string
  /**
   * Consult the nearest `ActionPermissionProvider` for actions that don't set
   * an explicit `visible` — `edit` shows only where `can("edit", row)` passes,
   * and likewise per action `kind`. Set `false` to opt a grid out even when a
   * provider is mounted above it. Explicit `visible` always wins. @default true
   */
  permissionAware?: boolean
  /** The row actions. Omitting both (or hiding both) removes the column. */
  actions?: GridActionColumnActions<TRow>
}

/** An action that survived static filtering, ready for the cell renderer. */
export interface ResolvedGridAction<TRow> {
  /**
   * The `ACTION_BUTTON_CONFIG` key driving the button's icon/label/variant.
   * `"edit"`/`"delete"` for the sugar keys, or the custom action's `action`.
   */
  kind: ActionKind
  config: GridRowActionConfig<TRow>
}

/* ------------------------------ normalization ------------------------------ */

/**
 * Collapse the `boolean | config` action prop into a config, or `null` when the
 * action is statically off (`false`, `enabled: false`, or `visible: false` as a
 * literal). Function `visible` predicates stay — they are per-row decisions.
 */
export const normalizeRowAction = <TRow>(
  input: GridRowActionProp<TRow> | undefined
): GridRowActionConfig<TRow> | null => {
  if (input === undefined || input === false) return null
  if (input === true) return {}
  if (input.enabled === false) return null
  if (input.visible === false) return null
  return input
}

/**
 * The actions that can render for at least one row, in display order (edit,
 * delete, then each `custom` action). An empty result means the column should
 * not render at all (see the auto-hide contract in {@link isActionColumnEnabled}).
 */
export const resolveActiveActions = <TRow>(
  options: GridActionColumnOptions<TRow>
): ResolvedGridAction<TRow>[] => {
  const active: ResolvedGridAction<TRow>[] = []
  for (const kind of GRID_ACTION_KINDS) {
    const config = normalizeRowAction(options.actions?.[kind])
    if (config) active.push({ kind, config })
  }
  for (const { action, ...rest } of options.actions?.custom ?? []) {
    const config = normalizeRowAction(rest)
    if (config) active.push({ kind: action, config })
  }
  return active
}

/**
 * Auto-hide contract: the column exists only when it is enabled *and* at least
 * one action is statically visible. (Per-row `visible` functions count as
 * potentially visible — they can only be judged row by row.)
 */
export const isActionColumnEnabled = <TRow>(
  options: GridActionColumnOptions<TRow> | undefined
): options is GridActionColumnOptions<TRow> =>
  options !== undefined &&
  options.enabled !== false &&
  resolveActiveActions(options).length > 0

/* ------------------------------- row resolvers ----------------------------- */

/** Evaluate a {@link GridActionRowValue} against a row. */
export const resolveRowValue = <TRow, V>(
  value: GridActionRowValue<TRow, V> | undefined,
  row: TRow,
  fallback: V
): V => {
  if (value === undefined) return fallback
  if (typeof value === "function") return (value as (row: TRow) => V)(row)
  return value
}

/* --------------------------------- defaults -------------------------------- */

const BUILTIN_TOOLTIPS: Partial<Record<ActionKind, string>> = {
  edit: "Edit row",
  delete: "Delete row",
}

/**
 * Tooltip/aria-label for an action: `false` disables it, a string overrides it,
 * anything else falls back to the built-in "Edit row" / "Delete row" or, for a
 * custom action, its `ACTION_BUTTON_CONFIG` label (passed as `defaultLabel`).
 */
export const resolveActionTooltip = (
  kind: ActionKind,
  tooltip: boolean | string | undefined,
  defaultLabel?: string
): string | false => {
  if (tooltip === false) return false
  if (typeof tooltip === "string") return tooltip
  return BUILTIN_TOOLTIPS[kind] ?? defaultLabel ?? kind
}

/** Accessible name for the button — never disabled, even when tooltip is. */
export const resolveActionAriaLabel = (
  kind: ActionKind,
  tooltip: boolean | string | undefined,
  defaultLabel?: string
): string =>
  typeof tooltip === "string" && tooltip.length > 0
    ? tooltip
    : (BUILTIN_TOOLTIPS[kind] ?? defaultLabel ?? kind)

export interface ResolvedConfirmOptions {
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel: string
}

const BUILTIN_CONFIRM: Partial<Record<ActionKind, ResolvedConfirmOptions>> = {
  edit: {
    title: "Edit this row?",
    description: "You are about to edit this row.",
    confirmLabel: "Edit",
    cancelLabel: "Cancel",
  },
  delete: {
    title: "Delete this row?",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  },
}

/**
 * Merge user confirm options over the per-action defaults; `null` = no confirm.
 * Custom actions with no built-in defaults derive them from `defaultLabel` (the
 * action's `ACTION_BUTTON_CONFIG` label).
 */
export const resolveConfirmOptions = (
  kind: ActionKind,
  confirm: boolean | GridActionConfirmOptions | undefined,
  defaultLabel?: string
): ResolvedConfirmOptions | null => {
  if (confirm === undefined || confirm === false) return null
  const overrides = confirm === true ? {} : confirm
  const defaults: ResolvedConfirmOptions = BUILTIN_CONFIRM[kind] ?? {
    title: defaultLabel ? `${defaultLabel} this row?` : "Are you sure?",
    description: null,
    confirmLabel: defaultLabel ?? "Confirm",
    cancelLabel: "Cancel",
  }
  return {
    title: overrides.title ?? defaults.title,
    description: overrides.description ?? defaults.description,
    confirmLabel: overrides.confirmLabel ?? defaults.confirmLabel,
    cancelLabel: overrides.cancelLabel ?? defaults.cancelLabel,
  }
}

/* ---------------------------------- width ---------------------------------- */

// Horizontal budget per button: icon-only buttons are 24px (`icon-sm`) plus the
// 4px flex gap; labeled buttons add the text. CHROME covers the cell padding.
const ICON_BUTTON_SPAN = 28
const LABEL_BUTTON_SPAN = 78
const CELL_CHROME = 30

/**
 * Width for the action column: an explicit `width` wins; otherwise size from
 * the button count, clamped to 80–120px icon-only (per the design spec) or up
 * to 200px with labels.
 */
export const resolveActionColumnWidth = (
  actionCount: number,
  showLabel: boolean,
  width?: number
): number => {
  if (width !== undefined) return width
  const span = showLabel ? LABEL_BUTTON_SPAN : ICON_BUTTON_SPAN
  const auto = CELL_CHROME + actionCount * span
  return Math.min(Math.max(auto, 80), showLabel ? 200 : 120)
}

/* -------------------------------- signature -------------------------------- */

/**
 * Memo key over the *structural* fields of the options — the ones baked into
 * the ColDef. Per-row callbacks/predicates are deliberately excluded: they are
 * read through a ref at render time, so changing them must not recreate the
 * column (which would reset AG Grid column state).
 */
export const actionColumnSignature = <TRow>(
  options: GridActionColumnOptions<TRow> | undefined
): string => {
  if (!isActionColumnEnabled(options)) return "off"
  const kinds = resolveActiveActions(options)
    .map((action) => action.kind)
    .join("+")
  return [
    kinds,
    String(options.pinned ?? "left"),
    String(options.width ?? "auto"),
    options.showLabel ? "label" : "icon",
    options.exportable ? "exportable" : "no-export",
    options.resizable ? "resizable" : "fixed",
    options.headerName ?? "Actions",
  ].join("|")
}

/* --------------------------------- export ---------------------------------- */

/**
 * `true` when a ColDef `context` carries the export opt-out set by
 * `buildActionColumnDef` (`exportable: false`, the default). Checked by both
 * grids' CSV/XLSX export paths.
 */
export const isExportSuppressed = (context: unknown): boolean =>
  typeof context === "object" &&
  context !== null &&
  (context as { suppressExport?: boolean }).suppressExport === true
