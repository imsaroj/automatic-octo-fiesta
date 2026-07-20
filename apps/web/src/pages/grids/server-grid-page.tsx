import { useCallback, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { Bug, ListChecks, RotateCw } from "lucide-react"
import { SmartButton } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartBadge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import {
  SmartPage,
  SmartToolbar,
  SmartPageSearch,
  SmartGridArea,
  SmartPageStatusBar,
  SmartPageFooter,
} from "@iamsaroj/smart-ui/smart-components/page"
import {
  SmartSearchForm,
  type SearchFieldDefinition,
} from "@iamsaroj/smart-ui/search"
import {
  SmartServerGrid,
  toServerFilters,
  type DataGridColumn,
  type SmartServerGridHandle,
  type ServerFetchParams,
  type ServerFetchResult,
  type ServerFilter,
} from "@iamsaroj/smart-ui/data-grid"
import { formatCurrency } from "@iamsaroj/smart-ui/lib/format"
import { fetchUsersPage, type UserRow } from "@/api/users"

/* --------------------------------- columns -------------------------------- */

const statusVariant: Record<
  UserRow["status"],
  "default" | "secondary" | "destructive"
> = {
  Active: "default",
  Pending: "secondary",
  Inactive: "destructive",
}

const StatusCell = ({ value }: { value?: UserRow["status"] }) => {
  if (!value) return null
  return <SmartBadge variant={statusVariant[value]}>{value}</SmartBadge>
}

/* ------------------------------- search form ------------------------------ */

const searchSchema = z.object({
  name: z.string().max(50).optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
})
type UserSearch = z.infer<typeof searchSchema>

const EMPTY_SEARCH: UserSearch = { name: "", email: "", role: "", status: "" }

const ROLES = [
  "Admin",
  "Manager",
  "Developer",
  "Designer",
  "QA Engineer",
  "Support",
]
const STATUSES: UserRow["status"][] = ["Active", "Pending", "Inactive"]

const searchFields: SearchFieldDefinition<UserSearch>[] = [
  { name: "name", label: "Name", type: "text", placeholder: "Search name…" },
  { name: "email", label: "Email", type: "text", placeholder: "Search email…" },
  {
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "Any role",
    options: ROLES.map((r) => ({ value: r, label: r })),
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Any status",
    options: STATUSES.map((s) => ({ value: s, label: s })),
  },
]

// The query is already pruned + trimmed by SmartSearchForm; `toServerFilters`
// infers an equals filter per key, with `contains` overrides for the free-text
// fields. (When every field is a plain equals match, skip this entirely and
// pass the query object straight to the grid's `query` prop.)
const toFilters = (query: Partial<UserSearch>): ServerFilter[] =>
  toServerFilters(query, {
    name: { type: "contains" },
    email: { type: "contains" },
  })

/* ---------------------------------- page ---------------------------------- */

const ServerGridPage = () => {
  const gridRef = useRef<SmartServerGridHandle<UserRow> | null>(null)
  const [selectedCount, setSelectedCount] = useState(0)
  const [search, setSearch] = useState<UserSearch>(EMPTY_SEARCH)
  const [appliedFilters, setAppliedFilters] = useState<ServerFilter[]>([])
  const [simulateError, setSimulateError] = useState(false)

  // Mirror into a ref so the stable `fetchRows` closure always reads the latest
  // value without being re-created.
  const simulateErrorRef = useRef(simulateError)
  // eslint-disable-next-line react-hooks/refs
  simulateErrorRef.current = simulateError

  const fetchRows = useCallback(
    (
      params: ServerFetchParams,
      signal: AbortSignal
    ): Promise<ServerFetchResult<UserRow>> =>
      fetchUsersPage(params, signal, {
        simulateError: simulateErrorRef.current,
      }),
    []
  )

  const columns = useMemo<DataGridColumn<UserRow>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 90 },
      { field: "name", headerName: "Name", minWidth: 170 },
      { field: "email", headerName: "Email", minWidth: 240 },
      { field: "role", headerName: "Role" },
      {
        field: "status",
        headerName: "Status",
        minWidth: 140,
        cellRenderer: StatusCell,
      },
      {
        field: "mrr",
        headerName: "MRR",
        type: "rightAligned",
        valueFormatter: (p) => formatCurrency(Number(p.value ?? 0)),
      },
    ],
    []
  )

  // Search applies the pruned query; a fresh array identity tells the grid to
  // reset to page 1 and refetch (see SmartServerGrid's `filters` prop).
  const handleSearch = useCallback((query: Partial<UserSearch>) => {
    setAppliedFilters(toFilters(query))
  }, [])

  const toggleError = () => {
    const next = !simulateError
    setSimulateError(next)
    simulateErrorRef.current = next
    gridRef.current?.reload()
  }

  const logSelected = () => {
    const ids = gridRef.current?.getSelectedIds() ?? []
    alert(ids.length ? `Selected IDs: ${ids.join(", ")}` : "No rows selected.")
  }

  return (
    <SmartPage
      title="Server Driven Grid"
      description="AG Grid Community + MSW: a dedicated search form, server-side sorting & pagination, infinite-scroll mode, Excel export, and cross-page selection."
    >
      <SmartToolbar>
        <SmartButton
          variant={simulateError ? "destructive" : "outline"}
          size="sm"
          onClick={toggleError}
        >
          <Bug className="h-4 w-4" />
          {simulateError ? "Erroring (click to fix)" : "Simulate error"}
        </SmartButton>
        <SmartButton variant="outline" size="sm" onClick={logSelected}>
          <ListChecks className="h-4 w-4" />
          Log selected
        </SmartButton>
        <span className="ml-auto" />
        <SmartButton
          variant="ghost"
          size="sm"
          onClick={() => gridRef.current?.reload()}
        >
          <RotateCw className="h-4 w-4" />
          Reload
        </SmartButton>
      </SmartToolbar>

      <SmartPageSearch className="block py-3">
        <SmartSearchForm<UserSearch>
          data={search}
          setData={setSearch}
          fields={searchFields}
          schema={searchSchema}
          columns={4}
          search
          reset
          showCount
          onSearch={handleSearch}
          onReset={() => setAppliedFilters([])}
        />
      </SmartPageSearch>

      <SmartGridArea>
        <SmartServerGrid
          ref={gridRef}
          fill
          columns={columns}
          fetchRows={fetchRows}
          getRowId={(row) => String(row.id)}
          filters={appliedFilters}
          pagination
          pageSize={20}
          selection="multiple"
          onSelectionChange={(sel) => setSelectedCount(sel.ids.length)}
          persistStateKey="smart-component-server-grid"
          exportFileName="users"
          emptyState={{
            title: "No users match",
            description: "Try a different search or click Reset.",
          }}
        />
      </SmartGridArea>

      <SmartPageStatusBar>
        <span className="text-xs text-muted-foreground">
          {selectedCount} row{selectedCount === 1 ? "" : "s"} selected (persists
          across pages)
        </span>
      </SmartPageStatusBar>

      <SmartPageFooter justify="end">
        <span className="text-xs text-muted-foreground">300 total users</span>
      </SmartPageFooter>
    </SmartPage>
  )
}

export default ServerGridPage
