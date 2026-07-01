"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

export interface SmartDialogHeader {
  title: React.ReactNode
  subtitle?: React.ReactNode
}

export interface SmartDialogProps {
  /** Controls open state (controlled mode). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Element rendered as the dialog trigger.
   * Passed as the `render` prop to DialogTrigger — must be a single element.
   * Omit when using controlled `open` without a built-in trigger.
   */
  trigger?: React.ReactElement
  /** Dialog header: title and optional subtitle. */
  header?: SmartDialogHeader
  /** Footer content (actions row). Maps to DialogFooter. */
  footer?: React.ReactNode
  /** Show the × close button in the top-right corner. @default true */
  showCloseButton?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * Flattened Dialog wrapper.
 *
 * ```tsx
 * // Before
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger render={<Button>Edit profile</Button>} />
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Edit profile</DialogTitle>
 *       <DialogDescription>Make changes here.</DialogDescription>
 *     </DialogHeader>
 *     <form>…</form>
 *     <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
 *   </DialogContent>
 * </Dialog>
 *
 * // After
 * <SmartDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   trigger={<Button>Edit profile</Button>}
 *   header={{ title: "Edit profile", subtitle: "Make changes here." }}
 *   footer={<Button onClick={save}>Save</Button>}
 * >
 *   <form>…</form>
 * </SmartDialog>
 * ```
 *
 * Fall back to native Dialog primitives when the trigger needs conditional
 * rendering, multiple triggers, or the header has a non-standard layout.
 */
export function SmartDialog({
  open,
  onOpenChange,
  trigger,
  header,
  footer,
  showCloseButton = true,
  className,
  children,
}: SmartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent showCloseButton={showCloseButton} className={className}>
        {header && (
          <DialogHeader>
            <DialogTitle>{header.title}</DialogTitle>
            {header.subtitle && (
              <DialogDescription>{header.subtitle}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
