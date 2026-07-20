/**
 * Type-only smoke test for the non-trivial snippets used in the docs. This file
 * is never executed — it is compiled by `tsc --noEmit` (via the doc-consistency
 * check, `scripts/check-docs.mjs`) so a doc example that stops type-checking
 * fails CI. Keep the snippets here in sync with the guides in `docs/`.
 */
import { z } from "zod"

import {
  SmartForm,
  type FieldDefinition,
  type SmartFormHandle,
} from "@iamsaroj/smart-ui/form"
import {
  buildFlatQuery,
  createPageFetcher,
  toServerFilters,
  type DataGridColumn,
  type GridActionColumnOptions,
} from "@iamsaroj/smart-ui/data-grid"
import {
  buildSearchQuery,
  type SearchFieldDefinition,
} from "@iamsaroj/smart-ui/search"
import type { TreeNode } from "@iamsaroj/smart-ui/tree"
import type { TransferItem } from "@iamsaroj/smart-ui/transfer-list"
import type { CalendarEvent } from "@iamsaroj/smart-ui/calendar"
import { sanitizeEditorHtml } from "@iamsaroj/smart-ui/text-editor"
import {
  SmartUIProvider,
  type SmartUIProviderProps,
} from "@iamsaroj/smart-ui/smart-components/provider"
import {
  ActionPermissionProvider,
  Can,
  useActionPermission,
  type ActionPermissionChecker,
} from "@iamsaroj/smart-ui/smart-components/buttons"

// ── form.md ──────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  active: z.boolean(),
})
type Values = z.infer<typeof schema>

const fields: FieldDefinition<Values>[] = [
  { name: "name", type: "text", label: "Name" },
  { name: "email", type: "email", label: "Email" },
  { name: "active", type: "checkbox", label: "Active" },
]
void fields
void SmartForm

// form.md § Typed & async options
const roleSchema = z.object({ roleId: z.number({ error: "Choose a role" }) })
type RoleForm = z.infer<typeof roleSchema>
declare function fetchRoles(
  signal: AbortSignal
): Promise<{ id: number; name: string }[]>
const roleFields: FieldDefinition<RoleForm>[] = [
  {
    name: "roleId",
    type: "select",
    label: "Role",
    options: ({ signal }) =>
      fetchRoles(signal).then((rs) =>
        rs.map((r) => ({ value: r.id, label: r.name }))
      ),
  },
]
void roleFields

// form.md § Create / edit modes
const accountSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
})
type Account = z.infer<typeof accountSchema>
const accountFields: FieldDefinition<Account>[] = [
  { name: "username", type: "text", label: "Username" },
  { name: "password", type: "password", label: "Password", modes: ["create"] },
]
void accountFields
declare const accountRef: { current: SmartFormHandle<Account> | null }
const loadRecord = (row: Account) => accountRef.current?.reset(row)
void loadRecord

// ── data-grid.md ────────────────────────────────────────────────────────────
interface User {
  id: string
  name: string
  email: string
}
const columns: DataGridColumn<User>[] = [
  { field: "name", headerName: "Name" },
  { field: "email", headerName: "Email" },
]
void columns

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})
const fetchUsers = createPageFetcher({
  url: "/api/users",
  itemSchema: userSchema,
})
void fetchUsers

// Adapting to a real backend (docs/data-grid.md § Adapting to a real backend)
declare const http: {
  get: (url: string, cfg: { signal: AbortSignal }) => Promise<{ data: unknown }>
}
const fetchUsersAdapted = createPageFetcher({
  url: "/users",
  request: (url, { signal }) => http.get(url, { signal }).then((r) => r.data),
  unwrap: (body) => (body as { data: unknown }).data,
  pageIndexBase: 1,
  encodeQuery: buildFlatQuery,
  itemSchema: userSchema,
})
void fetchUsersAdapted

// External filters from a search form (docs/data-grid.md § External filters)
const externalFilters = toServerFilters(
  { name: "ada", status: ["Active"] },
  { name: { type: "contains" } }
)
void externalFilters

// Permission gating (docs/smart-components.md § Permission gating)
const canDo: ActionPermissionChecker = (action, context) =>
  action !== "delete" || context != null
void canDo
void ActionPermissionProvider
void Can
void useActionPermission

// Action column (docs/data-grid.md § Action column)
declare const deletingId: string | null
const actionColumn: GridActionColumnOptions<User> = {
  pinned: "left",
  width: 110,
  showLabel: false,
  exportable: false,
  permissionAware: true,
  actions: {
    edit: {
      visible: true,
      disabled: (row) => row.id === "root",
      onClick: (row) => void row,
    },
    delete: {
      visible: (row) => row.id !== "root",
      loading: (row) => deletingId === row.id,
      confirm: { title: "Delete this user?" },
      onClick: (row) => void row,
    },
    custom: [
      { action: "view", tooltip: "View detail", onClick: (row) => void row },
      {
        action: "duplicate",
        confirm: true,
        loading: (row) => deletingId === row.id,
        onClick: (row) => void row,
      },
    ],
  },
}
void actionColumn

// ── search.md ────────────────────────────────────────────────────────
type Filters = {
  q: string
  active: boolean
}
const searchFields: SearchFieldDefinition<Filters>[] = [
  { name: "q", type: "text", label: "Search" },
  { name: "active", type: "checkbox", label: "Active only" },
]
void searchFields
const pruned = buildSearchQuery({ q: "ada", active: false })
void pruned

// ── tree / transfer / calendar ──────────────────────────────────────────────
const nodes: TreeNode[] = [
  { id: "src", label: "src", children: [{ id: "i", label: "index.ts" }] },
]
void nodes

const items: TransferItem[] = [{ id: "read", label: "Read" }]
void items

const events: CalendarEvent[] = [
  { id: "e1", title: "Standup", start: new Date(), end: new Date() },
]
void events

// ── text-editor.md ──────────────────────────────────────────────────
const clean: string = sanitizeEditorHtml("<p>hi</p>")
void clean

// ── smart-components.md § Global config ─────────────────────────────────
// Type-check the labels/defaults shapes the provider accepts (JSX-free so this
// stays a .ts snippet file).
const providerProps: SmartUIProviderProps = {
  labels: {
    confirm: { confirm: "삭제", cancel: "취소" },
    grid: { retry: "다시 시도", selected: (n) => `${n}개 선택됨` },
    search: { search: "검색", reset: "초기화" },
  },
  defaults: {
    grid: { pageSize: 50, density: "compact" },
    form: { columns: 2 },
  },
  children: null,
}
void providerProps
void SmartUIProvider
