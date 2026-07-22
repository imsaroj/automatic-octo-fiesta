import { cn } from "@iamsaroj/smart-ui/lib/utils"
import { GRID_HEADER_BAND } from "./grid-theme"

/**
 * The grid's first-load state. **Internal** — the data-grid barrel does not
 * re-export it; both grids render it from inside `GridShell`'s positioned body.
 *
 * It is deliberately not a spinner over a dimmed grid. A table's loading state
 * should describe the table: skeleton rows at the grid's real row height, one
 * light sweep passing over them, and a small status pill carrying the label.
 * The real column header stays visible above it (the overlay starts at
 * `GRID_HEADER_BAND`, the height the theme pins the header to), so the screen
 * never loses the information it already had — only the data is missing.
 *
 * Like `SmartPageLoading`, the motion is CSS-only (`.sui-grid-loading__*` /
 * `.sui-skel` in `styles/globals.css`) and the whole overlay fades in after a
 * ~140ms `animation-delay`: a fetch that resolves quickly never flashes a
 * skeleton, and the component holds no state and never re-renders.
 */

/**
 * Bar widths, cycled by row + column so the skeleton reads like real content
 * rather than a grid of identical bars. Deterministic — a random width would
 * jitter on every render.
 */
const BAR_WIDTHS = ["68%", "45%", "82%", "54%", "73%", "38%", "60%", "49%"]

/**
 * Drawn unconditionally: the body height isn't known here, so enough rows are
 * rendered to overflow a tall grid (extras are clipped) and the bottom scrim
 * fades the last visible row into the background either way.
 */
const SKELETON_ROWS = 18

export interface GridLoadingOverlayProps {
  /** Status text — announced to screen readers and shown in the pill. */
  label: string
  /** The grid's row height for the current density, so the rows line up. */
  rowHeight: number
  /** Visible column count. Clamped: the skeleton only has to read as a table. */
  columnCount: number
  className?: string
}

export const GridLoadingOverlay = ({
  label,
  rowHeight,
  columnCount,
  className,
}: GridLoadingOverlayProps) => {
  const columns = Math.min(Math.max(columnCount, 3), 6)

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "sui-grid-loading sui-delayed-in absolute inset-0 z-30 overflow-hidden rounded-[inherit]",
        className
      )}
    >
      {/* Opaque so AG Grid's own "no rows" overlay never shows through while
          the first page is still in flight. */}
      <div
        // Inset by the wrapper's own 1px border so the grid keeps its outline.
        className="sui-grid-loading__body absolute inset-x-px bottom-px overflow-hidden bg-background"
        style={{ top: GRID_HEADER_BAND }}
      >
        <div aria-hidden="true">
          {Array.from({ length: SKELETON_ROWS }, (_, row) => (
            <div
              key={row}
              className="flex items-center gap-6 border-b border-border/50 px-4"
              style={{ height: rowHeight }}
            >
              {Array.from({ length: columns }, (_, column) => (
                <div key={column} className="min-w-0 flex-1">
                  <div
                    className="sui-skel h-2.5 rounded-full"
                    style={{
                      width: BAR_WIDTHS[(row * 3 + column) % BAR_WIDTHS.length],
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* One band of light crossing the table — the only moving part. */}
        <div
          aria-hidden="true"
          className="sui-grid-loading__sweep pointer-events-none absolute inset-y-0 left-0 w-1/3"
        />

        {/* Dissolves the last row instead of cutting it on a hard edge, and
            keeps the pill legible over whatever it sits on. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background via-background/85 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
          <span className="flex max-w-full items-center gap-2.5 rounded-full border border-border/70 bg-card/90 py-1.5 pr-3.5 pl-3 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="h-[3px] w-7 shrink-0 overflow-hidden rounded-full bg-foreground/10"
            >
              <span className="sui-boot__rail block h-full rounded-full" />
            </span>
            <span className="truncate">{label}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** Sum of char codes — enough to give each column its own bar rhythm. */
const hash = (value: string): number => {
  let total = 0
  for (let i = 0; i < value.length; i += 1) total += value.charCodeAt(i)
  return total
}

/**
 * A single cell whose row hasn't arrived yet, in an **infinite** grid.
 *
 * AG Grid doesn't paint a loading row for a block it is still fetching — it
 * renders the row with every cell empty, and any formatter runs on `undefined`
 * (a currency column cheerfully shows `$0.00` for data that doesn't exist).
 * Wired through `defaultColDef.cellRendererSelector`, this replaces that with
 * the same placeholder bar the first-load skeleton uses, so scrolling into an
 * unloaded region looks like the table filling in rather than the table
 * breaking. Columns keep their own renderers: the selector only claims the
 * cell while `data` is missing.
 */
export const GridLoadingCell = (params: {
  node?: { rowIndex?: number | null }
  column?: { getColId?: () => string }
}) => {
  const row = params.node?.rowIndex ?? 0
  const column = hash(params.column?.getColId?.() ?? "")

  return (
    <div aria-hidden="true" className="flex h-full items-center">
      <div
        className="sui-skel sui-skel--pulse h-2.5 rounded-full"
        style={{ width: BAR_WIDTHS[(row + column) % BAR_WIDTHS.length] }}
      />
    </div>
  )
}
