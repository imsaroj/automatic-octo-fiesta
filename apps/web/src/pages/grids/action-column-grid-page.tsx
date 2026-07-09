import { useMemo, useState } from "react"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import { SmartBadge as Badge } from "@iamsaroj/smart-ui/smart-components/smart-badge"
import { SmartSegmented } from "@iamsaroj/smart-ui/smart-components/smart-segmented"
import { SmartSwitch } from "@iamsaroj/smart-ui/smart-components/smart-switch"
import {
  SmartPage,
  SmartPageContent,
} from "@iamsaroj/smart-ui/smart-components/page"
import {
  SmartGrid,
  type DataGridColumn,
  type GridActionColumnPin,
} from "@iamsaroj/smart-ui/data-grid"

interface UserRow {
  id: number
  name: string
  email: string
  role: "Owner" | "Administrator" | "Editor" | "Viewer"
  locked: boolean
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
const ROLES: UserRow["role"][] = ["Owner", "Administrator", "Editor", "Viewer"]

const makeRows = (count: number): UserRow[] =>
  Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 3) % LAST.length]
    return {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase() + "@example.com",
      role: ROLES[i % ROLES.length],
      locked: i % 7 === 0,
    }
  })

const RoleCell = ({ value }: { value?: UserRow["role"] }) => {
  if (!value) return null
  return (
    <Badge variant={value === "Owner" ? "default" : "secondary"}>{value}</Badge>
  )
}

/**
 * Everything the action column does, on one page: pin left/right/unpinned,
 * icon-only vs labels, per-row loading on delete (simulated async), delete
 * confirmation, row-based rules (Owner rows can't be deleted, locked rows
 * can't be edited) and a permission toggle that statically hides Delete —
 * hide both and the column disappears entirely.
 */
const ActionColumnGridPage = () => {
  const [rows, setRows] = useState<UserRow[]>(() => makeRows(57))
  const [pinned, setPinned] = useState<GridActionColumnPin>("left")
  const [showLabel, setShowLabel] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const [canDelete, setCanDelete] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const columns = useMemo<DataGridColumn<UserRow>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 90, filter: false },
      { field: "name", headerName: "Name", minWidth: 170 },
      { field: "email", headerName: "Email", minWidth: 230 },
      {
        field: "role",
        headerName: "Role",
        cellRenderer: RoleCell,
        minWidth: 140,
      },
      {
        field: "locked",
        headerName: "Locked",
        maxWidth: 110,
        valueFormatter: (p) => (p.value ? "🔒" : ""),
      },
    ],
    []
  )

  const handleEdit = (row: UserRow) => {
    toast.info(`Edit ${row.name}`, {
      description: "Open your edit dialog or navigate to a detail page here.",
    })
  }

  const handleDelete = (row: UserRow) => {
    // Simulated async delete with a per-row loading state.
    setDeletingId(row.id)
    window.setTimeout(() => {
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      setDeletingId(null)
      toast.success(`${row.name} deleted`)
    }, 1200)
  }

  return (
    <SmartPage
      layout="document"
      title="Action Column Grid"
      description="Config-driven Edit/Delete column: pinning, per-row loading, delete confirmation, row-based rules and permission-driven auto-hide — no custom cell renderers in app code."
      actions={
        <>
          <SmartSegmented
            value={pinned === false ? "none" : pinned}
            onValueChange={(value) =>
              setPinned(value === "none" ? false : (value as "left" | "right"))
            }
            options={[
              { value: "left", label: "Pin left" },
              { value: "right", label: "Pin right" },
              { value: "none", label: "Unpinned" },
            ]}
          />
          <SmartSwitch
            checked={showLabel}
            onCheckedChange={setShowLabel}
            label="Labels"
          />
          <SmartSwitch
            checked={canEdit}
            onCheckedChange={setCanEdit}
            label="Can edit"
          />
          <SmartSwitch
            checked={canDelete}
            onCheckedChange={setCanDelete}
            label="Can delete"
          />
        </>
      }
    >
      <SmartPageContent>
        <SmartGrid
          title="Users"
          rows={rows}
          columns={columns}
          getRowId={(row) => String(row.id)}
          height={540}
          actionColumn={{
            pinned,
            showLabel,
            actions: {
              edit: {
                visible: canEdit,
                // Locked rows keep the button but can't use it.
                disabled: (row) => row.locked,
                onClick: handleEdit,
              },
              delete: {
                visible: canDelete,
                // Row-based permission: the Owner row can't be deleted.
                disabled: (row) => row.role === "Owner",
                loading: (row) => deletingId === row.id,
                confirm: {
                  title: "Delete this user?",
                  description:
                    "The user loses access immediately. This cannot be undone.",
                  confirmLabel: "Delete user",
                },
                onClick: handleDelete,
              },
            },
          }}
          emptyState={{
            title: "No users left",
            description: "You deleted everyone. Reload to reseed the demo.",
          }}
        />
      </SmartPageContent>
    </SmartPage>
  )
}

export default ActionColumnGridPage
