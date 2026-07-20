import { afterEach, describe, expect, it, vi } from "vitest"
import type { GridApi } from "ag-grid-community"
import {
  collectGridExport,
  debounce,
  errorMessage,
  mergeServerFilters,
  readPersistedGridState,
  resolveExternalFilters,
  writePersistedGridState,
} from "@/data-grid/server-grid-internals"
import type { ServerFilter } from "@/data-grid/pagination"

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("errorMessage", () => {
  it("reads a string `message` from an error-like object", () => {
    expect(errorMessage({ message: "Boom" })).toBe("Boom")
    expect(errorMessage(new Error("Network down"))).toBe("Network down")
  })

  it("falls back when there is no usable message", () => {
    expect(errorMessage(null)).toBe("Failed to load data.")
    expect(errorMessage(42)).toBe("Failed to load data.")
    expect(errorMessage({ message: 123 })).toBe("Failed to load data.")
  })
})

describe("mergeServerFilters", () => {
  const base: ServerFilter[] = [
    { field: "a", filterType: "text", type: "contains", value: "x" },
  ]
  const external: ServerFilter[] = [
    { field: "b", filterType: "text", type: "equals", value: "y" },
  ]

  it("appends external filters after the base filters", () => {
    expect(mergeServerFilters(base, external)).toEqual([...base, ...external])
  })

  it("returns the base array unchanged when there is nothing external", () => {
    expect(mergeServerFilters(base, undefined)).toBe(base)
    expect(mergeServerFilters(base, [])).toBe(base)
  })
})

describe("resolveExternalFilters", () => {
  const filters: ServerFilter[] = [
    { field: "a", filterType: "text", type: "contains", value: "x" },
  ]

  it("normalizes a query object into ServerFilters", () => {
    expect(resolveExternalFilters(undefined, { name: "ada" })).toEqual([
      { field: "name", filterType: "text", type: "equals", value: "ada" },
    ])
  })

  it("appends query filters after the filters prop", () => {
    expect(resolveExternalFilters(filters, { name: "ada" })).toEqual([
      ...filters,
      { field: "name", filterType: "text", type: "equals", value: "ada" },
    ])
  })

  it("keeps the filters identity when the query contributes nothing", () => {
    expect(resolveExternalFilters(filters, undefined)).toBe(filters)
    expect(resolveExternalFilters(filters, {})).toBe(filters)
    expect(resolveExternalFilters(filters, { name: "" })).toBe(filters)
    expect(resolveExternalFilters(undefined, {})).toBeUndefined()
  })
})

describe("persisted grid state", () => {
  it("round-trips column + filter state through localStorage", () => {
    writePersistedGridState("grid-1", {
      columnState: [{ colId: "name", width: 200 }],
      filterModel: { name: { type: "contains", filter: "ada" } },
    })
    const parsed = readPersistedGridState("grid-1")
    expect(parsed?.columnState).toEqual([{ colId: "name", width: 200 }])
    expect(parsed?.filterModel).toEqual({
      name: { type: "contains", filter: "ada" },
    })
  })

  it("returns null for a missing or corrupt entry", () => {
    expect(readPersistedGridState("missing")).toBeNull()
    localStorage.setItem("corrupt", "{not valid json")
    expect(readPersistedGridState("corrupt")).toBeNull()
  })

  it("never throws when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded")
    })
    expect(() =>
      writePersistedGridState("k", { columnState: [] })
    ).not.toThrow()
  })
})

describe("debounce", () => {
  it("invokes the function once, with the latest args, after the delay", () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced("a")
    debounced("b")
    debounced("c")
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith("c")
    vi.useRealTimers()
  })
})

interface Row {
  id: number
  name: string
  mrr: number
}

/** A minimal AG Grid API stub exposing just what `collectGridExport` reads. */
const fakeExportApi = (rows: Row[]): GridApi<Row> => {
  const columns = [
    // AG Grid's internal checkbox column (present when selection is on) must
    // never reach the export.
    { colId: "ag-Grid-SelectionColumn", colDef: {} as { headerName?: string } },
    { colId: "name", colDef: { headerName: "Name" } },
    { colId: "mrr", colDef: {} as { headerName?: string } }, // no headerName → falls back to colId
  ]
  const displayed = columns.map((c) => ({
    getColDef: () => c.colDef,
    getColId: () => c.colId,
  }))
  return {
    getAllDisplayedColumns: () => displayed,
    forEachNode: (
      cb: (node: { data: Row | undefined; id: string }) => void
    ) => {
      rows.forEach((row) => cb({ data: row, id: String(row.id) }))
      cb({ data: undefined, id: "ghost" }) // a node with no data is skipped
    },
    getCellValue: ({
      rowNode,
      colKey,
    }: {
      rowNode: { data: Row }
      colKey: { getColId: () => string }
    }) => rowNode.data[colKey.getColId() as "name" | "mrr"],
  } as unknown as GridApi<Row>
}

describe("collectGridExport", () => {
  it("builds headers from displayed columns (headerName, else colId)", () => {
    const table = collectGridExport(
      fakeExportApi([{ id: 1, name: "Ada", mrr: 2500 }])
    )
    expect(table.headers).toEqual(["Name", "mrr"])
  })

  it("builds one row per loaded node, skipping nodes without data", () => {
    const table = collectGridExport(
      fakeExportApi([
        { id: 1, name: "Ada", mrr: 2500 },
        { id: 2, name: "Grace", mrr: 4200 },
      ])
    )
    expect(table.rows).toEqual([
      ["Ada", 2500],
      ["Grace", 4200],
    ])
  })

  it("coerces nullish cell values to an empty string", () => {
    const table = collectGridExport(
      fakeExportApi([{ id: 1, name: "", mrr: 0 }])
    )
    // empty string stays "", numeric 0 stays 0 (only null/undefined become "")
    expect(table.rows).toEqual([["", 0]])
  })
})
