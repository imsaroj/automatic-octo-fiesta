import { useCallback, useMemo, useRef } from "react"
import { RotateCw } from "lucide-react"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import {
  SmartPage,
  SmartGridArea,
} from "@iamsaroj/smart-ui/smart-components/page"
import {
  SmartServerGrid,
  type DataGridColumn,
  type SmartServerGridHandle,
  type ServerFetchParams,
  type ServerFetchResult,
  type ServerFilter,
} from "@iamsaroj/smart-ui/data-grid"
import { formatCurrency } from "@iamsaroj/smart-ui/lib/format"

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

const ALL_ROWS: UserRow[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
  email:
    `${FIRST[i % FIRST.length]}.${LAST[(i * 3) % LAST.length]}`.toLowerCase() +
    `${i}@example.com`,
  role: ROLES[i % ROLES.length],
  status: STATUSES[i % STATUSES.length],
  mrr: 19 + ((i * 37) % 980),
}))

/* ----------------------------- mock fetch --------------------------------- */

const applyFilters = (rows: UserRow[], filters: ServerFilter[]): UserRow[] =>
  rows.filter((row) =>
    filters.every((f) => {
      const val = String(row[f.field as keyof UserRow] ?? "").toLowerCase()
      const term = String(f.value ?? "").toLowerCase()
      if (f.type === "equals") return val === term
      if (f.type === "contains") return val.includes(term)
      return true
    })
  )

const fetchUsersPage = async (
  params: ServerFetchParams,
  signal: AbortSignal
): Promise<ServerFetchResult<UserRow>> => {
  await new Promise((resolve, reject) => {
    const t = window.setTimeout(resolve, 250)
    signal.addEventListener("abort", () => {
      window.clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

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
  const { startRow = 0, endRow = 25 } = params
  return { rows: rows.slice(startRow, endRow), total }
}

/* --------------------------------- columns -------------------------------- */

const statusVariant: Record<Status, "default" | "secondary" | "destructive"> = {
  Active: "default",
  Pending: "secondary",
  Inactive: "destructive",
}

const StatusCell = ({ value }: { value?: Status }) => {
  if (!value) return null
  return <Badge variant={statusVariant[value]}>{value}</Badge>
}

/* ---------------------------------- page ---------------------------------- */

const InfiniteGridPage = () => {
  const gridRef = useRef<SmartServerGridHandle<UserRow> | null>(null)

  const fetchRows = useCallback(
    (
      params: ServerFetchParams,
      signal: AbortSignal
    ): Promise<ServerFetchResult<UserRow>> => fetchUsersPage(params, signal),
    []
  )

  const columns = useMemo<DataGridColumn<UserRow>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 90 },
      { field: "name", headerName: "Name", minWidth: 180 },
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

  return (
    <SmartPage
      title="Infinite Scroll Grid"
      description="Rows stream in blocks as you scroll — no pager, constant memory, 1 000 rows loaded on demand."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => gridRef.current?.reload()}
        >
          <RotateCw className="h-4 w-4" /> Reload
        </Button>
      }
    >
      <SmartGridArea>
        <SmartServerGrid
          ref={gridRef}
          fill
          title="Users (streaming)"
          columns={columns}
          fetchRows={fetchRows}
          getRowId={(row) => String(row.id)}
          pagination={false}
          pageSize={25}
          columnFilters={false}
          selection="multiple"
          exportFileName="users"
          emptyState={{
            title: "No users",
            description: "Nothing to stream yet.",
          }}
        />
      </SmartGridArea>
    </SmartPage>
  )
}

export default InfiniteGridPage
