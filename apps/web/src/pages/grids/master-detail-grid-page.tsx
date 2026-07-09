import { useMemo, useState } from "react"
import { MousePointerClick, Package } from "lucide-react"
import { SmartBadge as Badge } from "@imsaroj/smart-ui/smart-components/smart-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@imsaroj/smart-ui/smart-components/smart-card"
import {
  SmartPage,
  SmartPageContent,
  SmartPageEmpty,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartGrid, type DataGridColumn } from "@imsaroj/smart-ui/data-grid"
import { formatCurrency } from "@imsaroj/smart-ui/lib/format"

/* --------------------------------- types ---------------------------------- */

interface Order {
  id: string
  product: string
  qty: number
  total: number
  status: "Shipped" | "Processing" | "Refunded"
}

interface Account {
  id: number
  company: string
  owner: string
  plan: "Enterprise" | "Pro" | "Free"
  mrr: number
  orders: Order[]
}

/* --------------------------------- data ----------------------------------- */

const makeAccounts = (): Account[] => {
  const companies = [
    ["Acme Inc", "Ada Lovelace", "Enterprise"],
    ["Globex", "Grace Hopper", "Pro"],
    ["Initech", "Linus Torvalds", "Free"],
    ["Umbrella", "Barbara Liskov", "Pro"],
    ["Hooli", "Katherine Johnson", "Enterprise"],
  ] as const
  const products = ["Seats", "API credits", "Storage", "Support plan", "Add-on"]
  const statuses: Order["status"][] = ["Shipped", "Processing", "Refunded"]
  return companies.map((co, i) => ({
    id: i + 1,
    company: co[0],
    owner: co[1],
    plan: co[2],
    mrr: 480 + i * 320,
    orders: Array.from({ length: 3 + (i % 3) }, (_, j) => ({
      id: `#${1000 + i * 10 + j}`,
      product: products[(i + j) % products.length] ?? "Item",
      qty: 1 + ((i + j) % 5),
      total: 120 + ((i * 7 + j * 31) % 900),
      status: statuses[(i + j) % statuses.length] ?? "Shipped",
    })),
  }))
}

/* --------------------------------- cells ---------------------------------- */

const planVariant: Record<
  Account["plan"],
  "default" | "secondary" | "outline"
> = {
  Enterprise: "default",
  Pro: "secondary",
  Free: "outline",
}

const orderStatusVariant: Record<
  Order["status"],
  "default" | "secondary" | "destructive"
> = {
  Shipped: "default",
  Processing: "secondary",
  Refunded: "destructive",
}

const PlanCell = ({ value }: { value?: Account["plan"] }) => {
  if (!value) return null
  return <Badge variant={planVariant[value]}>{value}</Badge>
}

const OrderStatusCell = ({ value }: { value?: Order["status"] }) => {
  if (!value) return null
  return <Badge variant={orderStatusVariant[value]}>{value}</Badge>
}

/* ---------------------------------- page ---------------------------------- */

const MasterDetailGridPage = () => {
  // eslint-disable-next-line react-hooks/use-memo
  const accounts = useMemo(makeAccounts, [])
  const [selected, setSelected] = useState<Account | null>(accounts[0] ?? null)

  const masterColumns = useMemo<DataGridColumn<Account>[]>(
    () => [
      { field: "company", headerName: "Company", minWidth: 160 },
      { field: "owner", headerName: "Owner", minWidth: 160 },
      {
        field: "plan",
        headerName: "Plan",
        cellRenderer: PlanCell,
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

  const detailColumns = useMemo<DataGridColumn<Order>[]>(
    () => [
      { field: "id", headerName: "Order", maxWidth: 110 },
      { field: "product", headerName: "Product", minWidth: 150 },
      { field: "qty", headerName: "Qty", maxWidth: 90, type: "rightAligned" },
      {
        field: "total",
        headerName: "Total",
        type: "rightAligned",
        valueFormatter: (p) => formatCurrency(Number(p.value ?? 0)),
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: OrderStatusCell,
        minWidth: 130,
      },
    ],
    []
  )

  return (
    <SmartPage
      layout="document"
      title="Master Detail Grid"
      description="Select an account in the master grid to drill into its orders in the linked detail panel — a Community-friendly master/detail pattern."
    >
      <SmartPageContent>
        <SmartGrid
          title="Accounts"
          rows={accounts}
          columns={masterColumns}
          selection="single"
          getRowId={(row) => String(row.id)}
          onSelectionChange={(rows) => setSelected(rows[0] ?? null)}
          pagination={false}
          height={280}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              {selected ? `${selected.company} — orders` : "Orders"}
            </CardTitle>
            <CardDescription>
              {selected
                ? `${selected.orders.length} orders · ${selected.plan} plan · ${formatCurrency(selected.mrr)} MRR`
                : "Select an account above to see its orders."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <SmartGrid
                rows={selected.orders}
                columns={detailColumns}
                getRowId={(row) => row.id}
                pagination={false}
                quickSearch={false}
                columnSelector={false}
                exportCsv={false}
                height={240}
              />
            ) : (
              <SmartPageEmpty
                icon={<MousePointerClick />}
                title="No account selected"
                description="Click a row in the accounts grid above to drill into its orders."
              />
            )}
          </CardContent>
        </Card>
      </SmartPageContent>
    </SmartPage>
  )
}

export default MasterDetailGridPage
