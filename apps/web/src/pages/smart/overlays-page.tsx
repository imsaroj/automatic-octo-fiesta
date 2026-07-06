import { useState } from "react"
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
} from "@workspace/ui/smart-components/page"
import {
  SmartDialog,
  type SmartDialogSize,
} from "@workspace/ui/smart-components/smart-dialog"
import {
  SheetClose,
  SmartSheet,
} from "@workspace/ui/smart-components/smart-sheet"
import {
  DrawerClose,
  SmartDrawer,
} from "@workspace/ui/smart-components/smart-drawer"
import { SmartConfirmDialog } from "@workspace/ui/smart-components/smart-confirm-dialog"
import { SmartContextMenu } from "@workspace/ui/smart-components/smart-context-menu"
import { SmartInput } from "@workspace/ui/smart-components/smart-input"
import { SmartTextarea } from "@workspace/ui/smart-components/smart-textarea"
import { SmartSelect } from "@workspace/ui/smart-components/smart-select"
import { SmartSwitch } from "@workspace/ui/smart-components/smart-switch"
import { SmartButton } from "@workspace/ui/smart-components/smart-button"

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
                <DrawerClose
                  render={
                    <SmartButton variant="outline" className="w-full">
                      Cancel
                    </SmartButton>
                  }
                />
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
