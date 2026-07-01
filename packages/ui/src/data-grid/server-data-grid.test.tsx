import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { SmartServerGrid } from "@/data-grid/server-data-grid"
import type { DataGridColumn } from "@/data-grid/grid-internals"
import type { ServerFetchResult } from "@/data-grid/pagination"

interface Row {
  id: number
  name: string
}

const columns: DataGridColumn<Row>[] = [
  { field: "id", headerName: "ID" },
  { field: "name", headerName: "Name" },
]

const fetchRows = (): Promise<ServerFetchResult<Row>> =>
  Promise.resolve({ rows: [{ id: 1, name: "Ada" }], total: 1 })

const getRowId = (row: Row): string => String(row.id)

describe("SmartServerGrid", () => {
  it("renders the title and default toolbar controls", () => {
    render(
      <SmartServerGrid
        title="Users"
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
      />
    )

    expect(screen.getByText("Users")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /columns/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
  })

  it("hides toolbar controls when their features are disabled", () => {
    render(
      <SmartServerGrid
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
        refreshable={false}
        columnSelector={false}
        exportExcel={false}
      />
    )

    expect(
      screen.queryByRole("button", { name: /refresh/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /columns/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /export/i })
    ).not.toBeInTheDocument()
  })

  it("mounts with selection, persistence and infinite mode without crashing", () => {
    render(
      <SmartServerGrid
        title="Members"
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
        selection="multiple"
        persistStateKey="test-server-grid"
        pagination={false}
      />
    )

    expect(screen.getByText("Members")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument()
  })

  it("mounts with external filters, fill layout and a double-click handler", () => {
    render(
      <SmartServerGrid
        title="Members"
        columns={columns}
        fetchRows={fetchRows}
        getRowId={getRowId}
        filters={[
          { field: "name", filterType: "text", type: "contains", value: "ada" },
        ]}
        columnFilters={false}
        fill
        onRowDoubleClick={() => {}}
      />
    )

    expect(screen.getByText("Members")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
  })
})
