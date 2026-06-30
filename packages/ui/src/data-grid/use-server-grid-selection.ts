import { useCallback, useRef, useState, type RefObject } from "react";
import type { GridApi, RowSelectedEvent } from "ag-grid-community";

/** What changed in a {@link SmartServerGridProps.onSelectionChange} event. */
export interface ServerSelection<TRow> {
  /** Selected rows that are currently loaded in the grid cache. */
  rows: TRow[];
  /** Every selected row id, including rows on pages not currently loaded. */
  ids: string[];
}

/** The selection API returned by {@link useServerGridSelection}. */
export interface ServerGridSelection<TRow> {
  /** Count of every selected id (drives the toolbar "{n} selected" label). */
  selectedCount: number;
  /** Selected rows currently loaded in the grid cache. */
  collectLoadedSelectedRows: () => TRow[];
  /** All selected row ids (including rows not currently loaded). */
  getSelectedIds: () => string[];
  /** Recompute the count and fire `onSelectionChange`. */
  emitSelection: () => void;
  /** Re-select loaded nodes whose id is in the set — wire to `onModelUpdated`. */
  reapplySelection: () => void;
  /** Track a user selection toggle — wire to `onRowSelected`. */
  handleRowSelected: (event: RowSelectedEvent<TRow>) => void;
  /** Clear the selection (grid + id set) and emit. */
  clearSelection: () => void;
}

/**
 * Cross-page selection for {@link SmartServerGrid}. The **id set is the source
 * of truth** so a selection survives block reloads: when AG Grid's infinite row
 * model purges and re-fetches blocks, {@link ServerGridSelection.reapplySelection}
 * re-selects any loaded node whose id is still in the set. Drive it from AG
 * Grid's `onRowSelected` (user toggles) and `onModelUpdated` (blocks arrive).
 */
export function useServerGridSelection<TRow>(
  gridApiRef: RefObject<GridApi<TRow> | null>,
  onSelectionChange?: (selection: ServerSelection<TRow>) => void,
): ServerGridSelection<TRow> {
  // Selection that survives block reloads: the id set is the source of truth.
  const selectedIdsRef = useRef<Set<string>>(new Set());
  // Guards against treating our own programmatic re-selection as a user action.
  const applyingSelectionRef = useRef(false);
  // Latest callback read without re-creating the memoized handlers.
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const [selectedCount, setSelectedCount] = useState(0);

  const collectLoadedSelectedRows = useCallback((): TRow[] => {
    const api = gridApiRef.current;
    const rows: TRow[] = [];
    if (!api) return rows;
    api.forEachNode((node) => {
      if (node.data && node.id != null && selectedIdsRef.current.has(node.id)) {
        rows.push(node.data);
      }
    });
    return rows;
  }, [gridApiRef]);

  const getSelectedIds = useCallback(() => Array.from(selectedIdsRef.current), []);

  const emitSelection = useCallback(() => {
    const ids = Array.from(selectedIdsRef.current);
    setSelectedCount(ids.length);
    onSelectionChangeRef.current?.({ rows: collectLoadedSelectedRows(), ids });
  }, [collectLoadedSelectedRows]);

  // Re-select nodes whose id is in the set whenever new blocks arrive.
  const reapplySelection = useCallback(() => {
    const api = gridApiRef.current;
    if (!api || selectedIdsRef.current.size === 0) return;
    applyingSelectionRef.current = true;
    api.forEachNode((node) => {
      if (node.id != null && selectedIdsRef.current.has(node.id) && !node.isSelected()) {
        node.setSelected(true);
      }
    });
    applyingSelectionRef.current = false;
  }, [gridApiRef]);

  const handleRowSelected = useCallback(
    (event: RowSelectedEvent<TRow>) => {
      if (applyingSelectionRef.current) return; // ignore programmatic re-selection
      const { node } = event;
      if (node.id == null) return;
      if (node.isSelected()) selectedIdsRef.current.add(node.id);
      else selectedIdsRef.current.delete(node.id);
      emitSelection();
    },
    [emitSelection],
  );

  const clearSelection = useCallback(() => {
    gridApiRef.current?.deselectAll();
    selectedIdsRef.current.clear();
    setSelectedCount(0);
    emitSelection();
  }, [gridApiRef, emitSelection]);

  return {
    selectedCount,
    collectLoadedSelectedRows,
    getSelectedIds,
    emitSelection,
    reapplySelection,
    handleRowSelected,
    clearSelection,
  };
}
