import { afterEach, expect, test } from "vitest"
import type { ReactElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import type { ICellRendererParams } from "ag-grid-community"

import {
  ActionPermissionProvider,
  type ActionPermissionChecker,
} from "@iamsaroj/smart-ui/smart-components/buttons"
import {
  buildActionColumnDef,
  GridActionCell,
  type GridActionCellParams,
  type GridActionColumnStore,
} from "./action-column-cell"
import { ACTION_COLUMN_ID, type GridActionColumnOptions } from "./action-column"

/**
 * Rendering contracts of the action cell: which buttons show for a row, how
 * per-row disabled/loading resolve, and that `confirm` gates `onClick` behind
 * the dialog. `buildActionColumnDef`'s utility-column lockdown is asserted at
 * the bottom.
 */

interface Row {
  id: number
  locked: boolean
}

const row: Row = { id: 1, locked: false }

let container: HTMLDivElement
let root: Root
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.innerHTML = ""
})

/** Static store — enough for render tests; the live store is exercised via `useGridActionColumn`. */
const staticStore = (
  options: GridActionColumnOptions<Row>
): GridActionColumnStore<Row> => ({
  getOptions: () => options,
  getVersion: () => 0,
  subscribe: () => () => {},
})

const cellElement = (
  options: GridActionColumnOptions<Row>,
  data: Row | null
): ReactElement => {
  const params = {
    data: data ?? undefined,
    actionColumnStore: staticStore(options),
  } as ICellRendererParams<Row> & GridActionCellParams<Row>
  return <GridActionCell<Row> {...params} />
}

const mountCell = (
  options: GridActionColumnOptions<Row>,
  data: Row | null = row // null = placeholder row (no data loaded yet)
) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(cellElement(options, data)))
}

const mountCellWithPermission = (
  can: ActionPermissionChecker,
  options: GridActionColumnOptions<Row>,
  data: Row | null = row
) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root.render(
      <ActionPermissionProvider can={can}>
        {cellElement(options, data)}
      </ActionPermissionProvider>
    )
  )
}

const buttonByLabel = (label: string): HTMLButtonElement | null =>
  container.querySelector(`button[aria-label="${label}"]`)

test("renders edit + delete with default aria-labels and fires onClick with the row", () => {
  const clicks: Array<[string, Row]> = []
  mountCell({
    actions: {
      edit: { onClick: (r) => clicks.push(["edit", r]) },
      delete: { onClick: (r) => clicks.push(["delete", r]) },
    },
  })

  const edit = buttonByLabel("Edit row")
  const remove = buttonByLabel("Delete row")
  expect(edit).not.toBeNull()
  expect(remove).not.toBeNull()

  act(() => edit?.click())
  act(() => remove?.click())
  expect(clicks).toEqual([
    ["edit", row],
    ["delete", row],
  ])
})

test("per-row visible hides only the matching button", () => {
  mountCell({
    actions: {
      edit: { visible: (r) => !r.locked },
      delete: { visible: (r) => r.locked },
    },
  })

  expect(buttonByLabel("Edit row")).not.toBeNull()
  expect(buttonByLabel("Delete row")).toBeNull()
})

test("per-row disabled and loading disable the button; loading swallows clicks", () => {
  let fired = 0
  mountCell({
    actions: {
      edit: { disabled: (r) => !r.locked },
      delete: { loading: () => true, onClick: () => (fired += 1) },
    },
  })

  expect(buttonByLabel("Edit row")?.disabled).toBe(true)
  const remove = buttonByLabel("Delete row")
  expect(remove?.disabled).toBe(true)
  act(() => remove?.click())
  expect(fired).toBe(0)
})

test("loading delete leaves edit enabled", () => {
  mountCell({
    actions: {
      edit: true,
      delete: { loading: true },
    },
  })

  expect(buttonByLabel("Edit row")?.disabled).toBe(false)
  expect(buttonByLabel("Delete row")?.disabled).toBe(true)
})

test("confirm gates onClick behind the dialog", async () => {
  let fired = 0
  mountCell({
    actions: {
      delete: { confirm: true, onClick: () => (fired += 1) },
    },
  })

  act(() => buttonByLabel("Delete row")?.click())
  // The confirm dialog opens one macrotask later (the outside-press race fix
  // in internal/use-deferred-open.ts) — flush that tick before asserting.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  // Click opened the dialog instead of firing the action.
  expect(fired).toBe(0)
  expect(document.body.textContent).toContain("Delete this row?")

  // The dialog's destructive confirm button carries the action label.
  const confirmButton = Array.from(
    document.body.querySelectorAll("button")
  ).find((btn) => btn.textContent === "Delete")
  expect(confirmButton).toBeDefined()
  act(() => confirmButton?.click())
  expect(fired).toBe(1)
})

test("renders nothing for placeholder rows (infinite model) ", () => {
  mountCell({ actions: { edit: true, delete: true } }, null)
  expect(container.querySelector("button")).toBeNull()
})

test("consults the permission provider by default for actions without explicit visible", () => {
  // can("edit") allowed, can("delete") denied → only Edit renders.
  mountCellWithPermission((action) => action !== "delete", {
    actions: { edit: true, delete: true },
  })

  expect(buttonByLabel("Edit row")).not.toBeNull()
  expect(buttonByLabel("Delete row")).toBeNull()
})

test("passes the row as the permission context", () => {
  const seen: Array<[string | number, unknown]> = []
  mountCellWithPermission(
    (action, context) => {
      seen.push([action, context])
      return true
    },
    { actions: { edit: true } }
  )

  expect(seen).toContainEqual(["edit", row])
})

test("explicit visible wins over the permission provider", () => {
  // Provider denies delete, but an explicit `visible: true` overrides it.
  mountCellWithPermission((action) => action !== "delete", {
    actions: { delete: { visible: true } },
  })

  expect(buttonByLabel("Delete row")).not.toBeNull()
})

test("renders custom actions after edit/delete with their config label + confirm", async () => {
  let duplicated: Row | null = null
  mountCell({
    actions: {
      edit: true,
      custom: [
        {
          action: "duplicate",
          confirm: true, // default copy derived from the "Duplicate" label
          onClick: (r) => (duplicated = r),
        },
      ],
    },
  })

  // Edit still renders; the custom action uses its ACTION_BUTTON_CONFIG label.
  expect(buttonByLabel("Edit row")).not.toBeNull()
  const dup = buttonByLabel("Duplicate")
  expect(dup).not.toBeNull()

  act(() => dup?.click())
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  // Confirm gated it; default title derives from the label.
  expect(duplicated).toBeNull()
  expect(document.body.textContent).toContain("Duplicate this row?")
})

test("custom action consults the permission provider by its action kind", () => {
  mountCellWithPermission((action) => action === "view", {
    actions: {
      custom: [
        { action: "view", onClick: () => {} },
        { action: "restore", onClick: () => {} },
      ],
    },
  })

  expect(buttonByLabel("View")).not.toBeNull()
  expect(buttonByLabel("Restore")).toBeNull()
})

test("permissionAware: false opts a grid out of an ambient provider", () => {
  // Provider would deny both, but the column ignores it entirely.
  const denyAll: ActionPermissionChecker = () => false
  mountCellWithPermission(denyAll, {
    permissionAware: false,
    actions: { edit: true, delete: true },
  })

  expect(buttonByLabel("Edit row")).not.toBeNull()
  expect(buttonByLabel("Delete row")).not.toBeNull()
})

test("buildActionColumnDef locks the column down as a utility column", () => {
  const options: GridActionColumnOptions<Row> = {
    actions: { edit: true, delete: true },
  }
  const def = buildActionColumnDef(options, staticStore(options))

  expect(def.colId).toBe(ACTION_COLUMN_ID)
  expect(def.pinned).toBe("left") // default pin
  expect(def.sortable).toBe(false)
  expect(def.filter).toBe(false)
  expect(def.editable).toBe(false)
  expect(def.resizable).toBe(false)
  expect(def.suppressMovable).toBe(true)
  expect(def.suppressHeaderMenuButton).toBe(true)
  expect(def.lockPinned).toBe(true)
  expect(def.flex).toBe(0)
  expect(def.width).toBeGreaterThanOrEqual(80)
  expect(def.width).toBeLessThanOrEqual(120)
  expect(def.minWidth).toBe(def.width)
  expect(def.maxWidth).toBe(def.width)
  // Not exported unless opted in.
  expect(def.context).toEqual({ suppressExport: true })
  expect(
    buildActionColumnDef({ ...options, exportable: true }, staticStore(options))
      .context
  ).toEqual({ suppressExport: false })
})

test("buildActionColumnDef honors pinned right / unpinned and explicit width", () => {
  const options: GridActionColumnOptions<Row> = {
    pinned: "right",
    width: 140,
    actions: { edit: true },
  }
  const def = buildActionColumnDef(options, staticStore(options))
  expect(def.pinned).toBe("right")
  expect(def.lockPosition).toBe("right")
  expect(def.width).toBe(140)

  const unpinned = buildActionColumnDef(
    { pinned: false, actions: { edit: true } },
    staticStore(options)
  )
  // Explicit null (not undefined): pinned is stateful in AG Grid — undefined
  // on a columnDefs update means "keep current", which would never unpin.
  expect(unpinned.pinned).toBeNull()
  expect(unpinned.lockPosition).toBeUndefined()
})
