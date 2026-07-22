/**
 * The one layout rule a filter bar adds on top of the shared grid engine.
 * Lives outside `smart-search-form.tsx` so that file exports only its component.
 */

import type { GridColumnsValue, Responsive } from "@iamsaroj/smart-ui/layout"

/**
 * A filter bar's column count is a *desktop* intent — nobody wants four filters
 * side by side in a 400px drawer. A plain number is therefore expanded into a
 * breakpoint ramp (1 → 2 → n) so the bar collapses on its own; anything richer
 * (a per-breakpoint map, intrinsic tracks, a track list) is the author being
 * explicit and passes straight through.
 */
export const toSearchColumns = (
  columns: Responsive<GridColumnsValue> | undefined
): Responsive<GridColumnsValue> | undefined => {
  if (typeof columns !== "number") return columns
  if (columns <= 1) return 1
  if (columns === 2) return { base: 1, sm: 2 }
  return { base: 1, sm: 2, lg: columns }
}
