import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@workspace/ui/smart-components/smart-badge"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageContent,
} from "@workspace/ui/smart-components/page"
import { SmartGrid, type DataGridColumn } from "@workspace/ui/data-grid"
import { formatCurrency } from "@workspace/ui/lib/format"

interface UserRow {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "invited" | "suspended"
  mrr: number
}

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
const ROLES = ["Administrator", "Editor", "Viewer", "Owner"]
const STATUSES: UserRow["status"][] = ["active", "invited", "suspended"]

function makeRows(count: number): UserRow[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 3) % LAST.length]
    return {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase() + "@example.com",
      role: ROLES[i % ROLES.length],
      status: STATUSES[i % STATUSES.length],
      mrr: 19 + ((i * 37) % 480),
    }
  })
}

const statusVariant: Record<
  UserRow["status"],
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  invited: "secondary",
  suspended: "destructive",
}

function StatusCell({ value }: { value?: UserRow["status"] }) {
  if (!value) return null
  return <Badge variant={statusVariant[value]}>{value}</Badge>
}

export default function SimpleGridPage() {
  const [loading, setLoading] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [selected, setSelected] = useState<UserRow[]>([])

  const allRows = useMemo(() => makeRows(157), [])
  const rows = empty ? [] : allRows

  const columns = useMemo<DataGridColumn<UserRow>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 90, filter: false },
      { field: "name", headerName: "Name", minWidth: 170 },
      { field: "email", headerName: "Email", minWidth: 230 },
      { field: "role", headerName: "Role" },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: StatusCell,
        minWidth: 130,
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

  const simulateLoading = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1200)
  }

  return (
    <SmartPage layout="document">
      <SmartPageHeader>
        <div className="flex items-start justify-between">
          <div>
            <SmartPageTitle>Simple Grid</SmartPageTitle>
            <SmartPageDescription>
              Client-side grid with quick search, sort, filter, column
              visibility, CSV export and selection — all rows loaded in memory.
            </SmartPageDescription>
          </div>
          <SmartPageActions>
            <Button variant="outline" size="sm" onClick={simulateLoading}>
              Simulate loading
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEmpty((v) => !v)}
            >
              {empty ? "Show data" : "Show empty"}
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add user
            </Button>
          </SmartPageActions>
        </div>
        {selected.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selected.length} row{selected.length === 1 ? "" : "s"} selected
          </p>
        )}
      </SmartPageHeader>

      <SmartPageContent>
        <SmartGrid
          title="Users"
          rows={rows}
          columns={columns}
          loading={loading}
          selection="multiple"
          onSelectionChange={setSelected}
          getRowId={(row) => String(row.id)}
          height={540}
          emptyState={{
            title: "No users yet",
            description: "Invite teammates and they'll appear here.",
          }}
          toolbarActions={
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" /> Add user
            </Button>
          }
        />
      </SmartPageContent>
    </SmartPage>
  )
}
