/**
 * The vocabulary of the layout engine: breakpoints, the {@link Responsive}
 * wrapper every visual value accepts, and the column / gap / placement value
 * types. Pure types + constants, no React — the resolvers in `resolve.ts` and
 * the components in `grid-layout.tsx` both build on this.
 */

/**
 * Breakpoint names, smallest first. `base` is the unconditional value; the rest
 * apply from their min-width **container** size upward and inherit downward
 * (mobile-first), so declaring `md` also covers `lg`/`xl`/`2xl`.
 */
export const BREAKPOINT_ORDER = [
  "base",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
] as const

export type Breakpoint = (typeof BREAKPOINT_ORDER)[number]

/**
 * Container widths each breakpoint activates at. **Mirrored by hand in
 * `src/styles/layout.css`** — CSS cannot read these, so change both together.
 */
export const BREAKPOINT_MIN_WIDTH: Record<
  Exclude<Breakpoint, "base">,
  string
> = {
  xs: "20rem",
  sm: "30rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
}

/** A per-breakpoint map. Missing breakpoints inherit the nearest smaller one. */
export type ResponsiveMap<T> = Partial<Record<Breakpoint, T>>

/**
 * Any layout value, either flat (applies everywhere) or per breakpoint:
 *
 * ```ts
 * columns={12}                      // always 12 tracks
 * columns={{ base: 1, md: 12 }}     // 1 track until the container hits 48rem
 * ```
 */
export type Responsive<T> = T | ResponsiveMap<T>

/**
 * Intrinsically sized tracks — the count follows the container instead of being
 * declared. `auto: "fit"` collapses empty tracks (items stretch to fill the
 * row); `auto: "fill"` keeps them (items keep their width, leaving a gap).
 *
 * ```ts
 * columns={{ auto: "fit", min: "16rem" }}   // as many ≥16rem tracks as fit
 * ```
 */
export interface AutoTracks {
  auto: "fit" | "fill"
  /** Minimum track width, e.g. `"16rem"`. */
  min: string
  /** Maximum track width. Default `"1fr"`. */
  max?: string
}

/**
 * How many columns a grid has, in one of four notations:
 *
 * | Value | Meaning |
 * | --- | --- |
 * | `12` | 12 equal tracks |
 * | `[1, 3]` | two proportional tracks — 25% / 75% |
 * | `["16rem", "1fr"]` | a fixed sidebar track plus a flexible one |
 * | `{ auto: "fit", min: "16rem" }` | as many ≥16rem tracks as fit |
 *
 * A raw `grid-template-columns` string is also accepted as an escape hatch
 * (`"repeat(3, 1fr) 2fr"`); fraction spans can't be resolved against one,
 * since the track count isn't statically knowable.
 */
export type GridColumnsValue =
  | number
  | string
  | readonly (number | string)[]
  | AutoTracks

/** Named spacing steps for `gap`. A raw CSS length is also accepted. */
export type GapToken = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

/**
 * A gap: a {@link GapToken}, a number on the 0.25rem scale (`4` → `1rem`, the
 * Tailwind convention), or any CSS length (`"12px"`, `"2ch"`).
 */
export type GapValue = GapToken | number | string

/**
 * How wide a cell is, in one of four notations — all resolved against the
 * grid's column count *at that breakpoint*:
 *
 * | Value | Meaning |
 * | --- | --- |
 * | `6` | 6 tracks (clamped to the column count, so it never overflows) |
 * | `"full"` | edge to edge, whatever the column count |
 * | `"1/2"`, `"2/3"` | a fraction of the grid — no column-count math to do |
 * | `"25%"` | the same idea as a percentage |
 * | `"auto"` | one track (the default) |
 *
 * Fractions and percentages need a knowable column count; against a raw
 * template string or {@link AutoTracks} they fall back to `"auto"`.
 */
export type SpanValue =
  | number
  | "full"
  | "auto"
  | `${number}/${number}`
  | `${number}%`

/** Where a cell sits in its grid. Every field / section / item accepts these. */
export interface GridPlacement {
  /** Width in columns. See {@link SpanValue}. Default one track. */
  span?: Responsive<SpanValue>
  /** 1-based column to start at — pins the cell instead of auto-placing it. */
  colStart?: Responsive<number | "auto">
  /** Height in rows. Default `1`. */
  rowSpan?: Responsive<number>
  /** Visual order override; lower comes first. Reorder without touching config order. */
  order?: Responsive<number>
  /** Start a fresh row (shorthand for `colStart: 1`). Ignored when `colStart` is set. */
  newRow?: boolean
}

/** Grid-level configuration — the props of a layout, minus its children. */
export interface GridLayoutOptions {
  /** Column tracks. See {@link GridColumnsValue}. Default `1`. */
  columns?: Responsive<GridColumnsValue>
  /** Gap on both axes. Default `"md"` (1rem). */
  gap?: Responsive<GapValue>
  /** Column gap — overrides {@link gap} horizontally. */
  columnGap?: Responsive<GapValue>
  /** Row gap — overrides {@link gap} vertically. */
  rowGap?: Responsive<GapValue>
  /**
   * Backfill holes left by wide cells with later, narrower ones
   * (`grid-auto-flow: row dense`). Visual order stops matching DOM order, so
   * keep it off for forms where tab order matters.
   */
  dense?: boolean
  /** Block-axis alignment of cells within their track. Default `stretch`. */
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  /** Inline-axis alignment of cells within their track. Default `stretch`. */
  justify?: "start" | "center" | "end" | "stretch"
}
