import { useState } from "react"
import { z } from "zod"
import {
  Copy,
  Edit,
  FolderOpen,
  Layers,
  Link,
  MoreHorizontal,
  PanelRight,
  Share2,
  Star,
  Trash2,
} from "lucide-react"
import {
  SmartPage,
  SmartPageContent,
  SmartPageSection,
} from "@iamsaroj/smart-ui/smart-components/page"
import {
  SmartDialog,
  type SmartDialogSize,
} from "@iamsaroj/smart-ui/smart-components/smart-dialog"
import {
  SheetClose,
  SmartSheet,
} from "@iamsaroj/smart-ui/smart-components/smart-sheet"
import {
  DrawerClose,
  SmartDrawer,
} from "@iamsaroj/smart-ui/smart-components/smart-drawer"
import { SmartConfirmDialog } from "@iamsaroj/smart-ui/smart-components/smart-confirm-dialog"
import { SmartContextMenu } from "@iamsaroj/smart-ui/smart-components/smart-context-menu"
import { SmartInput } from "@iamsaroj/smart-ui/smart-components/smart-input"
import { SmartTextarea } from "@iamsaroj/smart-ui/smart-components/smart-textarea"
import { SmartSelect } from "@iamsaroj/smart-ui/smart-components/smart-select"
import { SmartSwitch } from "@iamsaroj/smart-ui/smart-components/smart-switch"
import { SmartButton } from "@iamsaroj/smart-ui/smart-components/smart-button"
import {
  AddButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from "@iamsaroj/smart-ui/smart-components/buttons"
import { toast } from "@iamsaroj/smart-ui/smart-components/smart-toaster"
import { type FieldDefinition, SmartForm } from "@iamsaroj/smart-ui/form"

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
]

const DIALOG_SIZES: SmartDialogSize[] = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "full",
]

const FILE_CONTEXT_ITEMS = [
  {
    type: "item" as const,
    label: "Open",
    icon: <FolderOpen className="size-3.5" />,
    shortcut: "↵",
    onClick: () => alert("Open"),
  },
  {
    type: "item" as const,
    label: "Copy link",
    icon: <Link className="size-3.5" />,
    shortcut: "⌘L",
    onClick: () => alert("Copy link"),
  },
  { type: "separator" as const },
  {
    type: "sub" as const,
    label: "Share",
    icon: <Share2 className="size-3.5" />,
    items: [
      {
        type: "item" as const,
        label: "Copy link",
        icon: <Copy className="size-3.5" />,
        onClick: () => alert("Copy link"),
      },
      {
        type: "item" as const,
        label: "Star file",
        icon: <Star className="size-3.5" />,
        onClick: () => alert("Star"),
      },
    ],
  },
  { type: "separator" as const },
  {
    type: "item" as const,
    label: "Delete",
    icon: <Trash2 className="size-3.5" />,
    variant: "destructive" as const,
    shortcut: "⌫",
    onClick: () => alert("Delete"),
  },
]

/* ── SmartSheet CRUD demo ──────────────────────────────────── */

const memberSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.email("Enter a valid email"),
  role: z.string().min(1, "Choose a role"),
  notes: z.string().optional(),
})

type MemberForm = z.infer<typeof memberSchema>
type Member = MemberForm & { id: number }

const EMPTY_MEMBER: MemberForm = { name: "", email: "", role: "", notes: "" }

const MEMBER_FIELDS: FieldDefinition<MemberForm>[] = [
  {
    name: "name",
    type: "text",
    label: "Full name",
    placeholder: "Ada Lovelace",
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "ada@example.com",
  },
  {
    name: "role",
    type: "select",
    label: "Role",
    options: ROLE_OPTIONS,
  },
  {
    name: "notes",
    type: "textarea",
    label: "Notes",
    placeholder: "Internal notes about this member…",
    rows: 3,
  },
]

const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com", role: "admin" },
  { id: 2, name: "Grace Hopper", email: "grace@example.com", role: "member" },
  { id: 3, name: "Alan Turing", email: "alan@example.com", role: "viewer" },
]

const MEMBER_FORM_ID = "sheet-member-form"

/** Fake API latency so the async save/update state is visible in the demo. */
const fakeApiCall = (ms = 1200) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role

/**
 * CRUD in a right-side SmartSheet: the list stays on the page while
 * create/edit happen in a SmartForm inside the sheet. The Save button lives
 * in the sheet footer and drives the form via `form={MEMBER_FORM_ID}`.
 */
const SheetCrudDemo = () => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [nextId, setNextId] = useState(INITIAL_MEMBERS.length + 1)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (member: Member) => {
    setEditing(member)
    setSheetOpen(true)
  }

  const handleSubmit = async (value: MemberForm) => {
    setSaving(true)
    try {
      await fakeApiCall() // e.g. POST/PUT to your API
      if (editing) {
        setMembers((prev) =>
          prev.map((member) =>
            member.id === editing.id ? { ...member, ...value } : member
          )
        )
        toast.success("Member updated", { description: value.name })
      } else {
        setMembers((prev) => [...prev, { id: nextId, ...value }])
        setNextId((id) => id + 1)
        toast.success("Member added", { description: value.name })
      }
      // Only close once the async save has completed.
      setSheetOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (member: Member) => {
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
    toast.success("Member deleted", { description: member.name })
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Team members</p>
          <p className="text-xs text-muted-foreground">
            Create and edit happen in a right-side sheet with a SmartForm.
          </p>
        </div>
        <AddButton size="sm" onClick={openCreate}>
          Add member
        </AddButton>
      </div>

      <ul className="divide-y divide-border">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.email}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {roleLabel(member.role)}
              </span>
              <EditButton
                iconOnly
                size="sm"
                variant="ghost"
                onClick={() => openEdit(member)}
              />
              <SmartConfirmDialog
                trigger={
                  <DeleteButton
                    iconOnly
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  />
                }
                title={`Delete ${member.name}?`}
                description="This removes the member from the list. This action cannot be undone."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => handleDelete(member)}
              />
            </div>
          </li>
        ))}
        {members.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            No members yet — add one to get started.
          </li>
        )}
      </ul>

      <SmartSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          // Keep the sheet open (Esc / backdrop / ×) while the save is in flight.
          if (!open && saving) return
          setSheetOpen(open)
        }}
        dividers
        header={{
          title: editing ? "Edit member" : "Add member",
          subtitle: editing
            ? `Update details for ${editing.name}.`
            : "Fill in the details for the new member.",
        }}
        footer={
          <>
            <SheetClose
              render={
                <SmartButton variant="outline" size="sm" disabled={saving}>
                  Cancel
                </SmartButton>
              }
            />
            <SaveButton
              size="sm"
              type="submit"
              form={MEMBER_FORM_ID}
              loading={saving}
              loadingText={editing ? "Updating…" : "Saving…"}
            >
              {editing ? "Update" : "Save"}
            </SaveButton>
          </>
        }
      >
        <SmartForm
          key={editing?.id ?? "new"}
          id={MEMBER_FORM_ID}
          schema={memberSchema}
          data={editing ?? EMPTY_MEMBER}
          fields={MEMBER_FIELDS}
          submitLabel={null}
          onSubmit={handleSubmit}
        />
      </SmartSheet>
    </div>
  )
}

const OverlaysPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [openSize, setOpenSize] = useState<SmartDialogSize | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)

  return (
    <SmartPage
      layout="detail"
      title="Overlays"
      description="SmartDialog, SmartSheet, SmartDrawer, SmartConfirmDialog, and SmartContextMenu — all overlay and popover patterns."
    >
      <SmartPageContent maxWidth="2xl" padding="md">
        {/* ── SmartDialog ─────────────────────────────────────── */}
        <SmartPageSection
          title="SmartDialog"
          description="Modal dialog for focused tasks. Trigger via prop or controlled open state."
          divider
        >
          <div className="flex flex-wrap gap-3">
            {/* Trigger-driven */}
            <SmartDialog
              trigger={
                <SmartButton variant="outline" size="sm">
                  <Edit className="size-3.5" />
                  Edit profile
                </SmartButton>
              }
              header={{
                title: "Edit profile",
                subtitle: "Update your name and role below.",
              }}
              footer={
                <>
                  <SmartButton
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </SmartButton>
                  <SmartButton size="sm" onClick={() => setDialogOpen(false)}>
                    Save changes
                  </SmartButton>
                </>
              }
            >
              <div className="flex flex-col gap-4 py-2">
                <SmartInput
                  label="Display name"
                  defaultValue="Saroj Kumar"
                  required
                />
                <SmartSelect
                  label="Role"
                  options={ROLE_OPTIONS}
                  defaultValue="admin"
                />
              </div>
            </SmartDialog>

            {/* Controlled */}
            <SmartButton size="sm" onClick={() => setDialogOpen(true)}>
              <Layers className="size-3.5" />
              Open controlled
            </SmartButton>
            <SmartDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              header={{
                title: "Controlled dialog",
                subtitle: "This dialog is opened programmatically.",
              }}
              footer={
                <SmartButton size="sm" onClick={() => setDialogOpen(false)}>
                  Close
                </SmartButton>
              }
            >
              <p className="py-2 text-sm text-muted-foreground">
                No trigger prop — the parent controls <code>open</code>{" "}
                directly. Useful for opening from a dropdown menu item or after
                an async action.
              </p>
            </SmartDialog>
          </div>
        </SmartPageSection>

        {/* ── SmartDialog sizes ──────────────────────────────── */}
        <SmartPageSection
          title="SmartDialog sizes"
          description="Fixed width × fixed height per size prop: xs 400×60vh · sm 600×70vh · md 800×80vh · lg 1000×85vh · xl 1200×90vh · 2xl 1400×90vh · 3xl 1600×92vh · full (viewport − 48px). Tall content scrolls."
          divider
        >
          <div className="flex flex-wrap gap-3">
            {DIALOG_SIZES.map((size) => (
              <SmartButton
                key={size}
                variant="outline"
                size="sm"
                onClick={() => setOpenSize(size)}
              >
                {size}
              </SmartButton>
            ))}
          </div>
          <SmartDialog
            open={openSize !== null}
            onOpenChange={(next) => !next && setOpenSize(null)}
            size={openSize ?? "sm"}
            dividers
            header={{
              title: `size="${openSize ?? "sm"}"`,
              subtitle:
                openSize === "full"
                  ? "The full variant spans the viewport minus a 48px margin — great for immersive editors."
                  : "Fixed width and height, centered, with content scrolling inside.",
            }}
            footer={
              <SmartButton size="sm" onClick={() => setOpenSize(null)}>
                Close
              </SmartButton>
            }
          >
            <p className="py-2 text-sm text-muted-foreground">
              This dialog is rendered with{" "}
              <code>size="{openSize ?? "sm"}"</code>. Pick another button to
              compare widths.
            </p>
          </SmartDialog>
        </SmartPageSection>

        {/* ── SmartSheet ─────────────────────────────────────── */}
        <SmartPageSection
          title="SmartSheet"
          description="Slide-in panel for secondary context that doesn't navigate away."
          divider
        >
          <div className="flex flex-wrap gap-3">
            <SmartSheet
              trigger={
                <SmartButton variant="outline" size="sm">
                  <PanelRight className="size-3.5" />
                  Open sheet
                </SmartButton>
              }
              dividers
              header={{
                title: "User settings",
                subtitle: "Adjust preferences for this user.",
              }}
              footer={
                <>
                  <SheetClose
                    render={
                      <SmartButton variant="outline" size="sm">
                        Cancel
                      </SmartButton>
                    }
                  />
                  <SmartButton size="sm">Save</SmartButton>
                </>
              }
            >
              <div className="flex flex-col gap-5">
                <SmartInput label="Full name" defaultValue="Saroj Kumar" />
                <SmartInput
                  label="Email"
                  type="email"
                  defaultValue="saroj@example.com"
                />
                <SmartSelect
                  label="Role"
                  options={ROLE_OPTIONS}
                  defaultValue="member"
                />
                <SmartTextarea
                  label="Notes"
                  placeholder="Internal notes about this user…"
                  optional
                  rows={3}
                />
                <SmartSwitch
                  label="Active account"
                  description="Disable to suspend access without deleting the user."
                  defaultChecked
                />
              </div>
            </SmartSheet>

            <SmartSheet
              trigger={
                <SmartButton variant="outline" size="sm" className="gap-1.5">
                  ← Left side
                </SmartButton>
              }
              side="left"
              header={{
                title: "Left panel",
                subtitle: "Slides in from the left edge.",
              }}
            >
              <p className="text-sm text-muted-foreground">
                Use <code>side="left"</code> for navigation drawers or tree
                panels.
              </p>
            </SmartSheet>
          </div>

          {/* CRUD in a sheet — SmartForm from the form engine */}
          <div className="mt-5">
            <SheetCrudDemo />
          </div>
        </SmartPageSection>

        {/* ── SmartDrawer ─────────────────────────────────────── */}
        <SmartPageSection
          title="SmartDrawer"
          description="Bottom drawer — great for mobile-first action sheets."
          divider
        >
          <div className="flex flex-wrap gap-3">
            <SmartButton
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              Open drawer
            </SmartButton>
            <SmartDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              header={{
                title: "Quick actions",
                subtitle: "Choose an action for this file.",
              }}
              footer={
                <DrawerClose asChild>
                  <SmartButton variant="outline" className="w-full">
                    Cancel
                  </SmartButton>
                </DrawerClose>
              }
            >
              <div className="flex flex-col gap-2 pb-2">
                {[
                  { icon: <Edit className="size-4" />, label: "Rename" },
                  { icon: <Copy className="size-4" />, label: "Duplicate" },
                  { icon: <Share2 className="size-4" />, label: "Share" },
                  { icon: <Star className="size-4" />, label: "Star" },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                    onClick={() => setDrawerOpen(false)}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
                <button
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            </SmartDrawer>
          </div>
        </SmartPageSection>

        {/* ── SmartConfirmDialog ────────────────────────────── */}
        <SmartPageSection
          title="SmartConfirmDialog"
          description="One-shot confirm before irreversible actions."
          divider
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Trigger-driven */}
            <SmartConfirmDialog
              trigger={
                <SmartButton variant="destructive" size="sm">
                  <Trash2 className="size-3.5" />
                  Delete item
                </SmartButton>
              }
              title="Delete this item?"
              description="This will permanently remove the item and all its data. This action cannot be undone."
              confirmLabel="Delete"
              variant="destructive"
              onConfirm={() => setDeleted(true)}
            />

            {/* Controlled — opened by a separate button */}
            <SmartButton
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              <MoreHorizontal className="size-3.5" />
              Controlled confirm
            </SmartButton>
            <SmartConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Archive project?"
              description="Archived projects are hidden from the dashboard but can be restored later."
              confirmLabel="Archive"
              cancelLabel="Keep active"
              onConfirm={() => alert("Archived!")}
            />

            {deleted && (
              <span className="text-xs text-destructive">Item deleted.</span>
            )}
          </div>
        </SmartPageSection>

        {/* ── SmartContextMenu ──────────────────────────────── */}
        <SmartPageSection
          title="SmartContextMenu"
          description="Right-click (or long-press on touch) to open the context menu."
        >
          <SmartContextMenu items={FILE_CONTEXT_ITEMS}>
            <div className="flex h-32 cursor-context-menu items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors select-none hover:bg-muted/30">
              Right-click anywhere in this area
            </div>
          </SmartContextMenu>
        </SmartPageSection>
      </SmartPageContent>
    </SmartPage>
  )
}

export default OverlaysPage
