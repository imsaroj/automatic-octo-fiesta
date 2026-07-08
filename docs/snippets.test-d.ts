/**
 * Type-only smoke test for the non-trivial snippets used in the docs. This file
 * is never executed — it is compiled by `tsc --noEmit` (via the doc-consistency
 * check, `scripts/check-docs.mjs`) so a doc example that stops type-checking
 * fails CI. Keep the snippets here in sync with the guides in `docs/`.
 */
import { z } from "zod"

import { SmartForm, type FieldDefinition } from "@workspace/ui/form-engine"
import { createPageFetcher, type DataGridColumn } from "@workspace/ui/data-grid"
import {
  buildSearchQuery,
  type SearchFieldDefinition,
} from "@workspace/ui/search-engine"
import type { TreeNode } from "@workspace/ui/tree-engine"
import type { TransferItem } from "@workspace/ui/transfer-list-engine"
import type { CalendarEvent } from "@workspace/ui/calendar-engine"
import { sanitizeEditorHtml } from "@workspace/ui/lexical-text-editor"

// ── form-engine.md ──────────────────────────────────────────────────────────
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

// ── search-engine.md ────────────────────────────────────────────────────────
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

// ── lexical-text-editor.md ──────────────────────────────────────────────────
const clean: string = sanitizeEditorHtml("<p>hi</p>")
void clean
