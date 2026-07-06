/**
 * CRUD Example Page
 *
 * The full enterprise data story on the "grid" layout: a paged, searchable list
 * backed by **TanStack Query** against the MSW mock API, with create / edit /
 * delete **mutations**, an **optimistic** delete, and **toast** feedback.
 *
 * This is the recipe real consumer apps copy:
 * - reads   → `useQuery` (cache + retry + `keepPreviousData` while paging)
 * - writes  → `useMutation` + `queryClient.invalidateQueries(["users"])`
 * - delete  → optimistic `onMutate` / rollback `onError` / reconcile `onSettled`
 *
 * The library stays fetch-agnostic — all of this lives in the app.
 */

import { useEffect, useState } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Filter, Pencil, Trash2, UserPlus, Users } from "lucide-react"
import { SmartButton as Button } from "@workspace/ui/smart-components/smart-button"
import { SmartConfirmDialog } from "@workspace/ui/smart-components/smart-confirm-dialog"
import { SmartDialog } from "@workspace/ui/smart-components/smart-dialog"
import { toast } from "@workspace/ui/smart-components/smart-toaster"
import { SmartSearchInput } from "@workspace/ui/smart-components/search-input"
import {
  SmartPage,
  SmartPageHeader,
  SmartPageTitle,
  SmartPageDescription,
  SmartPageActions,
  SmartPageBreadcrumb,
  SmartToolbar,
  SmartPageSearch,
  SmartGridArea,
  SmartPageStatusBar,
  SmartPageFooter,
  SmartPageEmpty,
  SmartPageError,
} from "@workspace/ui/smart-components/page"
import { SmartForm, type FieldDefinition } from "@workspace/ui/form-engine"
import { z } from "zod"
import {
  createUser,
  deleteUser,
  fetchUserList,
  updateUser,
  type NewUser,
} from "@/api/users-crud"
import type { UserRow } from "@/api/users"

// ─── Form schema + fields (reused for create & edit) ──────────────────────────

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["Active", "Inactive", "Pending"]),
  mrr: z.number().min(0, "MRR can't be negative"),
})
type UserForm = z.infer<typeof userFormSchema>

const ROLE_OPTIONS = [
  "Admin",
  "Manager",
  "Developer",
  "Designer",
  "QA Engineer",
  "Support",
].map((r) => ({ label: r, value: r }))

const STATUS_OPTIONS = (["Active", "Inactive", "Pending"] as const).map(
  (s) => ({
    label: s,
    value: s,
  })
)

const userFields: FieldDefinition<UserForm>[] = [
  { name: "name", label: "Name", type: "text", placeholder: "Ada Lovelace" },
  { name: "email", label: "Email", type: "email", colSpan: 2 },
  { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { name: "mrr", label: "MRR", type: "currency", min: 0 },
]

const EMPTY_USER: UserForm = {
  name: "",
  email: "",
  role: "Developer",
  status: "Active",
  mrr: 0,
}

const STATUS_COLORS: Record<UserRow["status"], string> = {
  Active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const PAGE_SIZE = 20

// ─── User create/edit dialog ──────────────────────────────────────────────────

const UserFormDialog = ({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  pending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: UserForm
  title: string
  submitLabel: string
  pending: boolean
  onSubmit: (value: UserForm) => void
}) => (
  <SmartDialog open={open} onOpenChange={onOpenChange} header={{ title }}>
    {open && (
      <SmartForm
        schema={userFormSchema}
        fields={userFields}
        data={initial}
        columns={2}
        submitLabel={pending ? "Saving…" : submitLabel}
        onSubmit={onSubmit}
      />
    )}
  </SmartDialog>
)

// ─── Component ────────────────────────────────────────────────────────────────

const CrudExamplePage = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(0)

  // Debounce the search box so we don't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Create/edit dialog state. `editing === null` → create mode.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  // Pending delete confirmation target.
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)

  const usersQueryKey = ["users", { search: debouncedSearch, page }] as const

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: usersQueryKey,
    queryFn: ({ signal }) =>
      fetchUserList({ page, size: PAGE_SIZE, search: debouncedSearch }, signal),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["users"] })

  const createMutation = useMutation({
    mutationFn: (input: NewUser) => createUser(input),
    onSuccess: (user) => {
      toast.success(`Created ${user.name}`)
      setDialogOpen(false)
      void invalidateUsers()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateMutation = useMutation({
    mutationFn: (input: { id: number; changes: Partial<NewUser> }) =>
      updateUser(input.id, input.changes),
    onSuccess: (user) => {
      toast.success(`Updated ${user.name}`)
      setDialogOpen(false)
      void invalidateUsers()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (user: UserRow) => deleteUser(user.id),
    // Optimistic: drop the row from the current page immediately, roll back on error.
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKey })
      const previous = queryClient.getQueryData<typeof data>(usersQueryKey)
      queryClient.setQueryData<typeof data>(usersQueryKey, (curr) =>
        curr
          ? {
              rows: curr.rows.filter((r) => r.id !== user.id),
              total: Math.max(0, curr.total - 1),
            }
          : curr
      )
      return { previous }
    },
    onError: (e: Error, _user, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(usersQueryKey, ctx.previous)
      toast.error(e.message)
    },
    onSuccess: (_res, user) => toast.success(`Deleted ${user.name}`),
    onSettled: () => void invalidateUsers(),
  })

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (user: UserRow) => {
    setEditing(user)
    setDialogOpen(true)
  }

  const handleSubmit = (value: UserForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, changes: value })
    } else {
      createMutation.mutate(value)
    }
  }

  const savePending = createMutation.isPending || updateMutation.isPending

  return (
    // SmartGridArea's presence auto-detects the "grid" layout
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
              Manage your organisation's members — backed by TanStack Query.
            </SmartPageDescription>
          </div>
          <SmartPageActions>
            <Button size="sm" onClick={openCreate}>
              <UserPlus />
              Invite user
            </Button>
          </SmartPageActions>
        </div>
      </SmartPageHeader>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <SmartToolbar>
        <Button variant="outline" size="sm" disabled>
          <Filter />
          Filter
        </Button>
        <span className="ms-auto" />
        <span className="text-xs text-muted-foreground">
          {isFetching ? "Refreshing…" : `${total.toLocaleString()} users`}
        </span>
      </SmartToolbar>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <SmartPageSearch>
        <SmartSearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search by name…"
          className="w-72"
        />
      </SmartPageSearch>

      {/* ── Grid fills remaining height ─────────────────────────────────────── */}
      <SmartGridArea>
        {isError ? (
          <SmartPageError
            title="Failed to load users"
            description={(error as Error).message}
            onRetry={() => void refetch()}
          />
        ) : rows.length === 0 && !isPending ? (
          <SmartPageEmpty
            icon={<Users />}
            title="No users found"
            description={
              debouncedSearch
                ? `No users match "${debouncedSearch}".`
                : "Invite your first user to get started."
            }
            action={
              debouncedSearch ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <UserPlus />
                  Invite user
                </Button>
              )
            }
          />
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    MRR
                  </th>
                  <th className="w-24 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {isPending ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : (
                  rows.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-2.5 font-medium">{user.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {user.role}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[user.status]}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                        ${user.mrr.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SmartGridArea>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <SmartPageStatusBar>
        <span className="text-xs text-muted-foreground">
          {total.toLocaleString()} users
        </span>
      </SmartPageStatusBar>

      {/* ── Footer: pagination ──────────────────────────────────────────────── */}
      <SmartPageFooter justify="between">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || isFetching}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1 || isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </SmartPageFooter>

      {/* ── Create / edit dialog ────────────────────────────────────────────── */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing ?? EMPTY_USER}
        title={editing ? "Edit user" : "Invite user"}
        submitLabel={editing ? "Save changes" : "Create user"}
        pending={savePending}
        onSubmit={handleSubmit}
      />

      {/* ── Delete confirmation ─────────────────────────────────────────────── */}
      <SmartConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "user"}?`}
        description="This removes the user from the list. This can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </SmartPage>
  )
}

export default CrudExamplePage
