import { useCallback, useMemo, useRef, useState } from "react"
import { Bug, ListChecks, RotateCw, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
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

/* --------------------------------- types ---------------------------------- */

type Status = "Active" | "Pending" | "Inactive"

interface UserRow {
  id: number
  name: string
  email: string
  role: string
  status: Status
  mrr: number
}

/* --------------------------------- data ----------------------------------- */

const FIRST = [
  "Ada",
  "Alan",
  "Grace",
  "Linus",
  "Edsger",
  "Barbara",
  "Ken",
  "Margaret",
  "Donald",
  "Katherine",
]
const LAST = [
  "Lovelace",
  "Turing",
  "Hopper",
  "Torvalds",
  "Dijkstra",
  "Liskov",
  "Thompson",
  "Hamilton",
  "Knuth",
  "Johnson",
]
const ROLES = [
  "Admin",
  "Manager",
  "Developer",
  "Designer",
  "QA Engineer",
  "Support",
]
const STATUSES: Status[] = ["Active", "Pending", "Inactive"]

const ALL_ROWS: UserRow[] = Array.from({ length: 300 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
  email:
    `${FIRST[i % FIRST.length]}.${LAST[(i * 3) % LAST.length]}`.toLowerCase() +
    "@example.com",
  role: ROLES[i % ROLES.length],
  status: STATUSES[i % STATUSES.length],
  mrr: 19 + ((i * 37) % 980),
}))

/* ----------------------------- mock fetch --------------------------------- */

function applyFilters(rows: UserRow[], filters: ServerFilter[]): UserRow[] {
  return rows.filter((row) =>
    filters.every((f) => {
      const val = String(row[f.field as keyof UserRow] ?? "").toLowerCase()
      const term = String(f.value ?? "").toLowerCase()
      if (f.type === "equals") return val === term
      if (f.type === "contains") return val.includes(term)
      return true
    })
  )
}

async function fetchUsersPage(
  params: ServerFetchParams,
  signal: AbortSignal,
  opts: { simulateError?: boolean } = {}
): Promise<ServerFetchResult<UserRow>> {
  await new Promise((resolve, reject) => {
    const t = window.setTimeout(resolve, 350)
    signal.addEventListener("abort", () => {
      window.clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })
  if (opts.simulateError) throw new Error("Server error (simulated)")

  let rows = applyFilters(ALL_ROWS, params.filters ?? [])

  if (params.sort?.length) {
    const { field, dir } = params.sort[0]
    rows = [...rows].sort((a, b) => {
      const av = a[field as keyof UserRow]
      const bv = b[field as keyof UserRow]
      if (av == null || bv == null) return 0
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return dir === "asc" ? cmp : -cmp
    })
  }

  const total = rows.length
  const { startRow = 0, endRow = 20 } = params
  return { rows: rows.slice(startRow, endRow), total }
}

/* --------------------------------- columns -------------------------------- */

const statusVariant: Record<Status, "default" | "secondary" | "destructive"> = {
  Active: "default",
  Pending: "secondary",
  Inactive: "destructive",
}

function StatusCell({ value }: { value?: Status }) {
  if (!value) return null
  return <Badge variant={statusVariant[value]}>{value}</Badge>
}

/* --------------------------------- search --------------------------------- */

interface UserSearch {
  name: string
  role: string
  status: string
}

const EMPTY_SEARCH: UserSearch = { name: "", role: "", status: "" }

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

  const handleSearch = () => setAppliedFilters(toFilters(search))
  const handleReset = () => {
    setSearch(EMPTY_SEARCH)
    setAppliedFilters([])
  }

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
              Server-side sort, pagination and cross-page selection — data is
              fetched per page from the server.
            </SmartPageDescription>
          </div>
        </div>
      </SmartPageHeader>

      <SmartToolbar>
        <Button
          variant={simulateError ? "destructive" : "outline"}
          size="sm"
          onClick={toggleError}
        >
          <Bug className="h-4 w-4" />
          {simulateError ? "Erroring (click to fix)" : "Simulate error"}
        </Button>
        <Button variant="outline" size="sm" onClick={logSelected}>
          <ListChecks className="h-4 w-4" />
          Log selected
        </Button>
        <span className="ml-auto" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => gridRef.current?.reload()}
        >
          <RotateCw className="h-4 w-4" />
          Reload
        </Button>
      </SmartToolbar>

      <SmartPageSearch className="flex-wrap items-end py-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Name
          </label>
          <SmartSearchInput
            value={search.name}
            onValueChange={(v) => setSearch((s) => ({ ...s, name: v }))}
            placeholder="Search name…"
            className="h-8 w-48"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Role
          </label>
          <select
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
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
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
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" /> Search
          </Button>
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
