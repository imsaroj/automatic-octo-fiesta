import { themeQuartz, type Theme } from "ag-grid-community"

/**
 * AG Grid theme derived from the design tokens. Colors reference the same CSS
 * variables the rest of the system uses, so the grid follows light/dark mode
 * automatically — no separate AG Grid CSS import required (v33+ Theming API).
 */
/**
 * Column header height, in px. Pinned rather than left to the theme's spacing
 * maths because the loading skeleton starts exactly below the header (see
 * `grid-loading.tsx`) — the two must agree, and `--ag-header-height` is only
 * published inside AG Grid's own wrapper, where the overlay can't read it.
 * `GRID_HEADER_BAND` is the distance from the top of the grid body to the top
 * of the first row: the header plus the two 1px rules above and below it (the
 * wrapper's own border, then the header's bottom border).
 */
export const GRID_HEADER_HEIGHT = 48
export const GRID_HEADER_BAND = GRID_HEADER_HEIGHT + 2

export const dataGridTheme: Theme = themeQuartz.withParams({
  headerHeight: GRID_HEADER_HEIGHT,
  accentColor: "var(--primary)",
  backgroundColor: "var(--background)",
  foregroundColor: "var(--foreground)",
  borderColor: "var(--border)",
  chromeBackgroundColor: "var(--card)",
  headerBackgroundColor: "var(--muted)",
  headerTextColor: "var(--muted-foreground)",
  rowHoverColor: "var(--accent)",
  selectedRowBackgroundColor: "var(--accent)",
  panelBackgroundColor: "var(--card)",
  fontFamily: "inherit",
  headerFontWeight: 600,
  borderRadius: "var(--radius)",
  wrapperBorderRadius: "var(--radius)",
})
