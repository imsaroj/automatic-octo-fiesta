import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { RefObject } from "react"
import type { GridApi, RowSelectedEvent } from "ag-grid-community"
import { useServerGridSelection } from "@/data-grid/use-server-grid-selection"

interface Row {
  id: number
  name: string
}

interface FakeNode {
  id: string
  data: Row
  selected: boolean
  isSelected: () => boolean
  setSelected: (value: boolean) => void
}

function makeNode(row: Row): FakeNode {
  const node: FakeNode = {
    id: String(row.id),
    data: row,
    selected: false,
    isSelected: () => node.selected,
    setSelected: (value: boolean) => {
      node.selected = value
    },
  }
  return node
}

/** A mutable AG Grid API stub exposing only what the selection hook touches. */
function fakeApi(nodesRef: { current: FakeNode[] }): GridApi<Row> {
  return {
    forEachNode: (cb: (node: FakeNode) => void) =>
      nodesRef.current.forEach((n) => cb(n)),
    deselectAll: () => nodesRef.current.forEach((n) => (n.selected = false)),
  } as unknown as GridApi<Row>
}

const rowSelected = (node: FakeNode): RowSelectedEvent<Row> =>
  ({ node }) as unknown as RowSelectedEvent<Row>

describe("useServerGridSelection", () => {
  it("tracks user selections and emits loaded rows + all ids", () => {
    const node1 = makeNode({ id: 1, name: "Ada" })
    const nodesRef = { current: [node1, makeNode({ id: 2, name: "Grace" })] }
    const apiRef: RefObject<GridApi<Row> | null> = {
      current: fakeApi(nodesRef),
    }
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useServerGridSelection(apiRef, onSelectionChange)
    )

    act(() => {
      node1.setSelected(true)
      result.current.handleRowSelected(rowSelected(node1))
    })

    expect(result.current.selectedCount).toBe(1)
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      ids: ["1"],
      rows: [node1.data],
    })
  })

  it("keeps the id set as the source of truth across block reloads", () => {
    const r1 = { id: 1, name: "Ada" }
    let nodesRef = {
      current: [makeNode(r1), makeNode({ id: 2, name: "Grace" })],
    }
    // Mutable on purpose — we swap the api as "blocks" reload below.
    const apiRef: { current: GridApi<Row> | null } = {
      current: fakeApi(nodesRef),
    }
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useServerGridSelection(apiRef, onSelectionChange)
    )

    // user selects row 1 on "page 1"
    act(() => {
      nodesRef.current[0].setSelected(true)
      result.current.handleRowSelected(rowSelected(nodesRef.current[0]))
    })
    expect(result.current.getSelectedIds()).toEqual(["1"])

    // page 2 loads (row 1 is no longer in the cache)
    act(() => {
      nodesRef.current = [
        makeNode({ id: 3, name: "Linus" }),
        makeNode({ id: 4, name: "Bjarne" }),
      ]
      apiRef.current = fakeApi(nodesRef)
      result.current.reapplySelection()
    })
    // id survives; no loaded row matches it yet
    expect(result.current.getSelectedIds()).toEqual(["1"])
    expect(result.current.collectLoadedSelectedRows()).toEqual([])

    // back to page 1 — the freshly-loaded row 1 is re-selected from the id set
    act(() => {
      nodesRef = { current: [makeNode(r1)] }
      apiRef.current = fakeApi(nodesRef)
      result.current.reapplySelection()
    })
    expect(nodesRef.current[0].isSelected()).toBe(true)
    expect(result.current.collectLoadedSelectedRows()).toEqual([r1])
  })

  it("removes an id when a row is deselected", () => {
    const node1 = makeNode({ id: 1, name: "Ada" })
    const nodesRef = { current: [node1] }
    const apiRef: RefObject<GridApi<Row> | null> = {
      current: fakeApi(nodesRef),
    }
    const { result } = renderHook(() => useServerGridSelection(apiRef))

    act(() => {
      node1.setSelected(true)
      result.current.handleRowSelected(rowSelected(node1))
    })
    expect(result.current.getSelectedIds()).toEqual(["1"])

    act(() => {
      node1.setSelected(false)
      result.current.handleRowSelected(rowSelected(node1))
    })
    expect(result.current.getSelectedIds()).toEqual([])
    expect(result.current.selectedCount).toBe(0)
  })

  it("clearSelection deselects every node and empties the id set", () => {
    const node1 = makeNode({ id: 1, name: "Ada" })
    const node2 = makeNode({ id: 2, name: "Grace" })
    const nodesRef = { current: [node1, node2] }
    const apiRef: RefObject<GridApi<Row> | null> = {
      current: fakeApi(nodesRef),
    }
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useServerGridSelection(apiRef, onSelectionChange)
    )

    act(() => {
      node1.setSelected(true)
      result.current.handleRowSelected(rowSelected(node1))
      node2.setSelected(true)
      result.current.handleRowSelected(rowSelected(node2))
    })
    expect(result.current.selectedCount).toBe(2)

    act(() => result.current.clearSelection())

    expect(result.current.getSelectedIds()).toEqual([])
    expect(result.current.selectedCount).toBe(0)
    expect(node1.isSelected()).toBe(false)
    expect(node2.isSelected()).toBe(false)
  })

  it("ignores the re-entrant onRowSelected fired while reapplying (no duplicate emit)", () => {
    const r1 = { id: 1, name: "Ada" }
    const original = makeNode(r1)
    const nodesRef = { current: [original] }
    const apiRef: RefObject<GridApi<Row> | null> = {
      current: fakeApi(nodesRef),
    }
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useServerGridSelection(apiRef, onSelectionChange)
    )

    act(() => {
      original.setSelected(true)
      result.current.handleRowSelected(rowSelected(original))
    })
    expect(onSelectionChange).toHaveBeenCalledTimes(1)

    // A fresh node whose setSelected re-fires onRowSelected, like real AG Grid.
    const fresh = makeNode(r1)
    fresh.setSelected = (value: boolean) => {
      fresh.selected = value
      result.current.handleRowSelected(rowSelected(fresh))
    }
    nodesRef.current = [fresh]

    act(() => result.current.reapplySelection())

    // reapply re-selected the node, but the guarded re-entrant call did not emit.
    expect(fresh.isSelected()).toBe(true)
    expect(onSelectionChange).toHaveBeenCalledTimes(1)
  })
})
