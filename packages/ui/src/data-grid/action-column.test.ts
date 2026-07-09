import { expect, test } from "vitest"

import {
  actionColumnSignature,
  isActionColumnEnabled,
  isExportSuppressed,
  normalizeRowAction,
  resolveActionAriaLabel,
  resolveActionColumnWidth,
  resolveActionTooltip,
  resolveActiveActions,
  resolveConfirmOptions,
  resolveRowValue,
  type GridActionColumnOptions,
} from "./action-column"

/**
 * The action column's behavior contracts (auto-hide, per-row resolution,
 * confirm defaults, structural memo signature, export opt-out) are pure — lock
 * them in here; the rendering path is covered in `action-column-cell.test.tsx`.
 */

interface Row {
  id: number
  locked: boolean
}

/* ------------------------------ normalization ------------------------------ */

test("normalizeRowAction: false / enabled:false / visible:false are statically off", () => {
  expect(normalizeRowAction<Row>(undefined)).toBeNull()
  expect(normalizeRowAction<Row>(false)).toBeNull()
  expect(normalizeRowAction<Row>({ enabled: false })).toBeNull()
  expect(normalizeRowAction<Row>({ visible: false })).toBeNull()
})

test("normalizeRowAction: true, configs and per-row visible functions stay active", () => {
  expect(normalizeRowAction<Row>(true)).toEqual({})
  const config = { onClick: () => {} }
  expect(normalizeRowAction<Row>(config)).toBe(config)
  const perRow = { visible: (row: Row) => !row.locked }
  expect(normalizeRowAction<Row>(perRow)).toBe(perRow)
})

/* -------------------------------- auto-hide -------------------------------- */

test("column auto-hides when disabled or when every action is statically hidden", () => {
  expect(isActionColumnEnabled<Row>(undefined)).toBe(false)
  expect(isActionColumnEnabled<Row>({ actions: {} })).toBe(false)
  expect(
    isActionColumnEnabled<Row>({ actions: { edit: false, delete: false } })
  ).toBe(false)
  expect(
    isActionColumnEnabled<Row>({
      enabled: false,
      actions: { edit: true, delete: true },
    })
  ).toBe(false)
  expect(isActionColumnEnabled<Row>({ actions: { edit: true } })).toBe(true)
})

test("resolveActiveActions keeps display order edit → delete and drops hidden ones", () => {
  const both = resolveActiveActions<Row>({
    actions: { delete: true, edit: true },
  })
  expect(both.map((action) => action.kind)).toEqual(["edit", "delete"])

  const deleteOnly = resolveActiveActions<Row>({
    actions: { edit: { visible: false }, delete: true },
  })
  expect(deleteOnly.map((action) => action.kind)).toEqual(["delete"])
})

/* ------------------------------ row resolution ------------------------------ */

test("resolveRowValue: static, per-row function, and fallback", () => {
  const row: Row = { id: 1, locked: true }
  expect(resolveRowValue<Row, boolean>(undefined, row, true)).toBe(true)
  expect(resolveRowValue<Row, boolean>(false, row, true)).toBe(false)
  expect(resolveRowValue<Row, boolean>((r) => r.locked, row, false)).toBe(true)
})

/* ---------------------------- tooltip / aria-label -------------------------- */

test("tooltip defaults to 'Edit row' / 'Delete row', string overrides, false disables", () => {
  expect(resolveActionTooltip("edit", undefined)).toBe("Edit row")
  expect(resolveActionTooltip("delete", true)).toBe("Delete row")
  expect(resolveActionTooltip("delete", "Remove user")).toBe("Remove user")
  expect(resolveActionTooltip("edit", false)).toBe(false)
})

test("aria-label survives tooltip: false", () => {
  expect(resolveActionAriaLabel("delete", false)).toBe("Delete row")
  expect(resolveActionAriaLabel("delete", "Remove user")).toBe("Remove user")
})

/* --------------------------------- confirm --------------------------------- */

test("confirm: false → null, true → delete defaults, object merges over defaults", () => {
  expect(resolveConfirmOptions("delete", undefined)).toBeNull()
  expect(resolveConfirmOptions("delete", false)).toBeNull()

  const defaults = resolveConfirmOptions("delete", true)
  expect(defaults).toEqual({
    title: "Delete this row?",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  })

  const custom = resolveConfirmOptions("delete", { title: "Remove user?" })
  expect(custom?.title).toBe("Remove user?")
  expect(custom?.confirmLabel).toBe("Delete")
})

/* ---------------------------------- width ---------------------------------- */

test("width: explicit wins; icon-only auto-sizes clamped to 80–120", () => {
  expect(resolveActionColumnWidth(2, false, 150)).toBe(150)
  // 1 icon button would be < 80 → clamped up.
  expect(resolveActionColumnWidth(1, false)).toBe(80)
  // 2 icon buttons land inside the 80–120 band.
  const two = resolveActionColumnWidth(2, false)
  expect(two).toBeGreaterThanOrEqual(80)
  expect(two).toBeLessThanOrEqual(120)
  // Labeled buttons get more room but stay bounded.
  expect(resolveActionColumnWidth(2, true)).toBeGreaterThan(two)
  expect(resolveActionColumnWidth(2, true)).toBeLessThanOrEqual(200)
})

/* -------------------------------- signature -------------------------------- */

test("signature is stable across callback identity changes but tracks structure", () => {
  const options = (
    onClick: (row: Row) => void,
    pinned?: "left" | "right" | false
  ): GridActionColumnOptions<Row> => ({
    pinned,
    actions: { edit: { onClick }, delete: { onClick } },
  })

  // New inline callbacks (every parent render) must NOT change the signature…
  expect(actionColumnSignature(options(() => {}))).toBe(
    actionColumnSignature(options(() => {}))
  )
  // …but structural changes must.
  expect(actionColumnSignature(options(() => {}, "right"))).not.toBe(
    actionColumnSignature(options(() => {}, "left"))
  )
  expect(actionColumnSignature<Row>({ actions: { edit: true } })).not.toBe(
    actionColumnSignature<Row>({ actions: { delete: true } })
  )
  expect(actionColumnSignature<Row>(undefined)).toBe("off")
  expect(
    actionColumnSignature<Row>({ enabled: false, actions: { edit: true } })
  ).toBe("off")
})

/* ---------------------------------- export --------------------------------- */

test("isExportSuppressed only trips on the explicit context flag", () => {
  expect(isExportSuppressed({ suppressExport: true })).toBe(true)
  expect(isExportSuppressed({ suppressExport: false })).toBe(false)
  expect(isExportSuppressed(undefined)).toBe(false)
  expect(isExportSuppressed(null)).toBe(false)
  expect(isExportSuppressed("nope")).toBe(false)
})
