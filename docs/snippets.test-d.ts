/**
 * Type-only smoke test for the non-trivial snippets used in the docs. This file
 * is never executed — it is compiled by `tsc --noEmit` (via the doc-consistency
 * check, `scripts/check-docs.mjs`) so a doc example that stops type-checking
 * fails CI. Keep the snippets here in sync with the guides in `docs/`.
 */
import { z } from "zod"

import { SmartForm, type FieldDefinition } from "@iamsaroj/smart-ui/form"
import {
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

// External filters from a search form (docs/data-grid.md § External filters)
const externalFilters = toServerFilters(
  { name: "ada", status: ["Active"] },
  { name: { type: "contains" } }
)
void externalFilters

// Action column (docs/data-grid.md § Action column)
declare const deletingId: string | null
const actionColumn: GridActionColumnOptions<User> = {
  pinned: "left",
  width: 110,
  showLabel: false,
  exportable: false,
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
