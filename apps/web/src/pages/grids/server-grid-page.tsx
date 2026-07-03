import { useCallback, useMemo, useRef, useState } from "react"
import { Bug, ListChecks, RotateCw, Search } from "lucide-react"
import { SmartButton } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge } from "@workspace/ui/smart-components/smart-badge"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartToolbar,
  SmartPageSearch,
  SmartGridArea,
  SmartPageStatusBar,
  SmartPageFooter,
} from "@workspace/ui/smart-components/page"
import { SmartSearchInput } from "@workspace/ui/smart-components/search-input"
import {
  SmartServerGrid,
  type DataGridColumn,
  type SmartServerGridHandle,
  type ServerFetchParams,
  type ServerFetchResult,
  type ServerFilter,
} from "@workspace/ui/data-grid"
import { formatCurrency } from "@workspace/ui/lib/format"
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

function StatusCell({ value }: { value?: UserRow["status"] }) {
  if (!value) return null
  return <SmartBadge variant={statusVariant[value]}>{value}</SmartBadge>
}

/* ------------------------------- search form ------------------------------ */

interface UserSearch {
  name: string
  role: string
  status: string
}

const EMPTY_SEARCH: UserSearch = { name: "", role: "", status: "" }

const ROLES = [
  "Admin",
  "Manager",
  "Developer",
  "Designer",
  "QA Engineer",
  "Support",
]
const STATUSES: UserRow["status"][] = ["Active", "Pending", "Inactive"]

function toFilters(values: UserSearch): ServerFilter[] {
  const filters: ServerFilter[] = []
  const name = values.name.trim()
  if (name)
    filters.push({
      field: "name",
      filterType: "text",
      type: "contains",
      value: name,
    })
  if (values.role)
    filters.push({
      field: "role",
      filterType: "text",
      type: "equals",
      value: values.role,
    })
  if (values.status)
    filters.push({
      field: "status",
      filterType: "text",
      type: "equals",
      value: values.status,
    })
  return filters
}

/* ---------------------------------- page ---------------------------------- */

export default function ServerGridPage() {
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

  // Search applies the form values; a fresh array identity tells the grid to
  // reset to page 1 and refetch (see SmartServerGrid's `filters` prop).
  const handleSearch = useCallback(() => {
    setAppliedFilters(toFilters(search))
  }, [search])

  const handleReset = useCallback(() => {
    setSearch(EMPTY_SEARCH)
    setAppliedFilters([])
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
    <SmartPage>
      <SmartPageHeader>
        <div className="flex items-start justify-between">
          <div>
            <SmartPageTitle>Server Driven Grid</SmartPageTitle>
            <SmartPageDescription>
              AG Grid Community + MSW: a dedicated search form, server-side
              sorting & pagination, infinite-scroll mode, Excel export, and
              cross-page selection.
            </SmartPageDescription>
          </div>
        </div>
      </SmartPageHeader>

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

      <SmartPageSearch className="flex-wrap items-end py-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Name
          </span>
          <SmartSearchInput
            value={search.name}
            onValueChange={(v) => setSearch((s) => ({ ...s, name: v }))}
            placeholder="Search name…"
            className="h-8 w-48"
            aria-label="Name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-role"
            className="text-xs font-medium text-muted-foreground"
          >
            Role
          </label>
          <select
            id="filter-role"
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={search.role}
            onChange={(e) => setSearch((s) => ({ ...s, role: e.target.value }))}
          >
            <option value="">Any role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-status"
            className="text-xs font-medium text-muted-foreground"
          >
            Status
          </label>
          <select
            id="filter-status"
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={search.status}
            onChange={(e) =>
              setSearch((s) => ({ ...s, status: e.target.value }))
            }
          >
            <option value="">Any status</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
        <SmartPageActions>
          <SmartButton variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </SmartButton>
          <SmartButton size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" /> Search
          </SmartButton>
        </SmartPageActions>
      </SmartPageSearch>

      <SmartGridArea>
        <SmartServerGrid
          ref={gridRef}
          fill
          columns={columns}
          fetchRows={fetchRows}
          getRowId={(row) => String(row.id)}
          filters={appliedFilters}
          columnFilters={false}
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
