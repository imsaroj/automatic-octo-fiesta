/**
 * CRUD Example Page
 *
 * Demonstrates the "grid" layout — the most common enterprise pattern:
 * - Header sticks at the top
 * - Toolbar (search + filter controls) sticks below header
 * - Grid fills ALL remaining viewport height without calc() or 100vh
 * - Status bar and footer stick at the bottom
 * - Only the grid scrolls
 *
 * SmartPage auto-detects this as a "grid" layout because SmartGridArea
 * is a direct child.
 */

import { useState } from "react"
import {
  Download,
  Filter,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageBreadcrumb,
  SmartToolbar,
  SmartPageSearch,
  SmartPageFilters,
  SmartGridArea,
  SmartPageStatusBar,
  SmartPageFooter,
  SmartPageEmpty,
} from "@workspace/ui/smart-components/page"
import { SmartSearchInput } from "@workspace/ui/smart-components/search-input"

// ─── Fake data ────────────────────────────────────────────────────────────────

interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Member" | "Viewer"
  status: "Active" | "Invited" | "Suspended"
  joined: string
}

const USERS: User[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: (["Admin", "Member", "Viewer"] as const)[i % 3],
  status: (["Active", "Invited", "Suspended"] as const)[i % 3],
  joined: new Date(Date.now() - i * 86_400_000 * 7).toLocaleDateString(),
}))

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Invited: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
} as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function CrudExamplePage() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filtered = USERS.filter((u) => {
    if (activeFilter && u.status !== activeFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((u) => u.id)),
    )
  }

  return (
    // No layout prop needed — SmartGridArea's presence auto-detects "grid"
    <SmartPage>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <SmartPageHeader>
        <SmartPageBreadcrumb
          items={[{ label: "Admin", href: "#" }, { label: "Users" }]}
        />
        <div className="flex items-center justify-between">
          <div>
            <SmartPageTitle>Users</SmartPageTitle>
            <SmartPageDescription>
              Manage your organisation's members and access levels.
            </SmartPageDescription>
          </div>
          <SmartPageActions>
            <Button variant="outline" size="sm">
              <Download />
              Export
            </Button>
            <Button size="sm">
              <UserPlus />
              Invite user
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      {/* ── Toolbar: action buttons + view controls ─────────────────────────── */}
      <SmartToolbar>
        <Button
          variant={activeFilter ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter(activeFilter ? null : "Active")}
        >
          <Filter />
          {activeFilter ? `Filter: ${activeFilter}` : "Filter"}
        </Button>
        <span className="ms-auto" />
        <Button variant="ghost" size="icon-sm" aria-label="List view">
          <LayoutList />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Grid view">
          <LayoutGrid />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Refresh">
          <RefreshCw />
        </Button>
      </SmartToolbar>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <SmartPageSearch>
        <SmartSearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search users…"
          className="w-72"
        />
      </SmartPageSearch>

      {/* ── Active filters ──────────────────────────────────────────────────── */}
      {activeFilter && (
        <SmartPageFilters label="Active filters:">
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setActiveFilter(null)}>
            Status: {activeFilter} ×
          </Badge>
        </SmartPageFilters>
      )}

      {/* ── Grid fills remaining height ─────────────────────────────────────── */}
      <SmartGridArea>
        {filtered.length === 0 ? (
          <SmartPageEmpty
            icon={<Users />}
            title="No users found"
            description={
              query
                ? `No users match "${query}". Try a different search.`
                : "No users match the current filters."
            }
            action={
              <Button variant="outline" size="sm" onClick={() => { setQuery(""); setActiveFilter(null) }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b">
                  <th className="w-10 px-4 py-2.5 text-left">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="w-16 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b transition-colors hover:bg-muted/40 ${selected.has(user.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium">{user.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{user.role}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{user.joined}</td>
                    <td className="px-4 py-2.5">
                      <Button variant="ghost" size="icon-sm" aria-label="Delete">
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SmartGridArea>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <SmartPageStatusBar>
        <span className="text-xs text-muted-foreground">
          {filtered.length.toLocaleString()} of {USERS.length.toLocaleString()} users
        </span>
        {selected.size > 0 && (
          <>
            <span className="text-xs font-medium text-primary">
              {selected.size} selected
            </span>
            <Button variant="ghost" size="xs">
              <Trash2 />
              Delete selected
            </Button>
          </>
        )}
      </SmartPageStatusBar>

      {/* ── Footer: pagination ──────────────────────────────────────────────── */}
      <SmartPageFooter justify="between">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">Page 1 of 1</span>
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      </SmartPageFooter>
    </SmartPage>
  )
}
