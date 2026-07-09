import type { LucideIcon } from "lucide-react"
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileInput,
  FileOutput,
  Files,
  Filter,
  Pencil,
  Plus,
  Printer,
  RefreshCcw,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import type { SmartButtonProps } from "@imsaroj/smart-ui/smart-components/smart-button"

export type ActionButtonVariant = NonNullable<SmartButtonProps["variant"]>

/** Per-action defaults. Everything here is overridable per instance. */
export interface ActionDefaults {
  /** Default visible label; also the aria-label / tooltip fallback for icon-only buttons. */
  label: string
  icon: LucideIcon
  variant: ActionButtonVariant
  /** Label swapped in while `loading` (see `SmartButton`). */
  loadingText?: string
  /** Which side of the label the icon renders on. @default "start" */
  iconSide?: "start" | "end"
  /** Native button type. @default "button" */
  type?: "button" | "submit" | "reset"
}

/**
 * Single source of truth for every action button. Adding a new action means
 * adding one entry here plus one `createActionButton` line in
 * `action-buttons.tsx` — `ActionKind` and the `ActionButton` `action` prop
 * pick it up automatically.
 */
export const ACTION_BUTTON_CONFIG = {
  add: { label: "Add", icon: Plus, variant: "default", loadingText: "Adding…" },
  edit: { label: "Edit", icon: Pencil, variant: "outline" },
  delete: {
    label: "Delete",
    icon: Trash2,
    variant: "destructive",
    loadingText: "Deleting…",
  },
  save: {
    label: "Save",
    icon: Save,
    variant: "default",
    loadingText: "Saving…",
  },
  cancel: { label: "Cancel", icon: X, variant: "ghost" },
  search: {
    label: "Search",
    icon: Search,
    variant: "default",
    loadingText: "Searching…",
  },
  refresh: {
    label: "Refresh",
    icon: RefreshCw,
    variant: "outline",
    loadingText: "Refreshing…",
  },
  sync: {
    label: "Sync",
    icon: RefreshCcw,
    variant: "outline",
    loadingText: "Syncing…",
  },
  download: {
    label: "Download",
    icon: Download,
    variant: "outline",
    loadingText: "Downloading…",
  },
  upload: {
    label: "Upload",
    icon: Upload,
    variant: "outline",
    loadingText: "Uploading…",
  },
  import: {
    label: "Import",
    icon: FileInput,
    variant: "outline",
    loadingText: "Importing…",
  },
  export: {
    label: "Export",
    icon: FileOutput,
    variant: "outline",
    loadingText: "Exporting…",
  },
  copy: {
    label: "Copy",
    icon: Copy,
    variant: "outline",
    loadingText: "Copying…",
  },
  print: {
    label: "Print",
    icon: Printer,
    variant: "outline",
    loadingText: "Printing…",
  },
  filter: { label: "Filter", icon: Filter, variant: "outline" },
  reset: { label: "Reset", icon: RotateCcw, variant: "ghost" },
  submit: {
    label: "Submit",
    icon: Send,
    variant: "default",
    loadingText: "Submitting…",
    type: "submit",
  },
  approve: {
    label: "Approve",
    icon: Check,
    variant: "default",
    loadingText: "Approving…",
  },
  reject: {
    label: "Reject",
    icon: Ban,
    variant: "destructive",
    loadingText: "Rejecting…",
  },
  view: { label: "View", icon: Eye, variant: "outline" },
  close: { label: "Close", icon: X, variant: "ghost" },
  back: { label: "Back", icon: ArrowLeft, variant: "ghost" },
  next: {
    label: "Next",
    icon: ChevronRight,
    variant: "outline",
    iconSide: "end",
  },
  previous: { label: "Previous", icon: ChevronLeft, variant: "outline" },
  duplicate: {
    label: "Duplicate",
    icon: Files,
    variant: "outline",
    loadingText: "Duplicating…",
  },
  archive: {
    label: "Archive",
    icon: Archive,
    variant: "outline",
    loadingText: "Archiving…",
  },
  restore: {
    label: "Restore",
    icon: ArchiveRestore,
    variant: "outline",
    loadingText: "Restoring…",
  },
} as const satisfies Record<string, ActionDefaults>

export type ActionKind = keyof typeof ACTION_BUTTON_CONFIG
