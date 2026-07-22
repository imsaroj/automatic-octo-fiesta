/**
 * Named layouts for the shapes teams reach for constantly, so an app doesn't
 * re-derive its own breakpoint ramp in every screen. A preset is just a
 * {@link GridLayoutOptions} object — spread it, override any part of it, or
 * ignore it entirely.
 *
 * Every multi-column preset starts at one column: below the `md` container
 * width (48rem) a form is narrower than two usable fields, so collapsing is the
 * right default rather than an opt-in.
 */

import type { GridLayoutOptions } from "./types"

export const LAYOUT_PRESETS = {
  /** One column at every size — the classic stacked form. */
  stacked: { columns: 1 },
  /** Two columns from `sm` up. */
  pair: { columns: { base: 1, sm: 2 } },
  /** Three columns, stepping 1 → 2 → 3. */
  triple: { columns: { base: 1, sm: 2, lg: 3 } },
  /** Four columns, stepping 1 → 2 → 4. A dense filter bar. */
  quad: { columns: { base: 1, sm: 2, lg: 4 } },
  /**
   * The 12-column workhorse: any halves/thirds/quarters split expresses
   * exactly, and spans clamp to 1 below `md`.
   */
  twelve: { columns: { base: 1, md: 12 } },
  /** 16 columns for dashboards that need finer proportions than twelfths. */
  sixteen: { columns: { base: 1, md: 8, lg: 16 } },
  /**
   * No fixed count — as many ≥16rem tracks as fit, re-flowing continuously
   * instead of at breakpoints. Fraction spans don't apply here (there is no
   * knowable count); use `span: "full"` for full-width rows.
   */
  fluid: { columns: { auto: "fit", min: "16rem" } },
  /** A fixed 18rem rail plus a flexible main column. */
  sidebar: { columns: { base: 1, md: ["18rem", "1fr"] } },
  /** Tight, four-up filter bar for toolbars and search headers. */
  filters: { columns: { base: 1, sm: 2, lg: 4 }, gap: "sm" },
} as const satisfies Record<string, GridLayoutOptions>

/** Name of a built-in layout preset. */
export type LayoutPreset = keyof typeof LAYOUT_PRESETS

/**
 * Resolve a preset name to its options, with explicit options merged over it —
 * so `preset="twelve"` plus `gap="lg"` keeps the 12-column ramp.
 */
export const resolveLayoutPreset = (
  preset: LayoutPreset | undefined,
  overrides: GridLayoutOptions
): GridLayoutOptions => {
  if (!preset) return overrides
  const base = LAYOUT_PRESETS[preset] as GridLayoutOptions
  const merged: GridLayoutOptions = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value
  }
  return merged
}
