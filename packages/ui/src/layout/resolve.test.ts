import { describe, expect, it } from "vitest"

import {
  resolveCellStyle,
  resolveColumns,
  resolveGap,
  resolveGridLayout,
  resolvePlacementColumn,
  resolveSpan,
  toGridColumn,
  toResponsiveMap,
} from "./resolve"
import { resolveLayoutPreset } from "./presets"

describe("toResponsiveMap", () => {
  it("wraps a flat value as the base breakpoint", () => {
    expect(toResponsiveMap(12)).toEqual({ base: 12 })
  })

  it("passes a breakpoint map through", () => {
    expect(toResponsiveMap({ base: 1, md: 12 })).toEqual({ base: 1, md: 12 })
  })

  it("treats a config object with non-breakpoint keys as a flat value", () => {
    const tracks = { auto: "fit", min: "16rem" } as const
    expect(toResponsiveMap(tracks)).toEqual({ base: tracks })
  })

  it("treats an array as a flat value, not a map", () => {
    expect(toResponsiveMap([1, 3])).toEqual({ base: [1, 3] })
  })
})

describe("resolveColumns", () => {
  it("expands a count into equal, non-overflowing tracks", () => {
    expect(resolveColumns(12)).toEqual({
      template: "repeat(12, minmax(0, 1fr))",
      count: 12,
    })
  })

  it("floors and clamps a nonsense count", () => {
    expect(resolveColumns(0).count).toBe(1)
  })

  it("reads a numeric track list as proportions", () => {
    expect(resolveColumns([1, 3])).toEqual({
      template: "minmax(0, 1fr) minmax(0, 3fr)",
      count: 2,
    })
  })

  it("passes string tracks through verbatim", () => {
    expect(resolveColumns(["18rem", "1fr"])).toEqual({
      template: "18rem 1fr",
      count: 2,
    })
  })

  it("builds an intrinsic repeat, with no knowable count", () => {
    expect(resolveColumns({ auto: "fit", min: "16rem" })).toEqual({
      template: "repeat(auto-fit, minmax(16rem, 1fr))",
      count: undefined,
    })
  })

  it("accepts a raw template as an escape hatch", () => {
    expect(resolveColumns("repeat(3, 1fr) 2fr")).toEqual({
      template: "repeat(3, 1fr) 2fr",
      count: undefined,
    })
  })
})

describe("resolveGap", () => {
  it("maps tokens", () => {
    expect(resolveGap("md")).toBe("1rem")
    expect(resolveGap("none")).toBe("0")
  })

  it("reads a number on the 0.25rem scale", () => {
    expect(resolveGap(4)).toBe("1rem")
  })

  it("passes an unknown string through as a CSS length", () => {
    expect(resolveGap("12px")).toBe("12px")
  })
})

describe("resolveSpan", () => {
  it("resolves fractions against the column count", () => {
    expect(resolveSpan("1/2", 12)).toBe(6)
    expect(resolveSpan("1/3", 12)).toBe(4)
    expect(resolveSpan("2/3", 12)).toBe(8)
  })

  it("resolves percentages the same way", () => {
    expect(resolveSpan("25%", 12)).toBe(3)
    expect(resolveSpan("20%", 10)).toBe(2)
  })

  it("clamps a span wider than the grid to full width", () => {
    expect(resolveSpan(6, 1)).toBe("full")
    expect(resolveSpan(12, 12)).toBe("full")
  })

  it("keeps a span narrower than the grid", () => {
    expect(resolveSpan(6, 12)).toBe(6)
  })

  it("falls back to one track when a relative span has no count to work with", () => {
    expect(resolveSpan("1/2", undefined)).toBe("auto")
    expect(resolveSpan("50%", undefined)).toBe("auto")
  })

  it("passes keywords through", () => {
    expect(resolveSpan("full", 12)).toBe("full")
    expect(resolveSpan("auto", 12)).toBe("auto")
  })
})

describe("toGridColumn", () => {
  it("spans without pinning a start", () => {
    expect(toGridColumn(6, undefined)).toBe("span 6")
  })

  it("pins a start when given one", () => {
    expect(toGridColumn(6, 3)).toBe("3 / span 6")
  })

  it("runs full width edge to edge", () => {
    expect(toGridColumn("full", undefined)).toBe("1 / -1")
    expect(toGridColumn("full", 2)).toBe("2 / -1")
  })
})

describe("resolvePlacementColumn", () => {
  it("keeps a pin that fits", () => {
    expect(resolvePlacementColumn(6, 7, 12)).toBe("7 / span 6")
  })

  it("snaps a pin past the last column back onto the grid", () => {
    // Otherwise CSS invents implicit columns and every other cell's
    // proportions shift — the grid silently grows past its declared width.
    expect(resolvePlacementColumn(6, 7, 1)).toBe("1 / -1")
  })

  it("runs a pinned cell to the edge instead of overrunning it", () => {
    expect(resolvePlacementColumn(6, 10, 12)).toBe("10 / -1")
  })

  it("leaves a pin alone when the column count is unknowable", () => {
    expect(resolvePlacementColumn(6, 7, undefined)).toBe("7 / span 6")
  })
})

describe("resolveGridLayout", () => {
  it("emits one template variable per declared breakpoint", () => {
    const { style, columnCounts } = resolveGridLayout({
      columns: { base: 1, md: 12 },
    })
    expect(style["--sui-tpl-base"]).toBe("repeat(1, minmax(0, 1fr))")
    expect(style["--sui-tpl-md"]).toBe("repeat(12, minmax(0, 1fr))")
    expect(columnCounts).toEqual({ base: 1, md: 12 })
  })

  it("skips a breakpoint that repeats the previous template", () => {
    const { style } = resolveGridLayout({ columns: { base: 4, md: 4, lg: 8 } })
    expect(style["--sui-tpl-base"]).toBe("repeat(4, minmax(0, 1fr))")
    expect(style).not.toHaveProperty("--sui-tpl-md")
    expect(style["--sui-tpl-lg"]).toBe("repeat(8, minmax(0, 1fr))")
  })

  it("splits gap across both axes and lets a per-axis gap win", () => {
    const { style } = resolveGridLayout({ gap: "md", rowGap: "lg" })
    expect(style["--sui-gx-base"]).toBe("1rem")
    expect(style["--sui-gy-base"]).toBe("1.5rem")
  })

  it("defaults the column count to 1 so spans still clamp", () => {
    expect(resolveGridLayout({}).columnCounts).toEqual({ base: 1 })
  })

  it("carries dense packing and alignment", () => {
    const { style } = resolveGridLayout({ dense: true, align: "start" })
    expect(style["--sui-flow"]).toBe("row dense")
    expect(style["--sui-align"]).toBe("start")
  })
})

describe("resolveCellStyle", () => {
  it("emits nothing when a cell declares no placement", () => {
    expect(resolveCellStyle({}, { base: 12 })).toEqual({})
  })

  it("re-clamps a fixed span when the grid's column count changes", () => {
    // The field only ever says `span: 6`; the collapse to full width below
    // 48rem comes from the grid, not from a second declaration.
    const style = resolveCellStyle({ span: 6 }, { base: 1, md: 12 })
    expect(style["--sui-col-base"]).toBe("1 / -1")
    expect(style["--sui-col-md"]).toBe("span 6")
  })

  it("re-resolves a fraction at each of the grid's breakpoints", () => {
    const style = resolveCellStyle({ span: "1/2" }, { base: 1, md: 12, lg: 16 })
    expect(style["--sui-col-base"]).toBe("1 / -1")
    expect(style["--sui-col-md"]).toBe("span 6")
    expect(style["--sui-col-lg"]).toBe("span 8")
  })

  it("honors the cell's own breakpoints over the grid's", () => {
    const style = resolveCellStyle(
      { span: { base: "full", lg: 3 } },
      { base: 12 }
    )
    expect(style["--sui-col-base"]).toBe("1 / -1")
    expect(style["--sui-col-lg"]).toBe("span 3")
  })

  it("collapses repeated values so only real changes reach the DOM", () => {
    const style = resolveCellStyle({ span: "full" }, { base: 1, md: 12 })
    expect(style["--sui-col-base"]).toBe("1 / -1")
    expect(style).not.toHaveProperty("--sui-col-md")
  })

  it("reads newRow as a start-of-row pin", () => {
    const style = resolveCellStyle({ newRow: true, span: 4 }, { base: 12 })
    expect(style["--sui-col-base"]).toBe("1 / span 4")
  })

  it("lets an explicit colStart win over newRow", () => {
    const style = resolveCellStyle(
      { newRow: true, colStart: 5, span: 4 },
      { base: 12 }
    )
    expect(style["--sui-col-base"]).toBe("5 / span 4")
  })

  it("collapses a pinned cell when the container drops to one column", () => {
    const style = resolveCellStyle(
      { colStart: 7, span: 6 },
      { base: 1, md: 12 }
    )
    expect(style["--sui-col-base"]).toBe("1 / -1")
    expect(style["--sui-col-md"]).toBe("7 / span 6")
  })

  it("emits row spans and order independently of the column count", () => {
    const style = resolveCellStyle({ rowSpan: 2, order: -1 }, { base: 12 })
    expect(style["--sui-row-base"]).toBe("span 2")
    expect(style["--sui-ord-base"]).toBe("-1")
  })
})

describe("resolveLayoutPreset", () => {
  it("returns the overrides untouched with no preset", () => {
    expect(resolveLayoutPreset(undefined, { columns: 3 })).toEqual({
      columns: 3,
    })
  })

  it("keeps preset values that the overrides do not mention", () => {
    expect(resolveLayoutPreset("twelve", { gap: "lg" })).toEqual({
      columns: { base: 1, md: 12 },
      gap: "lg",
    })
  })

  it("lets an explicit override replace a preset value", () => {
    expect(resolveLayoutPreset("twelve", { columns: 16 }).columns).toBe(16)
  })

  it("ignores undefined overrides so an unset prop never blanks a preset", () => {
    expect(
      resolveLayoutPreset("twelve", { columns: undefined, gap: undefined })
    ).toEqual({ columns: { base: 1, md: 12 } })
  })
})
