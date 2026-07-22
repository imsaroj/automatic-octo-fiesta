/**
 * `@iamsaroj/smart-ui/layout` — the container-query CSS Grid engine shared by
 * `SmartForm`, `SmartSearchForm`, and any app layout that needs the same rules.
 *
 *   import { SmartGridLayout, SmartGridItem } from "@iamsaroj/smart-ui/layout"
 *
 * Three ideas make up the whole engine:
 *
 * - **Runtime values, not compiled classes.** Column counts and spans travel as
 *   CSS custom properties, so 12, 16, or 37 columns all work — nothing has to
 *   exist in a Tailwind safelist.
 * - **Container queries, not media queries.** A layout reacts to the width it
 *   was given, so the same form is correct in a page, a 420px drawer, and a
 *   split pane.
 * - **Spans clamp to the column count.** `span: 6` on a `{ base: 1, md: 12 }`
 *   grid is half a row on desktop and a full row on mobile, with no per-field
 *   breakpoint config.
 *
 * Requires `@iamsaroj/smart-ui/globals.css` (it pulls in `layout.css`).
 */

export {
  SmartGridLayout,
  SmartGridItem,
  type SmartGridLayoutProps,
  type SmartGridItemProps,
} from "./grid-layout"

export {
  GridLayoutProvider,
  useGridLayout,
  useGridCell,
  useGridLayoutContext,
  type GridLayoutContextValue,
  type GridLayoutModel,
} from "./context"

export {
  BREAKPOINT_ORDER,
  BREAKPOINT_MIN_WIDTH,
  type Breakpoint,
  type Responsive,
  type ResponsiveMap,
  type AutoTracks,
  type GridColumnsValue,
  type GapToken,
  type GapValue,
  type SpanValue,
  type GridPlacement,
  type GridLayoutOptions,
} from "./types"

export {
  resolveColumns,
  resolveGap,
  resolveSpan,
  resolveGridLayout,
  resolveCellStyle,
  resolvePlacementColumn,
  toGridColumn,
  toResponsiveMap,
  splitPlacement,
  type ColumnCountMap,
  type CssVars,
  type ResolvedColumns,
  type ResolvedGridLayout,
  type ResolvedSpan,
} from "./resolve"

export {
  LAYOUT_PRESETS,
  resolveLayoutPreset,
  type LayoutPreset,
} from "./presets"
