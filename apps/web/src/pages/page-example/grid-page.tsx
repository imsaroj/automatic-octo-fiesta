/**
 * Page Example — Data Grid layout ("kitchen sink")
 *
 * A `SmartGridArea` as a direct child auto-detects the `grid` layout, which
 * turns on grid scroll containment and makes every surrounding region sticky.
 * This example wires up ALL of the surrounding slots at once — header, toolbar,
 * search, filters, grid area, status bar and footer — so the grid fills the
 * remaining height and nothing else scrolls.
 */

import { useMemo, useState } from "react"
import { Download, Filter, Plus, X } from "lucide-react"
import {
  SmartPage,
  SmartToolbar,
  SmartPageSearch,
  SmartPageFilters,
  SmartGridArea,
  SmartPageStatusBar,
  SmartPageFooter,
} from "@iamsaroj/smart-ui/smart-components/page"
import { SmartButton as Button } from "@iamsaroj/smart-ui/smart-components/smart-button"
import { SmartBadge as Badge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import { SmartSearchInput as SearchInput } from "@iamsaroj/smart-ui/smart-components/search-input"
import { SmartGrid, type DataGridColumn } from "@iamsaroj/smart-ui/data-grid"
import { formatCurrency } from "@iamsaroj/smart-ui/lib/format"

interface AccountRow {
  id: number
  name: string
  owner: string
  plan: "Free" | "Pro" | "Enterprise"
  status: "active" | "trial" | "churned"
  mrr: number
}

const NAMES = [
  "Acme",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark",
  "Wayne",
  "Wonka",
  "Hooli",
  "Pied Piper",
  "Cyberdyne",
]
const OWNERS = ["Ada", "Grace", "Linus", "Katherine", "Ken", "Margaret"]
const PLANS: AccountRow["plan"][] = ["Free", "Pro", "Enterprise"]
const STATUSES: AccountRow["status"][] = ["active", "trial", "churned"]

const makeRows = (n: number): AccountRow[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `${NAMES[i % NAMES.length]} ${i + 1}`,
    owner: OWNERS[i % OWNERS.length],
    plan: PLANS[i % PLANS.length],
    status: STATUSES[i % STATUSES.length],
    mrr: 29 + ((i * 53) % 900),
  }))

const statusVariant: Record<
  AccountRow["status"],
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  trial: "secondary",
  churned: "destructive",
}

const StatusCell = ({ value }: { value?: AccountRow["status"] }) => {
  if (!value) return null
  return <Badge variant={statusVariant[value]}>{value}</Badge>
}

const GridLayoutPage = () => {
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<AccountRow["plan"] | null>("Pro")
  const [selected, setSelected] = useState<AccountRow[]>([])

  const allRows = useMemo(() => makeRows(240), [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRows.filter((r) => {
      if (planFilter && r.plan !== planFilter) return false
      return !(q && !`${r.name} ${r.owner}`.toLowerCase().includes(q))
    })
  }, [allRows, query, planFilter])

  const columns = useMemo<DataGridColumn<AccountRow>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 90, filter: false },
      { field: "name", headerName: "Account", minWidth: 180 },
      { field: "owner", headerName: "Owner", minWidth: 140 },
      { field: "plan", headerName: "Plan", minWidth: 130 },
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

  const totalMrr = rows.reduce((sum, r) => sum + r.mrr, 0)

  return (
    // SmartGridArea present → auto-detected "grid" layout (all regions sticky)
    <SmartPage
      title="Accounts"
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download /> Export
          </Button>
          <Button size="sm">
            <Plus /> New account
          </Button>
        </>
      }
    >
      <SmartToolbar>
        <span className="text-xs font-medium text-muted-foreground">
          {rows.length} of {allRows.length} accounts
        </span>
        <span className="ms-auto" />
        <Button variant="ghost" size="sm">
          <Filter /> More filters
        </Button>
      </SmartToolbar>

      <SmartPageSearch>
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search accounts or owners…"
          className="w-80"
        />
      </SmartPageSearch>

      <SmartPageFilters label="Filters:">
        {PLANS.map((plan) => (
          // SmartBadge is non-interactive (it drops onClick), so wrap it in a
          // real <button> to get a keyboard-accessible, toggleable filter chip.
          <button
            key={plan}
            type="button"
            aria-pressed={planFilter === plan}
            onClick={() => setPlanFilter((p) => (p === plan ? null : plan))}
            className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Badge variant={planFilter === plan ? "default" : "outline"}>
              {plan}
            </Badge>
          </button>
        ))}
        {planFilter && (
          <Button variant="ghost" size="xs" onClick={() => setPlanFilter(null)}>
            <X className="size-3" /> Clear
          </Button>
        )}
      </SmartPageFilters>

      <SmartGridArea>
        {/*
          The SmartPage already provides the toolbar, search, filters, status bar
          and footer, so we switch OFF the grid's own chrome (quick search, the
          Columns menu, CSV export and pagination). Otherwise the grid renders a
          second toolbar flush beneath the filter bar and its own pager above the
          status bar — the crowding you'd otherwise see. What's left is a clean,
          height-filling grid that manages only its own scroll.
        */}
        <SmartGrid
          rows={rows}
          columns={columns}
          selection="multiple"
          onSelectionChange={setSelected}
          getRowId={(row) => String(row.id)}
          height="100%"
          quickSearch={false}
          columnSelector={false}
          exportCsv={false}
          pagination={false}
          emptyState={{
            title: "No matching accounts",
            description: "Adjust your search or filters to see results.",
          }}
        />
      </SmartGridArea>

      <SmartPageStatusBar>
        <span className="text-xs text-muted-foreground">
          {rows.length.toLocaleString()} rows
          {selected.length > 0 && ` — ${selected.length} selected`}
        </span>
        <span className="ms-auto text-xs text-muted-foreground">
          Total MRR {formatCurrency(totalMrr)}
        </span>
      </SmartPageStatusBar>

      <SmartPageFooter justify="between">
        <span className="text-xs text-muted-foreground">
          Auto-saved just now
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Reset
          </Button>
          <Button size="sm" disabled={selected.length === 0}>
            Apply to {selected.length || 0}
          </Button>
        </div>
      </SmartPageFooter>
    </SmartPage>
  )
}

export default GridLayoutPage
