/**
 * The pure core of the layout engine: config objects in, CSS custom properties
 * out. No React and no DOM, so every rule below is directly unit-testable
 * (`resolve.test.ts`) — the React layer in `grid-layout.tsx` only ships these
 * results to the `style` attribute, and `styles/layout.css` only decides which
 * breakpoint's property wins.
 *
 * Two rules carry most of the engine's behavior:
 *
 * 1. **Spans are clamped to the column count at their own breakpoint.** A
 *    `span: 6` field in a `{ base: 1, md: 12 }` grid resolves to 1 track below
 *    48rem and 6 above it — responsive collapse falls out for free, and a cell
 *    can never overflow its grid.
 * 2. **Values are emitted only when they change.** The cascade in
 *    `layout.css` inherits each breakpoint from the nearest declared smaller
 *    one, so repeating a value would be pure DOM weight.
 */

import type * as React from "react"

import {
  BREAKPOINT_ORDER,
  type Breakpoint,
  type GapValue,
  type GridColumnsValue,
  type GridLayoutOptions,
  type GridPlacement,
  type Responsive,
  type ResponsiveMap,
  type SpanValue,
} from "./types"

/** A CSS-custom-property bag. `React.CSSProperties` rejects `--*` keys. */
export type CssVars = React.CSSProperties & Record<`--${string}`, string>

const BREAKPOINT_SET = new Set<string>(BREAKPOINT_ORDER)

/**
 * A responsive map is a plain object whose keys are *all* breakpoint names.
 * That test is what lets `columns` accept both `{ base: 1, md: 12 }` and the
 * `{ auto: "fit", min: "16rem" }` config object without a discriminant.
 */
const isResponsiveMap = <T>(
  value: Responsive<T> | undefined
): value is ResponsiveMap<T> => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => BREAKPOINT_SET.has(key))
}

/** Normalize either notation to a per-breakpoint map. */
export const toResponsiveMap = <T>(
  value: Responsive<T> | undefined
): ResponsiveMap<T> => {
  if (value === undefined) return {}
  if (isResponsiveMap(value)) return value
  return { base: value as T }
}

// ── Columns ─────────────────────────────────────────────────────────────────

/** A column config resolved to CSS, plus the track count when it's knowable. */
export interface ResolvedColumns {
  /** A `grid-template-columns` value. */
  template: string
  /** Track count — `undefined` for raw templates and auto-fit/fill, where the
   * count isn't statically knowable. Fraction spans need it; numeric spans use
   * it to clamp. */
  count?: number
}

const EQUAL_TRACK = (count: number) => `repeat(${count}, minmax(0, 1fr))`

/** Turn one {@link GridColumnsValue} into a template + track count. */
export const resolveColumns = (value: GridColumnsValue): ResolvedColumns => {
  if (typeof value === "number") {
    const count = Math.max(1, Math.floor(value))
    return { template: EQUAL_TRACK(count), count }
  }

  if (typeof value === "string") return { template: value }

  // `Array.isArray` doesn't narrow a `readonly` array out of a union, so key
  // off the config object's own discriminant instead.
  if ("auto" in value) {
    const { auto, min, max = "1fr" } = value
    return { template: `repeat(auto-${auto}, minmax(${min}, ${max}))` }
  }

  const tracks = value.map((track) =>
    // `minmax(0, Nfr)` rather than a bare `Nfr`: an fr track's implicit `auto`
    // minimum lets wide content (a long select, an overflowing table) push the
    // track past its share and break the proportions.
    typeof track === "number" ? `minmax(0, ${track}fr)` : track
  )
  if (tracks.length === 0) return { template: EQUAL_TRACK(1), count: 1 }
  return { template: tracks.join(" "), count: tracks.length }
}

// ── Gap ─────────────────────────────────────────────────────────────────────

const GAP_TOKENS: Record<string, string> = {
  none: "0",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
}

/** Turn a gap token / spacing step / raw length into a CSS length. */
export const resolveGap = (value: GapValue): string => {
  if (typeof value === "number") return `${value * 0.25}rem`
  return GAP_TOKENS[value] ?? value
}

// ── Spans ───────────────────────────────────────────────────────────────────

/** A span resolved against a known column count: a track count, or a keyword. */
export type ResolvedSpan = number | "full" | "auto"

/**
 * Resolve one {@link SpanValue} against the column count in effect at that
 * breakpoint. Relative spans (`"1/2"`, `"25%"`) need the count; without one
 * (raw template / auto-fit) they degrade to `"auto"` rather than guessing.
 * Numeric spans are clamped into `[1, count]`, which is what makes a wide span
 * collapse gracefully on a narrow container.
 */
export const resolveSpan = (
  span: SpanValue,
  count: number | undefined
): ResolvedSpan => {
  if (span === "full") return "full"
  if (span === "auto") return "auto"

  let tracks: number

  if (typeof span === "number") {
    tracks = Math.floor(span)
  } else if (span.endsWith("%")) {
    if (count === undefined) return "auto"
    tracks = Math.round((Number.parseFloat(span) / 100) * count)
  } else if (span.includes("/")) {
    if (count === undefined) return "auto"
    const [numerator, denominator] = span.split("/").map(Number)
    if (!denominator) return "auto"
    tracks = Math.round((numerator / denominator) * count)
  } else {
    tracks = Number(span)
  }

  if (!Number.isFinite(tracks)) return "auto"
  tracks = Math.max(1, tracks)
  if (count !== undefined) {
    if (tracks >= count) return "full"
    tracks = Math.min(tracks, count)
  }
  return tracks
}

/** Compose a resolved span + optional start column into a `grid-column` value. */
export const toGridColumn = (
  span: ResolvedSpan,
  start: number | "auto" | undefined
): string => {
  const pinned =
    typeof start === "number" ? Math.max(1, Math.floor(start)) : undefined
  if (span === "full") return pinned === undefined ? "1 / -1" : `${pinned} / -1`
  if (span === "auto") return pinned === undefined ? "auto" : `${pinned} / auto`
  return pinned === undefined ? `span ${span}` : `${pinned} / span ${span}`
}

/**
 * Resolve a cell's full column placement — span *and* start — against the
 * column count in effect.
 *
 * The clamping here is what keeps a grid honest. CSS happily invents **implicit
 * columns** for a cell that starts or ends past the last track, which silently
 * widens the row and throws every other cell's proportions off. So a start
 * beyond the last column snaps back to it, and a span that would run off the
 * end runs to the edge instead. A field pinned to column 7 of a 12-column grid
 * therefore still collapses cleanly to full width when the container narrows to
 * a single column, with no per-breakpoint override.
 */
export const resolvePlacementColumn = (
  span: SpanValue | undefined,
  start: number | "auto" | undefined,
  count: number | undefined
): string => {
  let pinned =
    typeof start === "number" ? Math.max(1, Math.floor(start)) : undefined
  if (pinned !== undefined && count !== undefined)
    pinned = Math.min(pinned, count)

  const resolved = resolveSpan(span ?? "auto", count)

  // A pinned cell that would overrun the last track ends at the edge instead.
  if (
    typeof resolved === "number" &&
    pinned !== undefined &&
    count !== undefined &&
    resolved > count - pinned + 1
  ) {
    return toGridColumn("full", pinned)
  }

  return toGridColumn(resolved, pinned)
}

// ── Grid style ──────────────────────────────────────────────────────────────

/**
 * The declared column count per breakpoint, handed from a grid to its cells so
 * their spans can be resolved. A breakpoint present with an `undefined` value
 * means "declared here, but the count is unknowable" — distinct from absent,
 * which inherits the next smaller breakpoint.
 */
export type ColumnCountMap = ResponsiveMap<number | undefined>

/** A grid's inline style plus the column counts its cells resolve against. */
export interface ResolvedGridLayout {
  style: CssVars
  columnCounts: ColumnCountMap
}

/** Build a grid element's custom properties from its {@link GridLayoutOptions}. */
export const resolveGridLayout = (
  options: GridLayoutOptions
): ResolvedGridLayout => {
  const { columns, gap, columnGap, rowGap, dense, align, justify } = options

  const style = {} as CssVars
  const columnCounts: ColumnCountMap = {}

  const columnMap = toResponsiveMap(columns)
  let lastTemplate: string | undefined
  for (const breakpoint of BREAKPOINT_ORDER) {
    const value = columnMap[breakpoint]
    if (value === undefined) continue
    const { template, count } = resolveColumns(value)
    columnCounts[breakpoint] = count
    if (template === lastTemplate) continue
    lastTemplate = template
    style[`--sui-tpl-${breakpoint}`] = template
  }
  // With no `columns` at all the CSS default (one track) applies; say so
  // explicitly so cells clamp against it instead of skipping the clamp.
  if (columns === undefined) columnCounts.base = 1

  assignGap(style, "gx", columnGap ?? gap)
  assignGap(style, "gy", rowGap ?? gap)

  if (dense) style["--sui-flow"] = "row dense"
  if (align) style["--sui-align"] = align
  if (justify) style["--sui-justify"] = justify

  return { style, columnCounts }
}

const assignGap = (
  style: CssVars,
  axis: "gx" | "gy",
  value: Responsive<GapValue> | undefined
): void => {
  if (value === undefined) return
  const map = toResponsiveMap(value)
  let last: string | undefined
  for (const breakpoint of BREAKPOINT_ORDER) {
    const raw = map[breakpoint]
    if (raw === undefined) continue
    const length = resolveGap(raw)
    if (length === last) continue
    last = length
    style[`--sui-${axis}-${breakpoint}`] = length
  }
}

// ── Cell style ──────────────────────────────────────────────────────────────

/**
 * Build a cell's custom properties. Walks every breakpoint once, carrying the
 * last declared span / start / column count forward — that single pass is what
 * makes a cell react to *the grid's* breakpoints as well as its own, so
 * `span: 6` re-clamps when the column count changes even though the span itself
 * never did.
 */
export const resolveCellStyle = (
  placement: GridPlacement,
  columnCounts: ColumnCountMap = {}
): CssVars => {
  const style = {} as CssVars

  const spanMap = toResponsiveMap(placement.span)
  const startMap = toResponsiveMap(
    placement.colStart ?? (placement.newRow ? 1 : undefined)
  )

  let span: SpanValue | undefined
  let start: number | "auto" | undefined
  let count: number | undefined
  let lastColumn: string | undefined

  for (const breakpoint of BREAKPOINT_ORDER) {
    if (breakpoint in spanMap) span = spanMap[breakpoint]
    if (breakpoint in startMap) start = startMap[breakpoint]
    if (breakpoint in columnCounts) count = columnCounts[breakpoint]
    // Nothing placed yet — leave the CSS default (`auto`) in charge.
    if (span === undefined && start === undefined) continue

    const column = resolvePlacementColumn(span, start, count)
    if (column === lastColumn) continue
    lastColumn = column
    style[`--sui-col-${breakpoint}`] = column
  }

  assignSimple(style, "row", placement.rowSpan, (rows) =>
    rows > 1 ? `span ${Math.floor(rows)}` : "auto"
  )
  assignSimple(style, "ord", placement.order, (order) => `${Math.floor(order)}`)

  return style
}

const assignSimple = (
  style: CssVars,
  name: "row" | "ord",
  value: Responsive<number> | undefined,
  format: (value: number) => string
): void => {
  if (value === undefined) return
  const map = toResponsiveMap(value)
  let last: string | undefined
  for (const breakpoint of BREAKPOINT_ORDER) {
    const raw = map[breakpoint]
    if (raw === undefined) continue
    const formatted = format(raw)
    if (formatted === last) continue
    last = formatted
    style[`--sui-${name}-${breakpoint}`] = formatted
  }
}

/** Strip the placement keys out of a props object (the rest are DOM props). */
export const splitPlacement = <P extends GridPlacement>(
  props: P
): [GridPlacement, Omit<P, keyof GridPlacement>] => {
  const { span, colStart, rowSpan, order, newRow, ...rest } = props
  return [{ span, colStart, rowSpan, order, newRow }, rest]
}

export type { Breakpoint }
