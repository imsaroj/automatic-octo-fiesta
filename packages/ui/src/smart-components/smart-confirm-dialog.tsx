"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@iamsaroj/smart-ui/components/alert-dialog"

import { useDeferredOpen } from "../internal/use-deferred-open"

export interface SmartConfirmDialogProps {
  /** Controls open state (controlled mode). Omit for uncontrolled (trigger-driven). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Element rendered as the dialog trigger.
   * Passed as the `render` prop to AlertDialogTrigger.
   */
  trigger?: React.ReactElement
  /** Confirmation question headline. @default "Are you sure?" */
  title?: string
  /** Supporting text that explains the consequences. */
  description?: React.ReactNode
  /**
   * Icon or illustration shown above the title (inside AlertDialogMedia).
   * Recommended: a Lucide icon sized `size-4`.
   */
  media?: React.ReactNode
  /** Label for the confirm button. @default "Confirm" */
  confirmLabel?: string
  /** Label for the cancel button. @default "Cancel" */
  cancelLabel?: string
  /** Called when the user confirms. Dialog closes automatically. */
  onConfirm?: () => void
  /**
   * Visual style of the confirm button.
   * Use `"destructive"` for irreversible actions (delete, revoke, etc.).
   * @default "default"
   */
  variant?: "default" | "destructive"
  /** Dialog size. @default "sm" */
  size?: "default" | "sm"
}

/**
 * One-shot confirmation dialog for irreversible or high-stakes actions.
 *
 * Handles uncontrolled (trigger-driven) and controlled open state transparently.
 * The confirm button calls `onConfirm` then closes; the cancel button closes only.
 *
 * ```tsx
 * // Delete confirmation
 * <SmartConfirmDialog
 *   trigger={<Button variant="destructive" size="sm">Delete account</Button>}
 *   title="Delete account?"
 *   description="All data will be permanently erased. This cannot be undone."
 *   confirmLabel="Delete account"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 * />
 *
 * // Controlled (e.g. opened from a dropdown menu item)
 * <SmartConfirmDialog
 *   open={confirmOpen}
 *   onOpenChange={setConfirmOpen}
 *   title="Remove member?"
 *   onConfirm={handleRemove}
 *   variant="destructive"
 * />
 * ```
 */
export const SmartConfirmDialog = ({
  open: openProp,
  onOpenChange: onChangeProp,
  trigger,
  title = "Are you sure?",
  description,
  media,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  size = "sm",
}: SmartConfirmDialogProps) => {
  const [local, setLocal] = React.useState(false)

  // Support both controlled (openProp provided) and uncontrolled (internal state).
  const open = openProp ?? local

  // Opens land one macrotask later, so a confirm opened from inside another
  // interaction (e.g. a grid row's Delete button) can't read that same
  // interaction as its own outside-press and self-close before painting.
  const deferredOpen = useDeferredOpen(open)

  const setOpen = React.useCallback(
    (val: boolean) => {
      setLocal(val)
      onChangeProp?.(val)
    },
    [onChangeProp]
  )

  return (
    <AlertDialog open={deferredOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {media && <AlertDialogMedia>{media}</AlertDialogMedia>}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onConfirm?.()
              setOpen(false)
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
