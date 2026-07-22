import type { ReactNode } from "react"

import { cn } from "@iamsaroj/smart-ui/lib/utils"

/**
 * The outer chrome shared by `SmartGrid` and `SmartServerGrid`: the flex-column
 * root, the toolbar slot, and the **positioned** body container that both the
 * fixed-`height` and full-viewport `fill` layouts flow through. Each grid drops
 * its own `<AgGridReact>` plus any overlays (loading / error / "loading more")
 * into `children`; because the body is `relative`, a standalone
 * `GridLoadingOverlay` (`absolute inset-0`) or `SmartPageError` overlay covers
 * exactly the grid area.
 *
 * Extracting this converged the two grids' previously-divergent wrappers — the
 * client grid gains the `fill` layout for free — while keeping the row-model
 * specifics (client `rowData` vs. the server infinite datasource) in each
 * component. **Internal** — not re-exported from the data-grid barrel.
 */
export interface GridShellProps {
  /**
   * Fill the parent instead of using a fixed `height`: the root becomes a flex
   * column whose body grows to consume the remaining space. Use inside a
   * `flex-1 min-h-0` parent for a full-viewport layout. @default false
   */
  fill?: boolean
  /** Body height when `fill` is `false`. @default 480 */
  height?: number | string
  className?: string
  /** Toolbar element (already composed by the grid), rendered above the body. */
  toolbar?: ReactNode
  /** The `<AgGridReact>` plus any absolute overlays. */
  children: ReactNode
}

export const GridShell = ({
  fill = false,
  height = 480,
  className,
  toolbar,
  children,
}: GridShellProps) => (
  <div
    className={cn("flex flex-col gap-3", fill && "h-full min-h-0", className)}
    style={fill ? { height: "100%" } : undefined}
  >
    {toolbar}
    <div
      className={cn("relative w-full", fill && "min-h-0 flex-1")}
      style={fill ? undefined : { height }}
    >
      {children}
    </div>
  </div>
)
