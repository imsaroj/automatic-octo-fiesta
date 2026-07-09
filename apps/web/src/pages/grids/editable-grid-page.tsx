import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { SmartButton as Button } from "@imsaroj/smart-ui/smart-components/smart-button"
import {
  SmartPage,
  SmartPageContent,
} from "@imsaroj/smart-ui/smart-components/page"
import { SmartGrid, type DataGridColumn } from "@imsaroj/smart-ui/data-grid"
import { formatCurrency } from "@imsaroj/smart-ui/lib/format"

interface EditableRow {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
  salary: number
}

const ROLES = ["admin", "engineer", "designer", "analyst"]
const DEPTS = ["engineering", "design", "operations", "finance"]

const seedRows = (): EditableRow[] => {
  const seed = [
    ["Ada", "Lovelace", "engineer", "engineering", 98000],
    ["Grace", "Hopper", "admin", "operations", 120000],
    ["Linus", "Torvalds", "engineer", "engineering", 110000],
    ["Barbara", "Liskov", "analyst", "finance", 86000],
    ["Katherine", "Johnson", "designer", "design", 79000],
  ] as const
  return seed.map((row, i) => ({
    id: i + 1,
    firstName: row[0],
    lastName: row[1],
    role: row[2],
    department: row[3],
    salary: row[4],
    email: `${row[0]}.${row[1]}`.toLowerCase() + "@example.com",
  }))
}

const EditableGridPage = () => {
  const [rows, setRows] = useState<EditableRow[]>(seedRows)
  const [selected, setSelected] = useState<EditableRow[]>([])

  const columns = useMemo<DataGridColumn<EditableRow>[]>(
    () => [
      {
        field: "firstName",
        headerName: "First name",
        editable: true,
        minWidth: 150,
      },
      {
        field: "lastName",
        headerName: "Last name",
        editable: true,
        minWidth: 150,
      },
      { field: "email", headerName: "Email", editable: true, minWidth: 220 },
      {
        field: "role",
        headerName: "Role",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ROLES },
        cellClass: "capitalize",
        minWidth: 140,
      },
      {
        field: "department",
        headerName: "Department",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: DEPTS },
        cellClass: "capitalize",
        minWidth: 150,
      },
      {
        field: "salary",
        headerName: "Salary",
        editable: true,
        cellEditor: "agNumberCellEditor",
        type: "rightAligned",
        valueFormatter: (p) => formatCurrency(Number(p.value ?? 0)),
        minWidth: 130,
      },
    ],
    []
  )

  const addRow = () => {
    setRows((list) => [
      {
        id: Math.max(0, ...list.map((r) => r.id)) + 1,
        firstName: "New",
        lastName: "Member",
        email: "new.member@example.com",
        role: "engineer",
        department: "engineering",
        salary: 60000,
      },
      ...list,
    ])
  }

  const deleteSelected = () => {
    if (selected.length === 0) return
    const ids = new Set(selected.map((r) => r.id))
    setRows((list) => list.filter((r) => !ids.has(r.id)))
    setSelected([])
  }

  return (
    <SmartPage
      layout="document"
      title="Editable Grid"
      description="Inline cell editing with text, dropdown and number editors. Double-click a cell (or press Enter) to edit."
      actions={
        <>
          {selected.length > 0 && (
            <Button variant="outline" size="sm" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4" /> Delete ({selected.length})
            </Button>
          )}
          <Button size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add row
          </Button>
        </>
      }
    >
      <SmartPageContent>
        <SmartGrid
          title="Editable members"
          rows={rows}
          columns={columns}
          selection="multiple"
          onSelectionChange={setSelected}
          getRowId={(row) => String(row.id)}
          pagination={false}
          height={480}
          exportFileName="members"
        />
      </SmartPageContent>
    </SmartPage>
  )
}

export default EditableGridPage
